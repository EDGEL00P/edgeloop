import type { IsoDateTimeString, GameId, AlertId } from './brand';
export type ClientMessageType = 'auth' | 'subscribe' | 'unsubscribe' | 'ping';
export type ClientMessage = {
    type: 'auth';
    token: string;
} | {
    type: 'subscribe';
    channels: string[];
} | {
    type: 'unsubscribe';
    channels: string[];
} | {
    type: 'ping';
};
export type ServerMessageType = 'auth_success' | 'auth_error' | 'subscribed' | 'unsubscribed' | 'pong' | 'event' | 'error';
export type ServerMessage = {
    type: 'auth_success';
    userId: string;
    permissions: string[];
} | {
    type: 'auth_error';
    code: string;
    message: string;
} | {
    type: 'subscribed';
    channels: string[];
} | {
    type: 'unsubscribed';
    channels: string[];
} | {
    type: 'pong';
} | {
    type: 'event';
    channel: string;
    event: GameEvent | PredictionEvent | OddsEvent | AlertEvent;
} | {
    type: 'error';
    code: string;
    message: string;
};
export type GameEventType = 'game_started' | 'score_update' | 'quarter_change' | 'game_ended' | 'status_change';
export type GameEvent = {
    eventType: GameEventType;
    gameId: GameId;
    timestamp: IsoDateTimeString;
    data: {
        homeScore?: number;
        awayScore?: number;
        quarter?: number;
        timeRemaining?: string;
        possession?: string;
        status?: string;
    };
};
export type PredictionEvent = {
    eventType: 'prediction_updated';
    gameId: GameId;
    timestamp: IsoDateTimeString;
    data: {
        modelVersion: string;
        winProbHome: number;
        winProbAway: number;
        confidence: number;
        edges: Record<string, number>;
    };
};
export type OddsEvent = {
    eventType: 'odds_changed';
    gameId: GameId;
    timestamp: IsoDateTimeString;
    data: {
        provider: string;
        previous: {
            moneylineHome: number;
            moneylineAway: number;
            spreadHome: number;
            total: number;
        };
        current: {
            moneylineHome: number;
            moneylineAway: number;
            spreadHome: number;
            total: number;
        };
    };
};
export type AlertEvent = {
    eventType: 'alert_created';
    alertId: AlertId;
    timestamp: IsoDateTimeString;
    data: {
        severity: 'info' | 'warn' | 'crit';
        type: string;
        title: string;
        gameId?: GameId;
    };
};
export type Channel = 'games' | `games:${string}` | 'predictions' | `predictions:${string}` | 'odds' | `odds:${string}` | 'alerts';
//# sourceMappingURL=events.d.ts.map