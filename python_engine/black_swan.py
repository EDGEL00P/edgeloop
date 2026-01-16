"""
BLACK SWAN EVENTS
=================
QB2 readiness, special teams volatility,
hidden yards, catastrophic scenario planning
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class QB2Readiness:
    starter: str
    backup: str
    backup_experience: int  # career starts
    backup_passer_rating: float
    dropoff_rating: float  # expected point drop
    readiness_tier: str  # "elite_backup", "capable", "severe_dropoff", "catastrophic"
    live_bet_strategy: str


@dataclass
class SpecialTeamsEdge:
    team: str
    punt_net_avg: float
    punt_net_rank: int
    return_dvoa: float
    return_rank: int
    hidden_yards_per_game: float
    edge_vs_spread: float
    recommendation: str


@dataclass
class CatastrophicScenario:
    scenario: str
    probability: float
    affected_bets: list[str]
    hedge_strategy: str


# QB2 Database
QB2_DATABASE = {
    "KC": {"starter": "Patrick Mahomes", "backup": "Carson Wentz", "exp": 70, "rating": 84.5, "dropoff": 8.5},
    "BUF": {"starter": "Josh Allen", "backup": "Mitchell Trubisky", "exp": 50, "rating": 78.2, "dropoff": 12.0},
    "PHI": {"starter": "Jalen Hurts", "backup": "Kenny Pickett", "exp": 24, "rating": 72.5, "dropoff": 10.5},
    "SF": {"starter": "Brock Purdy", "backup": "Brandon Allen", "exp": 8, "rating": 68.5, "dropoff": 15.0},
    "DAL": {"starter": "Dak Prescott", "backup": "Cooper Rush", "exp": 12, "rating": 82.0, "dropoff": 6.5},
    "DET": {"starter": "Jared Goff", "backup": "Hendon Hooker", "exp": 2, "rating": 65.0, "dropoff": 18.0},
    "BAL": {"starter": "Lamar Jackson", "backup": "Josh Johnson", "exp": 15, "rating": 70.5, "dropoff": 20.0},
    "MIA": {"starter": "Tua Tagovailoa", "backup": "Mike White", "exp": 8, "rating": 75.5, "dropoff": 12.5},
    "CIN": {"starter": "Joe Burrow", "backup": "Jake Browning", "exp": 4, "rating": 82.5, "dropoff": 10.0},
    "NYJ": {"starter": "Aaron Rodgers", "backup": "Tyrod Taylor", "exp": 72, "rating": 80.0, "dropoff": 8.0},
}

# Special Teams Rankings
SPECIAL_TEAMS_DATA = {
    "BAL": {"punt_net": 44.2, "punt_rank": 2, "ret_dvoa": 4.5, "ret_rank": 5},
    "SF": {"punt_net": 43.8, "punt_rank": 5, "ret_dvoa": 6.2, "ret_rank": 3},
    "DAL": {"punt_net": 42.5, "punt_rank": 12, "ret_dvoa": -2.5, "ret_rank": 22},
    "KC": {"punt_net": 43.5, "punt_rank": 8, "ret_dvoa": 3.2, "ret_rank": 8},
    "DET": {"punt_net": 44.5, "punt_rank": 1, "ret_dvoa": 5.8, "ret_rank": 4},
    "BUF": {"punt_net": 42.0, "punt_rank": 18, "ret_dvoa": 1.5, "ret_rank": 12},
    "MIA": {"punt_net": 41.5, "punt_rank": 22, "ret_dvoa": 8.5, "ret_rank": 1},
    "PHI": {"punt_net": 43.0, "punt_rank": 10, "ret_dvoa": 2.8, "ret_rank": 10},
}


class BlackSwanEngine:
    """Catastrophic scenario planning and hidden edges"""
    
    def analyze_qb2_readiness(self, team: str) -> QB2Readiness:
        """Pre-calculate backup QB impact for live betting"""
        
        data = QB2_DATABASE.get(team, {
            "starter": "Unknown", "backup": "Unknown", 
            "exp": 0, "rating": 65.0, "dropoff": 20.0
        })
        
        # Determine readiness tier
        if data["dropoff"] <= 7:
            tier = "elite_backup"
            strategy = "Minimal live adjustment needed"
        elif data["dropoff"] <= 12:
            tier = "capable"
            strategy = "Reduce spread bet by 3 points mentally"
        elif data["dropoff"] <= 17:
            tier = "severe_dropoff"
            strategy = f"LIVE BET AGAINST {team} if starter exits"
        else:
            tier = "catastrophic"
            strategy = f"HAMMER OPPONENT immediately on starter injury"
        
        return QB2Readiness(
            starter=data["starter"],
            backup=data["backup"],
            backup_experience=data["exp"],
            backup_passer_rating=data["rating"],
            dropoff_rating=data["dropoff"],
            readiness_tier=tier,
            live_bet_strategy=strategy
        )
    
    def calculate_special_teams_edge(
        self,
        team: str,
        opponent: str
    ) -> SpecialTeamsEdge:
        """Calculate hidden yards advantage from special teams"""
        
        team_data = SPECIAL_TEAMS_DATA.get(team, {
            "punt_net": 42.0, "punt_rank": 16, "ret_dvoa": 0, "ret_rank": 16
        })
        opp_data = SPECIAL_TEAMS_DATA.get(opponent, {
            "punt_net": 42.0, "punt_rank": 16, "ret_dvoa": 0, "ret_rank": 16
        })
        
        # Calculate hidden yards differential
        punt_diff = team_data["punt_net"] - opp_data["punt_net"]
        ret_diff = (team_data["ret_dvoa"] - opp_data["ret_dvoa"]) * 0.5
        
        hidden_yards = punt_diff * 4 + ret_diff * 2  # ~4 punts per game
        
        # Convert to spread equivalent (~14 yards = 1 point)
        spread_edge = hidden_yards / 14
        
        if spread_edge > 1.5:
            rec = f"🎯 {team} has {spread_edge:.1f} pt hidden ST edge — bet spread"
        elif spread_edge > 0.7:
            rec = f"Moderate ST edge for {team} — factor into close spreads"
        elif spread_edge < -1.0:
            rec = f"⚠️ {team} giving up hidden yards — lean opponent"
        else:
            rec = "ST neutralizes — no edge"
        
        return SpecialTeamsEdge(
            team=team,
            punt_net_avg=team_data["punt_net"],
            punt_net_rank=team_data["punt_rank"],
            return_dvoa=team_data["ret_dvoa"],
            return_rank=team_data["ret_rank"],
            hidden_yards_per_game=round(hidden_yards, 1),
            edge_vs_spread=round(spread_edge, 2),
            recommendation=rec
        )
    
    def model_catastrophic_scenarios(
        self,
        game_id: str,
        home_team: str,
        away_team: str,
        current_spread: float,
        key_players: list[str]
    ) -> list[CatastrophicScenario]:
        """Pre-model black swan scenarios for live betting preparedness"""
        
        scenarios = []
        
        # Scenario 1: Star QB injury
        home_qb2 = self.analyze_qb2_readiness(home_team)
        away_qb2 = self.analyze_qb2_readiness(away_team)
        
        if home_qb2.dropoff_rating > 12:
            scenarios.append(CatastrophicScenario(
                scenario=f"{home_qb2.starter} exits game",
                probability=0.08,  # ~8% chance any game
                affected_bets=[
                    f"{home_team} spread becomes +{current_spread + home_qb2.dropoff_rating/2:.1f}",
                    f"Team total drops 4-6 points",
                    f"{home_team} ML odds should double"
                ],
                hedge_strategy=f"Have live bet on {away_team} ready at -3 to -7"
            ))
        
        # Scenario 2: Weather shift
        scenarios.append(CatastrophicScenario(
            scenario="Sudden weather deterioration",
            probability=0.05,
            affected_bets=[
                "Total should drop 3-5 points",
                "Passing props become overs",
                "Kicker props at risk"
            ],
            hedge_strategy="Monitor radar; have UNDER ready"
        ))
        
        # Scenario 3: Special teams disaster
        scenarios.append(CatastrophicScenario(
            scenario="Special teams TD/Turnover",
            probability=0.12,
            affected_bets=[
                "Can swing 7-14 points instantly",
                "Game script changes dramatically"
            ],
            hedge_strategy="Small live hedge opposite side after any ST score"
        ))
        
        # Scenario 4: Blowout develops
        scenarios.append(CatastrophicScenario(
            scenario="20+ point deficit by halftime",
            probability=0.10,
            affected_bets=[
                "2H totals should be lower",
                "Backup players enter",
                "Garbage time skews stats"
            ],
            hedge_strategy="Avoid 2H player props; bet 2H under"
        ))
        
        return scenarios
    
    def get_full_black_swan_report(
        self,
        home_team: str,
        away_team: str,
        spread: float
    ) -> dict:
        """Complete black swan analysis for game"""
        
        home_qb2 = self.analyze_qb2_readiness(home_team)
        away_qb2 = self.analyze_qb2_readiness(away_team)
        st_edge = self.calculate_special_teams_edge(home_team, away_team)
        scenarios = self.model_catastrophic_scenarios(
            "", home_team, away_team, spread, []
        )
        
        # Risk assessment
        risk_level = "LOW"
        if home_qb2.readiness_tier in ["catastrophic", "severe_dropoff"]:
            risk_level = "HIGH"
        elif away_qb2.readiness_tier in ["catastrophic", "severe_dropoff"]:
            risk_level = "HIGH"
        elif abs(st_edge.edge_vs_spread) > 1.5:
            risk_level = "MEDIUM"
        
        return {
            "home_qb2": home_qb2.__dict__,
            "away_qb2": away_qb2.__dict__,
            "special_teams": st_edge.__dict__,
            "catastrophic_scenarios": [s.__dict__ for s in scenarios],
            "overall_risk_level": risk_level,
            "live_bet_readiness": "PREPARED" if risk_level != "LOW" else "STANDARD"
        }
