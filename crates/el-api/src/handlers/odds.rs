use axum::response::Sse;
use futures_util::stream;
use serde::Serialize;
use std::convert::Infallible;

#[derive(Serialize, Clone)]
struct OddsUpdate {
    game_id: String,
    book: String,
    spread_home: f64,
    timestamp: i64,
}

// TODO: Connect to NATS JetStream for real-time odds
pub async fn stream_odds() -> Sse<impl futures_util::Stream<Item = Result<axum::response::sse::Event, Infallible>>> {
    // Placeholder - will be replaced with NATS JetStream subscription
    let stream = stream::repeat_with(|| {
        Ok(axum::response::sse::Event::default().data("odds update placeholder"))
    })
    .take(10);

    Sse::new(stream)
}
