"""
Market Analyzer for NFL Betting
Analyzes betting markets, identifies inefficiencies, and compares model predictions
"""
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import requests
import numpy as np
import pandas as pd
from singularity_config import is_signal_enabled, SINGULARITY_EXPLOIT_CONFIG

@dataclass
class MarketOdds:
    game_id: int
    home_team: str
    away_team: str
    opening_spread: float
    current_spread: float
    opening_total: float
    current_total: float
    opening_home_moneyline: int
    opening_away_moneyline: int
    current_home_moneyline: int
    current_away_moneyline: int
    sportsbook: str
    timestamp: str

@dataclass
class ModelProbability:
    game_id: int
    home_win_probability: float
    away_win_probability: float
    spread_prediction: float
    total_prediction: float
    over_probability: float
    under_probability: float
    confidence: float
    model_version: str

@dataclass
class BettingEdge:
    game_id: int
    edge_type: str
    selection: str
    model_probability: float
    market_probability: float
    fair_odds: float
    market_odds: float
    edge: float
    kelly_fraction: float
    confidence: float
    reason: str

class MarketAnalyzer:
    def __init__(self):
        self.vig_juice = 0.048

    def convert_american_to_decimal(self, american_odds: int) -> float:
        if american_odds > 0:
            return (american_odds / 100) + 1
        return (100 / abs(american_odds)) + 1

    def convert_decimal_to_probability(self, decimal_odds: float) -> float:
        return 1 / decimal_odds

    def convert_american_to_probability(self, american_odds: int) -> float:
        return self.convert_decimal_to_probability(
            self.convert_american_to_decimal(american_odds)
        )

    def calculate_market_probability(self, american_odds: int) -> float:
        probability = self.convert_american_to_probability(american_odds)
        return probability

    def calculate_fair_odds(self, model_probability: float) -> float:
        if model_probability <= 0 or model_probability >= 1:
            raise ValueError("Model probability must be between 0 and 1")
        return 1 / model_probability

    def calculate_edge(self, market_odds: float, fair_odds: float) -> float:
        return (market_odds / fair_odds) - 1

    def calculate_edge_model_vs_market(self, model_probability: float, market_probability: float) -> float:
        fair_odds = self.calculate_fair_odds(model_probability)
        market_odds = 1 / market_probability
        return self.calculate_edge(market_odds, fair_odds)

    def compare_model_to_market(
        self,
        model: ModelProbability,
        market: MarketOdds,
        kelly_fraction: float = 0.25
    ) -> List[BettingEdge]:
        edges = []

        home_market_prob = self.calculate_market_probability(market.current_home_moneyline)
        away_market_prob = self.calculate_market_probability(market.current_away_moneyline)

        spread_edge = self._compare_spread(model, market, kelly_fraction)
        if spread_edge:
            edges.append(spread_edge)

        total_edge = self._compare_total(model, market, kelly_fraction)
        if total_edge:
            edges.append(total_edge)

        home_ml_edge = self._compare_moneyline(
            model, market, "home", home_market_prob, kelly_fraction
        )
        if home_ml_edge:
            edges.append(home_ml_edge)

        away_ml_edge = self._compare_moneyline(
            model, market, "away", away_market_prob, kelly_fraction
        )
        if away_ml_edge:
            edges.append(away_ml_edge)

        return edges

    def _compare_spread(
        self,
        model: ModelProbability,
        market: MarketOdds,
        kelly_fraction: float
    ) -> Optional[BettingEdge]:
        model_spread = model.spread_prediction
        market_spread = market.current_spread
        spread_diff = model_spread - market_spread

        if abs(spread_diff) < 0.5:
            return None

        selection = "away" if spread_diff > 0 else "home"
        edge_probability = model.home_win_probability if model.home_win_probability > model.away_win_probability else model.away_win_probability

        market_implied_prob = 0.5 - (market_spread * 0.02)
        fair_odds = self.calculate_fair_odds(edge_probability)
        market_odds = self.convert_american_to_decimal(
            market.current_away_moneyline if spread_diff > 0 else market.current_home_moneyline
        )

        edge = self.calculate_edge_model_vs_market(edge_probability, market_implied_prob)

        if edge < 0.03:
            return None

        return BettingEdge(
            game_id=model.game_id,
            edge_type="spread",
            selection=selection,
            model_probability=edge_probability,
            market_probability=market_implied_prob,
            fair_odds=fair_odds,
            market_odds=market_odds,
            edge=edge,
            kelly_fraction=kelly_fraction,
            confidence=model.confidence,
            reason=f"Model spread ({model_spread:.1f}) differs from market ({market_spread:.1f}) by {spread_diff:.1f} points"
        )

    def _compare_total(
        self,
        model: ModelProbability,
        market: MarketOdds,
        kelly_fraction: float
    ) -> Optional[BettingEdge]:
        model_total = model.total_prediction
        market_total = market.current_total
        total_diff = model_total - market_total

        if abs(total_diff) < 1.5:
            return None

        selection = "over" if total_diff > 0 else "under"
        edge_probability = model.over_probability if selection == "over" else model.under_probability

        market_implied_prob = 0.5 - (total_diff * 0.015)
        fair_odds = self.calculate_fair_odds(edge_probability)
        market_odds = 1 / market_implied_prob

        edge = self.calculate_edge_model_vs_market(edge_probability, market_implied_prob)

        if edge < 0.03:
            return None

        return BettingEdge(
            game_id=model.game_id,
            edge_type="total",
            selection=selection,
            model_probability=edge_probability,
            market_probability=market_implied_prob,
            fair_odds=fair_odds,
            market_odds=market_odds,
            edge=edge,
            kelly_fraction=kelly_fraction,
            confidence=model.confidence,
            reason=f"Model total ({model_total:.1f}) differs from market ({market_total:.1f}) by {total_diff:.1f} points"
        )

    def _compare_moneyline(
        self,
        model: ModelProbability,
        market: MarketOdds,
        selection: str,
        market_probability: float,
        kelly_fraction: float
    ) -> Optional[BettingEdge]:
        model_probability = model.home_win_probability if selection == "home" else model.away_win_probability

        fair_odds = self.calculate_fair_odds(model_probability)
        market_odds = self.convert_american_to_decimal(
            market.current_home_moneyline if selection == "home" else market.current_away_moneyline
        )

        edge = self.calculate_edge_model_vs_market(model_probability, market_probability)

        if edge < 0.03:
            return None

        return BettingEdge(
            game_id=model.game_id,
            edge_type="moneyline",
            selection=selection,
            model_probability=model_probability,
            market_probability=market_probability,
            fair_odds=fair_odds,
            market_odds=market_odds,
            edge=edge,
            kelly_fraction=kelly_fraction,
            confidence=model.confidence,
            reason=f"Model {selection} win prob ({model_probability*100:.1f}%) > market ({market_probability*100:.1f}%)"
        )

    def find_opening_line_exploits(
        self,
        model: ModelProbability,
        market: MarketOdds,
        kelly_fraction: float = 0.25
    ) -> List[BettingEdge]:
        edges = []

        opening_home_prob = self.calculate_market_probability(market.opening_home_moneyline)
        opening_away_prob = self.calculate_market_probability(market.opening_away_moneyline)

        opening_ml_edge_home = self._compare_moneyline(
            model, market, "home", opening_home_prob, kelly_fraction
        )
        if opening_ml_edge_home:
            opening_ml_edge_home.reason = "OPENING LINE EXPLOIT: " + opening_ml_edge_home.reason
            edges.append(opening_ml_edge_home)

        opening_ml_edge_away = self._compare_moneyline(
            model, market, "away", opening_away_prob, kelly_fraction
        )
        if opening_ml_edge_away:
            opening_ml_edge_away.reason = "OPENING LINE EXPLOIT: " + opening_ml_edge_away.reason
            edges.append(opening_ml_edge_away)

        return edges

    def identify_market_overreaction(
        self,
        model: ModelProbability,
        market: MarketOdds,
        previous_games: List[Dict]
    ) -> Optional[BettingEdge]:
        if len(previous_games) == 0:
            return None

        last_game = previous_games[0]
        point_differential = abs(last_game.get('homeTeamScore', 0) - last_game.get('awayTeamScore', 0))

        if point_differential < 21:
            return None

        line_movement = abs(market.current_spread - market.opening_spread)

        if line_movement < 0.5:
            return None

        team_adjusted = "home" if market.current_spread > market.opening_spread else "away"
        model_win_prob = model.home_win_probability if team_adjusted == "home" else model.away_win_probability

        fair_odds = self.calculate_fair_odds(model_win_prob)
        market_odds = self.convert_american_to_decimal(
            market.current_home_moneyline if team_adjusted == "home" else market.current_away_moneyline
        )

        edge = self.calculate_edge_model_vs_market(model_win_prob, 0.5)

        if edge > 0.02:
            return BettingEdge(
                game_id=model.game_id,
                edge_type="moneyline",
                selection=team_adjusted,
                model_probability=model_win_prob,
                market_probability=0.5,
                fair_odds=fair_odds,
                market_odds=market_odds,
                edge=edge,
                kelly_fraction=0.25,
                confidence=model.confidence * 0.8,
                reason=f"MARKET OVERREACTION: {point_differential} point blowout, line moved {line_movement:.1f} points"
            )

        return None
