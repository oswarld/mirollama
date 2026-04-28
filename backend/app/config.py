"""
Configuration management
Uniformly load configuration from the .env file in the project root directory
"""

import os
from dotenv import load_dotenv

# Load the .env file in the project root directory
# Path: mirollama/.env (relative to backend/app/config.py)
project_root_env = os.path.join(os.path.dirname(__file__), '../../.env')

if os.path.exists(project_root_env):
    load_dotenv(project_root_env, override=True)
else:
    # If there is no .env in the root directory, try to load environment variables (for production environment)
    load_dotenv(override=True)


class Config:
    """FlaskConfiguration class"""
    
    # FlaskConfiguration
    SECRET_KEY = os.environ.get('SECRET_KEY', 'mirollama-secret-key')
    DEBUG = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    
    # JSONConfiguration - disable ASCII escaping and let Chinese display directly (instead of \uXXXX Format)
    JSON_AS_ASCII = False
    
    # LLMConfiguration (uniformly using OpenAI format)
    LLM_API_KEY = os.environ.get('LLM_API_KEY')
    LLM_BASE_URL = os.environ.get('LLM_BASE_URL', 'http://localhost:11434/v1')
    LLM_MODEL_NAME = os.environ.get('LLM_MODEL_NAME', 'gpt-oss:20b')

    SEARCH_PROVIDER = os.environ.get('SEARCH_PROVIDER', 'none')
    SEARXNG_BASE_URL = os.environ.get('SEARXNG_BASE_URL', '')
    WEB_SEARCH_LANGUAGE = os.environ.get('WEB_SEARCH_LANGUAGE', 'ko-KR')
    WEB_SEARCH_LIMIT = int(os.environ.get('WEB_SEARCH_LIMIT', '10'))
    
    # File upload configuration
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), '../uploads')
    ALLOWED_EXTENSIONS = {'pdf', 'md', 'txt', 'markdown'}
    
    # Text processing configuration
    DEFAULT_CHUNK_SIZE = 500  # Default cut size
    DEFAULT_CHUNK_OVERLAP = 50  # Default overlap size
    
    # OASISSimulation configuration
    OASIS_DEFAULT_MAX_ROUNDS = int(os.environ.get('OASIS_DEFAULT_MAX_ROUNDS', '10'))
    OASIS_SIMULATION_DATA_DIR = os.path.join(os.path.dirname(__file__), '../uploads/simulations')
    
    # OASISAction configurations available on the platform
    OASIS_TWITTER_ACTIONS = [
        'CREATE_POST', 'LIKE_POST', 'REPOST', 'FOLLOW', 'DO_NOTHING', 'QUOTE_POST'
    ]
    OASIS_REDDIT_ACTIONS = [
        'LIKE_POST', 'DISLIKE_POST', 'CREATE_POST', 'CREATE_COMMENT',
        'LIKE_COMMENT', 'DISLIKE_COMMENT', 'SEARCH_POSTS', 'SEARCH_USER',
        'TREND', 'REFRESH', 'DO_NOTHING', 'FOLLOW', 'MUTE'
    ]
    
    # Report AgentConfiguration
    REPORT_AGENT_MAX_TOOL_CALLS = int(os.environ.get('REPORT_AGENT_MAX_TOOL_CALLS', '5'))
    REPORT_AGENT_MAX_REFLECTION_ROUNDS = int(os.environ.get('REPORT_AGENT_MAX_REFLECTION_ROUNDS', '2'))
    REPORT_AGENT_TEMPERATURE = float(os.environ.get('REPORT_AGENT_TEMPERATURE', '0.5'))
    
    @classmethod
    def validate(cls):
        """Verify necessary configuration"""
        errors = []

        is_local_ollama = (
            'localhost:11434' in (cls.LLM_BASE_URL or '')
            or '127.0.0.1:11434' in (cls.LLM_BASE_URL or '')
        )
        if not cls.LLM_API_KEY and not is_local_ollama:
            errors.append("LLM_API_KEY is not configured")

        provider = (cls.SEARCH_PROVIDER or 'none').lower()
        if provider not in {'none', 'searxng'}:
            errors.append("SEARCH_PROVIDER supports only: none / searxng")
        if provider == 'searxng' and not cls.SEARXNG_BASE_URL:
            errors.append("SEARXNG_BASE_URL is not configured")

        return errors
