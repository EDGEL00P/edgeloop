"""
Correlation Matrix Builder
Cholesky decomposition for SGM (Same Game Parlay) correlation analysis
"""
import numpy as np
from scipy import linalg
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass

@dataclass
class CorrelationResult:
    correlation_matrix: np.ndarray
    cholesky_lower: np.ndarray
    eigenvalues: np.ndarray
    is_positive_definite: bool
    leg_correlations: List[Tuple[str, str, float]]
    sgm_adjustment: float
    fair_odds_multiplier: float

class CorrelationMatrixBuilder:
    """Build and analyze correlation matrices for SGM pricing"""
    
    BASE_CORRELATIONS = {
        ('passing_yards', 'passing_tds'): 0.72,
        ('rushing_yards', 'rushing_tds'): 0.58,
        ('receiving_yards', 'receiving_tds'): 0.65,
        ('team_points', 'passing_tds'): 0.68,
        ('team_points', 'rushing_tds'): 0.45,
        ('qb_rushing_yards', 'passing_yards'): -0.15,
        ('team_points', 'total_over'): 0.95,
        ('spread_cover', 'team_points'): 0.78,
        ('interceptions', 'team_points'): -0.42,
        ('sacks', 'passing_yards'): -0.35,
        ('receptions', 'receiving_yards'): 0.88,
        ('targets', 'receptions'): 0.75,
        ('rushing_attempts', 'rushing_yards'): 0.82,
        ('first_downs', 'team_points'): 0.71,
    }
    
    def __init__(self):
        self.correlation_cache: Dict[str, float] = {}
    
    def get_correlation(self, leg1_type: str, leg2_type: str) -> float:
        """Get correlation coefficient between two leg types"""
        key = (leg1_type, leg2_type)
        reverse_key = (leg2_type, leg1_type)
        
        if key in self.BASE_CORRELATIONS:
            return self.BASE_CORRELATIONS[key]
        elif reverse_key in self.BASE_CORRELATIONS:
            return self.BASE_CORRELATIONS[reverse_key]
        elif leg1_type == leg2_type:
            return 1.0
        else:
            return 0.0
    
    def build_matrix(self, legs: List[Dict]) -> CorrelationResult:
        """
        Build correlation matrix for a set of SGM legs.
        Uses Cholesky decomposition to ensure positive definiteness.
        """
        n = len(legs)
        if n < 2:
            return CorrelationResult(
                correlation_matrix=np.array([[1.0]]),
                cholesky_lower=np.array([[1.0]]),
                eigenvalues=np.array([1.0]),
                is_positive_definite=True,
                leg_correlations=[],
                sgm_adjustment=1.0,
                fair_odds_multiplier=1.0
            )
        
        corr_matrix = np.eye(n)
        leg_correlations = []
        
        for i in range(n):
            for j in range(i + 1, n):
                leg1, leg2 = legs[i], legs[j]
                
                same_player = leg1.get('player_id') == leg2.get('player_id')
                same_team = leg1.get('team') == leg2.get('team')
                
                base_corr = self.get_correlation(
                    leg1.get('stat_type', 'unknown'),
                    leg2.get('stat_type', 'unknown')
                )
                
                if same_player:
                    corr = base_corr * 1.2
                elif same_team:
                    corr = base_corr * 0.8
                else:
                    corr = base_corr * 0.3
                
                corr = max(-0.95, min(0.95, corr))
                
                corr_matrix[i, j] = corr
                corr_matrix[j, i] = corr
                leg_correlations.append((
                    leg1.get('description', f'Leg {i+1}'),
                    leg2.get('description', f'Leg {j+1}'),
                    corr
                ))
        
        eigenvalues = np.linalg.eigvalsh(corr_matrix)
        is_pd = bool(np.all(eigenvalues > 0))
        
        if not is_pd:
            corr_matrix = self._nearest_positive_definite(corr_matrix)
            eigenvalues = np.linalg.eigvalsh(corr_matrix)
        
        try:
            cholesky_lower = linalg.cholesky(corr_matrix, lower=True)
        except linalg.LinAlgError:
            corr_matrix = self._nearest_positive_definite(corr_matrix)
            cholesky_lower = linalg.cholesky(corr_matrix, lower=True)
        
        avg_corr = float(np.mean([abs(c[2]) for c in leg_correlations])) if leg_correlations else 0.0
        sgm_adjustment = 1.0 + avg_corr * 0.15
        
        det = np.linalg.det(corr_matrix)
        fair_odds_multiplier = 1 / max(0.1, det ** (1/n))
        
        return CorrelationResult(
            correlation_matrix=corr_matrix,
            cholesky_lower=cholesky_lower,
            eigenvalues=eigenvalues,
            is_positive_definite=is_pd,
            leg_correlations=leg_correlations,
            sgm_adjustment=sgm_adjustment,
            fair_odds_multiplier=fair_odds_multiplier
        )
    
    def _nearest_positive_definite(self, A: np.ndarray) -> np.ndarray:
        """Find the nearest positive definite matrix"""
        B = (A + A.T) / 2
        _, s, V = np.linalg.svd(B)
        H = np.dot(V.T, np.dot(np.diag(s), V))
        A2 = (B + H) / 2
        A3 = (A2 + A2.T) / 2
        
        if self._is_positive_definite(A3):
            return A3
        
        spacing = np.spacing(np.linalg.norm(A))
        I = np.eye(A.shape[0])
        k = 1
        while not self._is_positive_definite(A3):
            mineig = np.min(np.real(np.linalg.eigvalsh(A3)))
            A3 += I * (-mineig * k**2 + spacing)
            k += 1
        
        return A3
    
    def _is_positive_definite(self, A: np.ndarray) -> bool:
        """Check if matrix is positive definite"""
        try:
            np.linalg.cholesky(A)
            return True
        except np.linalg.LinAlgError:
            return False
    
    def calculate_sgm_fair_value(
        self,
        legs: List[Dict],
        uncorrelated_odds: float
    ) -> Dict:
        """Calculate fair SGM odds accounting for correlations"""
        result = self.build_matrix(legs)
        
        fair_odds = uncorrelated_odds * result.fair_odds_multiplier
        
        positive_corrs = [c for c in result.leg_correlations if c[2] > 0.3]
        negative_corrs = [c for c in result.leg_correlations if c[2] < -0.2]
        
        return {
            "uncorrelated_odds": uncorrelated_odds,
            "fair_adjusted_odds": round(fair_odds, 2),
            "adjustment_factor": round(result.fair_odds_multiplier, 4),
            "avg_correlation": round(result.sgm_adjustment - 1, 4),
            "positive_correlations": len(positive_corrs),
            "negative_correlations": len(negative_corrs),
            "is_value_bet": fair_odds > uncorrelated_odds * 1.05,
            "correlation_details": [
                {"leg1": c[0], "leg2": c[1], "correlation": round(c[2], 3)}
                for c in result.leg_correlations
            ]
        }

def correlation_result_to_dict(result: CorrelationResult) -> Dict:
    """Convert CorrelationResult to JSON-serializable dict"""
    return {
        "is_positive_definite": result.is_positive_definite,
        "sgm_adjustment": round(result.sgm_adjustment, 4),
        "fair_odds_multiplier": round(result.fair_odds_multiplier, 4),
        "leg_correlations": [
            {"leg1": c[0], "leg2": c[1], "correlation": round(c[2], 4)}
            for c in result.leg_correlations
        ],
        "eigenvalues": [round(float(e), 4) for e in result.eigenvalues]
    }
