/**
 * Engine Core Library
 * 
 * This library can be compiled to WASM for browser use.
 * Build command: wasm-pack build --target web
 */

pub mod kelly;
pub mod arbitrage;

pub use kelly::KellyCalculator;
