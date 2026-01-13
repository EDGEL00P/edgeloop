"""
Neural Network Prediction Engine
MLP-based predictor for game outcomes using EPA, air yards, success rate vectors
"""
import numpy as np
import joblib
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from sklearn.neural_network import MLPRegressor, MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from dataclasses import dataclass

@dataclass
class PredictionResult:
    home_score: float
    away_score: float
    spread_prediction: float
    total_prediction: float
    home_win_prob: float
    confidence: float
    feature_contributions: Dict[str, float]

class NeuralPredictor:
    def __init__(self, hidden_layers: Tuple[int, ...] = (128, 64, 32)):
        self.hidden_layers = hidden_layers
        self.score_model: Optional[MLPRegressor] = None
        self.win_model: Optional[MLPClassifier] = None
        self.scaler = StandardScaler()
        self.feature_names: List[str] = []
        self.is_fitted = False
    
    def _build_features(self, game_data: Dict) -> np.ndarray:
        """Extract feature vector from game data"""
        features = [
            game_data.get('home_epa_play', 0.0),
            game_data.get('away_epa_play', 0.0),
            game_data.get('home_success_rate', 0.45),
            game_data.get('away_success_rate', 0.45),
            game_data.get('home_cpoe', 0.0),
            game_data.get('away_cpoe', 0.0),
            game_data.get('home_red_zone_eff', 0.55),
            game_data.get('away_red_zone_eff', 0.55),
            game_data.get('home_turnover_margin', 0.0),
            game_data.get('away_turnover_margin', 0.0),
            game_data.get('home_pressure_rate', 0.25),
            game_data.get('away_pressure_rate', 0.25),
            game_data.get('home_yards_per_play', 5.5),
            game_data.get('away_yards_per_play', 5.5),
            game_data.get('home_third_down_rate', 0.40),
            game_data.get('away_third_down_rate', 0.40),
            game_data.get('spread', 0.0),
            game_data.get('total_line', 45.0),
            game_data.get('home_rest_days', 7),
            game_data.get('away_rest_days', 7),
            1.0 if game_data.get('dome', False) else 0.0,
            game_data.get('temperature', 65.0),
            game_data.get('wind_speed', 5.0),
        ]
        
        self.feature_names = [
            'home_epa_play', 'away_epa_play', 'home_success_rate', 'away_success_rate',
            'home_cpoe', 'away_cpoe', 'home_red_zone_eff', 'away_red_zone_eff',
            'home_turnover_margin', 'away_turnover_margin', 'home_pressure_rate', 'away_pressure_rate',
            'home_yards_per_play', 'away_yards_per_play', 'home_third_down_rate', 'away_third_down_rate',
            'spread', 'total_line', 'home_rest_days', 'away_rest_days',
            'is_dome', 'temperature', 'wind_speed'
        ]
        
        return np.array(features).reshape(1, -1)
    
    def train(self, X: np.ndarray, y_scores: np.ndarray, y_wins: np.ndarray) -> Dict:
        """Train both score prediction and win probability models"""
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        
        self.score_model = MLPRegressor(
            hidden_layer_sizes=self.hidden_layers,
            activation='relu',
            solver='adam',
            alpha=0.001,
            max_iter=1000,
            early_stopping=True,
            validation_fraction=0.1,
            random_state=42
        )
        self.score_model.fit(X_scaled, y_scores)
        
        self.win_model = MLPClassifier(
            hidden_layer_sizes=self.hidden_layers,
            activation='relu',
            solver='adam',
            alpha=0.001,
            max_iter=1000,
            early_stopping=True,
            validation_fraction=0.1,
            random_state=42
        )
        self.win_model.fit(X_scaled, y_wins)
        
        self.is_fitted = True
        
        score_cv = cross_val_score(self.score_model, X_scaled, y_scores, cv=5, scoring='r2')
        win_cv = cross_val_score(self.win_model, X_scaled, y_wins, cv=5, scoring='accuracy')
        
        return {
            "score_r2_mean": float(np.mean(score_cv)),
            "score_r2_std": float(np.std(score_cv)),
            "win_accuracy_mean": float(np.mean(win_cv)),
            "win_accuracy_std": float(np.std(win_cv)),
            "samples_trained": len(X)
        }
    
    def predict(self, game_data: Dict) -> PredictionResult:
        """Predict game outcome"""
        X = self._build_features(game_data)
        
        if self.is_fitted and self.score_model is not None and self.win_model is not None:
            X_scaled = self.scaler.transform(X)
            scores = self.score_model.predict(X_scaled)[0]
            home_score, away_score = scores[0], scores[1]
            win_proba = self.win_model.predict_proba(X_scaled)[0]
            home_win_prob = win_proba[1] if len(win_proba) > 1 else 0.5
            confidence = max(win_proba) if len(win_proba) > 1 else 0.5
        else:
            home_base = 24 + game_data.get('home_epa_play', 0) * 3
            away_base = 21 + game_data.get('away_epa_play', 0) * 3
            spread = game_data.get('spread', 0)
            home_score = home_base - spread * 0.3
            away_score = away_base + spread * 0.3
            home_win_prob = 0.5 + (home_score - away_score) * 0.02
            home_win_prob = max(0.1, min(0.9, home_win_prob))
            confidence = 0.5 + abs(home_score - away_score) * 0.01
        
        feature_contributions = self._calculate_contributions(game_data)
        
        return PredictionResult(
            home_score=float(home_score),
            away_score=float(away_score),
            spread_prediction=float(home_score - away_score),
            total_prediction=float(home_score + away_score),
            home_win_prob=float(home_win_prob),
            confidence=float(min(0.95, confidence)),
            feature_contributions=feature_contributions
        )
    
    def _calculate_contributions(self, game_data: Dict) -> Dict[str, float]:
        """Calculate feature contributions to prediction (simple importance)"""
        contributions = {}
        home_epa = float(game_data.get('home_epa_play', 0) or 0)
        away_epa = float(game_data.get('away_epa_play', 0) or 0)
        epa_diff = home_epa - away_epa
        contributions['epa_advantage'] = epa_diff * 0.3
        
        cpoe_diff = game_data.get('home_cpoe', 0) - game_data.get('away_cpoe', 0)
        contributions['passing_efficiency'] = cpoe_diff * 0.2
        
        rz_diff = game_data.get('home_red_zone_eff', 0.55) - game_data.get('away_red_zone_eff', 0.55)
        contributions['red_zone_edge'] = rz_diff * 0.25
        
        to_diff = game_data.get('home_turnover_margin', 0) - game_data.get('away_turnover_margin', 0)
        contributions['turnover_edge'] = to_diff * 0.15
        
        if game_data.get('wind_speed', 0) > 15:
            contributions['weather_impact'] = -0.1
        else:
            contributions['weather_impact'] = 0.0
        
        return contributions
    
    def save(self, path: str):
        """Save model to disk"""
        Path(path).mkdir(parents=True, exist_ok=True)
        if self.score_model:
            joblib.dump(self.score_model, f"{path}/score_model.joblib")
        if self.win_model:
            joblib.dump(self.win_model, f"{path}/win_model.joblib")
        joblib.dump(self.scaler, f"{path}/scaler.joblib")
    
    def load(self, path: str) -> bool:
        """Load model from disk"""
        try:
            self.score_model = joblib.load(f"{path}/score_model.joblib")
            self.win_model = joblib.load(f"{path}/win_model.joblib")
            self.scaler = joblib.load(f"{path}/scaler.joblib")
            self.is_fitted = True
            return True
        except Exception:
            return False

def prediction_to_dict(result: PredictionResult) -> Dict:
    """Convert PredictionResult to JSON-serializable dict"""
    return {
        "home_score": round(result.home_score, 1),
        "away_score": round(result.away_score, 1),
        "spread_prediction": round(result.spread_prediction, 1),
        "total_prediction": round(result.total_prediction, 1),
        "home_win_prob": round(result.home_win_prob, 4),
        "confidence": round(result.confidence, 4),
        "feature_contributions": {k: round(v, 4) for k, v in result.feature_contributions.items()}
    }
