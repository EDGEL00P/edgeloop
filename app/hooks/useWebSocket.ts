"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type JsonRecord = Record<string, unknown>;

interface UseWebSocketOptions {
  /** Optional override for the WS endpoint. If omitted, NEXT_PUBLIC_WS_URL is used, else NEXT_PUBLIC_API_URL → ws://api-host/ws */
  url?: string;
  /** If provided, used to derive ws URL when url is absent. */
  apiBase?: string;
  gameId?: number;
  subscribeToAll?: boolean;
  subscribeToBettingSignals?: boolean;
  retry?: boolean;
  maxRetries?: number;
  reconnectIntervalMs?: number;
}

interface WebSocketMessage extends JsonRecord {
  type?: string;
  odds?: JsonRecord;
  score?: JsonRecord;
  signal?: JsonRecord;
  lineMovement?: JsonRecord;
  timestamp?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    url,
    apiBase,
    gameId,
    subscribeToAll,
    subscribeToBettingSignals,
    retry = true,
    maxRetries = 5,
    reconnectIntervalMs = 3000,
  } = options;

  const [connected, setConnected] = useState(false);
  const [oddsData, setOddsData] = useState<JsonRecord | null>(null);
  const [scoreData, setScoreData] = useState<JsonRecord | null>(null);
  const [signals, setSignals] = useState<JsonRecord[]>([]);
  const [lineMovements, setLineMovements] = useState<JsonRecord[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const latestGameId = useRef<number | undefined>(gameId);

  const resolveWsUrl = useCallback(() => {
    if (url) return url;
    const envWs = process.env.NEXT_PUBLIC_WS_URL;
    if (envWs) return envWs;

    const base = apiBase || process.env.NEXT_PUBLIC_API_URL;
    if (!base) return undefined;

    try {
      const parsed = new URL(base);
      parsed.protocol = parsed.protocol.startsWith("https") ? "wss:" : "ws:";
      // Assume server exposes /ws endpoint; adjustable if backend differs
      parsed.pathname = parsed.pathname.replace(/\/$/, "") + "/ws";
      return parsed.toString();
    } catch {
      return undefined;
    }
  }, [apiBase, url]);

  const sendMessage = useCallback((payload: JsonRecord) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  const subscribeToGame = useCallback((newGameId: number) => {
    latestGameId.current = newGameId;
    sendMessage({ type: "subscribe:game", gameId: newGameId });
  }, [sendMessage]);

  const unsubscribeFromGame = useCallback((oldGameId: number) => {
    sendMessage({ type: "unsubscribe:game", gameId: oldGameId });
  }, [sendMessage]);

  useEffect(() => {
    const wsUrl = resolveWsUrl();
    if (!wsUrl) {
      // No WS endpoint configured; stay inert
      return () => undefined;
    }

    let closedByUser = false;

    const connect = () => {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setConnected(true);
        retryRef.current = 0;

        if (subscribeToAll) {
          sendMessage({ type: "subscribe:all" });
        }
        if (subscribeToBettingSignals) {
          sendMessage({ type: "subscribe:signals" });
        }
        if (latestGameId.current) {
          sendMessage({ type: "subscribe:game", gameId: latestGameId.current });
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as WebSocketMessage;
          if (data.odds) setOddsData(data.odds);
          if (data.score) setScoreData(data.score);
          if (data.signal) setSignals((prev) => [data.signal as JsonRecord, ...prev].slice(0, 50));
          if (data.lineMovement) setLineMovements((prev) => [data.lineMovement as JsonRecord, ...prev].slice(0, 100));
        } catch (error) {
          // Swallow parse errors to avoid tearing down the stream
          console.warn("ws_message_parse_error", { error: String(error) });
        }
      };

      socket.onerror = () => {
        // Errors are handled by close/reconnect; no-op to avoid React warnings
      };

      socket.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (closedByUser) return;
        if (!retry || retryRef.current >= maxRetries) return;

        retryRef.current += 1;
        const delay = reconnectIntervalMs;
        setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closedByUser = true;
      retryRef.current = 0;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [resolveWsUrl, subscribeToAll, subscribeToBettingSignals, retry, maxRetries, reconnectIntervalMs, sendMessage]);

  return {
    connected,
    oddsData,
    scoreData,
    signals,
    lineMovements,
    subscribeToGame,
    unsubscribeFromGame,
  };
}
