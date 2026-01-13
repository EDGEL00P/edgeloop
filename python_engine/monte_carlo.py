"""
Monte Carlo Simulation Engine
Parallelized simulation for game outcome distributions
"""
import numpy as np
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import scipy.stats as stats

@dataclass
class SimulationResult:
    home_wins: int
    away_wins: int
    home_win_prob: float
    away_win_prob: float
    home_cover_prob: float
    away_cover_prob: float
    over_prob: float
    under_prob: float
    mean_home_score: float
    mean_away_score: float
    std_home_score: float
    std_away_score: float
    home_scores: np.ndarray
    away_scores: np.ndarray
    margins: np.ndarray
    totals: np.ndarray
    confidence_68: Tuple[float, float]
    confidence_95: Tuple[float, float]

class MonteCarloEngine:
    def __init__(self, iterations: int = 100000):
        self.iterations = iterations
        self.rng = np.random.default_rng()
    
    def simulate_game(
        self,
        home_mean: float,
        away_mean: float,
        home_std: float = 10.0,
        away_std: float = 10.0,
        correlation: float = 0.15,
        spread: float = 0.0,
        total_line: float = 45.0
    ) -> SimulationResult:
        """
        Run Monte Carlo simulation for a single game.
        Uses correlated bivariate normal distribution for realistic score modeling.
        """
        cov_matrix = np.array([
            [home_std**2, correlation * home_std * away_std],
            [correlation * home_std * away_std, away_std**2]
        ])
        
        means = [home_mean, away_mean]
        samples = self.rng.multivariate_normal(means, cov_matrix, self.iterations)
        
        home_scores = np.maximum(0, np.round(samples[:, 0])).astype(int)
        away_scores = np.maximum(0, np.round(samples[:, 1])).astype(int)
        
        margins = home_scores - away_scores
        totals = home_scores + away_scores
        
        home_wins = np.sum(home_scores > away_scores)
        away_wins = np.sum(away_scores > home_scores)
        
        home_covers = np.sum(margins > -spread)
        over_hits = np.sum(totals > total_line)
        
        margin_mean = float(np.mean(margins))
        margin_std = float(np.std(margins))
        confidence_68 = (margin_mean - margin_std, margin_mean + margin_std)
        confidence_95 = (margin_mean - 1.96 * margin_std, margin_mean + 1.96 * margin_std)
        
        return SimulationResult(
            home_wins=int(home_wins),
            away_wins=int(away_wins),
            home_win_prob=home_wins / self.iterations,
            away_win_prob=away_wins / self.iterations,
            home_cover_prob=home_covers / self.iterations,
            away_cover_prob=1 - (home_covers / self.iterations),
            over_prob=over_hits / self.iterations,
            under_prob=1 - (over_hits / self.iterations),
            mean_home_score=float(np.mean(home_scores)),
            mean_away_score=float(np.mean(away_scores)),
            std_home_score=float(np.std(home_scores)),
            std_away_score=float(np.std(away_scores)),
            home_scores=home_scores,
            away_scores=away_scores,
            margins=margins,
            totals=totals,
            confidence_68=confidence_68,
            confidence_95=confidence_95
        )
    
    def simulate_batch(
        self,
        games: List[Dict],
        workers: int = 4
    ) -> List[SimulationResult]:
        """Simulate multiple games in parallel"""
        results = []
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [
                executor.submit(
                    self.simulate_game,
                    game.get('home_mean', 24),
                    game.get('away_mean', 21),
                    game.get('home_std', 10),
                    game.get('away_std', 10),
                    game.get('correlation', 0.15),
                    game.get('spread', 0),
                    game.get('total_line', 45)
                )
                for game in games
            ]
            results = [f.result() for f in futures]
        return results
    
    def calculate_ev(
        self,
        win_prob: float,
        decimal_odds: float,
        stake: float = 100.0
    ) -> Dict:
        """Calculate expected value for a bet"""
        implied_prob = 1 / decimal_odds
        edge = win_prob - implied_prob
        ev = (win_prob * (decimal_odds - 1) * stake) - ((1 - win_prob) * stake)
        roi = ev / stake * 100
        
        return {
            "win_probability": win_prob,
            "implied_probability": implied_prob,
            "edge": edge,
            "expected_value": ev,
            "roi_percent": roi,
            "is_positive_ev": ev > 0,
            "confidence": "high" if edge > 0.05 else "medium" if edge > 0.02 else "low"
        }
    
    def poisson_matrix(
        self,
        home_lambda: float,
        away_lambda: float,
        max_goals: int = 50
    ) -> np.ndarray:
        """Generate Poisson probability matrix for score outcomes"""
        home_probs = stats.poisson.pmf(range(max_goals + 1), home_lambda)
        away_probs = stats.poisson.pmf(range(max_goals + 1), away_lambda)
        return np.outer(home_probs, away_probs)

def result_to_dict(result: SimulationResult) -> Dict:
    """Convert SimulationResult to JSON-serializable dict"""
    return {
        "home_wins": result.home_wins,
        "away_wins": result.away_wins,
        "home_win_prob": round(result.home_win_prob, 4),
        "away_win_prob": round(result.away_win_prob, 4),
        "home_cover_prob": round(result.home_cover_prob, 4),
        "away_cover_prob": round(result.away_cover_prob, 4),
        "over_prob": round(result.over_prob, 4),
        "under_prob": round(result.under_prob, 4),
        "mean_home_score": round(result.mean_home_score, 1),
        "mean_away_score": round(result.mean_away_score, 1),
        "std_home_score": round(result.std_home_score, 2),
        "std_away_score": round(result.std_away_score, 2),
        "confidence_68": [round(x, 2) for x in result.confidence_68],
        "confidence_95": [round(x, 2) for x in result.confidence_95],
        "iterations": len(result.margins)
    }
