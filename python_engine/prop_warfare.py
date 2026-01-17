"""
PROP WARFARE MODULE — Player Micro-Markets
==========================================
Route-tree matching, substitution patterns, garbage time,
injury domino effects
"""

from dataclasses import dataclass
from typing import Optional
from enum import Enum


class RouteType(Enum):
    SLANT = "slant"
    OUT = "out"
    IN = "in"
    GO = "go"
    POST = "post"
    CORNER = "corner"
    CURL = "curl"
    DRAG = "drag"
    SCREEN = "screen"
    WHEEL = "wheel"


class GameScript(Enum):
    BLOWOUT_WIN = "blowout_win"
    BLOWOUT_LOSS = "blowout_loss"
    CLOSE_GAME = "close_game"
    NEUTRAL = "neutral"


@dataclass
class RouteMatchup:
    wr_name: str
    cb_name: str
    route_type: RouteType
    wr_success_rate: float  # % success on this route
    cb_allowed_rate: float  # % allowed on this route
    matchup_edge: float  # positive = WR advantage
    recommendation: str


@dataclass
class SubstitutionPattern:
    player_name: str
    position: str
    avg_snaps_before_rest: int
    backup_name: str
    backup_opportunity_rating: float
    recommendation: str


@dataclass
class GarbageTimeProjection:
    predicted_script: GameScript
    confidence: float
    rushing_impact: str
    passing_impact: str
    recommended_props: list[str]


@dataclass
class InjuryDominoEffect:
    injured_player: str
    position: str
    downstream_effects: list[dict]
    betting_recommendations: list[str]


# Sample WR route tendencies
WR_ROUTE_PROFILES = {
    "Davante Adams": {"slant": 0.72, "out": 0.68, "go": 0.58, "curl": 0.75},
    "Tyreek Hill": {"slant": 0.65, "go": 0.78, "post": 0.72, "screen": 0.82},
    "Justin Jefferson": {"slant": 0.70, "in": 0.75, "post": 0.68, "corner": 0.65},
    "CeeDee Lamb": {"slant": 0.74, "curl": 0.70, "out": 0.66, "post": 0.62},
    "Ja'Marr Chase": {"go": 0.75, "post": 0.72, "slant": 0.68, "corner": 0.70},
    "Amon-Ra St. Brown": {"slant": 0.78, "curl": 0.76, "screen": 0.80, "in": 0.72},
}

# Sample CB route defense
CB_ROUTE_DEFENSE = {
    "Sauce Gardner": {"slant": 0.35, "go": 0.28, "out": 0.32, "post": 0.30},
    "Patrick Surtain": {"slant": 0.38, "go": 0.32, "curl": 0.35, "corner": 0.33},
    "Jaire Alexander": {"slant": 0.40, "in": 0.36, "out": 0.38, "post": 0.35},
    "Trevon Diggs": {"slant": 0.52, "go": 0.45, "post": 0.48, "curl": 0.50},
}

# Snap count patterns
SNAP_PATTERNS = {
    "Derrick Henry": {"avg_before_rest": 8, "backup": "Tyjae Spears"},
    "Christian McCaffrey": {"avg_before_rest": 6, "backup": "Jordan Mason"},
    "Josh Jacobs": {"avg_before_rest": 7, "backup": "Emanuel Wilson"},
    "Saquon Barkley": {"avg_before_rest": 7, "backup": "Kenneth Gainwell"},
    "Jonathan Taylor": {"avg_before_rest": 6, "backup": "Zack Moss"},
}


class PropWarfareEngine:
    """Player prop micro-market analysis"""
    
    def analyze_route_matchup(
        self,
        wr_name: str,
        cb_name: str,
        route_type: str
    ) -> RouteMatchup:
        """Match WR route tendencies against CB coverage success"""
        
        route = RouteType(route_type)
        
        # Get profiles (default to league average)
        wr_profile = WR_ROUTE_PROFILES.get(wr_name, {route_type: 0.60})
        cb_profile = CB_ROUTE_DEFENSE.get(cb_name, {route_type: 0.45})
        
        wr_success = wr_profile.get(route_type, 0.60)
        cb_allowed = cb_profile.get(route_type, 0.45)
        
        # Calculate edge
        matchup_edge = (wr_success - (1 - cb_allowed)) * 100
        
        if matchup_edge > 15:
            rec = f"🎯 STRONG: {wr_name} {route_type} routes vs {cb_name}"
        elif matchup_edge > 5:
            rec = f"Slight edge for {wr_name} on {route_type}"
        elif matchup_edge < -10:
            rec = f"⚠️ FADE: {cb_name} dominates {route_type}"
        else:
            rec = "Neutral matchup"
        
        return RouteMatchup(
            wr_name=wr_name,
            cb_name=cb_name,
            route_type=route,
            wr_success_rate=wr_success,
            cb_allowed_rate=cb_allowed,
            matchup_edge=round(matchup_edge, 1),
            recommendation=rec
        )
    
    def predict_substitution_opportunity(
        self,
        starter_name: str,
        game_pace: str = "normal"  # "fast", "normal", "slow"
    ) -> SubstitutionPattern:
        """Predict backup opportunity based on snap patterns"""
        
        pattern = SNAP_PATTERNS.get(starter_name, {
            "avg_before_rest": 7, "backup": "Unknown"
        })
        
        avg_rest = pattern["avg_before_rest"]
        backup = pattern["backup"]
        
        # Adjust for game pace
        pace_mult = {"fast": 1.2, "normal": 1.0, "slow": 0.8}
        expected_series = 12 * pace_mult.get(game_pace, 1.0)
        
        # Backup opportunity rating
        backup_touches = expected_series / avg_rest * 2  # ~2 touches per rest series
        opportunity = min(backup_touches / 8 * 100, 100)  # scale to 100
        
        if opportunity > 70:
            rec = f"🎯 TARGET {backup} rushing attempts OVER"
        elif opportunity > 50:
            rec = f"Monitor {backup} — decent volume expected"
        else:
            rec = f"{starter_name} likely to dominate touches"
        
        return SubstitutionPattern(
            player_name=starter_name,
            position="RB",
            avg_snaps_before_rest=avg_rest,
            backup_name=backup,
            backup_opportunity_rating=round(opportunity, 1),
            recommendation=rec
        )
    
    def simulate_garbage_time(
        self,
        favorite_spread: float,
        favorite_total_offense_rank: int,  # 1-32
        underdog_total_offense_rank: int
    ) -> GarbageTimeProjection:
        """Predict game script for prop targeting"""
        
        # Blowout probability based on spread
        if favorite_spread <= -14:
            blowout_prob = 0.55
        elif favorite_spread <= -10:
            blowout_prob = 0.40
        elif favorite_spread <= -7:
            blowout_prob = 0.25
        else:
            blowout_prob = 0.15
        
        # Adjust for offensive ranks
        if favorite_total_offense_rank <= 5:
            blowout_prob *= 1.2
        if underdog_total_offense_rank >= 25:
            blowout_prob *= 1.15
        
        blowout_prob = min(blowout_prob, 0.70)
        
        if blowout_prob > 0.45:
            script = GameScript.BLOWOUT_WIN
            rushing = "OVER on favorite RB — clock killing"
            passing = "OVER on underdog QB attempts — catch up mode"
            props = [
                f"Favorite RB Rush Attempts OVER",
                f"Underdog QB Pass Attempts OVER",
                f"Underdog WR2/WR3 Receptions OVER (soft coverage)"
            ]
        elif blowout_prob > 0.30:
            script = GameScript.NEUTRAL
            rushing = "Neutral — game flow dependent"
            passing = "Neutral — game flow dependent"
            props = ["Wait for live betting opportunities"]
        else:
            script = GameScript.CLOSE_GAME
            rushing = "Standard workloads expected"
            passing = "Standard workloads expected"
            props = ["No strong garbage time edges"]
        
        return GarbageTimeProjection(
            predicted_script=script,
            confidence=round(blowout_prob, 2),
            rushing_impact=rushing,
            passing_impact=passing,
            recommended_props=props
        )
    
    def analyze_injury_domino(
        self,
        injured_player: str,
        position: str,
        team: str
    ) -> InjuryDominoEffect:
        """Map downstream betting effects of key injuries"""
        
        effects = []
        recommendations = []
        
        if position == "C":  # Center out
            effects = [
                {"effect": "Interior pressure increases", "impact": "+25%"},
                {"effect": "QB scramble rate increases", "impact": "+40%"},
                {"effect": "Quick passing game emphasized", "impact": "+15%"},
            ]
            recommendations = [
                "QB Rushing Yards OVER",
                "Sacks OVER",
                "Slot WR Receptions OVER",
                "RB Yards UNDER (fewer holes)",
            ]
        
        elif position == "LT":  # Left Tackle out
            effects = [
                {"effect": "Blindside pressure increases", "impact": "+35%"},
                {"effect": "Quick game emphasis", "impact": "+20%"},
                {"effect": "RB chip blocking increases", "impact": "+30%"},
            ]
            recommendations = [
                "Sacks OVER",
                "QB Rushing Yards OVER (escape)",
                "RB Receiving UNDER (blocking duties)",
            ]
        
        elif position == "WR1":
            effects = [
                {"effect": "WR2 target share increases", "impact": "+40%"},
                {"effect": "TE targets increase", "impact": "+25%"},
                {"effect": "Defense can bracket WR2", "impact": "-10% efficiency"},
            ]
            recommendations = [
                "WR2 Receptions OVER",
                "TE Receptions OVER",
                "Team Total UNDER (offensive efficiency drops)",
            ]
        
        elif position == "CB1":
            effects = [
                {"effect": "Opponent WR1 targets increase", "impact": "+30%"},
                {"effect": "Safety help required", "impact": "Run defense weakens"},
                {"effect": "Deep ball opportunities increase", "impact": "+25%"},
            ]
            recommendations = [
                "Opponent WR1 Yards OVER",
                "Opponent Passing Yards OVER",
                "Rushing Yards OVER (safety cheating)",
            ]
        
        else:
            effects = [{"effect": "Minor downstream impact", "impact": "Low"}]
            recommendations = ["No strong edges from this injury"]
        
        return InjuryDominoEffect(
            injured_player=injured_player,
            position=position,
            downstream_effects=effects,
            betting_recommendations=recommendations
        )
