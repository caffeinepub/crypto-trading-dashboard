import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Settings {
    enableToastNotifications: boolean;
    displayUiTheme: string;
    riskTolerance: number;
    enableTimeframeSync: boolean;
    preferredTimeframes: Array<string>;
    confidenceLevel: number;
    alertThreshold: number;
    enableAudioAlerts: boolean;
    aiForecastSensitivity: number;
    enablePerformanceMode: boolean;
    enableBrowserNotifications: boolean;
}
export interface Position {
    id: bigint;
    portfolioId: bigint;
    signalStrength: SignalStrength;
    asset: string;
    userId: Principal;
    takeProfit?: number;
    sellPrice?: number;
    stopLoss?: number;
    buyPrice: number;
    quantity: number;
}
export interface TradeJournalEntry {
    id: bigint;
    pnl: number;
    exitTime?: Time;
    entryTime: Time;
    userId: Principal;
    positionId: bigint;
    notes: string;
    outcome: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Backtest {
    id: bigint;
    userId: Principal;
    createdAt: Time;
    results: string;
    updatedAt?: Time;
    performance: string;
    strategyId: bigint;
}
export interface Strategy {
    id: bigint;
    code: string;
    userId?: Principal;
    name: string;
    description: string;
    performance: string;
}
export interface ReadyToDumpSignal {
    id: bigint;
    stopLossZone: number;
    entryZone: number;
    signalStrength: SignalStrength;
    timeframe: string;
    createdAt: Time;
    takeProfitZone: number;
    confidenceScore: number;
    updatedAt?: Time;
    symbol: string;
}
export interface UserProfile {
    riskTolerance?: number;
    preferredTimeframe?: string;
    name: string;
}
export enum SignalStrength {
    buy = "buy",
    strongBuy = "strongBuy",
    hold = "hold",
    sell = "sell",
    strongSell = "strongSell"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createBacktest(strategyId: bigint, performance: string, results: string): Promise<bigint>;
    createPosition(portfolioId: bigint, asset: string, buyPrice: number, quantity: number, signalStrength: SignalStrength): Promise<bigint>;
    createReadyToDumpSignal(symbol: string, timeframe: string, signalStrength: SignalStrength, confidenceScore: number, entryZone: number, takeProfitZone: number, stopLossZone: number): Promise<bigint>;
    createStrategy(name: string, description: string, performance: string, code: string): Promise<bigint>;
    createTradeJournalEntry(positionId: bigint, outcome: string, notes: string, exitTime: Time | null, pnl: number): Promise<bigint>;
    deleteBacktest(backtestId: bigint): Promise<void>;
    deletePosition(positionId: bigint): Promise<void>;
    deleteReadyToDumpSignal(signalId: bigint): Promise<void>;
    deleteStrategy(strategyId: bigint): Promise<void>;
    deleteTradeJournalEntry(entryId: bigint): Promise<void>;
    fetchCryptoDataFromBinance(): Promise<string>;
    getActiveReadyToDumpSignals(): Promise<Array<ReadyToDumpSignal>>;
    getAllBacktests(): Promise<Array<Backtest>>;
    getAllPositions(): Promise<Array<Position>>;
    getAllReadyToDumpSignals(): Promise<Array<ReadyToDumpSignal>>;
    getAllStrategies(): Promise<Array<Strategy>>;
    getAllTradeJournalEntries(): Promise<Array<TradeJournalEntry>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDefaultSettings(): Promise<Settings>;
    getPositionsByPortfolio(portfolioId: bigint): Promise<Array<Position>>;
    getStrategy(id: bigint): Promise<Strategy | null>;
    getStrategyCode(id: bigint): Promise<string | null>;
    getUserBacktests(): Promise<Array<Backtest>>;
    getUserPositions(): Promise<Array<Position>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserSettings(): Promise<Settings>;
    getUserStrategies(): Promise<Array<Strategy>>;
    getUserTradeJournalEntries(): Promise<Array<TradeJournalEntry>>;
    isCallerAdmin(): Promise<boolean>;
    resetUserSettings(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveUserSettings(settings: Settings): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateBacktest(backtestId: bigint, performance: string, results: string): Promise<void>;
    updatePosition(positionId: bigint, sellPrice: number | null, stopLoss: number | null, takeProfit: number | null): Promise<void>;
    updateReadyToDumpSignal(signalId: bigint, timeframe: string, signalStrength: SignalStrength, confidenceScore: number, entryZone: number, takeProfitZone: number, stopLossZone: number): Promise<void>;
    updateStrategy(strategyId: bigint, name: string, description: string, performance: string, code: string): Promise<void>;
    updateTradeJournalEntry(entryId: bigint, outcome: string, notes: string, exitTime: Time | null, pnl: number): Promise<void>;
}
