"""Configuration for NFL Singularity Engine"""
import os
from pydantic_settings import BaseSettings

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
