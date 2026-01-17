/**
 * Sentinel - The Scraper Service
 * 
 * Uses ChromiumOxide (Headless Chrome in Rust) to scrape odds from sportsbooks.
 * Publishes updates to NATS JetStream for real-time distribution.
 */

use anyhow::Result;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "sentinel=info".into()),
        )
        .init();

    info!("👁️  Sentinel scraper starting...");
    info!("📡 Connecting to NATS JetStream...");
    
    // TODO: Initialize ChromiumOxide browser
    // TODO: Set up NATS connection
    // TODO: Scrape odds from sportsbooks
    // TODO: Publish to NATS stream "odds.nfl"
    
    info!("✅ Sentinel ready (stub implementation)");
    
    // Keep running
    tokio::signal::ctrl_c().await?;
    info!("🛑 Sentinel shutting down...");
    
    Ok(())
}
