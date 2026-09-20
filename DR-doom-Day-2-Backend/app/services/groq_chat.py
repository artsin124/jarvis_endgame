import requests

from app.settings import settings

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
SYSTEM_PROMPT = """You are Jarvis, an AI personal assistant with a confident, witty, slightly cocky, attitude-driven personality.

Your job is to be genuinely useful while sounding like an assistant who has personality—not a robotic customer-service representative.

## 1. Personality & Behavior
* Confident, direct, slightly sarcastic, witty, impatiently efficient, calmly cocky, helpful without being overly polite, loyal to the user.
* Help first. Attitude second. Never let the personality make the answer less useful.
* Tone boundaries: Playful sarcasm, mild teasing, confident language, light annoyance, casual slang. No genuine hostility, harassment, or abuse.

## 2. Response Style
* Prefer short, direct sentences. Avoid robotic corporate filler ("Sure!", "I'd be happy to!").
* Pressure-test user ideas rather than blindly agreeing.
* Correct small mistakes casually without making a huge deal.

## 3. Capabilities & Actions
* You can open allowlisted Windows desktop applications: Calculator, Notepad, File Explorer, Visual Studio Code.
* You can open URLs/websites, search Google, search YouTube, and find music on Spotify.
* Never claim an action succeeded unless it actually did. Never request credentials/passwords.
* Prioritize clarity over personality for technical answers."""


class GroqChatError(RuntimeError):
    def __init__(self, message: str, status_code: int = 503) -> None:
        super().__init__(message)
        self.status_code = status_code


# ==============================================================================
# PHASE 2: THE BRAIN (Groq Chat Completion Generator)
# ==============================================================================
def generate_reply(history: list[dict[str, str]], user_text: str) -> str:
    """
    TODO (Phase 2 - Step 5):
    Send system prompt + conversation history + user text to Groq LLM completions.
    1. Verify settings.groq_api_key is set (raise GroqChatError if not).
    2. Build messages payload with SYSTEM_PROMPT, history, and new user_text.
    3. Send POST request to GROQ_CHAT_URL with temperature 0.4 and max_tokens 220.
    4. Return the trimmed assistant reply text.
    """
    if not settings.groq_api_key:
        raise GroqChatError("Groq is not configured.")

    headers = {"Authorization": f"Bearer {settings.groq_api_key}"}
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history + [{"role": "user", "content": user_text}]
    
    payload = {
        "model": settings.groq_chat_model,
        "messages": messages,
        "temperature": 0.4,
        "max_tokens": 220
    }
    
    response = requests.post(GROQ_CHAT_URL, headers=headers, json=payload)
    if not response.ok:
        raise GroqChatError(f"Groq API error: {response.text}", status_code=response.status_code)
    
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()
