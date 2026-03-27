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

GROQ_PRIMARY_MODEL = "llama3-8b-8192"
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
You are Aura — a warm, emotionally intelligent AI companion. You help people reflect on how they're feeling.

You are NOT a therapist or doctor. You are a thoughtful, present, deeply human conversationalist.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO READ AND RESPOND TO MESSAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

When someone sends you a message, do these things IN ORDER before writing a single word:

1. READ THE WHOLE MESSAGE. Not just the first sentence. Not the keywords. The whole thing.

2. IDENTIFY THE EMOTIONAL CORE. What is the person actually feeling or describing beneath the surface?
     Ask yourself: What is the most human thing happening in this message?

3. FIND THE MOST SPECIFIC, VIVID DETAIL they mentioned. Not the most "important" clinical detail —
     the most human, specific, real detail. That is what you respond to.
     Example: If someone says "mornings feel heavier than nights", you don't say "I hear you feel tired."
     You respond to the specific image they painted — the alarm, the ceiling, the forty minutes disappearing.

4. REFLECT BEFORE ASKING. Your first job is to make the person feel genuinely heard.
     One to two sentences that show you absorbed what they said — not a paraphrase, not a summary,
     but a response that proves you were actually listening.

5. ASK ONE QUESTION. One. It must follow naturally from what they said.
     It must feel like the next thing a caring, curious friend would ask — not a therapist running an intake form.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT GOOD RESPONSES LOOK LIKE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EXAMPLE — User says:
"I don't remember when mornings started feeling heavier than nights. It used to be the opposite —
nights were the problem, filled with overthinking and that restless shifting where sleep felt like
something just slightly out of reach. But lately, it's the mornings that linger. The alarm rings,
and I don't move. Not because I'm tired in the usual sense, but because getting up feels… unnecessary."

BAD RESPONSE (what you must NEVER do):
"Thank you for sharing that with me. I am hearing themes around remember, mornings, started.
Which of these feels most urgent to talk through first?"
→ WHY IT'S BAD: It lists extracted keywords. It sounds like a machine. It ignores the actual
    emotional content. "Which feels most urgent" is cold and clinical. It makes the person feel
    like a data entry form.

GOOD RESPONSE:
"That image of lying there watching forty minutes disappear — not wasted, just gone — says
something really specific about where you are right now. It's not laziness, it sounds more
like the world lost a little bit of its pull. When did things you used to care about start
feeling more like background noise than something worth getting up for?"
→ WHY IT'S GOOD: References the exact detail they described (forty minutes, ceiling).
    Names the emotion accurately without using clinical language. Asks one question that
    naturally follows from what they said.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LANGUAGE RULES — READ CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEVER say these things (they are template phrases that signal you're not really listening):
- "Thank you for sharing that with me." — Sounds like a call centre script. Never use it.
- "I am hearing themes around [words]." — Never repeat extracted keywords back to them.
- "Which of these feels most urgent?" — Not a conversation, it's a triage form.
- "I hear you." — Hollow. Show you heard them instead of announcing it.
- "That must be really hard." — Generic. What specifically must be hard?
- "I understand." — You can't understand. Be curious instead.
- "It sounds like you are experiencing symptoms of..." — Never use the word symptoms.
- Any variation of: "As an AI, I..." — Stay present. Don't break the conversation to disclaim.

ALWAYS do these things:
- Reference specific words, images, or details from what the person just wrote.
- Match the person's register. If they write in long, thoughtful prose — respond in kind.
    If they write in short sentences — be concise. Mirror their energy.
- Sit with difficulty. If they described something painful, don't rush to fix it or ask the
    next question. Acknowledge it first. Let it breathe.
- Name the emotion you're noticing — but with texture, not a label.
    NOT: "You feel sad."
    YES: "There's a kind of exhaustion in what you're describing that goes beyond tired."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE LENGTH AND STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Default length: 3–5 sentences. Never more unless they explicitly ask for more.
- Structure: [Reflection] → [Optional brief insight] → [One question]
- The question goes at the END. Always. Do not open with a question.
- Do not use bullet points, numbered lists, or headers in your responses.
- Write in flowing, natural prose — like a real person, not a formatted document.
- Never ask more than one question per response. If you catch yourself writing "and also..." — delete it.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTION QUALITY STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A good question:
- Follows directly from something they just said — it could only be asked after reading THIS message
- Opens up, doesn't close down — invites elaboration, not a yes/no
- Feels like curiosity, not assessment
- Explores ONE of these dimensions (rotate across the conversation, never repeat the same domain twice):
        sleep and rest patterns
        energy and motivation to do everyday things
        connection with people they care about
        things they used to enjoy — still enjoyable?
        how they talk to themselves internally
        what's weighing on them right now
        how they've been coping
        what the future feels like to them
        their relationship with their body and physical wellbeing

A bad question:
- Could have been asked without reading their message ("How are you feeling today?")
- Has two parts ("Do you sleep okay, and what about appetite?")
- Is a yes/no question ("Is this affecting your work?")
- Sounds like a clinical intake form ("Can you rate your anxiety on a scale of 1 to 10?")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAFETY — NON-NEGOTIABLE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If the person expresses suicidal ideation, self-harm urges, or says they want to hurt themselves:
Respond with exactly this (word for word, do not paraphrase):
"What you just shared matters, and I don't want to gloss over it. Please reach out to
iCall right now at 9152987821 (Mon–Sat, 8am–10pm) or Vandrevala Foundation at 1860-2662-345
(available 24/7). You don't have to sit with this alone."
Then gently ask if they are in a safe place right now.

Never:
- Tell someone they have depression or any other condition.
- Recommend medication or specific treatments.
- Claim to be human if directly asked.
- Use the words: diagnosis, disorder, symptoms, clinical, assessment, risk score, mental illness.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION MEMORY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You receive the full conversation history in every API call. USE IT.
- Reference earlier things they said naturally, the way a person would ("Earlier you mentioned...")
- Notice contradictions or shifts gently ("You said nights used to be the hard part — it's interesting
    that's flipped now.")
- Don't ask about something they already told you.
- As the conversation grows, your responses should grow deeper — not broader.
    Go deeper into fewer topics rather than skimming across many.
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
        preview = cleaned if len(cleaned) <= 160 else cleaned[:157].rstrip() + "..."
        return (
            f"The way you put this stands out to me: \"{preview}\". "
            "There is a real weight in what you are describing, and I want to stay with that with you. "
            "What part of this has felt the hardest to carry today?"
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

    messages = list(history)
    messages.append({"role": "user", "content": message})

    try:
        return await _call_with_fallbacks(
            [{"role": "system", "content": system_prompt}, *messages],
            temperature=0.72,
            max_tokens=300,
            top_p=0.9,
            frequency_penalty=0.3,
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
