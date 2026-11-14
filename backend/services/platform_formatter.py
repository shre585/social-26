import re
from typing import Dict, Any, List

PLATFORM_SPECS: Dict[str, Dict[str, Any]] = {
    "instagram": {
        "id": "instagram",
        "label": "Instagram Reels",
        "emoji": "📸",
        "aspect": "9:16",
        "width": 1080,
        "height": 1920,
        "max_seconds": 90,
        "caption_limit": 2200,
        "title_limit": 100,
        "post_limit": 2200,
        "hashtag_limit": 10,
        "best_times": ["Tue-Thu 7-9 PM", "Sat 11 AM"],
        "tip": "Use high-energy hooks in the first 3 seconds with on-screen text."
    },
    "youtube": {
        "id": "youtube",
        "label": "YouTube Shorts",
        "emoji": "▶️",
        "aspect": "9:16",
        "width": 1080,
        "height": 1920,
        "max_seconds": 60,
        "caption_limit": 5000,
        "title_limit": 100,
        "post_limit": 5000,
        "hashtag_limit": 5,
        "best_times": ["Mon-Fri 2-4 PM", "Sat-Sun 9-11 AM"],
        "tip": "Keep viewers looping by connecting the end sentence to the opening hook."
    },
    "youtube_long": {
        "id": "youtube_long",
        "label": "YouTube Video",
        "emoji": "📺",
        "aspect": "16:9",
        "width": 1920,
        "height": 1080,
        "max_seconds": 3600,
        "caption_limit": 5000,
        "title_limit": 100,
        "post_limit": 5000,
        "hashtag_limit": 3,
        "best_times": ["Thu-Fri 3-5 PM", "Sat 10 AM"],
        "tip": "Optimize for search keywords and add chapter timestamps in the description."
    },
    "facebook": {
        "id": "facebook",
        "label": "Facebook Reels",
        "emoji": "👥",
        "aspect": "4:5",
        "width": 1080,
        "height": 1350,
        "max_seconds": 120,
        "caption_limit": 2200,
        "title_limit": 100,
        "post_limit": 2200,
        "hashtag_limit": 3,
        "best_times": ["Wed-Fri 1-4 PM"],
        "tip": "Focus on relatable or educational storytelling that sparks comment debates."
    },
    "x": {
        "id": "x",
        "label": "X (Twitter)",
        "emoji": "🐦",
        "aspect": "16:9",
        "width": 1280,
        "height": 720,
        "max_seconds": 140,
        "caption_limit": 280,
        "title_limit": 70,
        "post_limit": 280,
        "hashtag_limit": 2,
        "best_times": ["Mon-Fri 8-10 AM", "Wed 12-2 PM"],
        "tip": "Punchy one-liner or contrarian hook performs best for retweets."
    },
    "snapchat": {
        "id": "snapchat",
        "label": "Snapchat Spotlight",
        "emoji": "👻",
        "aspect": "9:16",
        "width": 1080,
        "height": 1920,
        "max_seconds": 60,
        "caption_limit": 80,
        "title_limit": 60,
        "post_limit": 80,
        "hashtag_limit": 3,
        "best_times": ["Daily 8-11 PM"],
        "tip": "Fast pacing, vertical fullscreen audio, and concise visual punchlines."
    },
    "linkedin": {
        "id": "linkedin",
        "label": "LinkedIn Post",
        "emoji": "💼",
        "aspect": "1:1",
        "width": 1080,
        "height": 1080,
        "max_seconds": 120,
        "caption_limit": 3000,
        "title_limit": 100,
        "post_limit": 3000,
        "hashtag_limit": 4,
        "best_times": ["Tue-Thu 8-10 AM", "Wed 12 PM"],
        "tip": "Professional takeaway for founders, engineers, and executives ending with a reflective question."
    }
}

GENERIC_BACKUP_TAGS = ["#Tech", "#Learn", "#Coding", "#Innovation", "#Growth", "#Tutorial", "#Creator"]

def to_camel_case_hashtag(tag: str) -> str:
    """Normalize string to #CamelCase hashtag."""
    cleaned = re.sub(r"[^\w\s]", "", tag).strip()
    if not cleaned:
        return "#Content"
    words = cleaned.split()
    camel = "".join(w.capitalize() for w in words)
    if not camel.startswith("#"):
        camel = "#" + camel
    return camel

def normalize_hashtags(raw_tags: List[str], platform_id: str) -> List[str]:
    """Deduplicate, normalize to #CamelCase, pad to at least 5 tags, trim to platform limit."""
    spec = PLATFORM_SPECS.get(platform_id, PLATFORM_SPECS["instagram"])
    limit = spec["hashtag_limit"]

    seen = set()
    result = []

    # If YouTube shorts, ensure #Shorts is preserved
    if platform_id == "youtube":
        result.append("#Shorts")
        seen.add("#shorts")

    for tag in raw_tags:
        normalized = to_camel_case_hashtag(tag)
        key = normalized.lower()
        if key not in seen and len(normalized) > 1:
            seen.add(key)
            result.append(normalized)

    # Pad with generic tags if under 5
    for backup in GENERIC_BACKUP_TAGS:
        if len(result) >= 5:
            break
        if backup.lower() not in seen:
            seen.add(backup.lower())
            result.append(backup)

    # Trim to platform limit
    return result[:limit]

def get_tone_cta(tone: str) -> str:
    tone = tone.lower()
    if tone == "genz":
        return "Drop a comment or share with your mutuals! ⚡"
    elif tone == "professional":
        return "Save this post and share your perspective in the comments below."
    elif tone == "funny":
        return "Tag a friend who definitely needs to see this 😂"
    else:  # educational
        return "Bookmark this for your next project and follow for more tutorials! 📌"

def compose_post(platform_id: str, title: str, caption: str, hashtags: List[str], tone: str = "educational") -> Dict[str, Any]:
    """Build platform-optimized copy-paste post text based on specs."""
    spec = PLATFORM_SPECS.get(platform_id, PLATFORM_SPECS["instagram"])
    tags = normalize_hashtags(hashtags, platform_id)
    tag_str = " ".join(tags)
    cta = get_tone_cta(tone)

    if platform_id == "instagram":
        # Title/Hook + blank + Caption + blank + CTA + blank + hashtags
        text = f"{title}\n\n{caption}\n\n{cta}\n\n.\n.\n{tag_str}"
        return {
            "title": title[:spec["title_limit"]],
            "caption": caption[:spec["caption_limit"]],
            "hashtags": tags,
            "description": None,
            "text": text,
            "char_limit": spec["post_limit"]
        }

    elif platform_id == "youtube":
        # YouTube Shorts title must be punchy and <= 100 chars incl #Shorts
        yt_title = f"{title} #Shorts"
        if len(yt_title) > 100:
            yt_title = f"{title[:90]} #Shorts"
        text = f"{yt_title}\n\n{caption}\n\n{tag_str}"
        return {
            "title": yt_title,
            "caption": caption[:spec["caption_limit"]],
            "hashtags": tags,
            "description": f"{caption}\n\n{tag_str}",
            "text": text,
            "char_limit": spec["post_limit"]
        }

    elif platform_id == "youtube_long":
        yt_title = title[:100]
        desc = f"{caption}\n\nKey Takeaways:\n• Core architecture & breakdown\n• Practical implementation\n\nTimestamps & resources below.\n\n{tag_str}"
        text = f"{yt_title}\n\n{desc}"
        return {
            "title": yt_title,
            "caption": caption,
            "hashtags": tags,
            "description": desc,
            "text": text,
            "char_limit": spec["post_limit"]
        }

    elif platform_id == "facebook":
        text = f"{title}\n\n{caption}\n\n{cta}\n\n{tag_str}"
        return {
            "title": title[:spec["title_limit"]],
            "caption": caption[:spec["caption_limit"]],
            "hashtags": tags,
            "description": None,
            "text": text,
            "char_limit": spec["post_limit"]
        }

    elif platform_id == "x":
        # Strict 280 character limit including 2 hashtags
        tag_suffix = f" {tag_str}" if tag_str else ""
        max_body = 280 - len(tag_suffix) - 5
        body = f"{title}: {caption}" if len(title) < 50 else caption
        if len(body) > max_body:
            body = body[:max_body - 3] + "..."
        text = f"{body}{tag_suffix}"
        return {
            "title": title[:spec["title_limit"]],
            "caption": body,
            "hashtags": tags[:2],
            "description": None,
            "text": text,
            "char_limit": 280
        }

    elif platform_id == "snapchat":
        # Max 80 character caption
        short_caption = caption
        if len(short_caption) > 75:
            short_caption = title if len(title) <= 75 else short_caption[:72] + "..."
        text = f"{short_caption} {tag_str}"
        return {
            "title": title[:spec["title_limit"]],
            "caption": short_caption,
            "hashtags": tags,
            "description": None,
            "text": text,
            "char_limit": 80
        }

    elif platform_id == "linkedin":
        # Professional tone, ends with a thought-provoking question
        closing_question = "How are you addressing this in your current workflows? Let me know in the comments."
        lines = [
            f"💡 {title.upper()}",
            "",
            caption,
            "",
            "Key takeaways:",
            f"• Efficient modular architecture saves hours of manual work.",
            f"• Automation bridges the gap between raw knowledge and viral reach.",
            "",
            closing_question,
            "",
            tag_str
        ]
        text = "\n".join(lines)
        return {
            "title": title[:spec["title_limit"]],
            "caption": caption,
            "hashtags": tags,
            "description": None,
            "text": text,
            "char_limit": spec["post_limit"]
        }

    else:
        text = f"{title}\n\n{caption}\n\n{tag_str}"
        return {
            "title": title,
            "caption": caption,
            "hashtags": tags,
            "description": None,
            "text": text,
            "char_limit": 2000
        }
