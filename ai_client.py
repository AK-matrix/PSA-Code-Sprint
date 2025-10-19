"""
Flexible AI Client supporting multiple providers (Gemini, OpenAI, Anthropic, Groq)
"""

import os
from typing import Optional, Dict, Any


class AIClient:
    """Unified AI client that can work with different providers"""
    
    def __init__(self, provider: str = "gemini", model: str = None, api_key: str = None):
        """
        Initialize AI client with specified provider
        
        Args:
            provider: One of "gemini", "openai" (only these two supported now)
            model: Specific model name (uses default if not provided)
            api_key: API key (uses environment variable if not provided)
        """
        self.provider = provider.lower()
        # Always use environment variables for API keys
        self.api_key = None
        self.client = None
        
        # Set default models for each provider
        default_models = {
            "gemini": "gemini-2.0-flash-exp",
            "openai": "gpt-4o"
        }
        
        self.model = model or default_models.get(self.provider)
        
        # Initialize the appropriate client
        self._init_client()
    
    def _init_client(self):
        """Initialize the client based on provider"""
        
        if self.provider == "gemini":
            import google.generativeai as genai
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY not found in environment variables")
            genai.configure(api_key=api_key)
            self.client = genai.GenerativeModel(self.model)
            
        elif self.provider == "openai":
            from openai import OpenAI
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not found in environment variables")
            self.client = OpenAI(api_key=api_key)
            
        else:
            raise ValueError(f"Unsupported provider: {self.provider}. Only 'gemini' and 'openai' are supported.")
    
    def generate_content(self, prompt: str, temperature: float = 1.0) -> str:
        """
        Generate content using the configured AI model
        
        Args:
            prompt: The prompt to send to the AI
            temperature: Temperature for generation (0.0 to 2.0)
        
        Returns:
            Generated text response
        """
        
        if self.provider == "gemini":
            response = self.client.generate_content(
                prompt,
                generation_config={"temperature": temperature}
            )
            return response.text
        
        elif self.provider == "openai":
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature
            )
            return response.choices[0].message.content
        
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")


def create_ai_client(settings: Optional[Dict[str, Any]] = None) -> AIClient:
    """
    Factory function to create an AI client from settings
    
    Args:
        settings: Dictionary with 'aiProvider' and 'aiModel'
                 If None, uses Gemini as default
                 API keys are always loaded from environment variables
    
    Returns:
        Configured AIClient instance
    """
    if settings:
        return AIClient(
            provider=settings.get("aiProvider", "gemini"),
            model=settings.get("aiModel"),
            api_key=None  # Always use environment variables
        )
    else:
        # Use default Gemini from environment
        return AIClient(
            provider="gemini",
            model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp"),
            api_key=None  # Always use environment variables
        )

