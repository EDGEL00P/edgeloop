"""
DEFENSIVE SCHEME VULNERABILITY
==============================
Blitz response ratings, zone vs man splits,
coverage shell exploitation
"""

from dataclasses import dataclass
from typing import Optional
from enum import Enum


class CoverageShell(Enum):
    MAN = "man"
    ZONE = "zone"
    COVER_0 = "cover_0"
    COVER_1 = "cover_1"
    COVER_2 = "cover_2"
    COVER_3 = "cover_3"
    COVER_4 = "cover_4"
    COVER_6 = "cover_6"


class QBProcessorTier(Enum):
    ELITE = "elite"  # Mahomes, Brady, Rodgers
    ABOVE_AVERAGE = "above_average"
    AVERAGE = "average"
    BELOW_AVERAGE = "below_average"
    PANIC = "panic"


@dataclass
class BlitzResponse:
    qb_name: str
    processor_tier: QBProcessorTier
    passer_rating_vs_blitz: float
    completion_pct_vs_blitz: float
    interception_rate_vs_blitz: float
    sack_rate_vs_blitz: float
    recommendation: str


@dataclass
class DefenseBlitzProfile:
    team: str
    blitz_rate: float
    blitz_success_rate: float
    coverage_behind_blitz: CoverageShell
    recommended_plays: list[str]


@dataclass
class WRCoverageMatchup:
    wr_name: str
    wr_man_success: float
    wr_zone_success: float
    wr_specialty: str  # "man_beater" or "zone_beater"
    opponent_coverage_pct: dict
    recommended_bet: str


@dataclass
class SchemeVulnerability:
    offense: str
    defense: str
    primary_mismatch: str
    exploitation_plays: list[str]
    prop_recommendations: list[str]
    confidence: float


# QB Blitz Response Database
QB_BLITZ_RESPONSE = {
    "Patrick Mahomes": {"tier": "elite", "rating": 112.5, "comp": 68.2, "int": 1.8, "sack": 4.5},
    "Josh Allen": {"tier": "elite", "rating": 98.7, "comp": 62.1, "int": 2.5, "sack": 5.2},
    "Lamar Jackson": {"tier": "above_average", "rating": 95.2, "comp": 58.5, "int": 2.2, "sack": 6.8},
    "Joe Burrow": {"tier": "elite", "rating": 108.3, "comp": 67.8, "int": 1.5, "sack": 7.2},
    "Jalen Hurts": {"tier": "above_average", "rating": 88.5, "comp": 60.2, "int": 2.8, "sack": 6.5},
    "Dak Prescott": {"tier": "average", "rating": 82.3, "comp": 58.5, "int": 3.2, "sack": 8.1},
    "Trevor Lawrence": {"tier": "average", "rating": 79.8, "comp": 56.2, "int": 3.5, "sack": 7.8},
    "Justin Herbert": {"tier": "above_average", "rating": 92.5, "comp": 63.5, "int": 2.3, "sack": 6.2},
    "Tua Tagovailoa": {"tier": "above_average", "rating": 94.2, "comp": 68.5, "int": 2.0, "sack": 5.5},
    "Kirk Cousins": {"tier": "below_average", "rating": 72.5, "comp": 54.2, "int": 4.2, "sack": 9.5},
    "Sam Darnold": {"tier": "panic", "rating": 62.3, "comp": 48.5, "int": 5.8, "sack": 12.2},
}

# Team Blitz Profiles
TEAM_BLITZ_PROFILES = {
    "BAL": {"rate": 42.5, "success": 28.5, "shell": "cover_1"},
    "PIT": {"rate": 38.2, "success": 26.8, "shell": "cover_3"},
    "MIA": {"rate": 35.5, "success": 30.2, "shell": "cover_0"},
    "DAL": {"rate": 28.5, "success": 24.5, "shell": "cover_2"},
    "SF": {"rate": 25.2, "success": 22.8, "shell": "cover_3"},
    "BUF": {"rate": 32.5, "success": 27.2, "shell": "cover_1"},
    "KC": {"rate": 24.8, "success": 21.5, "shell": "cover_2"},
    "DET": {"rate": 30.2, "success": 25.8, "shell": "cover_3"},
    "PHI": {"rate": 26.5, "success": 24.2, "shell": "cover_2"},
    "CLE": {"rate": 34.8, "success": 29.5, "shell": "cover_1"},
}

# WR Coverage Splits
WR_COVERAGE_SPLITS = {
    "Tyreek Hill": {"man": 0.72, "zone": 0.65, "specialty": "man_beater"},
    "Davante Adams": {"man": 0.68, "zone": 0.75, "specialty": "zone_beater"},
    "Justin Jefferson": {"man": 0.70, "zone": 0.72, "specialty": "zone_beater"},
    "CeeDee Lamb": {"man": 0.65, "zone": 0.70, "specialty": "zone_beater"},
    "Ja'Marr Chase": {"man": 0.75, "zone": 0.62, "specialty": "man_beater"},
    "Amon-Ra St. Brown": {"man": 0.62, "zone": 0.78, "specialty": "zone_beater"},
    "A.J. Brown": {"man": 0.70, "zone": 0.66, "specialty": "man_beater"},
    "Stefon Diggs": {"man": 0.68, "zone": 0.72, "specialty": "zone_beater"},
    "DeVonta Smith": {"man": 0.72, "zone": 0.68, "specialty": "man_beater"},
    "Chris Olave": {"man": 0.66, "zone": 0.70, "specialty": "zone_beater"},
}


class DefensiveSchemeEngine:
    """Exploit defensive scheme vulnerabilities"""
    
    def analyze_blitz_response(
        self,
        qb_name: str,
        opponent: str
    ) -> BlitzResponse:
        """Analyze QB performance against the blitz"""
        
        qb_data = QB_BLITZ_RESPONSE.get(qb_name, {
            "tier": "average", "rating": 80.0, "comp": 58.0, "int": 3.0, "sack": 8.0
        })
        
        def_data = TEAM_BLITZ_PROFILES.get(opponent, {
            "rate": 30.0, "success": 25.0, "shell": "cover_2"
        })
        
        tier = QBProcessorTier(qb_data["tier"])
        
        # Generate recommendation based on matchup
        if tier in [QBProcessorTier.PANIC, QBProcessorTier.BELOW_AVERAGE] and def_data["rate"] > 35:
            rec = f"🎯 INT PROP YES | Sacks OVER — {qb_name} struggles vs blitz"
        elif tier == QBProcessorTier.ELITE and def_data["rate"] > 35:
            rec = f"WR1 Yards OVER — {qb_name} exploits blitz with hot reads"
        elif tier == QBProcessorTier.ELITE:
            rec = f"QB props favorable — elite processor"
        else:
            rec = "Neutral matchup — standard projections"
        
        return BlitzResponse(
            qb_name=qb_name,
            processor_tier=tier,
            passer_rating_vs_blitz=qb_data["rating"],
            completion_pct_vs_blitz=qb_data["comp"],
            interception_rate_vs_blitz=qb_data["int"],
            sack_rate_vs_blitz=qb_data["sack"],
            recommendation=rec
        )
    
    def get_defense_blitz_profile(self, team: str) -> DefenseBlitzProfile:
        """Get team's blitz tendencies"""
        
        data = TEAM_BLITZ_PROFILES.get(team, {
            "rate": 30.0, "success": 25.0, "shell": "cover_2"
        })
        
        shell = CoverageShell(data["shell"])
        
        # Recommended plays against this defense
        plays = []
        if data["rate"] > 35:
            plays.append("Quick slants and screens")
            plays.append("RB checkdowns")
        if shell in [CoverageShell.COVER_0, CoverageShell.COVER_1]:
            plays.append("Deep shots — single high safety")
        if shell == CoverageShell.COVER_3:
            plays.append("Attacking the seams")
            plays.append("Corner routes")
        
        return DefenseBlitzProfile(
            team=team,
            blitz_rate=data["rate"],
            blitz_success_rate=data["success"],
            coverage_behind_blitz=shell,
            recommended_plays=plays
        )
    
    def analyze_wr_coverage_matchup(
        self,
        wr_name: str,
        opponent: str,
        opponent_man_pct: float,
        opponent_zone_pct: float
    ) -> WRCoverageMatchup:
        """Match WR coverage skills against defense tendency"""
        
        wr_data = WR_COVERAGE_SPLITS.get(wr_name, {
            "man": 0.65, "zone": 0.65, "specialty": "zone_beater"
        })
        
        # Calculate expected success based on coverage mix
        expected_success = (
            wr_data["man"] * (opponent_man_pct / 100) +
            wr_data["zone"] * (opponent_zone_pct / 100)
        )
        
        # Determine if favorable matchup
        if wr_data["specialty"] == "man_beater" and opponent_man_pct > 55:
            rec = f"🎯 {wr_name} Yards OVER — man-beater vs man-heavy D"
        elif wr_data["specialty"] == "zone_beater" and opponent_zone_pct > 55:
            rec = f"🎯 {wr_name} Receptions OVER — zone-beater vs zone-heavy D"
        elif expected_success > 0.70:
            rec = f"{wr_name} props favorable — high expected success"
        else:
            rec = f"Neutral/unfavorable matchup for {wr_name}"
        
        return WRCoverageMatchup(
            wr_name=wr_name,
            wr_man_success=wr_data["man"],
            wr_zone_success=wr_data["zone"],
            wr_specialty=wr_data["specialty"],
            opponent_coverage_pct={"man": opponent_man_pct, "zone": opponent_zone_pct},
            recommended_bet=rec
        )
    
    def find_scheme_vulnerability(
        self,
        offense_team: str,
        offense_style: str,  # "air_raid", "west_coast", "run_heavy", "spread"
        defense_team: str,
        defense_style: str  # "aggressive", "bend_dont_break", "man_heavy", "zone_heavy"
    ) -> SchemeVulnerability:
        """Find systemic mismatches between offensive and defensive schemes"""
        
        exploits = []
        props = []
        confidence = 0.5
        mismatch = "None identified"
        
        # Air Raid vs Man Heavy
        if offense_style == "air_raid" and defense_style == "man_heavy":
            mismatch = "Quick passing game vs press coverage"
            exploits = ["Slants", "Quick outs", "RPOs"]
            props = ["Slot WR Receptions OVER", "Passing Yards OVER"]
            confidence = 0.70
        
        # Run Heavy vs Aggressive
        elif offense_style == "run_heavy" and defense_style == "aggressive":
            mismatch = "Play action against overcommitting defense"
            exploits = ["Play action deep shots", "TE seam routes"]
            props = ["TE Yards OVER", "Deep ball completions"]
            confidence = 0.65
        
        # Spread vs Zone Heavy
        elif offense_style == "spread" and defense_style == "zone_heavy":
            mismatch = "Finding soft spots in zone"
            exploits = ["Crossers", "Option routes", "Levels concept"]
            props = ["WR2 Receptions OVER", "QB Completions OVER"]
            confidence = 0.60
        
        # West Coast vs Bend Don't Break
        elif offense_style == "west_coast" and defense_style == "bend_dont_break":
            mismatch = "Death by 1000 cuts — long drives"
            exploits = ["Underneath routes", "Consistent completions"]
            props = ["1H Team Total UNDER", "RB Receptions OVER"]
            confidence = 0.55
        
        else:
            mismatch = "No clear schematic advantage"
            exploits = ["Standard game planning"]
            props = ["Line shopping recommended"]
            confidence = 0.45
        
        return SchemeVulnerability(
            offense=offense_team,
            defense=defense_team,
            primary_mismatch=mismatch,
            exploitation_plays=exploits,
            prop_recommendations=props,
            confidence=round(confidence, 2)
        )
