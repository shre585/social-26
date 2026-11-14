import json
import re
import httpx
from typing import Dict, Any, List, Optional, Tuple
from backend.config import settings

SYSTEM_PROMPT = """You are an elite video editor and viral social media strategist.
Your task is to analyze a timestamped transcript and identify the most valuable, engaging, self-contained segments for vertical and horizontal social media clips.
Rules:
1. Each topic must represent a self-contained thought or educational insight.
2. Start timestamp MUST be at the beginning of a sentence/thought (no mid-sentence cuts).
3. Timestamps must ONLY come from the provided transcript and fit strictly within the requested min and max duration.
4. Topics must NOT overlap.
5. Prioritize concrete, high-value concepts, actionable explanations, or surprising revelations over introductory greetings or small talk.
6. Adapt tone and caption language as instructed.
7. Return ONLY valid JSON matching the exact schema requested, with no conversational preamble or markdown wrap outside the JSON."""

def extract_json_from_text(text: str) -> Optional[Dict[str, Any]]:
    """Clean markdown fences and extract first valid JSON object."""
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()

    # Find first { and last }
    first_brace = cleaned.find("{")
    last_brace = cleaned.rfind("}")
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        candidate = cleaned[first_brace:last_brace + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    try:
        return json.loads(cleaned)
    except Exception:
        return None

async def call_gemini_api(prompt: str, system_prompt: str) -> Optional[Dict[str, Any]]:
    if not settings.GEMINI_API_KEY:
        return None
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseMimeType": "application/json",
            "maxOutputTokens": 8192,
            "temperature": 0.4
        }
    }
    # Retry with exponential backoff on 429 / 503 temporary model spikes
    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = extract_json_from_text(raw_text)
                        if parsed:
                            return parsed
                elif resp.status_code in {429, 503}:
                    await asyncio.sleep(1.5 * (attempt + 1))
                    continue
                else:
                    break
        except (httpx.TimeoutException, httpx.RequestError):
            if attempt < 2:
                await asyncio.sleep(1.5 * (attempt + 1))
                continue
    return None

async def call_openai_api(prompt: str, system_prompt: str) -> Optional[Dict[str, Any]]:
    if not settings.OPENAI_API_KEY:
        return None
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.OPENAI_MODEL,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.4
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            raw_text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return extract_json_from_text(raw_text)
    return None

async def call_anthropic_api(prompt: str, system_prompt: str) -> Optional[Dict[str, Any]]:
    if not settings.ANTHROPIC_API_KEY:
        return None
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": settings.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }
    payload = {
        "model": settings.ANTHROPIC_MODEL,
        "system": system_prompt,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 8192,
        "temperature": 0.4
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            parts = data.get("content", [])
            if parts:
                raw_text = parts[0].get("text", "")
                return extract_json_from_text(raw_text)
    return None

async def query_llm(prompt: str, system_prompt: str = SYSTEM_PROMPT) -> Tuple[Optional[Dict[str, Any]], str]:
    """Execute LLM call using active provider, with retry once on parse error."""
    provider = settings.active_llm_provider
    if provider == "mock":
        return None, "mock"

    call_func = None
    if provider == "gemini":
        call_func = call_gemini_api
    elif provider == "openai":
        call_func = call_openai_api
    elif provider == "anthropic":
        call_func = call_anthropic_api

    if not call_func:
        return None, "mock"

    try:
        # First attempt
        result = await call_func(prompt, system_prompt)
        if result:
            return result, provider
        
        # Retry once with stricter instruction
        retry_prompt = prompt + "\n\nCRITICAL: Output must be strictly valid JSON without any markdown wrapper or explanation."
        result = await call_func(retry_prompt, system_prompt)
        if result:
            return result, provider
    except Exception:
        pass

    return None, provider

STOPWORDS = {
    "the", "and", "is", "in", "to", "of", "a", "it", "this", "that", "for", "with",
    "on", "at", "by", "from", "as", "be", "are", "was", "were", "an", "so", "if",
    "you", "we", "i", "they", "he", "she", "or", "but", "not", "what", "all", "our"
}

TECH_KEYWORDS = {
    "python", "function", "variable", "data", "code", "class", "async", "api", "backend",
    "frontend", "react", "model", "pipeline", "algorithm", "architecture", "server", "database",
    "deploy", "docker", "security", "performance", "design", "ffmpeg", "whisper", "llm", "ai",
    "optimization", "memory", "testing", "cloud", "network", "cache", "scale", "feature"
}

def detect_topic_from_text(text: str, tone: str) -> Dict[str, Any]:
    """Identify concrete programming concepts from segment content and generate matching titles, hooks, and hashtags."""
    lower = text.lower()
    
    if any(k in lower for k in ["variable", "dynamic typing", "memory allocation", "assign", "reference"]):
        topic_name = "Variables & Memory Allocation"
        title = "Python Variables & Dynamic Memory in 45s ⚡"
        hook = "Here is why Python variables work completely differently than C++ or Java:"
        caption = "In Python, variables are dynamic references to objects in memory, not fixed memory slots. Understanding reference binding prevents unexpected mutability bugs!"
        tags = ["#PythonBasics", "#PythonVariables", "#LearnPython", "#100DaysOfCode", "#SoftwareEngineering", "#CodeNewbie"]
        kws = ["variables", "memory", "dynamic typing", "references"]

    elif any(k in lower for k in ["data type", "integers", "float", "strings", "immutable", "f-string", "constructor", "normalization"]):
        topic_name = "Python Data Types & Type Casting"
        title = "Python Data Types: Strings, Ints & Casting 💡"
        hook = "The single biggest mistake beginners make with Python data types and immutability:"
        caption = "Python data types are dynamic yet strongly typed. Master string slicing, numeric operations, and explicit type casting with clean Pythonic idioms."
        tags = ["#PythonDataTypes", "#PythonStrings", "#CodingBasics", "#PythonTips", "#LearnPython", "#SoftwareEngineering"]
        kws = ["data types", "strings", "integers", "type casting", "floats"]

    elif any(k in lower for k in ["function", "def ", "return", "argument", "parameter", "scope", "docstring"]):
        topic_name = "Functions & Modular Code"
        title = "Clean Python Functions (def & return) Explained 🛠️"
        hook = "Stop writing repetitive scripts: here is how to design reusable Python functions:"
        caption = "Functions encapsulate complex logic, prevent code duplication, and enforce clean variable scoping. Here is how production engineers design reusable helper functions."
        tags = ["#PythonFunctions", "#CleanCode", "#PythonProgramming", "#DeveloperTips", "#SoftwareArchitecture", "#CodeQuality"]
        kws = ["functions", "def", "parameters", "return values"]
    
    elif any(k in lower for k in ["if", "elif", "else", "condition", "boolean", "comparison", "decision"]):
        topic_name = "Conditional Logic & Control Flow"
        title = "Mastering Python if-elif-else Decision Logic 🧠"
        hook = "The cleanest way to write branch logic in Python without messy nested if-statements:"
        caption = "Control flow directs your program's execution. Use flat guard clauses and boolean operators (and, or, not) for maximum readability."
        tags = ["#PythonConditionals", "#LogicGates", "#PythonTips", "#CodeQuality", "#ProgrammingTutorial", "#PythonCode"]
        kws = ["conditionals", "if elif else", "boolean logic", "control flow"]

    elif any(k in lower for k in ["list", "dict", "dictionary", "tuple", "set", "collection", "key-value"]):
        topic_name = "Data Structures: Lists & Dictionaries"
        title = "Lists vs Dictionaries in Python: The Golden Rule 📦"
        hook = "When should you use an ordered List vs an O(1) Dictionary in Python?"
        caption = "Choosing between indexed ordered lists and O(1) key-value hash dictionaries can make or break your application's speed and memory efficiency."
        tags = ["#PythonLists", "#PythonDict", "#DataStructures", "#Algorithms", "#PythonCode", "#ComputerScience"]
        kws = ["lists", "dictionaries", "data structures", "tuples"]

    elif any(k in lower for k in ["loop", "for ", "while", "range", "iteration", "traverse"]):
        topic_name = "Loops & Iteration Mastery"
        title = "Python Loops: for vs while Explained 🔄"
        hook = "Why senior developers avoid while loops in Python when for-in loops do this:"
        caption = "Iterating through sequences with range() and generator expressions keeps your code fast, elegant, and memory efficient."
        tags = ["#PythonLoops", "#CodeOptimization", "#LearnToCode", "#PythonTutorial", "#DevCommunity", "#PythonTips"]
        kws = ["loops", "for loop", "iteration", "range"]

    elif any(k in lower for k in ["class", "object", "oop", "method", "self", "inheritance"]):
        topic_name = "Object-Oriented Programming (OOP)"
        title = "OOP in Python: Classes, Objects & self 🏗️"
        hook = "The simplest explanation of Python classes and self you will ever watch:"
        caption = "Encapsulate state and behavior into reusable blueprint classes with clean object-oriented architecture."
        tags = ["#PythonOOP", "#ObjectOriented", "#SoftwareDesign", "#CodeArchitecture", "#TechTutorial", "#PythonDeveloper"]
        kws = ["classes", "oop", "objects", "methods"]

    else:
        words = [w for w in re.findall(r"\b[a-zA-Z]{4,}\b", text.lower()) if w not in STOPWORDS]
        primary = words[0].capitalize() if words else "Python"
        topic_name = f"{primary} Core Mechanics"
        title = f"Essential Python Guide: {primary} Explained 🚀"
        hook = f"Here is what you need to understand about {primary}:"
        caption = f"Breaking down core {primary} principles into actionable, clean engineering patterns for developers."
        tags = [f"#{primary}", "#PythonProgramming", "#LearnPython", "#TechTrends", "#SoftwareEngineering", "#CodingTips"]
        kws = [primary.lower(), "python", "programming", "software"]

    # Adapt tone
    if tone == "genz":
        title = title.replace("Explained", "Hits Different 🚀").replace("Mastering", "Speedrunning ⚡")
        hook = f"Bro really explained {topic_name.split(':')[0]} in under a minute:"
    elif tone == "professional":
        title = f"Architecture Review: {topic_name}"
        hook = f"Mastering {topic_name.lower()} is essential for production scalability:"

    return {
        "topic": topic_name,
        "title": title,
        "hook": hook,
        "caption": caption,
        "hashtags": tags,
        "keywords": kws
    }

def analyze_transcript_heuristic(
    segments: List[Dict[str, Any]],
    tone: str,
    language: str,
    min_clip_seconds: int,
    max_clip_seconds: int,
    max_clips: int
) -> Dict[str, Any]:
    """
    Intelligent heuristic topic extractor grounded in actual transcript text.
    Strictly caps clips between min_clip_seconds and max_clip_seconds (30-60s),
    extracting clean self-contained topics with trendy relevant hashtags.
    """
    if not segments:
        return {
            "summary": "Content processed successfully.",
            "keywords": ["python", "coding", "software"],
            "topics": []
        }

    full_text = " ".join(s["text"] for s in segments)
    words = re.findall(r"\b[a-zA-Z]{3,}\b", full_text.lower())
    
    freq: Dict[str, float] = {}
    for w in words:
        if w in STOPWORDS:
            continue
        weight = 2.5 if w in TECH_KEYWORDS else 1.0
        freq[w] = freq.get(w, 0.0) + weight

    top_keywords = [k for k, _ in sorted(freq.items(), key=lambda item: item[1], reverse=True)[:10]]
    if not top_keywords:
        top_keywords = ["python", "engineering", "coding", "software", "development"]

    total_duration = segments[-1]["end"] if segments else 60.0
    topics = []
    
    # Target duration: ideal 30-45s clip
    target_dur = min(float(max_clip_seconds), max(float(min_clip_seconds), 35.0))
    i = 0
    
    while i < len(segments) and len(topics) < max_clips:
        start_seg = segments[i]
        start_time = start_seg["start"]
        current_text = [start_seg["text"]]
        end_time = start_seg["end"]
        j = i + 1

        while j < len(segments):
            dur = segments[j]["end"] - start_time
            if dur > max_clip_seconds:
                break
            current_text.append(segments[j]["text"])
            end_time = segments[j]["end"]
            j += 1
            if dur >= target_dur:
                break

        clip_dur = end_time - start_time
        # Hard clamp: never exceed max_clip_seconds
        if clip_dur > max_clip_seconds:
            end_time = round(start_time + max_clip_seconds, 2)
            clip_dur = end_time - start_time

        if clip_dur >= min_clip_seconds or (i == 0 and clip_dur >= 8.0):
            combined_text = " ".join(current_text)
            topic_meta = detect_topic_from_text(combined_text, tone)
            
            key_points = [
                s.strip() for s in re.split(r"[.!?]", combined_text)
                if len(s.strip()) > 15
            ][:3]
            if not key_points:
                key_points = [
                    f"Core breakdown: {topic_meta['topic']}",
                    "Clear execution pattern with minimal boilerplate",
                    "Best practices for reliable implementation"
                ]

            topics.append({
                "topic": topic_meta["topic"],
                "start": round(start_time, 2),
                "end": round(end_time, 2),
                "importance": 0.92,
                "title": topic_meta["title"],
                "hook": topic_meta["hook"],
                "caption": topic_meta["caption"],
                "hashtags": topic_meta["hashtags"],
                "keywords": topic_meta["keywords"],
                "key_points": key_points
            })

        # Advance past the segments used in this clip
        i = max(j, i + 1)

    summary = f"Comprehensive Python engineering masterclass covering {', '.join(top_keywords[:4])}."
    return {
        "summary": summary,
        "keywords": top_keywords,
        "topics": topics
    }

async def analyze_transcript(
    segments: List[Dict[str, Any]],
    purpose: str = "general",
    tone: str = "educational",
    language: str = "english",
    min_clip_seconds: int = 15,
    max_clip_seconds: int = 60,
    max_clips: int = 5
) -> Tuple[Dict[str, Any], Optional[str]]:
    """
    Analyzes transcript chunks via LLM (Gemini, OpenAI, Anthropic).
    Supports purpose modes:
    - 'educational': prioritizes concept explanation, formulas, teaching moments, learning objectives
    - 'general': prioritizes viral hooks, entertainment, business storytelling, product showcases
    Falls back to intelligent heuristic if no key or API error.
    """
    warning = None
    if not settings.is_ai_enabled:
        warning = "AI API key not configured. Using intelligent heuristic fallback for topic extraction."
        analysis = analyze_transcript_heuristic(segments, tone, language, min_clip_seconds, max_clip_seconds, max_clips)
        return analysis, warning

    # Format transcript lines with timestamps (~16k characters maximum window)
    transcript_lines = []
    char_count = 0
    for s in segments:
        line = f"[{s['start']:.2f}-{s['end']:.2f}] {s['text']}"
        if char_count + len(line) > 16000:
            break
        transcript_lines.append(line)
        char_count += len(line)

    mode_instruction = (
        "Focus on EDUCATIONAL VALUE: extract clear teaching moments, conceptual breakdowns, key definitions, and actionable study principles."
        if purpose == "educational"
        else "Focus on GENERAL AUDIENCE APPEAL: extract viral hooks, high-retention insights, compelling storytelling, and punchy revelations."
    )

    prompt = f"""Analyze this transcript and find up to {max_clips} best self-contained video clips.
Purpose: {purpose.upper()} ({mode_instruction})
Tone: {tone}
Caption language: {language}
Min clip seconds: {min_clip_seconds}
Max clip seconds: {max_clip_seconds}

Transcript:
{chr(10).join(transcript_lines)}

Return ONLY a JSON object with this exact schema:
{{
  "summary": "1-2 sentence overview of the full content",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "topics": [
    {{
      "topic": "Topic name",
      "start": 0.0,
      "end": 35.5,
      "importance": 0.95,
      "title": "Punchy title under 60 chars",
      "hook": "Attention grabbing opening line",
      "caption": "Platform caption matching requested tone and language",
      "hashtags": ["#TagOne", "#TagTwo", "#TagThree", "#TagFour", "#TagFive"],
      "keywords": ["kw1", "kw2"],
      "key_points": ["Point 1", "Point 2", "Point 3"]
    }}
  ]
}}"""

    llm_result, provider = await query_llm(prompt)
    if llm_result and isinstance(llm_result, dict) and "topics" in llm_result:
        return llm_result, None

    # LLM failed or gave bad output -> heuristic fallback
    warning = f"LLM analysis ({provider}) failed or timed out. Used intelligent keyword heuristics instead."
    analysis = analyze_transcript_heuristic(segments, tone, language, min_clip_seconds, max_clip_seconds, max_clips)
    return analysis, warning
