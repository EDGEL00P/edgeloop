"""Configuration for NFL Singularity Engine"""
import os
from typing import Any
from pydantic_settings import BaseSettings
from singularity_config import SINGULARITY_EXPLOIT_CONFIG, is_signal_enabled

class Settings(BaseSettings):
    balldontlie_api_key: str = os.getenv("BALLDONTLIE_API_KEY", "")
    weather_api_key: str = os.getenv("WEATHER_API_KEY", "")
    odds_api_key: str = os.getenv("ODDS_API_KEY", "")

    monte_carlo_iterations: int = 100000
    neural_hidden_layers: tuple = (128, 64, 32)
    kelly_fraction: float = 0.25
    min_edge_threshold: float = 0.03

    model_path: str = "python_engine/models"
    data_path: str = "python_engine/data"

    class Config:
        env_file = ".env"

settings = Settings()

def apply_singularity_filter(signal_name: str, signal_value: Any):
    """Apply Singularity configuration filter to signals."""
    if is_signal_enabled(signal_name):
        return signal_value
    return None
