"""
BACKTESTING TIME MACHINE
========================
Run model against historical seasons to prove profitability
before risking a dollar
"""

from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from enum import Enum
import random


class BetType(Enum):
    SPREAD = "spread"
    TOTAL = "total"
    MONEYLINE = "moneyline"
    PROP = "prop"


@dataclass
class BacktestBet:
    game_id: str
    season: int
    week: int
    bet_type: BetType
    selection: str
    odds: float
    stake: float
    result: str  # "win", "loss", "push"
    profit: float


@dataclass
class BacktestSeason:
    season: int
    total_bets: int
    wins: int
    losses: int
    pushes: int
    win_rate: float
    roi: float
    total_wagered: float
    total_profit: float
    max_drawdown: float
    sharpe_ratio: float


@dataclass
class BacktestReport:
    strategy_name: str
    seasons_tested: list[int]
    total_bets: int
    overall_roi: float
    overall_win_rate: float
    avg_odds: float
    best_season: int
    worst_season: int
    is_profitable: bool
    edge_estimate: float
    recommended_kelly: float
    season_details: list[BacktestSeason]


class BacktestEngine:
    """
    Backtesting Time Machine — validate model against historical data
    """
    
    def run_backtest(
        self,
        strategy_name: str,
        seasons: list[int],
        bet_type: str,
        model_predictions: list[dict],  # [{game_id, prediction, confidence, actual_result}]
        base_stake: float = 100
    ) -> BacktestReport:
        """
        Run full backtest simulation
        """
        
        all_bets: list[BacktestBet] = []
        season_results: list[BacktestSeason] = []
        
        for season in seasons:
            season_preds = [p for p in model_predictions if p.get("season") == season]
            
            wins = 0
            losses = 0
            pushes = 0
            season_profit = 0
            wagered = 0
            drawdown_track = []
            
            for pred in season_preds:
                odds = pred.get("odds", -110)
                decimal_odds = self._american_to_decimal(odds)
                stake = base_stake * pred.get("confidence", 0.5)
                
                result = pred.get("actual_result", "loss")
                
                if result == "win":
                    profit = stake * (decimal_odds - 1)
                    wins += 1
                elif result == "push":
                    profit = 0
                    pushes += 1
                else:
                    profit = -stake
                    losses += 1
                
                season_profit += profit
                wagered += stake
                drawdown_track.append(season_profit)
                
                all_bets.append(BacktestBet(
                    game_id=pred.get("game_id", ""),
                    season=season,
                    week=pred.get("week", 0),
                    bet_type=BetType(bet_type),
                    selection=pred.get("selection", ""),
                    odds=odds,
                    stake=stake,
                    result=result,
                    profit=round(profit, 2)
                ))
            
            # Calculate season metrics
            total_bets = wins + losses + pushes
            win_rate = wins / total_bets if total_bets > 0 else 0
            roi = (season_profit / wagered * 100) if wagered > 0 else 0
            
            # Max drawdown
            peak = 0
            max_dd = 0
            for p in drawdown_track:
                if p > peak:
                    peak = p
                dd = (peak - p) / base_stake if peak > 0 else 0
                if dd > max_dd:
                    max_dd = dd
            
            # Simplified Sharpe (assuming daily returns)
            avg_return = season_profit / max(total_bets, 1)
            std_return = 50  # placeholder
            sharpe = (avg_return / std_return) * (252 ** 0.5) if std_return > 0 else 0
            
            season_results.append(BacktestSeason(
                season=season,
                total_bets=total_bets,
                wins=wins,
                losses=losses,
                pushes=pushes,
                win_rate=round(win_rate, 3),
                roi=round(roi, 2),
                total_wagered=round(wagered, 2),
                total_profit=round(season_profit, 2),
                max_drawdown=round(max_dd * 100, 2),
                sharpe_ratio=round(sharpe, 2)
            ))
        
        # Aggregate results
        total_bets = len(all_bets)
        total_wins = sum(s.wins for s in season_results)
        total_wagered = sum(s.total_wagered for s in season_results)
        total_profit = sum(s.total_profit for s in season_results)
        
        overall_roi = (total_profit / total_wagered * 100) if total_wagered > 0 else 0
        overall_win_rate = total_wins / total_bets if total_bets > 0 else 0
        
        # Find best/worst seasons
        best_season = max(season_results, key=lambda x: x.roi).season if season_results else 0
        worst_season = min(season_results, key=lambda x: x.roi).season if season_results else 0
        
        # Edge estimate
        avg_odds = sum(b.odds for b in all_bets) / len(all_bets) if all_bets else -110
        implied_prob = self._american_to_implied(avg_odds)
        edge = overall_win_rate - implied_prob
        
        # Kelly recommendation
        if edge > 0 and overall_win_rate > 0:
            b = self._american_to_decimal(avg_odds) - 1
            q = 1 - overall_win_rate
            kelly = (edge * b - q) / b if b > 0 else 0
            kelly = max(0, min(kelly, 0.25))  # Cap at 25%
        else:
            kelly = 0
        
        return BacktestReport(
            strategy_name=strategy_name,
            seasons_tested=seasons,
            total_bets=total_bets,
            overall_roi=round(overall_roi, 2),
            overall_win_rate=round(overall_win_rate, 3),
            avg_odds=round(avg_odds, 0),
            best_season=best_season,
            worst_season=worst_season,
            is_profitable=overall_roi > 0,
            edge_estimate=round(edge, 4),
            recommended_kelly=round(kelly, 4),
            season_details=season_results
        )
    
    def simulate_historical_run(
        self,
        strategy_name: str,
        seasons: list[int] = [2021, 2022, 2023, 2024],
        games_per_season: int = 272,  # 17 weeks * 16 games
        model_edge: float = 0.03  # 3% assumed edge
    ) -> BacktestReport:
        """
        Simulate backtest with assumed edge (for demo purposes)
        """
        
        predictions = []
        
        for season in seasons:
            for week in range(1, 19):
                for game in range(16):
                    # Simulate with model edge
                    base_win_rate = 0.52 + model_edge
                    confidence = 0.4 + random.random() * 0.4
                    
                    # Higher confidence = closer to true edge
                    adjusted_rate = base_win_rate + (confidence - 0.5) * 0.1
                    
                    result = "win" if random.random() < adjusted_rate else "loss"
                    
                    predictions.append({
                        "game_id": f"{season}-W{week}-G{game}",
                        "season": season,
                        "week": week,
                        "selection": f"Team {game % 32}",
                        "odds": -110 + random.randint(-20, 20),
                        "confidence": confidence,
                        "actual_result": result
                    })
        
        return self.run_backtest(
            strategy_name=strategy_name,
            seasons=seasons,
            bet_type="spread",
            model_predictions=predictions
        )
    
    def _american_to_decimal(self, american: float) -> float:
        if american > 0:
            return (american / 100) + 1
        return (100 / abs(american)) + 1
    
    def _american_to_implied(self, american: float) -> float:
        if american > 0:
            return 100 / (american + 100)
        return abs(american) / (abs(american) + 100)
    
    def generate_report_summary(self, report: BacktestReport) -> str:
        """Generate human-readable backtest summary"""
        
        status = "✅ PROFITABLE" if report.is_profitable else "❌ UNPROFITABLE"
        
        summary = f"""
╔════════════════════════════════════════════════════════════════════╗
║  BACKTEST REPORT: {report.strategy_name.upper():^45} ║
╠════════════════════════════════════════════════════════════════════╣
║  Status: {status:^55} ║
║  Seasons Tested: {str(report.seasons_tested):^48} ║
╠════════════════════════════════════════════════════════════════════╣
║  Total Bets: {report.total_bets:>6}     Win Rate: {report.overall_win_rate:.1%}                ║
║  Overall ROI: {report.overall_roi:>+6.2f}%    Edge Est: {report.edge_estimate:>+.2%}                 ║
║  Avg Odds: {report.avg_odds:>+6.0f}       Kelly: {report.recommended_kelly:.2%}                     ║
╠════════════════════════════════════════════════════════════════════╣
║  Best Season: {report.best_season}        Worst Season: {report.worst_season}                   ║
╚════════════════════════════════════════════════════════════════════╝

SEASON BREAKDOWN:
"""
        
        for s in report.season_details:
            status_icon = "📈" if s.roi > 0 else "📉"
            summary += f"  {status_icon} {s.season}: {s.wins}W-{s.losses}L | ROI: {s.roi:+.1f}% | Max DD: {s.max_drawdown:.1f}%\n"
        
        if report.is_profitable and report.edge_estimate > 0.02:
            summary += f"\n🎯 RECOMMENDATION: Deploy with {report.recommended_kelly:.1%} Kelly stake"
        elif report.is_profitable:
            summary += f"\n⚠️ RECOMMENDATION: Marginal edge — use quarter Kelly ({report.recommended_kelly/4:.2%})"
        else:
            summary += "\n❌ RECOMMENDATION: Do NOT deploy — negative expectation"
        
        return summary
