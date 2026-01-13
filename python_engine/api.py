"""
NFL Singularity Supercomputer API
FastAPI-based REST API for ML predictions and analytics
"""
import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any

from .monte_carlo import MonteCarloEngine, result_to_dict
from .neural_predictor import NeuralPredictor, prediction_to_dict
from .correlation_matrix import CorrelationMatrixBuilder, correlation_result_to_dict
from .id_mapper import RosettaStone, team_mapping_to_dict, player_mapping_to_dict
from .kelly_staking import KellyStakingEngine, staking_result_to_dict

monte_carlo = MonteCarloEngine(iterations=100000)
neural_predictor = NeuralPredictor(hidden_layers=(128, 64, 32))
correlation_builder = CorrelationMatrixBuilder()
rosetta = RosettaStone()
kelly_engine = KellyStakingEngine(bankroll=10000.0, min_edge=0.03)

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
        
        if path == '/health':
            self._send_json({"status": "healthy", "engine": "singularity"})
        
        elif path == '/api/team':
            team_id = query.get('id', [''])[0] or query.get('abbr', [''])[0]
            team = rosetta.get_team(team_id)
            if team:
                self._send_json(team_mapping_to_dict(team))
            else:
                self._send_json({"error": "Team not found"}, 404)
        
        elif path == '/api/teams':
            teams = {abbr: team_mapping_to_dict(t) for abbr, t in rosetta.TEAM_MAPPINGS.items()}
            self._send_json(teams)
        
        else:
            self._send_json({"error": "Not found"}, 404)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed = urlparse(self.path)
        path = parsed.path
        
        try:
            body = self._parse_body()
        except json.JSONDecodeError:
            self._send_json({"error": "Invalid JSON"}, 400)
            return
        
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
        
        elif path == '/api/predict':
            result = neural_predictor.predict(body)
            self._send_json(prediction_to_dict(result))
        
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
        
        elif path == '/api/correlation':
            legs = body.get('legs', [])
            result = correlation_builder.build_matrix(legs)
            self._send_json(correlation_result_to_dict(result))
        
        elif path == '/api/sgm/fair-value':
            legs = body.get('legs', [])
            uncorrelated_odds = body.get('uncorrelated_odds', 5.0)
            result = correlation_builder.calculate_sgm_fair_value(legs, uncorrelated_odds)
            self._send_json(result)
        
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
        
        else:
            self._send_json({"error": "Not found"}, 404)
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

def run_server(port: int = 8000):
    """Run the Singularity API server"""
    server = HTTPServer(('0.0.0.0', port), SingularityHandler)
    print(f"Singularity Engine running on port {port}")
    server.serve_forever()

if __name__ == '__main__':
    port = int(os.environ.get('PYTHON_PORT', 8000))
    run_server(port)
