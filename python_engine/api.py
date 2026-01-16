"""
NFL Singularity Supercomputer API
FastAPI-based REST API for ML predictions and analytics

Integrates:
- Unified Data Engine (nflverse + BallDontLie)
- Monte Carlo simulations
- Neural network predictions
- Correlation analysis for SGM
- Kelly staking calculations
"""
import os
import json
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, Optional
from dataclasses import asdict

# Core analytics
from .monte_carlo import MonteCarloEngine, result_to_dict
from .neural_predictor import NeuralPredictor, prediction_to_dict
from .correlation_matrix import CorrelationMatrixBuilder, correlation_result_to_dict
from .id_mapper import RosettaStone, team_mapping_to_dict, player_mapping_to_dict
from .kelly_staking import KellyStakingEngine, staking_result_to_dict

# Data engine
from .unified_data_engine import get_data_engine, UnifiedDataEngine

logger = logging.getLogger(__name__)

# Initialize engines
monte_carlo = MonteCarloEngine(iterations=100000)
neural_predictor = NeuralPredictor(hidden_layers=(128, 64, 32))
correlation_builder = CorrelationMatrixBuilder()
rosetta = RosettaStone()
kelly_engine = KellyStakingEngine(bankroll=10000.0, min_edge=0.03)


def get_engine() -> UnifiedDataEngine:
    """Get the singleton data engine instance."""
    return get_data_engine()


def team_analytics_to_dict(analytics) -> Dict[str, Any]:
    """Convert TeamAnalytics to dict."""
    return {
        "team_id": analytics.team_id,
        "team_abbr": analytics.team_abbr,
        "team_name": analytics.team_name,
        "season": analytics.season,
        "week": analytics.week,
        "epa_per_play": analytics.epa_per_play,
        "pass_epa": analytics.pass_epa,
        "rush_epa": analytics.rush_epa,
        "def_epa_allowed": analytics.def_epa_allowed,
        "success_rate": analytics.success_rate,
        "cpoe": analytics.cpoe,
        "wins": analytics.wins,
        "losses": analytics.losses,
        "point_differential": analytics.point_differential,
    }


def game_analytics_to_dict(analytics) -> Dict[str, Any]:
    """Convert GameAnalytics to dict."""
    return {
        "game_id": analytics.game_id,
        "season": analytics.season,
        "week": analytics.week,
        "home_team": team_analytics_to_dict(analytics.home_team),
        "away_team": team_analytics_to_dict(analytics.away_team),
        "predictions": {
            "spread": analytics.predicted_spread,
            "total": analytics.predicted_total,
            "home_win_probability": analytics.home_win_probability,
        },
        "market": {
            "current_spread": analytics.current_spread,
            "current_total": analytics.current_total,
            "spread_edge": analytics.spread_edge,
            "total_edge": analytics.total_edge,
        },
    }


class SingularityHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for Singularity API"""
    
    def _send_json(self, data, status: int = 200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def _parse_body(self) -> Dict:
        """Parse JSON request body"""
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length:
            body = self.rfile.read(content_length)
            return json.loads(body.decode())
        return {}
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        
        try:
            if path == '/health':
                self._send_json({
                    "status": "healthy",
                    "engine": "singularity",
                    "version": "2.0.0",
                    "vectors": ["physics", "schematic", "efficiency", "trench", "context", "market"],
                })
            
            # ─────────────────────────────────────────────────────────────────
            # TEAM ENDPOINTS
            # ─────────────────────────────────────────────────────────────────
            
            elif path == '/api/team':
                team_id = query.get('id', [''])[0] or query.get('abbr', [''])[0]
                team = rosetta.get_team(team_id)
                if team:
                    self._send_json(team_mapping_to_dict(team))
                else:
                    self._send_json({"error": "Team not found"}, 404)
            
            elif path == '/api/teams':
                # Get teams from BallDontLie
                engine = get_engine()
                teams = engine.get_teams()
                result = []
                for t in teams:
                    result.append({
                        "id": t.id,
                        "abbreviation": t.abbreviation,
                        "name": t.name,
                        "full_name": t.full_name,
                        "location": t.location,
                        "conference": t.conference,
                        "division": t.division,
                    })
                self._send_json(result)
            
            elif path == '/api/team/analytics':
                team_abbr = query.get('abbr', [''])[0]
                season = int(query.get('season', ['2025'])[0])
                week = query.get('week', [None])[0]
                week = int(week) if week else None
                
                if not team_abbr:
                    self._send_json({"error": "abbr parameter required"}, 400)
                    return
                
                engine = get_engine()
                analytics = engine.build_team_analytics(team_abbr, season, week)
                
                if analytics:
                    self._send_json(team_analytics_to_dict(analytics))
                else:
                    self._send_json({"error": "Team not found"}, 404)
            
            elif path == '/api/team/roster':
                team_id = query.get('id', [''])[0]
                if not team_id:
                    self._send_json({"error": "id parameter required"}, 400)
                    return
                
                engine = get_engine()
                roster = engine.get_team_roster(int(team_id))
                self._send_json(roster.to_dicts() if roster.height > 0 else [])
            
            # ─────────────────────────────────────────────────────────────────
            # GAME ENDPOINTS
            # ─────────────────────────────────────────────────────────────────
            
            elif path == '/api/games':
                season = int(query.get('season', ['2025'])[0])
                week = query.get('week', [None])[0]
                week = int(week) if week else None
                
                engine = get_engine()
                if week:
                    games = engine.get_current_week_games(season, week)
                    result = []
                    for g in games:
                        result.append({
                            "id": g.id,
                            "date": g.date,
                            "season": g.season,
                            "week": g.week,
                            "status": g.status,
                            "home_team": {
                                "id": g.home_team.id,
                                "abbreviation": g.home_team.abbreviation,
                                "name": g.home_team.full_name,
                            },
                            "away_team": {
                                "id": g.visitor_team.id,
                                "abbreviation": g.visitor_team.abbreviation,
                                "name": g.visitor_team.full_name,
                            },
                            "home_score": g.home_team_score,
                            "away_score": g.visitor_team_score,
                        })
                    self._send_json(result)
                else:
                    self._send_json({"error": "week parameter required"}, 400)
            
            elif path == '/api/game/analytics':
                game_id = query.get('id', [''])[0]
                season = int(query.get('season', ['2025'])[0])
                week = int(query.get('week', ['1'])[0])
                
                if not game_id:
                    self._send_json({"error": "id parameter required"}, 400)
                    return
                
                engine = get_engine()
                analytics = engine.build_game_analytics(int(game_id), season, week)
                
                if analytics:
                    self._send_json(game_analytics_to_dict(analytics))
                else:
                    self._send_json({"error": "Game not found"}, 404)
            
            elif path == '/api/week/preview':
                season = int(query.get('season', ['2025'])[0])
                week = int(query.get('week', ['1'])[0])
                
                engine = get_engine()
                previews = engine.get_week_preview(season, week)
                
                self._send_json([game_analytics_to_dict(p) for p in previews])
            
            # ─────────────────────────────────────────────────────────────────
            # STANDINGS / HISTORICAL
            # ─────────────────────────────────────────────────────────────────
            
            elif path == '/api/standings':
                season = int(query.get('season', ['2025'])[0])
                
                engine = get_engine()
                standings = engine.get_standings(season)
                self._send_json(standings.to_dicts() if standings.height > 0 else [])
            
            elif path == '/api/players/search':
                query_str = query.get('q', [''])[0]
                if not query_str:
                    self._send_json({"error": "q parameter required"}, 400)
                    return
                
                engine = get_engine()
                players = engine.search_player(query_str)
                result = []
                for p in players:
                    result.append({
                        "id": p.id,
                        "first_name": p.first_name,
                        "last_name": p.last_name,
                        "position": p.position,
                        "team": p.team.abbreviation if p.team else None,
                    })
                self._send_json(result)
            
            # ─────────────────────────────────────────────────────────────────
            # ANALYTICS / VECTORS
            # ─────────────────────────────────────────────────────────────────
            
            elif path == '/api/vectors':
                from .unified_data_engine import VECTOR_CONFIGS
                result = {}
                for key, config in VECTOR_CONFIGS.items():
                    result[key] = {
                        "name": config.name,
                        "description": config.description,
                        "sources": config.sources,
                        "refresh_interval_hours": config.refresh_interval_hours,
                        "priority": config.priority,
                    }
                self._send_json(result)
            
            elif path == '/api/ngs/passing':
                engine = get_engine()
                ngs = engine.get_next_gen_stats("passing")
                if ngs is not None:
                    # Return top 50 records
                    self._send_json(ngs.head(50).to_dicts())
                else:
                    self._send_json([])
            
            elif path == '/api/ngs/rushing':
                engine = get_engine()
                ngs = engine.get_next_gen_stats("rushing")
                if ngs is not None:
                    self._send_json(ngs.head(50).to_dicts())
                else:
                    self._send_json([])
            
            elif path == '/api/ngs/receiving':
                engine = get_engine()
                ngs = engine.get_next_gen_stats("receiving")
                if ngs is not None:
                    self._send_json(ngs.head(50).to_dicts())
                else:
                    self._send_json([])
            
            else:
                self._send_json({"error": "Not found"}, 404)
        
        except Exception as e:
            logger.error(f"Error handling GET {path}: {e}")
            self._send_json({"error": str(e)}, 500)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed = urlparse(self.path)
        path = parsed.path
        
        try:
            body = self._parse_body()
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON"}, 400)
            return
        
        try:
            # ─────────────────────────────────────────────────────────────────
            # SIMULATION ENDPOINTS
            # ─────────────────────────────────────────────────────────────────
            
            if path == '/api/simulate':
                result = monte_carlo.simulate_game(
                    home_mean=body.get('home_mean', 24),
                    away_mean=body.get('away_mean', 21),
                    home_std=body.get('home_std', 10),
                    away_std=body.get('away_std', 10),
                    correlation=body.get('correlation', 0.15),
                    spread=body.get('spread', 0),
                    total_line=body.get('total_line', 45)
                )
                self._send_json(result_to_dict(result))
            
            elif path == '/api/simulate/batch':
                games = body.get('games', [])
                results = monte_carlo.simulate_batch(games)
                self._send_json([result_to_dict(r) for r in results])
            
            elif path == '/api/simulate/game':
                # Simulate a specific game with EPA data
                game_id = body.get('game_id')
                season = body.get('season', 2025)
                week = body.get('week', 1)
                
                if not game_id:
                    self._send_json({"error": "game_id required"}, 400)
                    return
                
                engine = get_engine()
                analytics = engine.build_game_analytics(game_id, season, week)
                
                if not analytics:
                    self._send_json({"error": "Game not found"}, 404)
                    return
                
                # Calculate expected points from EPA
                home_mean = 24 + analytics.home_team.epa_per_play * 100
                away_mean = 24 + analytics.away_team.epa_per_play * 100
                
                result = monte_carlo.simulate_game(
                    home_mean=home_mean,
                    away_mean=away_mean,
                    home_std=10,
                    away_std=10,
                    correlation=0.15,
                    spread=body.get('spread', analytics.predicted_spread or 0),
                    total_line=body.get('total', analytics.predicted_total or 45)
                )
                
                response = result_to_dict(result)
                response["game_analytics"] = game_analytics_to_dict(analytics)
                self._send_json(response)
            
            # ─────────────────────────────────────────────────────────────────
            # PREDICTION ENDPOINTS
            # ─────────────────────────────────────────────────────────────────
            
            elif path == '/api/predict':
                result = neural_predictor.predict(body)
                self._send_json(prediction_to_dict(result))
            
            elif path == '/api/predict/player':
                player_name = body.get('player_name')
                stat_type = body.get('stat_type', 'passing_yards')
                line = body.get('line', 250)
                
                if not player_name:
                    self._send_json({"error": "player_name required"}, 400)
                    return
                
                # Use neural predictor with player context
                features = body.copy()
                result = neural_predictor.predict(features)
                
                response = prediction_to_dict(result)
                response["player_name"] = player_name
                response["stat_type"] = stat_type
                response["line"] = line
                
                self._send_json(response)
            
            # ─────────────────────────────────────────────────────────────────
            # EV / KELLY ENDPOINTS
            # ─────────────────────────────────────────────────────────────────
            
            elif path == '/api/ev':
                ev = monte_carlo.calculate_ev(
                    win_prob=body.get('win_prob', 0.5),
                    decimal_odds=body.get('decimal_odds', 1.91),
                    stake=body.get('stake', 100)
                )
                self._send_json(ev)
            
            elif path == '/api/kelly':
                result = kelly_engine.calculate_kelly(
                    true_probability=body.get('true_probability', 0.5),
                    decimal_odds=body.get('decimal_odds', 1.91),
                    confidence=body.get('confidence', 1.0)
                )
                self._send_json(staking_result_to_dict(result))
            
            elif path == '/api/kelly/multi':
                bets = body.get('bets', [])
                result = kelly_engine.multi_bet_kelly(bets)
                self._send_json(result)
            
            # ─────────────────────────────────────────────────────────────────
            # CORRELATION / SGM ENDPOINTS
            # ─────────────────────────────────────────────────────────────────
            
            elif path == '/api/correlation':
                legs = body.get('legs', [])
                result = correlation_builder.build_matrix(legs)
                self._send_json(correlation_result_to_dict(result))
            
            elif path == '/api/sgm/fair-value':
                legs = body.get('legs', [])
                uncorrelated_odds = body.get('uncorrelated_odds', 5.0)
                result = correlation_builder.calculate_sgm_fair_value(legs, uncorrelated_odds)
                self._send_json(result)
            
            elif path == '/api/sgm/builder':
                # Build an SGM with optimal leg selection
                game_id = body.get('game_id')
                target_odds = body.get('target_odds', 5.0)
                max_legs = body.get('max_legs', 4)
                
                # Placeholder - would use correlation matrix to optimize
                self._send_json({
                    "game_id": game_id,
                    "target_odds": target_odds,
                    "max_legs": max_legs,
                    "recommended_legs": [],
                    "fair_odds": target_odds,
                    "edge": 0.0,
                })
            
            # ─────────────────────────────────────────────────────────────────
            # POISSON / DISTRIBUTION ENDPOINTS
            # ─────────────────────────────────────────────────────────────────
            
            elif path == '/api/poisson':
                matrix = monte_carlo.poisson_matrix(
                    home_lambda=body.get('home_lambda', 24),
                    away_lambda=body.get('away_lambda', 21),
                    max_goals=body.get('max_score', 50)
                )
                self._send_json({
                    "matrix": matrix.tolist(),
                    "home_lambda": body.get('home_lambda', 24),
                    "away_lambda": body.get('away_lambda', 21)
                })
            
            # ─────────────────────────────────────────────────────────────────
            # DATA FETCH ENDPOINTS
            # ─────────────────────────────────────────────────────────────────
            
            elif path == '/api/data/fetch-historical':
                start_season = body.get('start_season', 2020)
                end_season = body.get('end_season', 2025)
                
                engine = get_engine()
                results = engine.fetch_historical_data(start_season, end_season)
                
                self._send_json({
                    "status": "completed",
                    "results": results,
                })
            
            elif path == '/api/data/pbp':
                season = body.get('season', 2025)
                
                engine = get_engine()
                pbp = engine.get_play_by_play(season)
                
                if pbp is not None:
                    # Return summary, not full data
                    self._send_json({
                        "season": season,
                        "total_plays": pbp.height,
                        "columns": pbp.columns,
                        "sample": pbp.head(10).to_dicts(),
                    })
                else:
                    self._send_json({"error": "No PBP data"}, 404)
            
            else:
                self._send_json({"error": "Not found"}, 404)
        
        except Exception as e:
            logger.error(f"Error handling POST {path}: {e}")
            self._send_json({"error": str(e)}, 500)
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass


def run_server(port: int = 8000):
    """Run the Singularity API server"""
    server = HTTPServer(('0.0.0.0', port), SingularityHandler)
    print(f"⚡ Singularity Engine v2.0 running on port {port}")
    print(f"📊 Data Vectors: Physics | Schematic | Efficiency | Trench | Context | Market")
    server.serve_forever()


if __name__ == '__main__':
    port = int(os.environ.get('PYTHON_PORT', 8000))
    run_server(port)
