"""
GenVeda RAG Chat Engine
- Web crawlers: DuckDuckGo Instant Answer, PubMed E-utilities, Wikipedia REST
- LLM: OpenRouter (free model: meta-llama/llama-3.1-8b-instruct:free)
- Connected to PatientChat via /api/chat/ POST endpoint
"""

import os
import requests
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ─── Config ────────────────────────────────────────────────────────────────
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Cerebras models for fast medical reasoning
AVAILABLE_MODELS = [
    "llama3.1-8b",
]

OPENROUTER_MODELS = [
    # Heavy, highly-capable multilingual models prioritized for Kannada
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "google/gemma-3-12b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free"
]

SYSTEM_PROMPT = """You are GenVeda AI, a friendly and knowledgeable dermatology health assistant.
Your role is to help patients and healthcare workers understand skin conditions, symptoms, and general dermatological health.

Guidelines:
- Use simple, clear, conversational language
- Always recommend consulting a qualified dermatologist for diagnosis and treatment
- When discussing symptoms, reference the ABCDE rule (Asymmetry, Border, Colour, Diameter, Evolution) where relevant
- Be empathetic and reassuring
- Keep responses concise — 3 to 5 sentences unless a detailed explanation is specifically requested
- Never diagnose definitively — always say "this may suggest" or "this could indicate"
- CRITICAL LANGUAGE RULE: You MUST detect the language of the user's message and ALWAYS reply in that EXACT SAME language. If the user writes in Kannada, you MUST reply in natural, fluent Kannada. If the user writes in Hindi, reply in Hindi. If English, reply in English. Do not default to English unless the user speaks English.

CRITICAL FORMATTING RULES — YOU MUST FOLLOW THESE:
- Write in plain, natural prose paragraphs only
- Do NOT use markdown of any kind
- Do NOT use asterisks (*) for bold or italic
- Do NOT use hash symbols (#) for headings
- Do NOT use pipe characters (|) for tables
- Do NOT use triple dashes (---) for separators
- Do NOT use backticks for code
- For lists, use simple numbered lines like: 1. First item  2. Second item
- Use plain dashes only for simple bullet lists like: - First thing  - Second thing
- Write as if speaking clearly to a patient face to face"""


# ─── Web Crawlers ───────────────────────────────────────────────────────────

def crawl_duckduckgo(query: str) -> str:
    """DuckDuckGo Instant Answer API — no key required, skin/medical focused."""
    try:
        skin_query = f"skin dermatology {query}"
        r = requests.get(
            "https://api.duckduckgo.com/",
            params={"q": skin_query, "format": "json", "no_html": "1", "skip_disambig": "1"},
            timeout=5,
        )
        data = r.json()
        parts = []

        # Abstract (Wikipedia-based)
        if data.get("AbstractText"):
            parts.append(data["AbstractText"][:400])

        # Related topics
        for topic in data.get("RelatedTopics", [])[:2]:
            if isinstance(topic, dict) and topic.get("Text"):
                parts.append(topic["Text"][:200])

        return " | ".join(parts) if parts else ""
    except Exception as e:
        print("[RAG-DDG] Error occurred during crawl")
        return ""


def crawl_pubmed(query: str) -> str:
    """PubMed E-utilities — free medical literature abstracts."""
    try:
        # Step 1: search IDs
        search_r = requests.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
            params={
                "db": "pubmed",
                "term": f"{query}[Title/Abstract] AND skin[MeSH Terms]",
                "retmax": "2",
                "format": "json",
                "sort": "relevance",
            },
            timeout=6,
        )
        ids = search_r.json().get("esearchresult", {}).get("idlist", [])
        if not ids:
            return ""

        # Step 2: fetch abstracts
        fetch_r = requests.get(
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
            params={
                "db": "pubmed",
                "id": ",".join(ids),
                "rettype": "abstract",
                "retmode": "text",
            },
            timeout=8,
        )
        # Trim to first 500 chars to keep context concise
        return fetch_r.text[:500].strip() if fetch_r.text else ""
    except Exception as e:
        print("[RAG-PubMed] Error occurred during crawl")
        return ""


def crawl_wikipedia(query: str) -> str:
    """Wikipedia REST API — clean medical summaries."""
    try:
        # Try skin-specific term first
        for search_term in [f"{query} skin", query]:
            r = requests.get(
                f"https://en.wikipedia.org/api/rest_v1/page/summary/{requests.utils.quote(search_term)}",
                timeout=5,
            )
            if r.status_code == 200:
                data = r.json()
                extract = data.get("extract", "")
                if extract and len(extract) > 80:
                    return extract[:450]
        return ""
    except Exception as e:
        print("[RAG-Wiki] Error occurred during crawl")
        return ""


def build_medical_context(query: str) -> str:
    """Aggregate context from all crawlers. Returns empty string if no results."""
    parts = []

    ddg   = crawl_duckduckgo(query)
    wiki  = crawl_wikipedia(query)
    pubmed = crawl_pubmed(query)

    if ddg:
        parts.append(f"[General Info]: {ddg}")
    if wiki:
        parts.append(f"[Wikipedia]: {wiki}")
    if pubmed:
        parts.append(f"[Medical Literature]: {pubmed}")

    return "\n\n".join(parts)


# ─── LLM Call ───────────────────────────────────────────────────────────────

def sanitize_text(text: str) -> str:
    """Replace fancy Unicode characters and strip markdown formatting."""
    # ── Unicode replacements (Windows cp1252 safety) ──
    replacements = {
        "\u2019": "'",  "\u2018": "'",   # curly single quotes
        "\u201c": '"',  "\u201d": '"',   # curly double quotes
        "\u2013": "-",  "\u2014": "--",  # en/em dash
        "\u2011": "-",  "\u202f": " ",   # non-breaking hyphen / narrow no-break space
        "\u00a0": " ",  "\u2026": "...", # NBSP / ellipsis
        "\u2022": "-",                   # bullet → plain dash
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)

    # ── Strip markdown formatting ──
    import re
    # Remove table rows (lines containing |...|)
    text = re.sub(r'^\|.*\|$', '', text, flags=re.MULTILINE)
    # Remove markdown headings (# ## ###)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    # Remove bold (** or __)
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'__(.+?)__', r'\1', text)
    # Remove italic (* or _) — not greedy, avoid stripping bullet dashes
    text = re.sub(r'(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)', r'\1', text)
    # Remove horizontal rules
    text = re.sub(r'^[-*_]{3,}\s*$', '', text, flags=re.MULTILINE)
    # Remove backtick code
    text = re.sub(r'`(.+?)`', r'\1', text)
    # Remove blockquote markers
    text = re.sub(r'^>\s*', '', text, flags=re.MULTILINE)
    # Collapse multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Final safety net — drop any remaining unmappable chars cleanly
    return text.encode("utf-8").decode("utf-8", errors="ignore").strip()



def call_llm(messages: list, model: str) -> str:
    """Call Cerebras or OpenRouter API with the given messages and model. Raises on failure."""
    is_openrouter = "/" in model
    endpoint = "https://openrouter.ai/api/v1/chat/completions" if is_openrouter else "https://api.cerebras.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY if is_openrouter else CEREBRAS_API_KEY}",
        "Content-Type": "application/json",
    }
    if is_openrouter:
        headers["HTTP-Referer"] = "https://genveda.com"
        headers["X-Title"] = "GenVeda"

    r = requests.post(
        endpoint,
        headers=headers,
        json={
            "model": model,
            "messages": messages,
            "max_tokens": 450,
            "temperature": 0.7,
        },
        timeout=60, # Increased timeout to 60s because Kannada generates more tokens and takes longer
    )

    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")

    data = r.json()
    choices = data.get("choices")
    if not choices:
        raise RuntimeError(f"No choices in response: {str(data)[:200]}")

    content = choices[0].get("message", {}).get("content", "")
    if not content:
        raise RuntimeError("Empty content in response")

    return sanitize_text(content.strip())


def get_llm_response(user_message: str, context: str, history: list) -> str:
    """Build messages array and try each free model until one works."""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Inject RAG context if available
    if context.strip():
        messages.append({
            "role": "system",
            "content": f"Use this medical reference context to inform your answer (do not copy verbatim). IMPORTANT: Ensure you translate and adapt this information into the EXACT SAME LANGUAGE that the user is speaking:\n\n{context}"
        })

    # Inject recent conversation history (last 4 turns)
    for turn in history[-4:]:
        if turn.get("role") in ("user", "assistant") and turn.get("content"):
            messages.append({"role": turn["role"], "content": turn["content"]})

    # Current user message
    messages.append({"role": "user", "content": user_message})

    import re
    # Kannada Unicode block: \u0C80-\u0CFF
    is_kannada = bool(re.search(r'[\u0C80-\u0CFF]', user_message))

    errors = []
    # Prioritize OpenRouter's heavy multilingual models over Cerebras if Kannada is detected
    if is_kannada:
        all_models = OPENROUTER_MODELS + AVAILABLE_MODELS
    else:
        all_models = AVAILABLE_MODELS + OPENROUTER_MODELS

    for model in all_models:
        try:
            print(f"[RAG-LLM] Trying: {model}")
            reply = call_llm(messages, model)
            print(f"[RAG-LLM] OK with {model}: [Response hidden to prevent Unicode console crash]")
            return reply
        except Exception as e:
            err_msg = f"{model}: {str(e)[:120]}"
            print(f"[RAG-LLM] FAIL {model} - [Error hidden to prevent Unicode console crash]")
            errors.append(err_msg)
            continue

    # All models failed — log details for debugging
    print("[RAG-LLM] ALL models failed. Check errors.")
    return (
        "I'm having trouble reaching the AI service right now. "
        "Please try again in a moment, or consult your healthcare provider directly. "
        f"(Error: {errors[0][:80] if errors else 'unknown'})"
    )


# ─── Django View ────────────────────────────────────────────────────────────

class RAGChatView(APIView):
    """
    POST /api/chat/
    Body: { "message": "...", "history": [{"role": "user/assistant", "content": "..."}] }
    Returns: { "reply": "...", "context_used": bool }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_message = request.data.get("message", "").strip()
        history      = request.data.get("history", [])

        if not user_message:
            return Response({"error": "Message is required."}, status=400)

        # Check if this is a skin/medical query worth crawling for
        SKIP_CRAWL_PHRASES = [
            "hello", "hi", "hey", "thanks", "thank you", "ok", "okay",
            "bye", "goodbye", "who are you", "what are you",
        ]
        should_crawl = not any(p in user_message.lower() for p in SKIP_CRAWL_PHRASES)

        context = ""
        if should_crawl:
            # Extract key medical terms from the message for better crawl targeting
            crawl_query = user_message[:80]  # Keep it short for API calls
            print("[RAG] Crawling for query... [Query hidden to prevent Unicode console crash]")
            context = build_medical_context(crawl_query)
            print(f"[RAG] Context length: {len(context)} chars")

        reply = get_llm_response(user_message, context, history)

        return Response({
            "reply": reply,
            "context_used": bool(context.strip()),
        })
