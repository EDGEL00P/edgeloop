# Singularity Exploit Configuration Integration

## Overview
The Singularity Exploit system has been integrated into the Edgeloop NFL analytics platform. This provides a strict binary filtering mechanism to eliminate noise and human error from betting signals.

## Configuration Files

### TypeScript Configuration
**Location**: `server/singularity-config.ts`

Features:
- Type-safe configuration interface
- Helper functions for filtering signals
- Category-based signal organization

Key Functions:
- `isSignalEnabled(signalName: string): boolean` - Check if a signal is enabled
- `getEnabledSignals(category?: string): string[]` - Get enabled signals, optionally by category
- `getDisabledSignals(): string[]` - Get all disabled noise signals

### Python Configuration
**Location**: `python_engine/singularity_config.py`

Features:
- Dataclass-based configuration structure
- Consistent API with TypeScript version
- Integration with existing Python config module

Key Functions:
- `is_signal_enabled(signal_name: str) -> bool` - Check if a signal is enabled
- `get_enabled_signals(category: Optional[str] = None) -> List[str]` - Get enabled signals
- `get_disabled_signals() -> List[str]` - Get disabled signals

## Enabled Signal Categories

1. **MARKET_DATA**
   - Line movements from sharp books (Pinnacle, Circa)
   - Reverse line movement with public fade
   - Steam moves within 60 seconds
   - Sharp money percentage over 50%

2. **WEATHER**
   - Wind speed over 15 mph
   - Extreme temperatures (<32°F or >90°F)

3. **GAME_FACTORS**
   - Referee crew bias over 60%
   - Stadium turf type impact

4. **INJURIES**
   - Offensive line starters out
   - Defensive star players out
   - Late scratches confirmed via API

5. **BETTING**
   - Arbitrage opportunities with positive EV

6. **ROSTER_MOVES**
   - Practice squad elevation signals
   - Key position depth chart failures

7. **ANALYTICS**
   - Model projection variance >5 points

8. **SCHEDULING**
   - Rest disadvantage >48 hours
   - Cross-country travel with no rest
   - Divisional underdog late season

9. **COACHING**
   - Coach post-bye week record >70%

## Disabled Noise Signals (Blocked)

The following signals are explicitly blocked as noise:

- Public opinion polls
- TV commentator analysis
- Social media hype videos
- Pre-season performance metrics
- Historical trends older than 3 years
- Team loyalty/fan bias
- Emotional hedging strategies
- Expert consensus without data
- Revenge game narratives without stats
- Prime time game myths
- Must-win narratives
- Trap game speculation
- Player interview quotes
- Unconfirmed rumors/leaks
- Crowd noise levels
- Jersey color trends
- Coin toss result correlations
- Garbage time stats

## Integration Points

### Exploit Engine (TypeScript)
**File**: `server/analytics/exploitEngine.ts`

The `analyzeExploits` function now:
1. Runs all signal detectors
2. Filters signals through Singularity configuration
3. Logs blocked signals for transparency
4. Returns only enabled signals sorted by confidence

### Python Modules
**File**: `python_engine/config.py`

The `apply_singularity_filter` function allows Python analytics modules to:
1. Check signal enablement before processing
2. Return `None` for disabled signals
3. Maintain consistency with TypeScript configuration

## Usage Examples

### TypeScript
```typescript
import { isSignalEnabled, getEnabledSignals } from "../singularity-config";

// Check if a specific signal is enabled
if (isSignalEnabled("STEAM_MOVE_CHASE_WITHIN_60_SECONDS")) {
  // Process steam move signal
}

// Get all enabled signals by category
const marketSignals = getEnabledSignals("MARKET_DATA");
```

### Python
```python
from singularity_config import is_signal_enabled, get_enabled_signals
from config import apply_singularity_filter

# Check if a signal is enabled
if is_signal_enabled("WEATHER_WIND_SPEED_OVER_15_MPH"):
    # Process weather signal

# Apply filter to signal value
filtered_value = apply_singularity_filter("MODEL_PROJECTION_VARIANCE_OVER_5_POINTS", signal_data)
```

## Signal Type Mapping

The exploit engine maps internal signal types to Singularity configuration names:

| Signal Type | Singularity Config Name |
|-------------|------------------------|
| weather_elastic | WEATHER_WIND_SPEED_OVER_15_MPH |
| injury_cascade | INJURY_OFFENSIVE_LINE_STARTER_OUT |
| steam_move | STEAM_MOVE_CHASE_WITHIN_60_SECONDS |
| reverse_line_move | REVERSE_LINE_MOVEMENT_PUBLIC_FADE |
| ref_tendency | REFEREE_CREW_BIAS_OVER_60_PERCENT |
| dome_outdoor_split | STADIUM_TURF_TYPE_IMPACT_FACTOR |
| short_week_fatigue | TRAVEL_CROSS_COUNTRY_NO_REST |
| bye_week_edge | COACH_POST_BYE_WEEK_RECORD_OVER_70_PERCENT |
| public_fade | PUBLIC_OPINION_POLLS (DISABLED) |
| primetime_bias | PRIME_TIME_GAME_MYTHS (DISABLED) |
| revenge_game | REVENGE_GAME_NARRATIVES_WITHOUT_STATS (DISABLED) |

## Logging

Blocked signals are logged for transparency:
```
[Singularity Filter] Blocked signal: Public Fade (Home Heavy) (public_fade)
```

This allows tracking of what signals are being filtered without enabling them.

## Benefits

1. **Eliminates Emotional Bias**: No more revenge game narratives or fan bias
2. **Data-Driven Decisions**: Only signals backed by rigorous analysis
3. **Consistency**: Same filtering rules across TypeScript and Python
4. **Transparency**: Clear list of what signals are followed vs. ignored
5. **Maintainability**: Centralized configuration for easy adjustments
6. **Performance**: Early filtering prevents unnecessary processing

## Future Enhancements

- Add configuration versioning for signal rule history
- Create admin interface for toggling signals
- Implement A/B testing framework for signal efficacy
- Add signal performance tracking and automatic disablement
- Create signal strength weighting system
