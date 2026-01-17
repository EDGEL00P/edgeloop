/**
 * El-Feed - External Data Sources
 * 
 * Connectors for NFL data APIs and NATS JetStream
 */

pub mod balldontlie;

// Re-export for convenience
pub use balldontlie::BallDontLieClient;

pub struct NatsClient;

impl NatsClient {
    pub async fn new() -> anyhow::Result<Self> {
        // TODO: Connect to NATS JetStream
        todo!("Implement NATS connection")
    }
}
