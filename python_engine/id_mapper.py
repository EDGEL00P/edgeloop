"""
Rosetta Stone ID Mapper
5ms unified ID lookup across multiple data sources
BallDontLie <-> GSIS <-> Sleeper <-> ESPN <-> PFR
"""
import httpx
from typing import Dict, Optional, List
from dataclasses import dataclass
import json
from pathlib import Path

@dataclass
class PlayerMapping:
    name: str
    bdl_id: Optional[str] = None
    gsis_id: Optional[str] = None
    sleeper_id: Optional[str] = None
    espn_id: Optional[str] = None
    pfr_id: Optional[str] = None
    team: Optional[str] = None
    position: Optional[str] = None

@dataclass
class TeamMapping:
    name: str
    full_name: str
    abbreviation: str
    bdl_id: Optional[int] = None
    espn_id: Optional[int] = None
    pfr_abbr: Optional[str] = None

class RosettaStone:
    """Unified ID mapping system for NFL data sources"""
    
    TEAM_MAPPINGS: Dict[str, TeamMapping] = {
        "ARI": TeamMapping("Cardinals", "Arizona Cardinals", "ARI", 33, 22, "crd"),
        "ATL": TeamMapping("Falcons", "Atlanta Falcons", "ATL", 27, 1, "atl"),
        "BAL": TeamMapping("Ravens", "Baltimore Ravens", "BAL", 6, 33, "rav"),
        "BUF": TeamMapping("Bills", "Buffalo Bills", "BUF", 3, 2, "buf"),
        "CAR": TeamMapping("Panthers", "Carolina Panthers", "CAR", 29, 29, "car"),
        "CHI": TeamMapping("Bears", "Chicago Bears", "CHI", 24, 3, "chi"),
        "CIN": TeamMapping("Bengals", "Cincinnati Bengals", "CIN", 9, 4, "cin"),
        "CLE": TeamMapping("Browns", "Cleveland Browns", "CLE", 8, 5, "cle"),
        "DAL": TeamMapping("Cowboys", "Dallas Cowboys", "DAL", 19, 6, "dal"),
        "DEN": TeamMapping("Broncos", "Denver Broncos", "DEN", 15, 7, "den"),
        "DET": TeamMapping("Lions", "Detroit Lions", "DET", 25, 8, "det"),
        "GB": TeamMapping("Packers", "Green Bay Packers", "GB", 22, 9, "gnb"),
        "HOU": TeamMapping("Texans", "Houston Texans", "HOU", 10, 34, "htx"),
        "IND": TeamMapping("Colts", "Indianapolis Colts", "IND", 12, 11, "clt"),
        "JAX": TeamMapping("Jaguars", "Jacksonville Jaguars", "JAX", 13, 30, "jax"),
        "KC": TeamMapping("Chiefs", "Kansas City Chiefs", "KC", 14, 12, "kan"),
        "LV": TeamMapping("Raiders", "Las Vegas Raiders", "LV", 16, 13, "rai"),
        "LAC": TeamMapping("Chargers", "Los Angeles Chargers", "LAC", 17, 24, "sdg"),
        "LAR": TeamMapping("Rams", "Los Angeles Rams", "LAR", 32, 14, "ram"),
        "MIA": TeamMapping("Dolphins", "Miami Dolphins", "MIA", 5, 15, "mia"),
        "MIN": TeamMapping("Vikings", "Minnesota Vikings", "MIN", 23, 16, "min"),
        "NE": TeamMapping("Patriots", "New England Patriots", "NE", 1, 17, "nwe"),
        "NO": TeamMapping("Saints", "New Orleans Saints", "NO", 26, 18, "nor"),
        "NYG": TeamMapping("Giants", "New York Giants", "NYG", 20, 19, "nyg"),
        "NYJ": TeamMapping("Jets", "New York Jets", "NYJ", 4, 20, "nyj"),
        "PHI": TeamMapping("Eagles", "Philadelphia Eagles", "PHI", 18, 21, "phi"),
        "PIT": TeamMapping("Steelers", "Pittsburgh Steelers", "PIT", 7, 23, "pit"),
        "SF": TeamMapping("49ers", "San Francisco 49ers", "SF", 30, 25, "sfo"),
        "SEA": TeamMapping("Seahawks", "Seattle Seahawks", "SEA", 31, 26, "sea"),
        "TB": TeamMapping("Buccaneers", "Tampa Bay Buccaneers", "TB", 28, 27, "tam"),
        "TEN": TeamMapping("Titans", "Tennessee Titans", "TEN", 11, 10, "oti"),
        "WAS": TeamMapping("Commanders", "Washington Commanders", "WAS", 21, 28, "was"),
    }
    
    def __init__(self, cache_path: str = "python_engine/data/id_cache.json"):
        self.cache_path = Path(cache_path)
        self.player_cache: Dict[str, PlayerMapping] = {}
        self._load_cache()
    
    def _load_cache(self):
        """Load cached player mappings"""
        if self.cache_path.exists():
            try:
                with open(self.cache_path) as f:
                    data = json.load(f)
                    for name, mapping in data.items():
                        self.player_cache[name.lower()] = PlayerMapping(**mapping)
            except Exception:
                pass
    
    def _save_cache(self):
        """Save player mappings to cache"""
        self.cache_path.parent.mkdir(parents=True, exist_ok=True)
        data = {}
        for name, mapping in self.player_cache.items():
            data[name] = {
                "name": mapping.name,
                "bdl_id": mapping.bdl_id,
                "gsis_id": mapping.gsis_id,
                "sleeper_id": mapping.sleeper_id,
                "espn_id": mapping.espn_id,
                "pfr_id": mapping.pfr_id,
                "team": mapping.team,
                "position": mapping.position
            }
        with open(self.cache_path, 'w') as f:
            json.dump(data, f)
    
    def get_team(self, identifier: str) -> Optional[TeamMapping]:
        """Get team by any identifier (abbreviation, name, or ID)"""
        identifier_upper = identifier.upper()
        
        if identifier_upper in self.TEAM_MAPPINGS:
            return self.TEAM_MAPPINGS[identifier_upper]
        
        for abbr, team in self.TEAM_MAPPINGS.items():
            if (team.name.upper() == identifier_upper or 
                team.full_name.upper() == identifier_upper):
                return team
            try:
                if team.bdl_id == int(identifier):
                    return team
            except ValueError:
                pass
        
        return None
    
    def bdl_to_gsis(self, bdl_id: str) -> Optional[str]:
        """Convert BallDontLie ID to GSIS ID"""
        for mapping in self.player_cache.values():
            if mapping.bdl_id == bdl_id:
                return mapping.gsis_id
        return None
    
    def gsis_to_bdl(self, gsis_id: str) -> Optional[str]:
        """Convert GSIS ID to BallDontLie ID"""
        for mapping in self.player_cache.values():
            if mapping.gsis_id == gsis_id:
                return mapping.bdl_id
        return None
    
    def find_player(self, name: str) -> Optional[PlayerMapping]:
        """Find player by name (fuzzy match)"""
        name_lower = name.lower().strip()
        
        if name_lower in self.player_cache:
            return self.player_cache[name_lower]
        
        for cached_name, mapping in self.player_cache.items():
            if name_lower in cached_name or cached_name in name_lower:
                return mapping
        
        return None
    
    def register_player(
        self,
        name: str,
        bdl_id: Optional[str] = None,
        gsis_id: Optional[str] = None,
        sleeper_id: Optional[str] = None,
        espn_id: Optional[str] = None,
        team: Optional[str] = None,
        position: Optional[str] = None
    ) -> PlayerMapping:
        """Register a new player mapping"""
        mapping = PlayerMapping(
            name=name,
            bdl_id=bdl_id,
            gsis_id=gsis_id,
            sleeper_id=sleeper_id,
            espn_id=espn_id,
            team=team,
            position=position
        )
        self.player_cache[name.lower()] = mapping
        self._save_cache()
        return mapping
    
    def get_all_team_ids(self, source: str = "bdl") -> Dict[str, int]:
        """Get all team IDs for a specific source"""
        result = {}
        for abbr, team in self.TEAM_MAPPINGS.items():
            if source == "bdl" and team.bdl_id:
                result[abbr] = team.bdl_id
            elif source == "espn" and team.espn_id:
                result[abbr] = team.espn_id
        return result

def team_mapping_to_dict(mapping: TeamMapping) -> Dict:
    """Convert TeamMapping to dict"""
    return {
        "name": mapping.name,
        "full_name": mapping.full_name,
        "abbreviation": mapping.abbreviation,
        "bdl_id": mapping.bdl_id,
        "espn_id": mapping.espn_id,
        "pfr_abbr": mapping.pfr_abbr
    }

def player_mapping_to_dict(mapping: PlayerMapping) -> Dict:
    """Convert PlayerMapping to dict"""
    return {
        "name": mapping.name,
        "bdl_id": mapping.bdl_id,
        "gsis_id": mapping.gsis_id,
        "sleeper_id": mapping.sleeper_id,
        "espn_id": mapping.espn_id,
        "pfr_id": mapping.pfr_id,
        "team": mapping.team,
        "position": mapping.position
    }
