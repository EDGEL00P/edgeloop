/**
 * Rust Engine Bridge - Apache Arrow IPC Integration
 * Connects Next.js frontend to Rust backend for high-performance data processing
 * Expects binary Apache Arrow IPC format responses
 */

export interface RustEngineConfig {
  baseUrl: string;
  timeout?: number;
}

export interface ArrowResponse {
  data: ArrayBuffer;
  contentType: string;
  metadata?: Record<string, string>;
}

let engineBridge: RustEngineBridge | null = null;

/**
 * Rust Engine Bridge Client
 * Handles communication with Rust backend using Apache Arrow IPC format
 */
class RustEngineBridge {
  private config: Required<RustEngineConfig>;

  constructor(config: RustEngineConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout || 30000, // 30 seconds default
    };
  }

  /**
   * Call Rust engine endpoint and parse Arrow IPC response
   * 
   * @param endpoint - API endpoint path
   * @param payload - Request payload (will be JSON stringified)
   * @returns Arrow IPC binary data
   */
  async call(
    endpoint: string,
    payload?: unknown
  ): Promise<ArrayBuffer> {
    const url = new URL(endpoint, this.config.baseUrl);

    const headers: HeadersInit = {
      "Accept": "application/x-arrow", // Arrow IPC format
      "Content-Type": "application/json",
    };

    const body = payload ? JSON.stringify(payload) : undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(url.toString(), {
        method: payload ? "POST" : "GET",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Rust engine request failed: ${response.status} - ${errorText}`
        );
      }

      // Read as ArrayBuffer for Arrow IPC binary format
      const arrayBuffer = await response.arrayBuffer();
      
      return arrayBuffer;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Rust engine request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Call Rust engine and return JSON (for endpoints that return JSON)
   * Some endpoints may return JSON instead of Arrow IPC
   */
  async callJSON<T>(endpoint: string, payload?: unknown): Promise<T> {
    const url = new URL(endpoint, this.config.baseUrl);

    const headers: HeadersInit = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };

    const body = payload ? JSON.stringify(payload) : undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(url.toString(), {
        method: payload ? "POST" : "GET",
        headers,
        body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Rust engine request failed: ${response.status} - ${errorText}`
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Rust engine request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async health(): Promise<{ status: string; version?: string }> {
    return this.callJSON<{ status: string; version?: string }>("/health");
  }

  /**
   * Get prediction from Rust engine (expects Arrow IPC)
   */
  async getPrediction(params: {
    home_team_id: number;
    away_team_id: number;
    season?: number;
    week?: number;
  }): Promise<ArrayBuffer> {
    return this.call("/api/v1/genesis/predict", params);
  }
}

/**
 * Get or initialize Rust Engine Bridge
 */
export function getEngineBridge(): RustEngineBridge {
  if (!engineBridge) {
    const baseUrl = process.env.RUST_ENGINE_URL;

    if (!baseUrl) {
      throw new Error("RUST_ENGINE_URL must be set");
    }

    engineBridge = new RustEngineBridge({
      baseUrl,
      timeout: process.env.RUST_ENGINE_TIMEOUT
        ? parseInt(process.env.RUST_ENGINE_TIMEOUT, 10)
        : undefined,
    });
  }

  return engineBridge;
}

/**
 * Check if Rust engine is configured
 */
export function isEngineConfigured(): boolean {
  return !!process.env.RUST_ENGINE_URL;
}

/**
 * Convenience function to call Rust engine
 */
export async function callRustEngine(
  endpoint: string,
  payload?: unknown
): Promise<ArrayBuffer> {
  const bridge = getEngineBridge();
  return bridge.call(endpoint, payload);
}
