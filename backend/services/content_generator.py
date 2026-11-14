import re
from typing import Dict, Any, List, Optional
from backend.config import settings
from backend.services.llm_analysis import query_llm
from backend.utils.file_utils import seconds_to_display_time

def build_carousel_slides(title: str, hook: str, key_points: List[str], keywords: List[str]) -> List[str]:
    """Generate 5-6 slides for an Instagram/LinkedIn carousel card."""
    kw_str = ", ".join(keywords[:3]) if keywords else "Modern Architecture"
    
    p1 = key_points[0] if len(key_points) > 0 else "Understanding foundational mechanics and core concepts."
    p2 = key_points[1] if len(key_points) > 1 else "Eliminating bottlenecks with clean, modular workflows."
    p3 = key_points[2] if len(key_points) > 2 else "Automating repetitive tasks to focus on high-impact output."

    slides = [
        f"🎯 {title}\n\nSwipe to see how this works ➔",
        f"💡 THE HOOK\n\n{hook if hook else 'Why does this matter?'}\n\nKey focus area: {kw_str}.",
        f"⚡ PILLAR 1: THE FOUNDATION\n\n{p1}\n\nStart with clean patterns before optimizing.",
        f"🛠️ PILLAR 2: IMPLEMENTATION\n\n{p2}\n\nEnsure predictability across every pipeline component.",
        f"🚀 PILLAR 3: THE RESULT\n\n{p3}\n\nConsistent execution with zero wasted effort.",
        "📌 SUMMARY & ACTION\n\n• Bookmark this guide\n• Share with someone building in tech\n• Drop your questions below!"
    ]
    return slides

def build_youtube_chapters(clips: List[Dict[str, Any]], total_duration: float) -> List[str]:
    """Build YouTube description timestamp chapters."""
    chapters = ["0:00 Introduction & Overview"]
    for c in clips:
        start_sec = c.get("start", 0.0)
        title = c.get("title", "Key Highlight")
        # Sanitize title to single line
        title = title.split("\n")[0].strip()
        time_str = seconds_to_display_time(start_sec)
        chapters.append(f"{time_str} {title}")
    return chapters

def build_fallback_extras(
    summary: str,
    keywords: List[str],
    clips: List[Dict[str, Any]],
    purpose: str = "general",
    tone: str = "educational"
) -> Dict[str, Any]:
    """High quality template fallback for extras (Blog, X Thread, LinkedIn, SEO, Quiz, Takeaways, Hooks, Newsletter)."""
    primary_topic = keywords[0].capitalize() if keywords else "Modern Concepts"
    kw_list = keywords[:6] if keywords else ["learning", "development", "strategy", "insights"]
    
    # 1. Blog in Markdown
    blog_lines = [
        f"# Complete Guide: {primary_topic} Explained",
        "",
        f"**Executive Overview:** {summary}",
        "",
        "## Why This Matters Today",
        "Whether you are mastering new technical concepts or scaling audience distribution, modular knowledge frameworks save countless hours while accelerating execution.",
        "",
        "## Key Concept Breakdowns"
    ]
    for idx, c in enumerate(clips, 1):
        blog_lines.append(f"### {idx}. {c.get('title', 'Core Concept')}")
        blog_lines.append(f"{c.get('hook', '')}")
        blog_lines.append(f"{c.get('caption', '')}")
        pts = c.get("key_points", [])
        if pts:
            for p in pts:
                blog_lines.append(f"- {p}")
        blog_lines.append("")

    blog_lines.extend([
        "## Practical Implementation Checklist",
        "- Break complex lectures or documents into bite-sized mental models",
        "- Test understanding actively with conceptual checkpoints",
        "- Repurpose core principles across diverse communication channels",
        "",
        "## Conclusion",
        "By deconstructing high-value knowledge into structured formats, creators and educators maximize retention and reach."
    ])
    blog_md = "\n".join(blog_lines)

    # 2. X Thread (strictly <= 275 chars per tweet)
    thread = []
    t1 = f"1/5 Master {primary_topic} in minutes. Here is the distilled breakdown of key principles you need to know 🧵👇"
    thread.append(t1[:275])

    for idx, c in enumerate(clips[:3], 2):
        t_text = f"{idx}/5 {c.get('title', primary_topic)}:\n{c.get('hook', '')} {c.get('caption', '')}"
        if len(t_text) > 275:
            t_text = t_text[:272] + "..."
        thread.append(t_text)

    t_end = f"5/5 Key Takeaway:\n• Isolate core fundamentals\n• Validate through practice\n• Share insights clearly\n\nSave this thread for future reference & follow for more breakdowns! ⚡"
    thread.append(t_end[:275])

    # 3. LinkedIn Post (professional tone, ends with engaging question)
    linkedin_lines = [
        f"The most impactful communicators and engineers don't overwhelm—they distill.",
        "",
        f"Key insights from our deep dive into {primary_topic}:",
        "",
        f"1. Conceptual Clarity: Breaking big ideas down makes complex knowledge accessible.",
        f"2. Retention via Action: Practical checkpoints reinforce understanding faster than passive consumption.",
        f"3. Multi-Channel Impact: One core piece of content can educate audiences across formats.",
        "",
        summary,
        "",
        f"How does your team approach retaining and sharing knowledge on {primary_topic}?",
        "",
        " ".join(f"#{kw.capitalize()}" for kw in kw_list[:4])
    ]
    linkedin_post = "\n".join(linkedin_lines)

    # 4. SEO
    seo_title = f"{primary_topic} Essentials: Complete Breakdown"[:60]
    meta_desc = f"Learn {primary_topic} fast with our modular conceptual breakdown, practical insights, and actionable knowledge guide."[:155]

    # 5. Standout Feature: Interactive Study & Review Quiz (for Educational & General Mastery)
    quiz = [
        {
            "question": f"What is the primary foundation behind mastering {primary_topic}?",
            "options": [
                f"Deconstructing concepts into modular, self-contained principles",
                "Memorizing definitions without practical context",
                "Skipping foundational rules and rushing to advanced tools",
                "Restricting insights to a single platform or medium"
            ],
            "correct_index": 0,
            "explanation": f"Effective mastery of {primary_topic} relies on breaking large subjects into bite-sized, practical mental models."
        },
        {
            "question": "Why is multi-platform repurposing valuable for education and general communication?",
            "options": [
                "It maximizes audience retention and accommodates different learning preferences",
                "It reduces content quality to save time",
                "It only works for video and cannot be applied to text",
                "It forces audiences into a single consumption habit"
            ],
            "correct_index": 0,
            "explanation": "Different audiences learn through different media (short video, longform articles, bite-sized threads, or professional case studies)."
        },
        {
            "question": "What is the best way to validate learning or viral hooks?",
            "options": [
                "Testing with objective feedback and sentence-level clarity",
                "Assuming initial instincts never need refinement",
                "Removing all structure and leaving thoughts unformatted",
                "Avoiding all keywords and context markers"
            ],
            "correct_index": 0,
            "explanation": "Clear, grounded validation ensures content is both engaging and structurally accurate."
        }
    ]

    # 6. Standout Feature: Key Takeaways & Cheat Sheet
    key_takeaways = [
        f"Foundational Rule: High-leverage {primary_topic} begins with modular deconstruction.",
        f"Execution: Focus on the top 20% of core concepts that drive 80% of understanding.",
        "Communication: Frame complex insights into punchy hooks, relatable examples, and clear summaries.",
        "Retention: Active reflection and quiz checkpoints double recall compared to passive reading."
    ]

    # 7. Standout Feature: Viral Hook Matrix
    viral_hook_matrix = [
        {
            "style": "Contrarian / Curiosity",
            "hook": f"Almost everyone approaches {primary_topic} the wrong way. Here is what top performers do instead:",
            "platform": "Twitter / Threads"
        },
        {
            "style": "Step-by-Step Value",
            "hook": f"If I had to teach {primary_topic} from scratch in under 3 minutes, this is the exact framework I'd use:",
            "platform": "Instagram Reels / TikTok"
        },
        {
            "style": "Executive Insight",
            "hook": f"Why mastering {primary_topic} has become a superpower for modern leaders and engineering teams:",
            "platform": "LinkedIn"
        },
        {
            "style": "Beginner Friendly",
            "hook": f"Confused about {primary_topic}? Here is the simple analogy that makes it instantly click:",
            "platform": "YouTube Shorts"
        }
    ]

    # 8. Standout Feature: Ready-to-Send Newsletter Edition
    newsletter = f"""Subject: ⚡ The Breakdown: {primary_topic} in 5 Minutes

Hey friend,

Today we are breaking down {primary_topic} into an actionable, high-signal guide you can read in under 5 minutes.

Quick Takeaway:
{summary}

3 Core Principles to Remember:
1. {clips[0].get('title', 'Core Concept') if clips else 'Foundational Clarity'}: {clips[0].get('hook', 'Focus on fundamentals.') if clips else 'Master the basics first.'}
2. {clips[1].get('title', 'Practical Implementation') if len(clips) > 1 else 'Hands-on Execution'}: {clips[1].get('hook', 'Apply concepts actively.') if len(clips) > 1 else 'Apply what you learn immediately.'}
3. Synthesis & Scale: One strong insight can power your team's strategy, your learning goals, and your content distribution.

Action Item for Today:
Pick one concept from this breakdown and teach it or implement it in your current project.

Until next time,
The Repurposer Team
"""

    return {
        "blog": blog_md,
        "x_thread": thread,
        "linkedin_post": linkedin_post,
        "seo": {
            "title": seo_title,
            "meta_description": meta_desc,
            "keywords": kw_list
        },
        "study_quiz": quiz,
        "key_takeaways": key_takeaways,
        "viral_hook_matrix": viral_hook_matrix,
        "newsletter_edition": newsletter
    }

async def generate_extras(
    summary: str,
    keywords: List[str],
    clips: List[Dict[str, Any]],
    total_duration: float,
    purpose: str = "general",
    tone: str = "educational"
) -> Dict[str, Any]:
    """Generate Blog, X Thread, LinkedIn Post, SEO, Chapters, Quiz, and Viral Hook Matrix via LLM or fallback."""
    chapters = build_youtube_chapters(clips, total_duration)

    if not settings.is_ai_enabled:
        fallback = build_fallback_extras(summary, keywords, clips, purpose, tone)
        fallback["youtube_chapters"] = chapters
        return fallback

    clips_brief = []
    for c in clips:
        clips_brief.append(f"- Title: {c.get('title')}, Hook: {c.get('hook')}, Points: {', '.join(c.get('key_points', []))}")

    purpose_context = (
        "Focus on EDUCATIONAL DEPTH: create a student-friendly study quiz (3 questions with options and explanation), key learning takeaways, comprehensive blog, and lecture chapters."
        if purpose == "educational"
        else "Focus on GENERAL AUDIENCE & GROWTH: create a viral hook matrix (contrarian, curiosity, value hooks), newsletter edition, tweet thread, and high-engagement LinkedIn post."
    )

    prompt = f"""Generate a comprehensive multi-channel publishing & educational asset suite for this content:
Purpose Mode: {purpose.upper()} ({purpose_context})
Summary: {summary}
Keywords: {', '.join(keywords)}
Tone: {tone}
Clips:
{chr(10).join(clips_brief)}

Rules:
1. blog: full markdown blog article with headers (H1, H2, H3), bullet points, and code/actionable tips.
2. x_thread: an array of 4-6 tweets. CRITICAL: each tweet MUST be <= 275 characters!
3. linkedin_post: high-impact professional post, formatted with line breaks, ending with a thought-provoking question and 4 hashtags.
4. seo: object with title (<= 60 chars), meta_description (<= 155 chars), and keywords array.
5. study_quiz: array of 3 multiple-choice questions: [{{"question": str, "options": [str, str, str, str], "correct_index": 0-3, "explanation": str}}]
6. key_takeaways: array of 4-5 bullet summary points.
7. viral_hook_matrix: array of 4 objects: [{{"style": "Curiosity"|"Contrarian"|"Value"|"Story", "hook": str, "platform": str}}]
8. newsletter_edition: ready-to-send markdown newsletter edition with Subject line.

Return ONLY a JSON object:
{{
  "blog": "markdown string",
  "x_thread": ["tweet 1", "tweet 2", "tweet 3"],
  "linkedin_post": "post string ending with a question",
  "seo": {{
    "title": "title under 60 chars",
    "meta_description": "description under 155 chars",
    "keywords": ["kw1", "kw2"]
  }},
  "study_quiz": [
    {{
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "Why this is correct"
    }}
  ],
  "key_takeaways": ["Point 1", "Point 2", "Point 3"],
  "viral_hook_matrix": [
    {{
      "style": "Curiosity",
      "hook": "Hook sentence",
      "platform": "Twitter"
    }}
  ],
  "newsletter_edition": "Subject: ...\n\nBody"
}}"""

    llm_result, _ = await query_llm(prompt)
    if llm_result and isinstance(llm_result, dict) and "blog" in llm_result and "x_thread" in llm_result:
        raw_thread = llm_result.get("x_thread", [])
        clean_thread = [t[:275] for t in raw_thread]
        seo = llm_result.get("seo", {})
        fallback = build_fallback_extras(summary, keywords, clips, purpose, tone)
        
        return {
            "blog": llm_result.get("blog", fallback["blog"]),
            "x_thread": clean_thread if clean_thread else fallback["x_thread"],
            "linkedin_post": llm_result.get("linkedin_post", fallback["linkedin_post"]),
            "seo": {
                "title": seo.get("title", f"{keywords[0] if keywords else 'Topic'} Guide")[:60],
                "meta_description": seo.get("meta_description", summary)[:155],
                "keywords": seo.get("keywords", keywords)
            },
            "youtube_chapters": chapters,
            "study_quiz": llm_result.get("study_quiz", fallback["study_quiz"]),
            "key_takeaways": llm_result.get("key_takeaways", fallback["key_takeaways"]),
            "viral_hook_matrix": llm_result.get("viral_hook_matrix", fallback["viral_hook_matrix"]),
            "newsletter_edition": llm_result.get("newsletter_edition", fallback["newsletter_edition"])
        }

    fallback = build_fallback_extras(summary, keywords, clips, purpose, tone)
    fallback["youtube_chapters"] = chapters
    return fallback
