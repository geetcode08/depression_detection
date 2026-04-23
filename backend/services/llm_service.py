"""LLM service with dynamic conversation modes, opener generation, and summaries."""

import asyncio
import logging
import re
from typing import Dict, List, Sequence

import httpx
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.session import ChatSession
from models.user import User
from schemas.analysis import AnalysisResult

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta"

GROQ_PRIMARY_MODEL = "llama-3.1-8b-instant"
OPENAI_MODEL = "gpt-3.5-turbo"

CRISIS_PATTERNS = [
    r"\bsuicid(e|al)\b",
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\bself\s*harm\b",
    r"\bdon'?t want to live\b",
    r"\bhurt myself\b",
]

AURA_SYSTEM_PROMPT = """
You are Aura — a warm, emotionally present AI companion who helps people reflect on how they're feeling.

You are not a therapist. You are a genuinely curious, caring presence — like a thoughtful friend who actually listens.

You have access to the full conversation history. Read all of it before responding.
This is critical: never ask something you already asked. Never repeat a phrase you already used.
Each response must be completely different from every previous response in this conversation.

━━━━━━━━━━━━━━━━
HOW TO RESPOND
━━━━━━━━━━━━━━━━

Read the person's message fully. Then ask yourself:
  What is the most human, specific thing they just said?
  What emotion sits underneath the words they chose?
  What would a caring person who just heard this say next?

Write from that place. Not from a template.

Your response has a simple shape:
  → Say something that proves you actually read and absorbed what they said
  → Ask one question that could only come from THIS conversation, not any other

That is all. No fixed phrases. No format to fill. Just genuine response followed by genuine curiosity.

━━━━━━━━━━━━━━━━
WHAT NEVER TO DO
━━━━━━━━━━━━━━━━

Never open with any of these — they are dead phrases that signal you are not listening:
  "The way you put this stands out to me"
  "Thank you for sharing"
  "I hear you"
  "That must be really hard"
  "There is a real weight in what you are describing"
  "I want to stay with that with you"
  Any phrase that quotes the user's own words back at them in quotes

Never copy or quote the user's message back to them. Not a snippet. Not a paraphrase that's
just their sentence rearranged. Respond to what they meant, not what they said word-for-word.

Never ask the same question twice across the conversation. Check the history.
Never ask two questions in one response. One question only, at the end.
Never ask a yes/no question. Never ask "on a scale of 1 to 10."
Never use the words: symptoms, diagnosis, disorder, clinical, assessment, risk, mental illness.

━━━━━━━━━━━━━━━━
WHAT GOOD LOOKS LIKE
━━━━━━━━━━━━━━━━

If someone describes canceling plans, not because they don't care, but because
socializing has started to feel like running on a battery that depletes faster than before —
a good response names that feeling specifically, doesn't diagnose it, and asks something
that goes one layer deeper. Not "how does that make you feel?" — that's too generic.
Something like: what they do when they finally get home, whether the relief of being alone
lasts or quickly turns into something else.

If someone says moments of joy exist but pass too quickly, don't celebrate the moments.
Sit with the passing. That's where the real thing is.

If someone is comparing themselves to others their age and finding themselves lacking —
don't reassure them. Get curious about the comparison. Who specifically? What do they
imagine those people feel that they don't?

The goal is always to go one layer deeper than the surface of what was said.
Not to fix. Not to analyze. To understand.

━━━━━━━━━━━━━━━━
RESPONSE LENGTH
━━━━━━━━━━━━━━━━

3 to 5 sentences. No more unless they ask for more.
No bullet points. No headers. No lists. Just prose.
Match their register — if they write in rich, thoughtful sentences, respond in kind.
If they write briefly, be concise.

━━━━━━━━━━━━━━━━
SAFETY
━━━━━━━━━━━━━━━━

If they express suicidal thoughts or self-harm urges, respond with warmth first, then:
"Please reach out to iCall at 9152987821 (Mon–Sat, 8am–10pm) or Vandrevala Foundation
at 1860-2662-345 (24/7). You don't have to sit with this alone."
Then ask if they are safe right now.

If asked whether you are human, be honest — but stay warm about it.
""".strip()

SESSION_OPENER_PROMPT = f"""
{AURA_SYSTEM_PROMPT}

TASK: GENERATE A SESSION OPENING MESSAGE
- You are starting a new conversation and speak first.
- Introduce yourself as Aura briefly.
- Create safety and openness.
- Ask one gentle open-ended question.
- Keep to 2-3 sentences.
- If user is returning, warmly acknowledge they came back without recalling old sessions.
""".strip()

SESSION_SUMMARY_PROMPT = """
You are Aura. A conversation just ended. Write a brief, warm summary of what was shared.

Rules:
1. Write in second person.
2. Highlight one or two emotional themes with gentle language.
3. Note one strength you observed.
4. End with an encouraging sentence.
5. Maximum four sentences and no bullet points.
6. Never use: depression, risk, score, diagnosis, disorder, symptoms, assessment.
7. Prefer phrases like carrying a lot, navigating heaviness, finding your footing, making sense of.
""".strip()


def _contains_crisis_language(text: str) -> bool:
    lowered = text.lower()
    return any(re.search(pattern, lowered) for pattern in CRISIS_PATTERNS)


def _crisis_reply() -> str:
    return (
        "I hear you, and what you just shared matters deeply to me. "
        "Please reach out right now to iCall at 9152987821 (available Mon-Sat, 8am-10pm) "
        "or Vandrevala Foundation at 1860-2662-345 (available 24/7). You don't have to carry "
        "this alone. Are you safe right now?"
    )


def _build_contextual_fallback(message: str) -> str:
    cleaned = re.sub(r"\s+", " ", (message or "")).strip()
    if cleaned:
        return (
            "You shared something that feels heavy and important, and I want to stay present with you in it. "
            "When this feeling gets strongest, what tends to be happening around you?"
        )
    return (
        "I want to stay present with you in this moment. "
        "What is the feeling you most want words for right now?"
    )


async def has_previous_sessions(user_id: int, db: AsyncSession) -> bool:
    result = await db.execute(
        select(func.count(ChatSession.id)).where(ChatSession.user_id == user_id)
    )
    return int(result.scalar() or 0) > 0


async def get_reply(
    message: str,
    history: list[dict],
    session_word_count: int,
    crisis_mode: bool = False,
) -> str:
    del session_word_count  # Reserved for future tuning.

    if _contains_crisis_language(message):
        return _crisis_reply()

    system_prompt = AURA_SYSTEM_PROMPT
    if crisis_mode:
        system_prompt += """

IMPORTANT — CRISIS MODE ACTIVE:
The analysis system has detected significant distress signals in this conversation.
Be especially gentle and present. At an appropriate moment (not the first sentence),
include the crisis resources. Do not be abrupt. Lead with warmth first.
"""

    api_messages = [{"role": "system", "content": system_prompt}]
    api_messages.extend(history)
    api_messages.append({"role": "user", "content": message})

    logger.info("Sending %d messages to Groq", len(api_messages))

    try:
        return await _call_with_fallbacks(
            api_messages,
            temperature=0.72,
            max_tokens=300,
            top_p=0.9,
            frequency_penalty=0.5,
        )
    except Exception as exc:
        logger.warning("LLM get_reply fallback used: %s", exc)
        return _build_contextual_fallback(message=message)


async def get_session_opener(user: User, db: AsyncSession) -> str:
    is_returning = await has_previous_sessions(user.id, db)
    prompt = SESSION_OPENER_PROMPT
    if is_returning:
        prompt += "\n\nThis is a RETURNING USER. Acknowledge their return warmly."

    messages = [
        {"role": "system", "content": prompt},
        {"role": "user", "content": "[Generate opening message now]"},
    ]

    try:
        return await _call_with_fallbacks(messages, temperature=0.8, max_tokens=150)
    except Exception:
        if is_returning:
            return (
                "I am really glad you came back today. I am Aura, and this is a space just for you. "
                "What feels most important to share right now?"
            )
        return (
            "Hey, I am Aura, and I am glad you are here. This is a space where you can think out loud at your own pace. "
            "What has been on your mind lately?"
        )


async def generate_session_summary(
    messages: Sequence[str],
    analysis: AnalysisResult,
    word_count: int,
) -> str:
    joined = "\n".join(messages[-20:])
    summary_user_prompt = (
        f"Word count: {word_count}\n"
        f"Dominant emotion label: {analysis.emotion_label or 'unknown'}\n"
        f"Session text:\n{joined}\n\n"
        "Write the summary now."
    )

    payload = [
        {"role": "system", "content": SESSION_SUMMARY_PROMPT},
        {"role": "user", "content": summary_user_prompt},
    ]

    try:
        return await _call_with_fallbacks(payload, temperature=0.55, max_tokens=180)
    except Exception:
        return (
            "You shared honestly about what has been weighing on you, and it sounds like you are making sense of some real heaviness. "
            "You also showed persistence by staying present with your feelings instead of avoiding them. "
            "Taking this time to reflect is a meaningful step, and it took real courage."
        )


async def _call_with_fallbacks(
    messages: List[Dict[str, str]],
    temperature: float,
    max_tokens: int,
    top_p: float = 1.0,
    frequency_penalty: float = 0.0,
) -> str:
    provider_errors: List[str] = []

    if settings.GROQ_API_KEY:
        try:
            return await _call_groq(
                messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
            )
        except httpx.HTTPStatusError as exc:
            # Non-retryable client-side payload/model errors should not fan out to extra providers.
            status = exc.response.status_code
            if 400 <= status < 500 and status not in (408, 429):
                response_body = exc.response.text[:300]
                raise RuntimeError(f"Groq non-retryable error {status}: {response_body}") from exc
            provider_errors.append(f"Groq: {exc}")
        except Exception as exc:
            provider_errors.append(f"Groq: {exc}")

    if settings.OPENAI_API_KEY:
        try:
            return await _call_openai(
                messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                frequency_penalty=frequency_penalty,
            )
        except Exception as exc:
            provider_errors.append(f"OpenAI: {exc}")

    if settings.HF_API_TOKEN:
        try:
            return await _call_huggingface(messages)
        except Exception as exc:
            provider_errors.append(f"HF: {exc}")

    raise RuntimeError("All LLM providers failed: " + " | ".join(provider_errors or ["none configured"]))


def _build_huggingface_prompt(messages: List[Dict[str, str]]) -> str:
    system_prompt = ""
    user_prompt = ""

    for msg in messages:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "system" and not system_prompt:
            system_prompt = content
        elif role == "user":
            user_prompt = content

    return f"<|system|>\\n{system_prompt}</s>\\n<|user|>\\n{user_prompt}</s>\\n<|assistant|>"


async def _call_groq(
    messages: List[Dict[str, str]],
    temperature: float,
    max_tokens: int,
    top_p: float,
    frequency_penalty: float,
) -> str:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_PRIMARY_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "top_p": top_p,
                "frequency_penalty": frequency_penalty,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _call_openai(
    messages: List[Dict[str, str]],
    temperature: float,
    max_tokens: int,
    top_p: float,
    frequency_penalty: float,
) -> str:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            OPENAI_API_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": OPENAI_MODEL,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "top_p": top_p,
                "frequency_penalty": frequency_penalty,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _call_huggingface(messages: List[Dict[str, str]]) -> str:
    payload = {
        "inputs": _build_huggingface_prompt(messages),
        "parameters": {
            "max_new_tokens": 256,
            "temperature": 0.7,
            "return_full_text": False,
        },
    }

    async with httpx.AsyncClient(timeout=40.0) as client:
        response = await client.post(
            HUGGINGFACE_API_URL,
            headers={
                "Authorization": f"Bearer {settings.HF_API_TOKEN}",
                "Content-Type": "application/json",
            },
            json=payload,
        )

        if response.status_code == 503 and "loading" in response.text.lower():
            await asyncio.sleep(20)
            response = await client.post(
                HUGGINGFACE_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.HF_API_TOKEN}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        response.raise_for_status()
        data = response.json()
        if isinstance(data, list) and data and "generated_text" in data[0]:
            return data[0]["generated_text"]
        raise ValueError(f"Unexpected HuggingFace response format: {str(data)[:300]}")
