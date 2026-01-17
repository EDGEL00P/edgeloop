"""
CHAOS PHYSICS ENGINE — Granular Environmental Impact
=====================================================
Aerodynamic drag, surface friction, sun glare, wind shear modeling
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime
import math

# Stadium altitudes (feet above sea level)
STADIUM_ALTITUDES = {
    "DEN": 5280, "ARI": 1086, "KC": 889, "DAL": 630, "ATL": 1050,
    "LV": 2001, "SEA": 12, "SF": 0, "MIA": 6, "TB": 13, "GB": 634,
    "CHI": 594, "MIN": 815, "DET": 600, "CLE": 653, "PIT": 730,
    "CIN": 455, "BAL": 14, "PHI": 39, "NYG": 3, "NYJ": 3, "NE": 262,
    "BUF": 600, "IND": 717, "TEN": 597, "JAX": 16, "HOU": 50,
    "NO": 3, "CAR": 751, "WAS": 45, "LAR": 223, "LAC": 223,
}

TURF_DATA = {
    "FieldTurf": {"friction": 0.85, "injury_risk": 1.1, "cut_efficiency": 0.92},
    "Matrix Turf": {"friction": 0.82, "injury_risk": 1.15, "cut_efficiency": 0.90},
    "Natural Grass": {"friction": 0.75, "injury_risk": 0.9, "cut_efficiency": 0.95},
    "Bermuda": {"friction": 0.73, "injury_risk": 0.85, "cut_efficiency": 0.97},
}

STADIUM_ORIENTATIONS = {
    "KC": 135, "DAL": 90, "DEN": 0, "GB": 157, "CHI": 90,
    "PHI": 165, "LAR": 90, "LAC": 90, "BUF": 135, "NE": 90,
}


@dataclass
class AerodynamicConditions:
    air_density: float
    drag_coefficient: float
    distance_modifier: float
    fg_range_modifier: int
    deep_ball_modifier: float


@dataclass
class WindShearAnalysis:
    base_speed: float
    gust_factor: float
    is_crosswind: bool
    passing_over_impact: float
    kicking_impact: float
    recommendation: str


class ChaosPhysicsEngine:
    """Granular environmental impact modeling"""
    
    def calculate_air_density(self, temp_f: float, humidity: float, altitude_ft: float) -> float:
        temp_k = (temp_f - 32) * 5/9 + 273.15
        pressure_pa = 101325 * math.exp(-altitude_ft * 0.3048 / 8500)
        humidity_factor = 1 - (humidity / 100) * 0.025
        return round((pressure_pa / (287.05 * temp_k)) * humidity_factor, 4)
    
    def get_aerodynamic_impact(self, stadium: str, temp_f: float, humidity: float) -> AerodynamicConditions:
        altitude = STADIUM_ALTITUDES.get(stadium, 500)
        density = self.calculate_air_density(temp_f, humidity, altitude)
        ref_density = 1.184
        ratio = density / ref_density
        
        return AerodynamicConditions(
            air_density=density,
            drag_coefficient=round(0.05 * ratio, 4),
            distance_modifier=round((1 - ratio) * 100, 1),
            fg_range_modifier=int((1 - ratio) * 15),
            deep_ball_modifier=round(1 + (1 - ratio) * 0.08, 3)
        )
    
    def analyze_wind_shear(self, wind_speed: float, direction: str, gust: float = None, stadium: str = None) -> WindShearAnalysis:
        gust = gust or wind_speed
        gust_factor = gust / wind_speed if wind_speed > 0 else 1.0
        
        dir_map = {"N": 0, "NE": 45, "E": 90, "SE": 135, "S": 180, "SW": 225, "W": 270, "NW": 315}
        wind_deg = dir_map.get(direction, 0)
        stadium_orient = STADIUM_ORIENTATIONS.get(stadium, 90)
        angle_diff = abs(wind_deg - stadium_orient)
        is_crosswind = 30 <= (angle_diff if angle_diff <= 180 else 360 - angle_diff) <= 150
        
        base = min(wind_speed / 30, 1.0)
        
        if is_crosswind and gust_factor > 1.3:
            return WindShearAnalysis(wind_speed, round(gust_factor, 2), True,
                round(base * 150, 1), round(base * 200, 1), "HAMMER UNDER | Fade All Kickers")
        elif is_crosswind:
            return WindShearAnalysis(wind_speed, round(gust_factor, 2), True,
                round(base * 120, 1), round(base * 150, 1), "LEAN UNDER | Kicker Caution")
        else:
            return WindShearAnalysis(wind_speed, round(gust_factor, 2), False,
                round(base * 70, 1), round(base * 80, 1), "Wind Manageable")
