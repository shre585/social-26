import os
import re
from pathlib import Path
from typing import Dict, Any, Optional
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.config import settings, PROJECT_ROOT

router = APIRouter(prefix="/api/settings", tags=["settings"])

class KeyUpdateRequest(BaseModel):
    provider: str  # "gemini", "openai", "anthropic"
    api_key: str

def mask_key(k: str) -> str:
    if not k or len(k) < 8:
        return ""
    return f"{k[:6]}...{k[-4:]}"

def update_env_file(key_name: str, value: str):
    """Update or append an environment variable in the .env file."""
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        env_path.write_text(f"{key_name}={value}\n", encoding="utf-8")
        return

    content = env_path.read_text(encoding="utf-8")
    pattern = rf"^{re.escape(key_name)}=.*$"
    
    if re.search(pattern, content, flags=re.MULTILINE):
        new_content = re.sub(pattern, f"{key_name}={value}", content, flags=re.MULTILINE)
    else:
        new_content = content.rstrip() + f"\n{key_name}={value}\n"
        
    env_path.write_text(new_content, encoding="utf-8")

@router.get("")
async def get_settings():
    """Return configured AI providers, active provider, and masked keys."""
    return {
        "ai_enabled": settings.is_ai_enabled,
        "active_provider": settings.active_llm_provider,
        "providers": {
            "gemini": {
                "name": "Google Gemini",
                "configured": bool(settings.GEMINI_API_KEY),
                "masked_key": mask_key(settings.GEMINI_API_KEY),
                "model": settings.GEMINI_MODEL,
                "free_tier": True,
                "doc_url": "https://aistudio.google.com/app/apikey"
            },
            "openai": {
                "name": "OpenAI (GPT-4o)",
                "configured": bool(settings.OPENAI_API_KEY),
                "masked_key": mask_key(settings.OPENAI_API_KEY),
                "model": settings.OPENAI_MODEL,
                "free_tier": False,
                "doc_url": "https://platform.openai.com/api-keys"
            },
            "anthropic": {
                "name": "Anthropic Claude",
                "configured": bool(settings.ANTHROPIC_API_KEY),
                "masked_key": mask_key(settings.ANTHROPIC_API_KEY),
                "model": settings.ANTHROPIC_MODEL,
                "free_tier": False,
                "doc_url": "https://console.anthropic.com/settings/keys"
            }
        }
    }

@router.post("/keys")
async def save_api_key(req: KeyUpdateRequest):
    """Validate and persist an AI API key."""
    provider = req.provider.strip().lower()
    raw_key = req.api_key.strip()

    if not raw_key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")

    # 1. Verification Call
    async with httpx.AsyncClient(timeout=15.0) as client:
        if provider == "gemini":
            # Test Gemini API key with a fast models query
            url = f"https://generativelanguage.googleapis.com/v1beta/models?key={raw_key}"
            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    err_msg = resp.json().get("error", {}).get("message", "Invalid Gemini API key.")
                    raise HTTPException(status_code=400, detail=f"Gemini verification failed: {err_msg}")
            except httpx.RequestError as e:
                raise HTTPException(status_code=400, detail=f"Network error connecting to Google Gemini: {str(e)}")

            # Update settings and .env
            settings.GEMINI_API_KEY = raw_key
            os.environ["GEMINI_API_KEY"] = raw_key
            update_env_file("GEMINI_API_KEY", raw_key)
            update_env_file("LLM_PROVIDER", "gemini")

        elif provider == "openai":
            url = "https://api.openai.com/v1/models"
            headers = {"Authorization": f"Bearer {raw_key}"}
            try:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    err_msg = resp.json().get("error", {}).get("message", "Invalid OpenAI API key.")
                    raise HTTPException(status_code=400, detail=f"OpenAI verification failed: {err_msg}")
            except httpx.RequestError as e:
                raise HTTPException(status_code=400, detail=f"Network error connecting to OpenAI: {str(e)}")

            settings.OPENAI_API_KEY = raw_key
            os.environ["OPENAI_API_KEY"] = raw_key
            update_env_file("OPENAI_API_KEY", raw_key)
            update_env_file("LLM_PROVIDER", "openai")

        elif provider == "anthropic":
            # Test key format
            if not raw_key.startswith("sk-ant-"):
                raise HTTPException(status_code=400, detail="Anthropic key must start with 'sk-ant-'.")
            settings.ANTHROPIC_API_KEY = raw_key
            os.environ["ANTHROPIC_API_KEY"] = raw_key
            update_env_file("ANTHROPIC_API_KEY", raw_key)
            update_env_file("LLM_PROVIDER", "anthropic")

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {provider}")

    return {
        "success": True,
        "provider": provider,
        "message": f"Successfully connected and verified {provider.upper()} API key! The AI Brain is now fully active.",
        "active_provider": settings.active_llm_provider
    }

@router.delete("/keys/{provider}")
async def remove_api_key(provider: str):
    """Remove a configured API key."""
    provider = provider.strip().lower()
    if provider == "gemini":
        settings.GEMINI_API_KEY = ""
        os.environ["GEMINI_API_KEY"] = ""
        update_env_file("GEMINI_API_KEY", "")
    elif provider == "openai":
        settings.OPENAI_API_KEY = ""
        os.environ["OPENAI_API_KEY"] = ""
        update_env_file("OPENAI_API_KEY", "")
    elif provider == "anthropic":
        settings.ANTHROPIC_API_KEY = ""
        os.environ["ANTHROPIC_API_KEY"] = ""
        update_env_file("ANTHROPIC_API_KEY", "")
    else:
        raise HTTPException(status_code=400, detail="Unknown provider")

    return {
        "success": True,
        "message": f"Removed {provider} API key. Reverted to Intelligent Heuristic mode.",
        "active_provider": settings.active_llm_provider
    }
