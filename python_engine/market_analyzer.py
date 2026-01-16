"""
NFL Market Analyzer
===================
Analyzes betting market data to identify edges, steam moves, 
and reverse line movement opportunities.
"""

import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

logger = logging.getLogger(__name__)


class SignalType(Enum):
    """Types of market signals."""
    STEAM = "steam"  # Sharp money movement
    RLM = "reverse_line_movement"  # Line moves opposite to public
    TRAP = "trap"  # Line not moving despite heavy public action
    WEATHER = "weather"  # Weather-based opportunity
    INJURY = "injury"  # Key injury impact
    VALUE = "value"  # Pure mathematical edge


@dataclass
class MarketSignal:
    """A betting signal derived from market analysis."""
    signal_type: SignalType
    game_id: int
    side: str  # HOME_SPREAD, AWAY_SPREAD, OVER, UNDER
    confidence: float  # 0-100
    edge: float  # Percentage edge
    description: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    # Supporting data
    model_line: Optional[float] = None
    market_line: Optional[float] = None
    public_percentage: Optional[float] = None
    sharp_percentage: Optional[float] = None
    

@dataclass
class LineSnapshot:
    """A snapshot of betting lines at a point in time."""
    game_id: int
    timestamp: datetime
    
    # Spread
    spread: float
    spread_home_odds: int  # American odds
    spread_away_odds: int
    
    # Total
    total: float
    over_odds: int
    under_odds: int
    
    # Moneyline
    home_ml: int
    away_ml: int
    
    # Source
    sportsbook: str


class MarketAnalyzer:
    """
    Analyzes betting market data to identify edges.
    
    Detects:
    - Steam moves (sharp money)
    - Reverse line movement
    - Line traps
    - Value opportunities
    """
    
    def __init__(
        self,
        min_steam_move: float = 0.5,  # Points
        min_rlm_threshold: float = 60.0,  # % public on one side
        min_value_edge: float = 3.0,  # % edge required
    ):
        """
        Initialize the market analyzer.
        
        Args:
            min_steam_move: Minimum line movement to flag as steam
            min_rlm_threshold: Minimum public % to check for RLM
            min_value_edge: Minimum edge % to flag as value
        """
        self.min_steam_move = min_steam_move
        self.min_rlm_threshold = min_rlm_threshold
        self.min_value_edge = min_value_edge
        
        # Line history storage
        self._line_history: Dict[int, List[LineSnapshot]] = {}
        
        logger.info("MarketAnalyzer initialized")
    
    def add_line_snapshot(self, snapshot: LineSnapshot) -> None:
        """
        Add a line snapshot to history.
        
        Args:
            snapshot: LineSnapshot to add
        """
        if snapshot.game_id not in self._line_history:
            self._line_history[snapshot.game_id] = []
        
        self._line_history[snapshot.game_id].append(snapshot)
        
        # Keep sorted by timestamp
        self._line_history[snapshot.game_id].sort(key=lambda x: x.timestamp)
    
    def get_opening_line(self, game_id: int) -> Optional[LineSnapshot]:
        """Get the opening line for a game."""
        history = self._line_history.get(game_id, [])
        return history[0] if history else None
    
    def get_current_line(self, game_id: int) -> Optional[LineSnapshot]:
        """Get the current (latest) line for a game."""
        history = self._line_history.get(game_id, [])
        return history[-1] if history else None
    
    def detect_steam_move(
        self,
        game_id: int,
        time_window_minutes: int = 10,
    ) -> Optional[MarketSignal]:
        """
        Detect sharp money steam moves.
        
        A steam move is a rapid line movement across multiple books
        in a short time window.
        
        Args:
            game_id: Game ID to analyze
            time_window_minutes: Window to detect rapid movement
            
        Returns:
            MarketSignal if steam detected, None otherwise
        """
        history = self._line_history.get(game_id, [])
        
        if len(history) < 2:
            return None
        
        current = history[-1]
        
        # Look for rapid movement in recent history
        for i in range(len(history) - 2, -1, -1):
            prev = history[i]
            time_diff = (current.timestamp - prev.timestamp).total_seconds() / 60
            
            if time_diff > time_window_minutes:
                break
            
            spread_move = abs(current.spread - prev.spread)
            
            if spread_move >= self.min_steam_move:
                # Determine direction
                if current.spread < prev.spread:
                    side = "HOME_SPREAD"
                    description = f"Steam on home spread: {prev.spread} → {current.spread}"
                else:
                    side = "AWAY_SPREAD"
                    description = f"Steam on away spread: {prev.spread} → {current.spread}"
                
                return MarketSignal(
                    signal_type=SignalType.STEAM,
                    game_id=game_id,
                    side=side,
                    confidence=min(spread_move * 20, 90),  # Scale confidence
                    edge=spread_move * 2,  # Rough edge estimate
                    description=description,
                    model_line=None,
                    market_line=current.spread,
                )
        
        return None
    
    def detect_rlm(
        self,
        game_id: int,
        public_spread_pct: float,
        public_total_pct: Optional[float] = None,
    ) -> List[MarketSignal]:
        """
        Detect reverse line movement.
        
        RLM occurs when the line moves opposite to where public
        money is flowing, indicating sharp money on the other side.
        
        Args:
            game_id: Game ID to analyze
            public_spread_pct: % of public on favorite/home
            public_total_pct: % of public on over (optional)
            
        Returns:
            List of MarketSignals for RLM opportunities
        """
        signals = []
        
        opening = self.get_opening_line(game_id)
        current = self.get_current_line(game_id)
        
        if not opening or not current:
            return signals
        
        spread_move = current.spread - opening.spread
        
        # Check spread RLM
        if public_spread_pct >= self.min_rlm_threshold:
            # Public is heavy on home/favorite
            if spread_move > 0:  # Line moved against public
                signals.append(MarketSignal(
                    signal_type=SignalType.RLM,
                    game_id=game_id,
                    side="AWAY_SPREAD",
                    confidence=min(public_spread_pct, 85),
                    edge=abs(spread_move) * 1.5,
                    description=f"RLM: {public_spread_pct:.0f}% public on home, line moved {opening.spread} → {current.spread}",
                    public_percentage=public_spread_pct,
                ))
        
        elif public_spread_pct <= (100 - self.min_rlm_threshold):
            # Public is heavy on away/underdog
            if spread_move < 0:  # Line moved against public
                signals.append(MarketSignal(
                    signal_type=SignalType.RLM,
                    game_id=game_id,
                    side="HOME_SPREAD",
                    confidence=min(100 - public_spread_pct, 85),
                    edge=abs(spread_move) * 1.5,
                    description=f"RLM: {100-public_spread_pct:.0f}% public on away, line moved {opening.spread} → {current.spread}",
                    public_percentage=100 - public_spread_pct,
                ))
        
        # Check total RLM if data provided
        if public_total_pct is not None:
            total_move = current.total - opening.total
            
            if public_total_pct >= self.min_rlm_threshold:
                if total_move < 0:  # Line moved down despite over action
                    signals.append(MarketSignal(
                        signal_type=SignalType.RLM,
                        game_id=game_id,
                        side="UNDER",
                        confidence=min(public_total_pct, 85),
                        edge=abs(total_move) * 0.5,
                        description=f"RLM: {public_total_pct:.0f}% public on over, total moved {opening.total} → {current.total}",
                        public_percentage=public_total_pct,
                    ))
            
            elif public_total_pct <= (100 - self.min_rlm_threshold):
                if total_move > 0:  # Line moved up despite under action
                    signals.append(MarketSignal(
                        signal_type=SignalType.RLM,
                        game_id=game_id,
                        side="OVER",
                        confidence=min(100 - public_total_pct, 85),
                        edge=abs(total_move) * 0.5,
                        description=f"RLM: {100-public_total_pct:.0f}% public on under, total moved {opening.total} → {current.total}",
                        public_percentage=100 - public_total_pct,
                    ))
        
        return signals
    
    def detect_value(
        self,
        game_id: int,
        model_spread: float,
        model_total: float,
    ) -> List[MarketSignal]:
        """
        Detect pure value opportunities based on model projections.
        
        Args:
            game_id: Game ID to analyze
            model_spread: Model projected spread (negative = home favored)
            model_total: Model projected total
            
        Returns:
            List of MarketSignals for value opportunities
        """
        signals = []
        
        current = self.get_current_line(game_id)
        if not current:
            return signals
        
        # Spread value
        spread_diff = current.spread - model_spread
        spread_edge = abs(spread_diff) / 3.5 * 100  # Convert to % edge estimate
        
        if spread_edge >= self.min_value_edge:
            if spread_diff > 0:  # Market has home as bigger underdog than model
                side = "HOME_SPREAD"
            else:
                side = "AWAY_SPREAD"
            
            signals.append(MarketSignal(
                signal_type=SignalType.VALUE,
                game_id=game_id,
                side=side,
                confidence=min(spread_edge * 5, 90),
                edge=spread_edge,
                description=f"Value: Model {model_spread:.1f} vs Market {current.spread:.1f} ({spread_edge:.1f}% edge)",
                model_line=model_spread,
                market_line=current.spread,
            ))
        
        # Total value
        total_diff = current.total - model_total
        total_edge = abs(total_diff) / 2.0 * 100  # Convert to % edge
        
        if total_edge >= self.min_value_edge:
            if total_diff > 0:  # Market total higher than model
                side = "UNDER"
            else:
                side = "OVER"
            
            signals.append(MarketSignal(
                signal_type=SignalType.VALUE,
                game_id=game_id,
                side=side,
                confidence=min(total_edge * 5, 90),
                edge=total_edge,
                description=f"Value: Model {model_total:.1f} vs Market {current.total:.1f} ({total_edge:.1f}% edge)",
                model_line=model_total,
                market_line=current.total,
            ))
        
        return signals
    
    def analyze_game(
        self,
        game_id: int,
        model_spread: Optional[float] = None,
        model_total: Optional[float] = None,
        public_spread_pct: Optional[float] = None,
        public_total_pct: Optional[float] = None,
    ) -> List[MarketSignal]:
        """
        Run full market analysis on a game.
        
        Args:
            game_id: Game ID to analyze
            model_spread: Model projected spread (optional)
            model_total: Model projected total (optional)
            public_spread_pct: % of public on home spread (optional)
            public_total_pct: % of public on over (optional)
            
        Returns:
            List of all detected signals
        """
        signals = []
        
        # Detect steam moves
        steam = self.detect_steam_move(game_id)
        if steam:
            signals.append(steam)
        
        # Detect RLM
        if public_spread_pct is not None:
            rlm_signals = self.detect_rlm(game_id, public_spread_pct, public_total_pct)
            signals.extend(rlm_signals)
        
        # Detect value
        if model_spread is not None and model_total is not None:
            value_signals = self.detect_value(game_id, model_spread, model_total)
            signals.extend(value_signals)
        
        # Sort by confidence
        signals.sort(key=lambda x: x.confidence, reverse=True)
        
        return signals
    
    def get_top_signals(
        self,
        min_confidence: float = 50.0,
        signal_types: Optional[List[SignalType]] = None,
    ) -> List[MarketSignal]:
        """
        Get top signals across all analyzed games.
        
        Args:
            min_confidence: Minimum confidence threshold
            signal_types: Filter by signal types (optional)
            
        Returns:
            List of signals meeting criteria
        """
        # Would need to track all signals generated
        # For now, return empty list
        return []


def signal_to_dict(signal: MarketSignal) -> Dict[str, Any]:
    """Convert MarketSignal to dict."""
    return {
        "signal_type": signal.signal_type.value,
        "game_id": signal.game_id,
        "side": signal.side,
        "confidence": signal.confidence,
        "edge": signal.edge,
        "description": signal.description,
        "timestamp": signal.timestamp.isoformat(),
        "model_line": signal.model_line,
        "market_line": signal.market_line,
        "public_percentage": signal.public_percentage,
        "sharp_percentage": signal.sharp_percentage,
    }
