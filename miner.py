"""
♾️ EDGELOOP DATA MINER
Orbital scan of ESPN's hidden NFL endpoint to extract live game data and market fractures
"""

import requests
import json
import random
import os
from datetime import datetime

# TARGET: The Undocumented ESPN Endpoint
# This is the same feed ESPN uses for their own scoreboard.
URL = "http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"

def fetch_live_data():
    print("INITIALIZING ORBITAL SCAN...")
    try:
        # Fake a browser to avoid getting blocked
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9"
        }
        
        response = requests.get(URL, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        processed_games = []

        for event in data.get('events', []):
            if not event.get('competitions'):
                continue
                
            competition = event['competitions'][0]
            
            # --- PARSE LIVE GAME STATE ---
            game_id = event['id']
            status_detail = event['status']['type']['shortDetail'] or event['status']['type']['name'] # e.g., "Final", "Q4 12:30"
            clock = event['status'].get('displayClock', '')
            period = event['status'].get('period', 0)
            
            # Competitors (Home/Away)
            competitors = competition.get('competitors', [])
            if len(competitors) < 2:
                continue
                
            # Find home and away teams
            team_h = None
            team_a = None
            for comp in competitors:
                if comp.get('homeAway') == 'home':
                    team_h = comp
                elif comp.get('homeAway') == 'away':
                    team_a = comp
            
            if not team_h or not team_a:
                # Fallback: first is home, second is away
                team_h = competitors[0]
                team_a = competitors[1] if len(competitors) > 1 else competitors[0]
            
            # --- PARSE ODDS (THE MARKET) ---
            # ESPN usually provides a "consensus" line in the first odds object
            odds_obj = competition.get('odds', [{}])[0] if competition.get('odds') else {}
            spread_raw = odds_obj.get('details', '') # e.g. "KC -3.0"
            
            # Extract the spread number for the Home Team
            market_spread = -3.5  # Default fallback
            try:
                if spread_raw:
                    # Parse "KC -3.0" or "-3.0" format
                    parts = spread_raw.split()
                    for part in parts:
                        try:
                            market_spread = float(part)
                            # Check if it's for home team (negative usually means home favored)
                            if team_h['team']['abbreviation'] not in spread_raw and market_spread < 0:
                                market_spread = -market_spread
                            break
                        except ValueError:
                            continue
            except:
                pass

            # --- SIMULATE EDGELOOP INTELLIGENCE (THE MODEL) ---
            # NOTE: Replace this section with your `nflverse` trained model later.
            # We generate a "Model Spread" that disagrees with the Market to show Exploits.
            
            # Create a deterministic "seed" from the game ID so the UI is consistent
            seed = int(str(game_id)[-2:]) if len(str(game_id)) >= 2 else int(game_id) % 100
            
            # Simulate Model Deviation
            model_variance = (seed / 100) * 6.0  # Model differs by up to 6 points
            if seed % 2 == 0:
                model_spread = market_spread + model_variance
            else:
                model_spread = market_spread - model_variance
            
            # Calculate Edge
            edge_prob = abs(model_spread - market_spread) * 2.5  # Approximate % edge
            
            # Detect Exploits
            velocity = "CRITICAL" if seed > 90 else "HIGH" if seed > 75 else "STABLE"
            fracture = True if seed > 85 else False  # Arbitrage detection

            # Get team colors
            home_color = team_h['team'].get('color', '000000')
            away_color = team_a['team'].get('color', 'FFFFFF')

            game_payload = {
                "id": str(game_id),
                "status": status_detail,
                "clock": clock,
                "period": period,
                "home": {
                    "abbr": team_h['team']['abbreviation'],
                    "name": team_h['team'].get('displayName', team_h['team'].get('name', '')),
                    "score": int(team_h.get('score', 0)) if team_h.get('score') else 0,
                    "color": home_color
                },
                "away": {
                    "abbr": team_a['team']['abbreviation'],
                    "name": team_a['team'].get('displayName', team_a['team'].get('name', '')),
                    "score": int(team_a.get('score', 0)) if team_a.get('score') else 0,
                    "color": away_color
                },
                "market": {
                    "spread": round(market_spread, 1),
                    "implied_prob": max(0, min(100, 50 + (market_spread * -2)))  # Rough conversion
                },
                "model": {
                    "spread": round(model_spread, 1),
                    "prob": max(0, min(100, 50 + (model_spread * -2))),
                    "edge": round(edge_prob, 1),
                    "velocity": velocity,
                    "is_fracture": fracture
                },
                "timestamp": datetime.now().isoformat()
            }
            processed_games.append(game_payload)

        # SAVE TO FILE (The Bridge to React)
        # Ensure public directory exists
        public_dir = os.path.join(os.path.dirname(__file__), 'public')
        os.makedirs(public_dir, exist_ok=True)
        
        output_path = os.path.join(public_dir, 'telemetry.json')
        with open(output_path, 'w') as f:
            json.dump({
                "games": processed_games,
                "updated_at": datetime.now().isoformat(),
                "count": len(processed_games)
            }, f, indent=2)
            
        print(f"[OK] DATA LINK ESTABLISHED. {len(processed_games)} TARGETS ACQUIRED.")
        print(f"[OK] Saved to {output_path}")
        return processed_games

    except requests.exceptions.RequestException as e:
        print(f"[ERROR] CONNECTION FAILURE: {e}")
        return []
    except Exception as e:
        print(f"[ERROR] PROCESSING ERROR: {e}")
        import traceback
        traceback.print_exc()
        return []

if __name__ == "__main__":
    fetch_live_data()
