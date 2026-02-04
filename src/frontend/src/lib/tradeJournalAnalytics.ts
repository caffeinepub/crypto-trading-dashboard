// Real-Time Trade Journal Analytics
// Tracks and analyzes trade outcomes and forecast accuracy

import type { AlertHistory } from './alertSystem';
import type { ClosedPosition } from './portfolioSimulation';

export interface JournalEntry {
  id: string;
  timestamp: number;
  symbol: string;
  name: string;
  signalType: 'entry' | 'exit' | 'strongBuy' | 'strongSell' | 'shortEntry' | 'coverExit';
  confidence: number;
  entryPrice: number;
  exitPrice?: number;
  outcome?: 'win' | 'loss' | 'pending';
  pnl?: number;
  roi?: number;
  linkedAlertId?: string;
  linkedPositionId?: string;
  notes?: string;
}

export interface JournalAnalytics {
  totalEntries: number;
  completedTrades: number;
  winRate: number;
  avgConfidence: number;
  confidenceCorrelation: number;
  outcomeDistribution: {
    wins: number;
    losses: number;
    pending: number;
  };
  performanceTrend: Array<{ date: string; winRate: number }>;
  confidenceAccuracy: Array<{ range: string; accuracy: number }>;
}

const STORAGE_KEY = 'trade_journal_entries';

// Get journal entries
export function getJournalEntries(): JournalEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Trade Journal] Error loading entries:', error);
    return [];
  }
}

// Add journal entry from alert
export function addJournalEntryFromAlert(alert: AlertHistory): JournalEntry {
  try {
    const entries = getJournalEntries();
    const entry: JournalEntry = {
      id: `journal-${Date.now()}`,
      timestamp: alert.timestamp,
      symbol: alert.symbol,
      name: alert.name,
      signalType: alert.type,
      confidence: alert.confidence,
      entryPrice: alert.price,
      outcome: 'pending',
      linkedAlertId: alert.id,
    };
    
    entries.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    console.log('[Trade Journal] Added entry from alert:', entry);
    return entry;
  } catch (error) {
    console.error('[Trade Journal] Error adding entry:', error);
    throw error;
  }
}

// Update journal entry with outcome
export function updateJournalEntryOutcome(
  entryId: string,
  exitPrice: number,
  outcome: 'win' | 'loss',
  pnl: number,
  roi: number
): void {
  try {
    const entries = getJournalEntries();
    const index = entries.findIndex(e => e.id === entryId);
    
    if (index !== -1) {
      entries[index] = {
        ...entries[index],
        exitPrice,
        outcome,
        pnl,
        roi,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      console.log('[Trade Journal] Updated entry outcome:', entries[index]);
    }
  } catch (error) {
    console.error('[Trade Journal] Error updating entry:', error);
  }
}

// Link journal entry to position
export function linkJournalEntryToPosition(entryId: string, positionId: string): void {
  try {
    const entries = getJournalEntries();
    const index = entries.findIndex(e => e.id === entryId);
    
    if (index !== -1) {
      entries[index].linkedPositionId = positionId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    }
  } catch (error) {
    console.error('[Trade Journal] Error linking position:', error);
  }
}

// Sync journal with closed positions
export function syncJournalWithPositions(closedPositions: ClosedPosition[]): void {
  try {
    const entries = getJournalEntries();
    
    closedPositions.forEach(position => {
      const entry = entries.find(e => e.linkedPositionId === position.id);
      if (entry && entry.outcome === 'pending') {
        updateJournalEntryOutcome(
          entry.id,
          position.exitPrice,
          position.pnl > 0 ? 'win' : 'loss',
          position.pnl,
          position.roi
        );
      }
    });
  } catch (error) {
    console.error('[Trade Journal] Error syncing with positions:', error);
  }
}

// Calculate journal analytics
export function calculateJournalAnalytics(): JournalAnalytics {
  const entries = getJournalEntries();
  const completed = entries.filter(e => e.outcome !== 'pending');
  
  const wins = completed.filter(e => e.outcome === 'win').length;
  const losses = completed.filter(e => e.outcome === 'loss').length;
  const pending = entries.filter(e => e.outcome === 'pending').length;
  
  const winRate = completed.length > 0 ? (wins / completed.length) * 100 : 0;
  const avgConfidence = entries.length > 0
    ? entries.reduce((sum, e) => sum + e.confidence, 0) / entries.length
    : 0;
  
  // Calculate confidence correlation
  const confidenceCorrelation = calculateConfidenceCorrelation(completed);
  
  // Calculate performance trend (last 7 days)
  const performanceTrend = calculatePerformanceTrend(completed);
  
  // Calculate confidence accuracy by range
  const confidenceAccuracy = calculateConfidenceAccuracy(completed);
  
  return {
    totalEntries: entries.length,
    completedTrades: completed.length,
    winRate,
    avgConfidence,
    confidenceCorrelation,
    outcomeDistribution: { wins, losses, pending },
    performanceTrend,
    confidenceAccuracy,
  };
}

// Calculate confidence correlation with outcomes
function calculateConfidenceCorrelation(entries: JournalEntry[]): number {
  if (entries.length < 2) return 0;
  
  const wins = entries.filter(e => e.outcome === 'win');
  const avgWinConfidence = wins.length > 0
    ? wins.reduce((sum, e) => sum + e.confidence, 0) / wins.length
    : 0;
  
  const losses = entries.filter(e => e.outcome === 'loss');
  const avgLossConfidence = losses.length > 0
    ? losses.reduce((sum, e) => sum + e.confidence, 0) / losses.length
    : 0;
  
  return avgWinConfidence - avgLossConfidence;
}

// Calculate performance trend over time
function calculatePerformanceTrend(entries: JournalEntry[]): Array<{ date: string; winRate: number }> {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });
  
  return last7Days.map(date => {
    const dayEntries = entries.filter(e => {
      const entryDate = new Date(e.timestamp).toISOString().split('T')[0];
      return entryDate === date;
    });
    
    const wins = dayEntries.filter(e => e.outcome === 'win').length;
    const winRate = dayEntries.length > 0 ? (wins / dayEntries.length) * 100 : 0;
    
    return { date, winRate };
  });
}

// Calculate confidence accuracy by range
function calculateConfidenceAccuracy(entries: JournalEntry[]): Array<{ range: string; accuracy: number }> {
  const ranges = [
    { range: '50-60%', min: 50, max: 60 },
    { range: '60-70%', min: 60, max: 70 },
    { range: '70-80%', min: 70, max: 80 },
    { range: '80-90%', min: 80, max: 90 },
    { range: '90-100%', min: 90, max: 100 },
  ];
  
  return ranges.map(({ range, min, max }) => {
    const rangeEntries = entries.filter(e => e.confidence >= min && e.confidence < max);
    const wins = rangeEntries.filter(e => e.outcome === 'win').length;
    const accuracy = rangeEntries.length > 0 ? (wins / rangeEntries.length) * 100 : 0;
    
    return { range, accuracy };
  });
}
