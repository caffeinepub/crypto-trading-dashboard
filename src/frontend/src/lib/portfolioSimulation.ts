// Portfolio Simulation Module
// Manages virtual trading positions and portfolio performance tracking

import type { CryptoData } from './coinRankingApi';
import type { SignalStrength } from '../backend';

export interface SimulatedPosition {
  id: string;
  symbol: string;
  name: string;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  entryTime: number;
  signalType: 'long' | 'short';
  signalStrength: SignalStrength;
  stopLoss?: number;
  takeProfit?: number;
  linkedSignalId?: string;
}

export interface PortfolioMetrics {
  totalValue: number;
  totalInvested: number;
  unrealizedPnL: number;
  realizedPnL: number;
  totalPnL: number;
  roi: number;
  positionCount: number;
  winningPositions: number;
  losingPositions: number;
  exposureByAsset: Record<string, number>;
  avgHoldingTime: number;
}

export interface ClosedPosition extends SimulatedPosition {
  exitPrice: number;
  exitTime: number;
  pnl: number;
  roi: number;
}

const STORAGE_KEY_POSITIONS = 'portfolio_simulation_positions';
const STORAGE_KEY_CLOSED = 'portfolio_simulation_closed';
const STORAGE_KEY_CAPITAL = 'portfolio_simulation_capital';
const DEFAULT_CAPITAL = 10000;

// Get active positions
export function getActivePositions(): SimulatedPosition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_POSITIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Portfolio Simulation] Error loading positions:', error);
    return [];
  }
}

// Get closed positions
export function getClosedPositions(): ClosedPosition[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CLOSED);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Portfolio Simulation] Error loading closed positions:', error);
    return [];
  }
}

// Get available capital
export function getAvailableCapital(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CAPITAL);
    return stored ? parseFloat(stored) : DEFAULT_CAPITAL;
  } catch (error) {
    console.error('[Portfolio Simulation] Error loading capital:', error);
    return DEFAULT_CAPITAL;
  }
}

// Set available capital
export function setAvailableCapital(capital: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_CAPITAL, capital.toString());
  } catch (error) {
    console.error('[Portfolio Simulation] Error saving capital:', error);
  }
}

// Open new position
export function openPosition(
  crypto: CryptoData,
  quantity: number,
  signalType: 'long' | 'short',
  signalStrength: SignalStrength,
  stopLoss?: number,
  takeProfit?: number,
  linkedSignalId?: string
): SimulatedPosition | null {
  try {
    const positions = getActivePositions();
    const capital = getAvailableCapital();
    const cost = crypto.price * quantity;

    if (cost > capital) {
      console.warn('[Portfolio Simulation] Insufficient capital');
      return null;
    }

    const position: SimulatedPosition = {
      id: `${crypto.symbol}-${Date.now()}`,
      symbol: crypto.symbol,
      name: crypto.name,
      entryPrice: crypto.price,
      currentPrice: crypto.price,
      quantity,
      entryTime: Date.now(),
      signalType,
      signalStrength,
      stopLoss,
      takeProfit,
      linkedSignalId,
    };

    positions.push(position);
    localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(positions));
    setAvailableCapital(capital - cost);

    console.log('[Portfolio Simulation] Opened position:', position);
    return position;
  } catch (error) {
    console.error('[Portfolio Simulation] Error opening position:', error);
    return null;
  }
}

// Close position
export function closePosition(positionId: string, exitPrice: number): ClosedPosition | null {
  try {
    const positions = getActivePositions();
    const positionIndex = positions.findIndex(p => p.id === positionId);

    if (positionIndex === -1) {
      console.warn('[Portfolio Simulation] Position not found');
      return null;
    }

    const position = positions[positionIndex];
    const pnl = position.signalType === 'long'
      ? (exitPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - exitPrice) * position.quantity;
    const roi = (pnl / (position.entryPrice * position.quantity)) * 100;

    const closedPosition: ClosedPosition = {
      ...position,
      exitPrice,
      exitTime: Date.now(),
      pnl,
      roi,
    };

    // Remove from active positions
    positions.splice(positionIndex, 1);
    localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(positions));

    // Add to closed positions
    const closed = getClosedPositions();
    closed.push(closedPosition);
    localStorage.setItem(STORAGE_KEY_CLOSED, JSON.stringify(closed));

    // Return capital
    const capital = getAvailableCapital();
    const returnedCapital = position.entryPrice * position.quantity + pnl;
    setAvailableCapital(capital + returnedCapital);

    console.log('[Portfolio Simulation] Closed position:', closedPosition);
    return closedPosition;
  } catch (error) {
    console.error('[Portfolio Simulation] Error closing position:', error);
    return null;
  }
}

// Update position prices
export function updatePositionPrices(cryptoData: CryptoData[]): void {
  try {
    const positions = getActivePositions();
    const priceMap = new Map(cryptoData.map(c => [c.symbol, c.price]));

    const updated = positions.map(position => {
      const currentPrice = priceMap.get(position.symbol);
      return currentPrice ? { ...position, currentPrice } : position;
    });

    localStorage.setItem(STORAGE_KEY_POSITIONS, JSON.stringify(updated));
  } catch (error) {
    console.error('[Portfolio Simulation] Error updating prices:', error);
  }
}

// Calculate portfolio metrics
export function calculatePortfolioMetrics(cryptoData: CryptoData[]): PortfolioMetrics {
  const positions = getActivePositions();
  const closed = getClosedPositions();
  const priceMap = new Map(cryptoData.map(c => [c.symbol, c.price]));

  let totalValue = getAvailableCapital();
  let totalInvested = 0;
  let unrealizedPnL = 0;
  let winningPositions = 0;
  let losingPositions = 0;
  const exposureByAsset: Record<string, number> = {};
  let totalHoldingTime = 0;

  // Calculate active positions
  positions.forEach(position => {
    const currentPrice = priceMap.get(position.symbol) || position.currentPrice;
    const positionValue = currentPrice * position.quantity;
    const invested = position.entryPrice * position.quantity;
    const pnl = position.signalType === 'long'
      ? (currentPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - currentPrice) * position.quantity;

    totalValue += positionValue;
    totalInvested += invested;
    unrealizedPnL += pnl;

    if (pnl > 0) winningPositions++;
    else if (pnl < 0) losingPositions++;

    exposureByAsset[position.symbol] = (exposureByAsset[position.symbol] || 0) + positionValue;
    totalHoldingTime += Date.now() - position.entryTime;
  });

  // Calculate realized PnL
  const realizedPnL = closed.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalPnL = unrealizedPnL + realizedPnL;
  const roi = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
  const avgHoldingTime = positions.length > 0 ? totalHoldingTime / positions.length : 0;

  return {
    totalValue,
    totalInvested,
    unrealizedPnL,
    realizedPnL,
    totalPnL,
    roi,
    positionCount: positions.length,
    winningPositions,
    losingPositions,
    exposureByAsset,
    avgHoldingTime,
  };
}

// Reset portfolio
export function resetPortfolio(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_POSITIONS);
    localStorage.removeItem(STORAGE_KEY_CLOSED);
    setAvailableCapital(DEFAULT_CAPITAL);
    console.log('[Portfolio Simulation] Portfolio reset');
  } catch (error) {
    console.error('[Portfolio Simulation] Error resetting portfolio:', error);
  }
}
