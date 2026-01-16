"""
NFL SINGULARITY — BOOKIE BREAKER ARSENAL
=========================================
Complete betting edge engine
"""

# Core Data Connectors
from .nflverse_connector import NFLVerseConnector
from .balldontlie_connector import BallDontLieConnector
from .unified_data_engine import UnifiedDataEngine

# Analysis Engines
from .kelly_staking import KellyStakingEngine
from .correlation_matrix import CorrelationMatrixBuilder
from .market_analyzer import MarketAnalyzer

# Bookie Breaker Arsenal
from .chaos_physics import ChaosPhysicsEngine
from .psychological_edge import PsychologicalEdgeEngine
from .prop_warfare import PropWarfareEngine
from .market_mechanics import MarketMechanicsEngine
from .defensive_schemes import DefensiveSchemeEngine
from .black_swan import BlackSwanEngine

# God Mode Features
from .backtester import BacktestEngine
from .sentiment_scraper import SentimentScraperEngine

__all__ = [
    # Data
    "NFLVerseConnector",
    "BallDontLieConnector", 
    "UnifiedDataEngine",
    
    # Core Analysis
    "KellyStakingEngine",
    "CorrelationMatrixBuilder",
    "MarketAnalyzer",
    
    # Bookie Breaker
    "ChaosPhysicsEngine",
    "PsychologicalEdgeEngine",
    "PropWarfareEngine",
    "MarketMechanicsEngine",
    "DefensiveSchemeEngine",
    "BlackSwanEngine",
    
    # God Mode
    "BacktestEngine",
    "SentimentScraperEngine",
]

__version__ = "2.0.0"
__codename__ = "SINGULARITY"
