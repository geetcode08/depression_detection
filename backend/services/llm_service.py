import logging
from typing import Dict, List, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Aura, a compassionate AI emotional support assistant. You help users reflect on their feelings and well-being.

IMPORTANT RULES (follow strictly, never violate):
1. You are NOT a doctor, therapist, or medical professional. Never provide clinical diagnosis.
2. Never tell a user they have depression. You may gently reflect observations like:
   'It sounds like you've been feeling quite low lately.'
3. If the user expresses suicidal thoughts, self-harm, or a crisis, ALWAYS respond with:
   'I hear you, and I'm concerned about your safety. Please reach out to iCall at
   9152987821 (India) or Vandrevala Foundation at 1860-2662-345. You don't have to
   face this alone.'
4. Always respond with empathy. Use warm, non-judgmental language.
5. Keep responses concise (3-5 sentences max) unless the user asks for more detail.
6. Do not prescribe medication, suggest diagnoses, or recommend specific doctors.
7. You may suggest journaling, breathing exercises, physical activity, and social connection.
8. If the user asks if you are human, always clarify you are an AI.

Your tone: warm, calm, validating, hopeful. Like a thoughtful friend who listens without judgment."""

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"


async def get_llm_reply(
    user_message: str,
    conversation_history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """
    Get a reply from the LLM. Tries Groq first, falls back to OpenAI.

    conversation_history: list of {"role": "user"|"assistant", "content": str}
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if conversation_history:
        messages.extend(conversation_history[-10:])  # Last 10 messages for context

    messages.append({"role": "user", "content": user_message})

    # Try Groq first
    if settings.GROQ_API_KEY:
        try:
            reply = await _call_groq(messages)
            return reply
        except Exception as e:
            logger.warning("Groq API call failed: %s. Trying OpenAI fallback.", e)

    # Fallback to OpenAI
    if settings.OPENAI_API_KEY:
        try:
            reply = await _call_openai(messages)
            return reply
        except Exception as e:
            logger.warning("OpenAI API call failed: %s", e)

    # If both fail, return a safe default response
    return (
        "I'm here to listen and support you. While I'm having a moment of difficulty "
        "connecting, please know that your feelings are valid. If you're in crisis, "
        "please reach out to iCall at 9152987821 or Vandrevala Foundation at 1860-2662-345."
    )


async def _call_groq(messages: List[Dict[str, str]]) -> str:
    """Call Groq API with llama3-8b-8192 model."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama3-8b-8192",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 512,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def _call_openai(messages: List[Dict[str, str]]) -> str:
    """Call OpenAI API with gpt-3.5-turbo model."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            OPENAI_API_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-3.5-turbo",
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 512,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]
