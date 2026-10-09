import json
import re
from typing import Literal
from urllib.parse import quote_plus, urlparse, urlunparse

import requests

from app.settings import settings

PlanKind = Literal["web_search", "youtube_search", "spotify_search"]

PLANNER_PROMPT = """Classify a browser-navigation request. Return JSON only:
{"kind":"web_search|youtube_search|spotify_search","query":"short search text"}.
Use youtube_search for requests to find a YouTube video, song, audio, or channel.
Use spotify_search for requests to find music, an artist, album, podcast, or playlist on Spotify.
Use web_search for every other website/search request. Never return a URL, command,
file path, app name, or explanation."""


# ==============================================================================
# PHASE 4: THE HANDS (Safe Web Action Destination Planner)
# ==============================================================================
def _model_classification(text: str) -> dict | None:
    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": settings.groq_chat_model,
        "messages": [
            {"role": "system", "content": PLANNER_PROMPT},
            {"role": "user", "content": text}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0
    }
    
    resp = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data, timeout=5)
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"]
    return json.loads(content)


def make_web_action_plan(text: str) -> dict[str, str]:
    """
    TODO (Phase 4 - Step 9):
    Classify user navigation request and return safe destination plan {kind, label, url}.
    - Explicit URL -> open_website
    - YouTube search -> youtube_search
    - Spotify search -> spotify_search
    - Other search -> web_search
    """
    text_stripped = text.strip()
    
    url_match = re.search(r'(https?://[^\s]+)', text_stripped)
    if url_match:
        url = url_match.group(1)
        parsed = urlparse(url)
        return {
            "kind": "open_website",
            "label": parsed.netloc,
            "url": url
        }
        
    if re.match(r"^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+(/[^\s]*)?$", text_stripped):
        url = "https://" + text_stripped
        parsed = urlparse(url)
        return {
            "kind": "open_website",
            "label": parsed.netloc,
            "url": url
        }

    try:
        plan = _model_classification(text_stripped)
        if plan is None:
            raise ValueError("Mocked")
        kind = plan.get("kind", "web_search")
        query = plan.get("query", text_stripped)
    except Exception:
        text_lower = text_stripped.lower()
        if "youtube" in text_lower:
            kind = "youtube_search"
            # Simple extraction for fallback
            query = re.sub(r'(?i)play|on youtube|search for', '', text_stripped).strip()
        elif "spotify" in text_lower:
            kind = "spotify_search"
            query = re.sub(r'(?i)play|on spotify|search for', '', text_stripped).strip()
        else:
            kind = "web_search"
            query = text_stripped
        
    if kind == "youtube_search":
        url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
        label = f"Search YouTube for '{query}'"
    elif kind == "spotify_search":
        url = f"https://open.spotify.com/search/{quote_plus(query)}"
        label = f"Search Spotify for '{query}'"
    else:
        kind = "web_search"
        url = f"https://www.google.com/search?q={quote_plus(query)}"
        label = f"Search Web for '{query}'"
        
    return {
        "kind": kind,
        "label": label,
        "url": url
    }
