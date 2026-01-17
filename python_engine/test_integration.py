"""
Integration Test Suite for NFL Singularity Engine
==================================================
Validates that all components work together correctly.

Run with: python -m python_engine.test_integration
"""

import sys
import logging
from typing import Dict, Any, List

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s'
)
logger = logging.getLogger(__name__)


def test_imports() -> bool:
    """Test that all modules can be imported."""
    logger.info("Testing module imports...")
    
    try:
        from python_engine import (
            settings,
            NFLVerseConnector,
            get_nflverse,
            BallDontLieConnector,
            get_balldontlie,
            UnifiedDataEngine,
            get_data_engine,
            TeamAnalytics,
            PlayerAnalytics,
            GameAnalytics,
            VECTOR_CONFIGS,
            MonteCarloEngine,
            NeuralPredictor,
            KellyCalculator,
            CorrelationMatrix,
            MarketAnalyzer,
        )
        logger.info("✓ All module imports successful")
        return True
    except ImportError as e:
        logger.error(f"✗ Import failed: {e}")
        return False


def test_nflverse_connector() -> bool:
    """Test NFLVerseConnector initialization."""
    logger.info("Testing NFLVerseConnector...")
    
    try:
        from python_engine import get_nflverse
        
        connector = get_nflverse()
        assert connector is not None
        assert connector.cache_dir.exists()
        
        logger.info("✓ NFLVerseConnector initialized successfully")
        return True
    except Exception as e:
        logger.error(f"✗ NFLVerseConnector test failed: {e}")
        return False


def test_balldontlie_connector() -> bool:
    """Test BallDontLieConnector initialization."""
    logger.info("Testing BallDontLieConnector...")
    
    try:
        from python_engine import get_balldontlie
        
        connector = get_balldontlie()
        assert connector is not None
        
        logger.info("✓ BallDontLieConnector initialized successfully")
        return True
    except Exception as e:
        logger.error(f"✗ BallDontLieConnector test failed: {e}")
        return False


def test_unified_data_engine() -> bool:
    """Test UnifiedDataEngine initialization."""
    logger.info("Testing UnifiedDataEngine...")
    
    try:
        from python_engine import get_data_engine, VECTOR_CONFIGS
        
        engine = get_data_engine()
        assert engine is not None
        assert engine.nflverse is not None
        assert engine.balldontlie is not None
        
        # Check vector configs
        assert len(VECTOR_CONFIGS) >= 6
        assert "physics" in VECTOR_CONFIGS
        assert "efficiency" in VECTOR_CONFIGS
        assert "market" in VECTOR_CONFIGS
        
        logger.info(f"✓ UnifiedDataEngine initialized with {len(VECTOR_CONFIGS)} vectors")
        return True
    except Exception as e:
        logger.error(f"✗ UnifiedDataEngine test failed: {e}")
        return False


def test_monte_carlo() -> bool:
    """Test Monte Carlo engine."""
    logger.info("Testing MonteCarloEngine...")
    
    try:
        from python_engine import MonteCarloEngine
        
        mc = MonteCarloEngine(iterations=1000)
        
        # Simulate a simple game
        result = mc.simulate_game(
            home_mean=24,
            away_mean=21,
            home_std=10,
            away_std=10,
            correlation=0.15,
            spread=-3,
            total_line=45
        )
        
        assert result is not None
        assert 0 <= result.home_win_probability <= 1
        assert result.over_probability + result.under_probability <= 1.01
        
        logger.info(f"✓ Monte Carlo: Home win prob={result.home_win_probability:.2%}")
        return True
    except Exception as e:
        logger.error(f"✗ MonteCarloEngine test failed: {e}")
        return False


def test_neural_predictor() -> bool:
    """Test Neural Predictor."""
    logger.info("Testing NeuralPredictor...")
    
    try:
        from python_engine import NeuralPredictor
        
        predictor = NeuralPredictor()
        
        # Make a simple prediction
        features = {
            "home_epa": 0.15,
            "away_epa": 0.08,
            "home_win_pct": 0.65,
            "away_win_pct": 0.45,
        }
        result = predictor.predict(features)
        
        assert result is not None
        
        logger.info(f"✓ NeuralPredictor returned prediction")
        return True
    except Exception as e:
        logger.error(f"✗ NeuralPredictor test failed: {e}")
        return False


def test_kelly_calculator() -> bool:
    """Test Kelly staking calculator."""
    logger.info("Testing KellyCalculator...")
    
    try:
        from python_engine import KellyCalculator
        
        kelly = KellyCalculator(bankroll=10000)
        
        # Calculate Kelly for a bet
        result = kelly.calculate_kelly(
            true_probability=0.55,
            decimal_odds=1.91,
            confidence=1.0
        )
        
        assert result is not None
        assert result.full_kelly >= 0
        
        logger.info(f"✓ Kelly full stake: ${result.full_kelly:.2f}")
        return True
    except Exception as e:
        logger.error(f"✗ KellyCalculator test failed: {e}")
        return False


def test_correlation_matrix() -> bool:
    """Test Correlation Matrix builder."""
    logger.info("Testing CorrelationMatrix...")
    
    try:
        from python_engine import CorrelationMatrix
        
        matrix = CorrelationMatrix()
        
        # Build a simple correlation matrix
        legs = [
            {"player_id": 1, "stat_type": "passing_yards", "description": "Mahomes 280+ yards"},
            {"player_id": 2, "team": "KC", "stat_type": "receiving_yards", "description": "Kelce 70+ yards"},
        ]
        result = matrix.build_matrix(legs)
        
        assert result is not None
        assert result.is_positive_definite
        
        logger.info(f"✓ CorrelationMatrix built successfully (adjustment: {result.sgm_adjustment:.4f})")
        return True
    except Exception as e:
        logger.error(f"✗ CorrelationMatrix test failed: {e}")
        return False


def test_market_analyzer() -> bool:
    """Test Market Analyzer."""
    logger.info("Testing MarketAnalyzer...")
    
    try:
        from python_engine import MarketAnalyzer
        from python_engine.market_analyzer import LineSnapshot
        from datetime import datetime
        
        analyzer = MarketAnalyzer()
        
        # Add some line snapshots
        snap1 = LineSnapshot(
            game_id=1,
            timestamp=datetime(2025, 1, 14, 10, 0),
            spread=-3.0,
            spread_home_odds=-110,
            spread_away_odds=-110,
            total=45.0,
            over_odds=-110,
            under_odds=-110,
            home_ml=-150,
            away_ml=130,
            sportsbook="DraftKings",
        )
        snap2 = LineSnapshot(
            game_id=1,
            timestamp=datetime(2025, 1, 14, 14, 0),
            spread=-3.5,
            spread_home_odds=-110,
            spread_away_odds=-110,
            total=45.5,
            over_odds=-110,
            under_odds=-110,
            home_ml=-155,
            away_ml=135,
            sportsbook="DraftKings",
        )
        
        analyzer.add_line_snapshot(snap1)
        analyzer.add_line_snapshot(snap2)
        
        # Check line movement detection
        opening = analyzer.get_opening_line(1)
        current = analyzer.get_current_line(1)
        
        assert opening is not None
        assert current is not None
        assert opening.spread == -3.0
        assert current.spread == -3.5
        
        logger.info(f"✓ MarketAnalyzer detected spread move: {opening.spread} → {current.spread}")
        return True
    except Exception as e:
        logger.error(f"✗ MarketAnalyzer test failed: {e}")
        return False


def test_api_endpoint_definitions() -> bool:
    """Test that API handler can be initialized."""
    logger.info("Testing API endpoint definitions...")
    
    try:
        from python_engine.api import SingularityHandler, game_analytics_to_dict, team_analytics_to_dict
        
        # Just verify the functions exist
        assert SingularityHandler is not None
        assert callable(game_analytics_to_dict)
        assert callable(team_analytics_to_dict)
        
        logger.info("✓ API endpoints defined correctly")
        return True
    except Exception as e:
        logger.error(f"✗ API test failed: {e}")
        return False


def test_vector_schema() -> bool:
    """Test vector schema definitions."""
    logger.info("Testing vector schema definitions...")
    
    try:
        from python_engine.vector_schema import (
            TeamEfficiency,
            PlayerEfficiency,
            LineMovement,
            MarketAnalysis,
            BettingSignal,
            GameContext,
            GameWeather,
        )
        
        # Test creating instances
        efficiency = TeamEfficiency(
            team_id=1,
            season=2025,
            week=1,
            epa_per_play=0.15,
            pass_epa_per_play=0.18,
            rush_epa_per_play=0.08,
            def_epa_per_play=-0.05,
            def_pass_epa_per_play=-0.08,
            def_rush_epa_per_play=-0.02,
            success_rate=0.48,
            def_success_rate_allowed=0.42,
            cpoe=2.5,
            total_dvoa=15.2,
            pass_dvoa=18.5,
            rush_dvoa=8.3,
            intended_air_yards_per_attempt=8.2,
            completed_air_yards_per_attempt=5.8,
            yac_per_completion=5.1,
            yac_over_expected=0.3,
        )
        
        assert efficiency.epa_per_play == 0.15
        assert efficiency.season == 2025
        
        logger.info("✓ Vector schema definitions valid")
        return True
    except Exception as e:
        logger.error(f"✗ Vector schema test failed: {e}")
        return False


def run_all_tests() -> Dict[str, bool]:
    """Run all integration tests."""
    print("\n" + "="*60)
    print("🏈 NFL SINGULARITY ENGINE - INTEGRATION TESTS")
    print("="*60 + "\n")
    
    tests = [
        ("Module Imports", test_imports),
        ("NFLVerse Connector", test_nflverse_connector),
        ("BallDontLie Connector", test_balldontlie_connector),
        ("Unified Data Engine", test_unified_data_engine),
        ("Monte Carlo Engine", test_monte_carlo),
        ("Neural Predictor", test_neural_predictor),
        ("Kelly Calculator", test_kelly_calculator),
        ("Correlation Matrix", test_correlation_matrix),
        ("Market Analyzer", test_market_analyzer),
        ("API Endpoints", test_api_endpoint_definitions),
        ("Vector Schema", test_vector_schema),
    ]
    
    results = {}
    passed = 0
    failed = 0
    
    for name, test_fn in tests:
        try:
            result = test_fn()
            results[name] = result
            if result:
                passed += 1
            else:
                failed += 1
        except Exception as e:
            logger.error(f"Test '{name}' threw exception: {e}")
            results[name] = False
            failed += 1
    
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    print(f"✓ Passed: {passed}")
    print(f"✗ Failed: {failed}")
    print(f"Total: {len(tests)}")
    print("="*60 + "\n")
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED - Engine is ready!")
    else:
        print("⚠️  Some tests failed - check logs above")
    
    return results


if __name__ == "__main__":
    results = run_all_tests()
    sys.exit(0 if all(results.values()) else 1)
