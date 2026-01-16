# ♾️ EDGELOOP DATA MINER

## Quick Start

### 1. Install Dependencies
```bash
pip install requests
```

### 2. Run the Miner
```bash
python miner.py
```

This will:
- Fetch live NFL data from ESPN's hidden endpoint
- Process games and calculate synthetic model predictions
- Save to `public/telemetry.json`

### 3. View the Dashboard
```bash
npm run dev
```

Navigate to: `http://localhost:3000/edgeloop`

## How It Works

1. **Data Source**: ESPN's undocumented API endpoint (same feed they use)
2. **Processing**: Extracts game state, scores, and betting lines
3. **Model Simulation**: Generates synthetic "Edgeloop Truth" predictions
4. **Output**: JSON file that the React frontend reads in real-time

## Auto-Refresh

The React frontend auto-refreshes every 30 seconds. For continuous updates, run the miner in a loop:

```bash
# Windows PowerShell
while ($true) { python miner.py; Start-Sleep 60 }

# Linux/Mac
while true; do python miner.py; sleep 60; done
```

## Future Integration

Replace the synthetic model in `miner.py` with your trained `nflverse` model predictions to generate real alpha signals.
