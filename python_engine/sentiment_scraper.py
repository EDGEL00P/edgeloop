"""
SOCIAL SENTIMENT SCRAPER
========================
Twitch/Twitter/Reddit sentiment analysis
Measure "Hype Train" inflation to fade the public
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timedelta
from enum import Enum


class SentimentSource(Enum):
    TWITTER = "twitter"
    REDDIT = "reddit"
    TWITCH = "twitch"
    DISCORD = "discord"
    YOUTUBE = "youtube"


class SentimentDirection(Enum):
    BULLISH = "bullish"
    BEARISH = "bearish"
    NEUTRAL = "neutral"


@dataclass
class TeamSentiment:
    team: str
    source: SentimentSource
    mentions_24h: int
    mentions_7d_avg: int
    sentiment_score: float  # -1 to 1
    spike_percentage: float  # vs 7d avg
    hype_level: str  # "extreme", "high", "normal", "low"
    recommendation: str


@dataclass
class PlayerSentiment:
    player_name: str
    team: str
    mentions_24h: int
    sentiment_score: float
    trending_topics: list[str]
    prop_impact: str


@dataclass
class MarketSentimentReport:
    game_id: str
    home_team: str
    away_team: str
    home_sentiment: TeamSentiment
    away_sentiment: TeamSentiment
    public_lean: str
    sharp_lean: str
    fade_recommendation: Optional[str]
    confidence: float


# Simulated sentiment data (in production: real API calls)
TEAM_BASELINE_MENTIONS = {
    "KC": 15000, "DAL": 18000, "SF": 12000, "PHI": 11000,
    "BUF": 9000, "MIA": 8000, "DET": 10000, "BAL": 7500,
    "CIN": 8500, "GB": 12000, "LAR": 9500, "NYG": 10000,
    "NYJ": 8000, "NE": 9000, "DEN": 6500, "LV": 7000,
}


class SentimentScraperEngine:
    """
    Social sentiment analysis for fade-the-public edges
    """
    
    def analyze_team_sentiment(
        self,
        team: str,
        mentions_24h: int,
        positive_mentions: int,
        negative_mentions: int,
        source: str = "twitter"
    ) -> TeamSentiment:
        """Analyze social sentiment for a team"""
        
        baseline = TEAM_BASELINE_MENTIONS.get(team, 8000)
        spike_pct = ((mentions_24h - baseline) / baseline) * 100
        
        # Calculate sentiment score
        total = positive_mentions + negative_mentions
        if total > 0:
            sentiment = (positive_mentions - negative_mentions) / total
        else:
            sentiment = 0
        
        # Determine hype level
        if spike_pct > 500:
            hype = "extreme"
            rec = f"🚨 EXTREME HYPE: FADE {team} — {spike_pct:.0f}% spike"
        elif spike_pct > 200:
            hype = "high"
            rec = f"⚠️ HIGH HYPE: Consider fading {team}"
        elif spike_pct > 50:
            hype = "elevated"
            rec = f"Elevated attention on {team} — monitor line"
        elif spike_pct < -30:
            hype = "low"
            rec = f"📉 LOW ATTENTION: Potential value on {team}"
        else:
            hype = "normal"
            rec = "Normal sentiment levels"
        
        return TeamSentiment(
            team=team,
            source=SentimentSource(source),
            mentions_24h=mentions_24h,
            mentions_7d_avg=baseline,
            sentiment_score=round(sentiment, 3),
            spike_percentage=round(spike_pct, 1),
            hype_level=hype,
            recommendation=rec
        )
    
    def analyze_player_buzz(
        self,
        player_name: str,
        team: str,
        mentions_24h: int,
        avg_mentions: int,
        topics: list[str]
    ) -> PlayerSentiment:
        """Analyze player-specific buzz for prop bets"""
        
        spike = ((mentions_24h - avg_mentions) / avg_mentions * 100) if avg_mentions > 0 else 0
        
        # Check for injury/suspension topics
        negative_topics = ["injury", "out", "questionable", "suspend", "arrest", "trade"]
        positive_topics = ["return", "healthy", "revenge", "milestone", "streak"]
        
        neg_count = sum(1 for t in topics if any(n in t.lower() for n in negative_topics))
        pos_count = sum(1 for t in topics if any(p in t.lower() for p in positive_topics))
        
        sentiment = (pos_count - neg_count) / max(len(topics), 1)
        
        if spike > 300 and sentiment > 0:
            impact = f"FADE {player_name} props — inflated due to hype"
        elif spike > 300 and sentiment < 0:
            impact = f"Monitor {player_name} — high buzz may be injury-related"
        elif spike < -50:
            impact = f"Potential VALUE on {player_name} — under the radar"
        else:
            impact = "Normal buzz levels — no adjustment"
        
        return PlayerSentiment(
            player_name=player_name,
            team=team,
            mentions_24h=mentions_24h,
            sentiment_score=round(sentiment, 2),
            trending_topics=topics[:5],
            prop_impact=impact
        )
    
    def generate_market_sentiment_report(
        self,
        game_id: str,
        home_team: str,
        away_team: str,
        home_mentions: int,
        away_mentions: int,
        public_bet_pct_home: float
    ) -> MarketSentimentReport:
        """Generate full sentiment report for a game"""
        
        # Analyze both teams
        home_baseline = TEAM_BASELINE_MENTIONS.get(home_team, 8000)
        away_baseline = TEAM_BASELINE_MENTIONS.get(away_team, 8000)
        
        home_sentiment = self.analyze_team_sentiment(
            home_team, home_mentions, 
            int(home_mentions * 0.6), int(home_mentions * 0.4)
        )
        
        away_sentiment = self.analyze_team_sentiment(
            away_team, away_mentions,
            int(away_mentions * 0.55), int(away_mentions * 0.45)
        )
        
        # Determine public lean
        if public_bet_pct_home > 65:
            public_lean = home_team
        elif public_bet_pct_home < 35:
            public_lean = away_team
        else:
            public_lean = "Split"
        
        # Estimate sharp lean (opposite of extreme public)
        if public_bet_pct_home > 70:
            sharp_lean = away_team
        elif public_bet_pct_home < 30:
            sharp_lean = home_team
        else:
            sharp_lean = "Neutral"
        
        # Generate fade recommendation
        fade_rec = None
        confidence = 0.5
        
        home_hype = home_sentiment.spike_percentage
        away_hype = away_sentiment.spike_percentage
        
        if home_hype > 300 and public_bet_pct_home > 65:
            fade_rec = f"🎯 FADE {home_team}: Extreme hype + heavy public = trap"
            confidence = 0.75
        elif away_hype > 300 and public_bet_pct_home < 35:
            fade_rec = f"🎯 FADE {away_team}: Extreme hype + heavy public = trap"
            confidence = 0.75
        elif abs(home_hype - away_hype) > 200:
            hyped_team = home_team if home_hype > away_hype else away_team
            fade_rec = f"Consider fading {hyped_team} — sentiment imbalance"
            confidence = 0.60
        
        return MarketSentimentReport(
            game_id=game_id,
            home_team=home_team,
            away_team=away_team,
            home_sentiment=home_sentiment,
            away_sentiment=away_sentiment,
            public_lean=public_lean,
            sharp_lean=sharp_lean,
            fade_recommendation=fade_rec,
            confidence=round(confidence, 2)
        )
    
    def get_trending_narratives(self) -> list[dict]:
        """Get current trending NFL narratives that may affect lines"""
        
        # In production: scrape actual trending topics
        # For demo: return sample narratives
        return [
            {
                "narrative": "Patrick Mahomes injury concern",
                "teams_affected": ["KC"],
                "sentiment": "bearish",
                "impact": "Line may overcorrect — look for value on KC",
                "confidence": 0.65
            },
            {
                "narrative": "Lions Super Bowl hype train",
                "teams_affected": ["DET"],
                "sentiment": "bullish",
                "impact": "Public hammering DET — consider fading",
                "confidence": 0.70
            },
            {
                "narrative": "Cowboys playoff drama",
                "teams_affected": ["DAL"],
                "sentiment": "mixed",
                "impact": "High variance — avoid or go contrarian",
                "confidence": 0.55
            },
            {
                "narrative": "Josh Allen MVP push",
                "teams_affected": ["BUF"],
                "sentiment": "bullish",
                "impact": "Props may be inflated — tread carefully",
                "confidence": 0.60
            }
        ]
    
    def calculate_fade_score(
        self,
        sentiment_spike: float,
        public_bet_pct: float,
        line_movement_direction: str,  # "with_public" or "against_public"
        sharp_money_pct: float
    ) -> dict:
        """Calculate a composite fade score"""
        
        score = 0
        factors = []
        
        # Sentiment spike factor
        if sentiment_spike > 300:
            score += 30
            factors.append(f"Extreme hype ({sentiment_spike:.0f}% spike)")
        elif sentiment_spike > 150:
            score += 15
            factors.append(f"High hype ({sentiment_spike:.0f}% spike)")
        
        # Public bet factor
        if public_bet_pct > 75:
            score += 25
            factors.append(f"Heavy public ({public_bet_pct:.0f}%)")
        elif public_bet_pct > 65:
            score += 15
            factors.append(f"Moderate public lean ({public_bet_pct:.0f}%)")
        
        # RLM factor
        if line_movement_direction == "against_public":
            score += 20
            factors.append("Reverse line movement detected")
        
        # Sharp money factor
        if sharp_money_pct > 60:
            if public_bet_pct > 65:
                score += 25  # Sharps opposite public
                factors.append(f"Sharp money ({sharp_money_pct:.0f}%) opposing public")
            else:
                score -= 10  # Sharps with public — less confident fade
        
        # Determine recommendation
        if score >= 70:
            rec = "🎯 STRONG FADE — high confidence contrarian play"
            action = "FADE"
        elif score >= 50:
            rec = "Consider fading — multiple contrarian signals"
            action = "LEAN_FADE"
        elif score >= 30:
            rec = "Mild contrarian interest — smaller position"
            action = "SMALL_FADE"
        else:
            rec = "Insufficient signals — pass or bet normally"
            action = "PASS"
        
        return {
            "fade_score": score,
            "factors": factors,
            "recommendation": rec,
            "action": action,
            "confidence": min(score / 100, 0.85)
        }
