"""
PSYCHOLOGICAL & HUMAN FACTOR MODELING
=====================================
Contract year detection, coaching aggression, lookahead spots,
referee tendencies, body clock fatigue
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from enum import Enum


class ContractStatus(Enum):
    CONTRACT_YEAR = "contract_year"
    FRANCHISE_TAG = "franchise_tag"
    ROOKIE_DEAL = "rookie_deal"
    EXTENSION = "extension"
    VETERAN_MIN = "veteran_min"


@dataclass
class PlayerMotivation:
    player_name: str
    contract_status: ContractStatus
    years_remaining: int
    motivation_score: float  # 0-100
    injury_avoidance_risk: float  # likelihood to avoid contact
    recommendation: str


@dataclass
class CoachProfile:
    coach_name: str
    team: str
    aggression_index: float  # 0-100
    fourth_down_go_rate: float  # % of analytics-recommended goes taken
    two_point_rate: float
    timeout_efficiency: float
    live_bet_edge: str


@dataclass
class LookaheadSpot:
    current_opponent: str
    current_spread: float
    next_opponent: str
    next_game_importance: float  # 0-100
    trap_probability: float
    recommendation: str


@dataclass
class RefereeCrew:
    crew_chief: str
    holding_calls_per_game: float
    pi_calls_per_game: float
    total_penalties_per_game: float
    home_penalty_bias: float  # + favors home
    recommended_bets: list[str]


@dataclass
class FatigueAnalysis:
    team: str
    body_clock_time: str  # actual body time at kickoff
    hours_offset: float
    fatigue_penalty: float  # expected point drop
    recommendation: str


# Coach aggression database (sample)
COACH_PROFILES = {
    "Andy Reid": {"aggression": 78, "4th_go": 0.72, "2pt": 0.35},
    "Sean McVay": {"aggression": 75, "4th_go": 0.68, "2pt": 0.28},
    "Kevin Stefanski": {"aggression": 70, "4th_go": 0.65, "2pt": 0.22},
    "Mike Tomlin": {"aggression": 55, "4th_go": 0.45, "2pt": 0.18},
    "Bill Belichick": {"aggression": 82, "4th_go": 0.78, "2pt": 0.32},
    "Kyle Shanahan": {"aggression": 72, "4th_go": 0.70, "2pt": 0.25},
    "Dan Campbell": {"aggression": 85, "4th_go": 0.82, "2pt": 0.38},
    "Matt LaFleur": {"aggression": 68, "4th_go": 0.62, "2pt": 0.20},
}

# Referee crew tendencies (sample)
REFEREE_CREWS = {
    "Brad Allen": {"holding": 4.2, "pi": 1.8, "total": 14.5, "home_bias": 0.3},
    "Shawn Hochuli": {"holding": 3.8, "pi": 2.1, "total": 15.2, "home_bias": 0.1},
    "Carl Cheffers": {"holding": 4.5, "pi": 1.5, "total": 13.8, "home_bias": 0.5},
    "Clete Blakeman": {"holding": 3.5, "pi": 2.4, "total": 16.1, "home_bias": -0.2},
    "Ron Torbert": {"holding": 4.0, "pi": 1.9, "total": 14.8, "home_bias": 0.4},
}


class PsychologicalEdgeEngine:
    """Human factor modeling for betting edges"""
    
    def analyze_player_motivation(
        self,
        player_name: str,
        contract_status: str,
        years_remaining: int,
        is_meaningful_game: bool,
        injury_history: bool = False
    ) -> PlayerMotivation:
        """Detect 'business decision' likelihood"""
        
        status = ContractStatus(contract_status)
        
        # Base motivation
        if status == ContractStatus.CONTRACT_YEAR:
            motivation = 95
            avoidance = 0.05
        elif status == ContractStatus.FRANCHISE_TAG:
            motivation = 70
            avoidance = 0.25  # Unhappy, protecting value
        elif status == ContractStatus.ROOKIE_DEAL:
            motivation = 85
            avoidance = 0.10
        elif status == ContractStatus.EXTENSION:
            motivation = 75
            avoidance = 0.15
        else:  # veteran_min
            motivation = 80
            avoidance = 0.20
        
        # Adjustments
        if not is_meaningful_game:
            motivation *= 0.85
            avoidance *= 1.5
        
        if injury_history:
            avoidance *= 1.3
        
        avoidance = min(avoidance, 0.5)
        
        if motivation > 90:
            rec = f"TARGET {player_name} props — high motivation"
        elif avoidance > 0.3:
            rec = f"FADE {player_name} — business decision risk"
        else:
            rec = "NEUTRAL — standard motivation"
        
        return PlayerMotivation(
            player_name=player_name,
            contract_status=status,
            years_remaining=years_remaining,
            motivation_score=round(motivation, 1),
            injury_avoidance_risk=round(avoidance, 2),
            recommendation=rec
        )
    
    def get_coach_profile(self, coach_name: str, team: str) -> CoachProfile:
        """Get coaching aggression profile for live betting"""
        
        profile = COACH_PROFILES.get(coach_name, {"aggression": 60, "4th_go": 0.55, "2pt": 0.20})
        
        if profile["aggression"] > 75:
            edge = "LIVE BET OVER when trailing — aggressive play-calling"
        elif profile["aggression"] < 50:
            edge = "LIVE BET UNDER when leading — conservative clock management"
        else:
            edge = "Neutral — standard game management"
        
        return CoachProfile(
            coach_name=coach_name,
            team=team,
            aggression_index=profile["aggression"],
            fourth_down_go_rate=profile["4th_go"],
            two_point_rate=profile["2pt"],
            timeout_efficiency=0.75,  # placeholder
            live_bet_edge=edge
        )
    
    def detect_lookahead_spot(
        self,
        team: str,
        current_opponent: str,
        current_spread: float,
        next_opponent: str,
        is_rivalry_next: bool,
        is_playoff_implications_next: bool
    ) -> LookaheadSpot:
        """Auto-flag trap game situations"""
        
        importance = 50
        if is_rivalry_next:
            importance += 25
        if is_playoff_implications_next:
            importance += 25
        
        # Calculate trap probability
        trap_prob = 0.15  # base
        
        if current_spread < -7:  # Big favorite
            trap_prob += 0.20
        
        if importance > 70:
            trap_prob += 0.25
        
        trap_prob = min(trap_prob, 0.65)
        
        if trap_prob > 0.45:
            rec = f"⚠️ TRAP ALERT: {team} looking ahead to {next_opponent}"
        elif trap_prob > 0.30:
            rec = f"Monitor: Possible lookahead to {next_opponent}"
        else:
            rec = "Low trap risk"
        
        return LookaheadSpot(
            current_opponent=current_opponent,
            current_spread=current_spread,
            next_opponent=next_opponent,
            next_game_importance=importance,
            trap_probability=round(trap_prob, 2),
            recommendation=rec
        )
    
    def analyze_referee_crew(self, crew_chief: str) -> RefereeCrew:
        """Get referee crew tendencies for betting edges"""
        
        crew = REFEREE_CREWS.get(crew_chief, {
            "holding": 4.0, "pi": 1.8, "total": 14.5, "home_bias": 0.2
        })
        
        recommendations = []
        
        if crew["holding"] > 4.2:
            recommendations.append("UNDER — High holding kills drives")
            recommendations.append("Sack props OVER")
        
        if crew["pi"] > 2.0:
            recommendations.append("OVER — PI extends drives")
            recommendations.append("QB Yards OVER")
        
        if crew["total"] > 15.5:
            recommendations.append("UNDER — Penalty-heavy games slow down")
        
        if crew["home_bias"] > 0.4:
            recommendations.append("Home Team Spread")
        
        if not recommendations:
            recommendations.append("Neutral crew — no strong edges")
        
        return RefereeCrew(
            crew_chief=crew_chief,
            holding_calls_per_game=crew["holding"],
            pi_calls_per_game=crew["pi"],
            total_penalties_per_game=crew["total"],
            home_penalty_bias=crew["home_bias"],
            recommended_bets=recommendations
        )
    
    def calculate_body_clock_fatigue(
        self,
        team: str,
        team_timezone: str,  # "PT", "MT", "CT", "ET"
        kickoff_et: int  # Hour in ET (13 = 1PM ET)
    ) -> FatigueAnalysis:
        """Quantify jet lag impact"""
        
        tz_offsets = {"PT": -3, "MT": -2, "CT": -1, "ET": 0}
        offset = tz_offsets.get(team_timezone, 0)
        
        body_clock_hour = kickoff_et + offset
        
        # Calculate fatigue
        fatigue_penalty = 0.0
        
        if team_timezone == "PT" and kickoff_et == 13:
            # West Coast team at 1PM ET = 10AM body clock
            fatigue_penalty = 2.5
        elif team_timezone == "PT" and kickoff_et == 16:
            fatigue_penalty = 1.0
        elif team_timezone == "ET" and kickoff_et == 22:
            # East Coast late game = 10PM, past prime
            fatigue_penalty = 1.5
        
        body_time = f"{body_clock_hour}:00"
        if body_clock_hour < 12:
            body_time = f"{body_clock_hour}:00 AM"
        else:
            body_time = f"{body_clock_hour - 12 if body_clock_hour > 12 else 12}:00 PM"
        
        if fatigue_penalty > 2:
            rec = f"FADE {team} — severe body clock disadvantage"
        elif fatigue_penalty > 1:
            rec = f"Lean against {team} — moderate fatigue"
        else:
            rec = "No significant fatigue impact"
        
        return FatigueAnalysis(
            team=team,
            body_clock_time=body_time,
            hours_offset=abs(offset),
            fatigue_penalty=round(fatigue_penalty, 1),
            recommendation=rec
        )
