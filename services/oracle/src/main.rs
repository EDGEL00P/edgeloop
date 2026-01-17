/**
 * Oracle - The Predictor Service
 * 
 * Listens to NATS JetStream for odds updates.
 * Runs Burn ML model inference to generate predictions.
 * Publishes picks back to NATS stream.
 */

use anyhow::Result;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "oracle=info".into()),
        )
        .init();

    info!("🔮 Oracle predictor starting...");
    info!("🧠 Loading Burn ML model...");
    info!("📡 Subscribing to NATS stream 'odds.nfl'...");
    
    // TODO: Load Burn model from el-brain
    // TODO: Subscribe to NATS "odds.nfl" stream
    // TODO: On odds update: run inference with Burn model
    // TODO: Calculate edge and confidence
    // TODO: Publish prediction to "predictions.nfl" stream
    
    info!("✅ Oracle ready (stub implementation)");
    
    // Keep running
    tokio::signal::ctrl_c().await?;
    info!("🛑 Oracle shutting down...");
    
    Ok(())
}
