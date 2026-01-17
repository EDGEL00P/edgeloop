"""
MARKET MECHANICS — Beating the Line
====================================
Fake steam detection, Wong teasers, correlated parlays,
line freeze arbitrage
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timedelta
from enum import Enum


class LineMovementType(Enum):
    STEAM = "steam"
    REVERSE_LINE_MOVE = "rlm"
    PUBLIC_DRIVEN = "public"
    SHARP_ACTION = "sharp"
    FAKE_STEAM = "fake_steam"
    INJURY_ADJUSTMENT = "injury"


class TeaserType(Enum):
    WONG_6PT = "wong_6pt"
    WONG_6_5PT = "wong_6_5pt"
    SWEETHEART = "sweetheart"
    STANDARD = "standard"


@dataclass
class LineMovement:
    game_id: str
    book: str
    open_line: float
    current_line: float
    movement: float
    movement_type: LineMovementType
    public_pct: float
    sharp_pct: float
    timestamp: datetime
    recommendation: str


@dataclass
class FakeSteamAlert:
    detected: bool
    initial_move_team: str
    initial_move_size: float
    suspected_target_team: str
    confidence: float
    action: str


@dataclass
class TeaserOpportunity:
    game_id: str
    teaser_type: TeaserType
    original_spread: float
    teased_spread: float
    crosses_key_numbers: list[int]
    expected_value: float
    is_positive_ev: bool
    recommendation: str


@dataclass
class CorrelatedParlay:
    legs: list[dict]
    correlation_strength: float  # -1 to 1
    book_pricing_error: float  # % mispriced
    true_probability: float
    book_implied_probability: float
    edge: float
    recommendation: str


@dataclass
class LineFreezeAlert:
    game_id: str
    news_event: str
    stale_books: list[str]
    fair_line: float
    stale_line: float
    edge: float
    window_seconds: int
    action: str


class MarketMechanicsEngine:
    """Beat the bookmakers through market analysis"""
    
    def detect_fake_steam(
        self,
        game_id: str,
        movements: list[dict]  # [{time, line, book, size}]
    ) -> FakeSteamAlert:
        """
        Identify when sharps bet small on Team A to move line,
        then hammer Team B when public follows.
        """
        
        if len(movements) < 3:
            return FakeSteamAlert(
                detected=False,
                initial_move_team="",
                initial_move_size=0,
                suspected_target_team="",
                confidence=0,
                action="Insufficient data"
            )
        
        # Analyze movement pattern
        first_move = movements[0]
        latest_moves = movements[-2:]
        
        # Fake steam pattern:
        # 1. Small early move in one direction
        # 2. Line continues that direction (public follows)
        # 3. Large sharp money appears opposite
        
        early_direction = 1 if first_move.get("line_change", 0) > 0 else -1
        
        # Check if late moves are opposite and larger
        late_opposite = sum(
            1 for m in latest_moves 
            if (m.get("line_change", 0) * early_direction) < 0
        )
        
        late_volume = sum(m.get("size", 0) for m in latest_moves)
        early_volume = first_move.get("size", 0)
        
        is_fake_steam = (
            late_opposite >= 1 and 
            late_volume > early_volume * 3 and
            len(movements) >= 4
        )
        
        confidence = 0.0
        if is_fake_steam:
            confidence = min((late_volume / early_volume) / 10, 0.85)
        
        initial_team = "Home" if early_direction > 0 else "Away"
        target_team = "Away" if early_direction > 0 else "Home"
        
        return FakeSteamAlert(
            detected=is_fake_steam,
            initial_move_team=initial_team,
            initial_move_size=early_volume,
            suspected_target_team=target_team,
            confidence=round(confidence, 2),
            action=f"FOLLOW SHARPS: Bet {target_team}" if is_fake_steam else "No fake steam detected"
        )
    
    def find_wong_teaser(
        self,
        spread: float,
        total: float,
        teaser_points: float = 6.0
    ) -> TeaserOpportunity:
        """
        Identify Wong Teaser opportunities that cross key numbers 3 and 7.
        Wong Teasers are mathematically +EV in specific situations.
        """
        
        key_numbers = [3, 7, 10, 14]
        
        # Calculate teased spread
        teased_spread = spread + teaser_points if spread < 0 else spread - teaser_points
        
        # Check which key numbers we cross
        crossed = []
        spread_range = sorted([spread, teased_spread])
        
        for kn in key_numbers:
            if spread_range[0] < kn <= spread_range[1]:
                crossed.append(kn)
            elif spread_range[0] < -kn <= spread_range[1]:
                crossed.append(-kn)
        
        # Wong Teaser criteria:
        # - Favorite between -7.5 and -8.5 teased to -1.5 to -2.5 (crosses 3 and 7)
        # - Underdog between +1.5 and +2.5 teased to +7.5 to +8.5 (crosses 3 and 7)
        
        is_wong = False
        ev = -0.02  # Default slight -EV
        
        if -8.5 <= spread <= -7.5 and teaser_points == 6:
            is_wong = True
            ev = 0.012  # ~1.2% +EV
        elif 1.5 <= spread <= 2.5 and teaser_points == 6:
            is_wong = True  
            ev = 0.015  # ~1.5% +EV
        elif -2.5 <= spread <= -1.5 and teaser_points == 6:
            is_wong = True
            ev = 0.008  # ~0.8% +EV
        elif 7.5 <= spread <= 8.5 and teaser_points == 6:
            is_wong = True
            ev = 0.010  # ~1.0% +EV
        
        # Additional value if crossing both 3 and 7
        if 3 in crossed or -3 in crossed:
            ev += 0.005
        if 7 in crossed or -7 in crossed:
            ev += 0.008
        
        teaser_type = TeaserType.WONG_6PT if is_wong and teaser_points == 6 else TeaserType.STANDARD
        
        if is_wong:
            rec = f"✅ WONG TEASER: {spread} → {teased_spread} | +EV: {ev*100:.1f}%"
        elif len(crossed) >= 2:
            rec = f"⚠️ Crosses {crossed} but not optimal Wong range"
        else:
            rec = "Standard teaser — no special edge"
        
        return TeaserOpportunity(
            game_id="",
            teaser_type=teaser_type,
            original_spread=spread,
            teased_spread=teased_spread,
            crosses_key_numbers=crossed,
            expected_value=round(ev, 4),
            is_positive_ev=ev > 0,
            recommendation=rec
        )
    
    def analyze_correlated_parlay(
        self,
        leg1_type: str,  # "team_win", "player_yards", "team_total", etc.
        leg1_value: str,
        leg2_type: str,
        leg2_value: str,
        book_parlay_odds: float
    ) -> CorrelatedParlay:
        """
        Find books that fail to properly price correlation.
        Positive correlation = both likely to hit together.
        """
        
        # Correlation matrix (simplified)
        correlations = {
            ("team_win", "rb_100_yards"): 0.45,  # RB runs in wins
            ("team_win", "qb_40_attempts"): -0.35,  # QBs throw less in wins
            ("team_win", "team_total_over"): 0.55,  # Winners score
            ("team_total_over", "qb_300_yards"): 0.60,  # High scoring = QB yards
            ("team_total_over", "rb_100_yards"): 0.30,  # Moderate
            ("qb_300_yards", "wr1_100_yards"): 0.65,  # QB yards = WR yards
            ("rb_100_yards", "team_rush_150"): 0.70,  # Strong correlation
            ("team_win", "defense_sack"): 0.25,  # Mild positive
        }
        
        # Get correlation
        key = (leg1_type, leg2_type)
        reverse_key = (leg2_type, leg1_type)
        
        correlation = correlations.get(key, correlations.get(reverse_key, 0.0))
        
        # Estimate true probability boost from correlation
        # Assuming each leg is ~50% base
        base_prob = 0.25  # 50% * 50%
        corr_adjustment = correlation * 0.15  # Max ~15% boost
        true_prob = base_prob + corr_adjustment
        
        # Book implied probability (from odds)
        book_implied = 1 / book_parlay_odds if book_parlay_odds > 0 else 0.25
        
        # Calculate edge
        edge = (true_prob - book_implied) / book_implied * 100
        pricing_error = edge
        
        if edge > 5:
            rec = f"🎯 EXPLOIT: Book underpricing correlation by {edge:.1f}%"
        elif edge > 2:
            rec = f"Slight edge: {edge:.1f}% correlation mispricing"
        elif edge < -5:
            rec = f"⚠️ AVOID: Negative correlation not priced in"
        else:
            rec = "Fairly priced parlay"
        
        return CorrelatedParlay(
            legs=[
                {"type": leg1_type, "value": leg1_value},
                {"type": leg2_type, "value": leg2_value}
            ],
            correlation_strength=round(correlation, 2),
            book_pricing_error=round(pricing_error, 1),
            true_probability=round(true_prob, 3),
            book_implied_probability=round(book_implied, 3),
            edge=round(edge, 1),
            recommendation=rec
        )
    
    def detect_line_freeze(
        self,
        game_id: str,
        news_event: str,
        news_time: datetime,
        book_lines: dict,  # {book: current_line}
        estimated_fair_line: float
    ) -> LineFreezeAlert:
        """
        Detect when books are slow to update after major news.
        The 30-second arbitrage window.
        """
        
        stale_books = []
        max_edge = 0.0
        stale_line = 0.0
        
        for book, line in book_lines.items():
            edge = abs(line - estimated_fair_line)
            if edge > 1.0:  # More than 1 point off
                stale_books.append(book)
                if edge > max_edge:
                    max_edge = edge
                    stale_line = line
        
        # Estimate window remaining
        time_since_news = (datetime.now() - news_time).seconds
        window_remaining = max(0, 120 - time_since_news)  # ~2 min window
        
        if stale_books and max_edge > 1.5:
            action = f"⚡ ACT NOW: Bet at {stale_books} before adjustment"
        elif stale_books:
            action = f"Monitor {stale_books} — slight edge available"
        else:
            action = "All books adjusted — no arbitrage"
        
        return LineFreezeAlert(
            game_id=game_id,
            news_event=news_event,
            stale_books=stale_books,
            fair_line=estimated_fair_line,
            stale_line=stale_line,
            edge=round(max_edge, 1),
            window_seconds=window_remaining,
            action=action
        )
    
    def classify_line_movement(
        self,
        open_line: float,
        current_line: float,
        public_pct: float,
        sharp_pct: float,
        has_injury_news: bool = False
    ) -> LineMovement:
        """Classify the type of line movement"""
        
        movement = current_line - open_line
        
        # Determine movement type
        if has_injury_news:
            move_type = LineMovementType.INJURY_ADJUSTMENT
            rec = "Wait for line to settle"
        elif abs(movement) >= 2 and sharp_pct > public_pct:
            move_type = LineMovementType.STEAM
            rec = f"FOLLOW: Sharp steam on {'Home' if movement > 0 else 'Away'}"
        elif movement * (public_pct - 50) < 0:
            # Line moving opposite to public
            move_type = LineMovementType.REVERSE_LINE_MOVE
            direction = "Home" if movement > 0 else "Away"
            rec = f"🎯 RLM ALERT: Sharps on {direction} despite {public_pct:.0f}% public other way"
        elif sharp_pct > 60:
            move_type = LineMovementType.SHARP_ACTION
            rec = f"Sharp action detected — {sharp_pct:.0f}% sharp money"
        else:
            move_type = LineMovementType.PUBLIC_DRIVEN
            rec = "Public-driven movement — fade potential"
        
        return LineMovement(
            game_id="",
            book="consensus",
            open_line=open_line,
            current_line=current_line,
            movement=round(movement, 1),
            movement_type=move_type,
            public_pct=public_pct,
            sharp_pct=sharp_pct,
            timestamp=datetime.now(),
            recommendation=rec
        )
