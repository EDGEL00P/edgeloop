"""
Multi-Dimensional Kelly Criterion Staking Engine
Optimal bankroll management with uncertainty-aware thresholds
"""
import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from scipy.optimize import minimize_scalar

@dataclass
class StakingResult:
    full_kelly: float
    half_kelly: float
    quarter_kelly: float
    recommended_stake: float
    recommended_fraction: str
    edge: float
    implied_probability: float
    true_probability: float
    roi_expected: float
    risk_of_ruin: float
    is_approved: bool
    rejection_reason: Optional[str]

class KellyStakingEngine:
    """Multi-dimensional Kelly Criterion with uncertainty handling"""
    
    def __init__(
        self,
        bankroll: float = 10000.0,
        min_edge: float = 0.03,
        max_fraction: float = 0.25,
        confidence_threshold: float = 0.6
    ):
        self.bankroll = bankroll
        self.min_edge = min_edge
        self.max_fraction = max_fraction
        self.confidence_threshold = confidence_threshold
    
    def calculate_kelly(
        self,
        true_probability: float,
        decimal_odds: float,
        confidence: float = 1.0
    ) -> StakingResult:
        """
        Calculate optimal stake using Kelly Criterion.
        Adjusts for uncertainty using confidence level.
        """
        implied_prob = 1 / decimal_odds
        edge = true_probability - implied_prob
        
        b = decimal_odds - 1
        p = true_probability
        q = 1 - p
        
        full_kelly = (b * p - q) / b if b > 0 else 0
        full_kelly = max(0, min(self.max_fraction, full_kelly))
        
        full_kelly *= confidence
        
        half_kelly = full_kelly / 2
        quarter_kelly = full_kelly / 4
        
        if edge < self.min_edge:
            recommended_fraction = "none"
            recommended_stake = 0
            is_approved = False
            rejection_reason = f"Edge {edge:.2%} below minimum {self.min_edge:.2%}"
        elif confidence < self.confidence_threshold:
            recommended_fraction = "quarter"
            recommended_stake = quarter_kelly * self.bankroll
            is_approved = True
            rejection_reason = None
        elif edge > 0.08:
            recommended_fraction = "half"
            recommended_stake = half_kelly * self.bankroll
            is_approved = True
            rejection_reason = None
        else:
            recommended_fraction = "quarter"
            recommended_stake = quarter_kelly * self.bankroll
            is_approved = True
            rejection_reason = None
        
        roi_expected = edge * 100
        risk_of_ruin = self._calculate_ror(full_kelly, true_probability, decimal_odds)
        
        return StakingResult(
            full_kelly=full_kelly * self.bankroll,
            half_kelly=half_kelly * self.bankroll,
            quarter_kelly=quarter_kelly * self.bankroll,
            recommended_stake=recommended_stake,
            recommended_fraction=recommended_fraction,
            edge=edge,
            implied_probability=implied_prob,
            true_probability=true_probability,
            roi_expected=roi_expected,
            risk_of_ruin=risk_of_ruin,
            is_approved=is_approved,
            rejection_reason=rejection_reason
        )
    
    def _calculate_ror(
        self,
        kelly_fraction: float,
        win_prob: float,
        decimal_odds: float,
        target_ruin: float = 0.1
    ) -> float:
        """Calculate risk of ruin for given stake size"""
        if kelly_fraction <= 0:
            return 0.0
        
        b = decimal_odds - 1
        edge = win_prob * b - (1 - win_prob)
        variance = win_prob * (b ** 2) + (1 - win_prob)
        
        if edge <= 0:
            return 1.0
        
        drift = edge * kelly_fraction
        vol = np.sqrt(variance) * kelly_fraction
        
        if vol == 0:
            return 0.0
        
        ror = np.exp(-2 * drift / (vol ** 2) * np.log(1 / target_ruin))
        return min(1.0, max(0.0, ror))
    
    def multi_bet_kelly(
        self,
        bets: List[Dict]
    ) -> Dict:
        """
        Calculate optimal allocation across multiple simultaneous bets.
        Uses simplified independent bet assumption.
        """
        results = []
        total_stake = 0
        
        for bet in bets:
            result = self.calculate_kelly(
                bet['true_probability'],
                bet['decimal_odds'],
                bet.get('confidence', 1.0)
            )
            if result.is_approved:
                total_stake += result.recommended_stake
                results.append({
                    "bet_id": bet.get('id', 'unknown'),
                    "stake": result.recommended_stake,
                    "edge": result.edge,
                    "fraction": result.recommended_fraction
                })
        
        if total_stake > self.bankroll * self.max_fraction * len(bets):
            scale_factor = (self.bankroll * self.max_fraction * len(bets)) / total_stake
            for r in results:
                r['stake'] *= scale_factor
            total_stake *= scale_factor
        
        return {
            "total_stake": total_stake,
            "bankroll_percentage": total_stake / self.bankroll * 100,
            "num_bets": len(results),
            "allocations": results
        }
    
    def growth_optimal_fraction(
        self,
        true_probability: float,
        decimal_odds: float,
        simulations: int = 10000,
        num_bets: int = 100
    ) -> Dict:
        """Find growth-optimal fraction via simulation"""
        fractions = np.linspace(0.01, 0.5, 50)
        final_bankrolls = []
        
        for frac in fractions:
            bankrolls = np.ones(simulations) * self.bankroll
            
            for _ in range(num_bets):
                wins = np.random.random(simulations) < true_probability
                stakes = bankrolls * frac
                bankrolls = np.where(
                    wins,
                    bankrolls + stakes * (decimal_odds - 1),
                    bankrolls - stakes
                )
                bankrolls = np.maximum(bankrolls, 0)
            
            final_bankrolls.append(np.median(bankrolls))
        
        optimal_idx = np.argmax(final_bankrolls)
        optimal_fraction = fractions[optimal_idx]
        
        return {
            "optimal_fraction": float(optimal_fraction),
            "optimal_stake": float(optimal_fraction * self.bankroll),
            "expected_final_bankroll": float(final_bankrolls[optimal_idx]),
            "growth_multiple": float(final_bankrolls[optimal_idx] / self.bankroll)
        }

def staking_result_to_dict(result: StakingResult) -> Dict:
    """Convert StakingResult to JSON-serializable dict"""
    return {
        "full_kelly": round(result.full_kelly, 2),
        "half_kelly": round(result.half_kelly, 2),
        "quarter_kelly": round(result.quarter_kelly, 2),
        "recommended_stake": round(result.recommended_stake, 2),
        "recommended_fraction": result.recommended_fraction,
        "edge": round(result.edge, 4),
        "edge_percent": f"{result.edge * 100:.2f}%",
        "implied_probability": round(result.implied_probability, 4),
        "true_probability": round(result.true_probability, 4),
        "roi_expected": round(result.roi_expected, 2),
        "risk_of_ruin": round(result.risk_of_ruin, 4),
        "is_approved": result.is_approved,
        "rejection_reason": result.rejection_reason
    }
