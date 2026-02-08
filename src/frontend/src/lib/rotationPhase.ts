import type { BucketMetrics } from './rotationMetrics';
import type { DominanceMetrics } from './coinRankingApi';

export interface RotationPhase {
  phase: string;
  confidence: number; // 0-100
  explanation: string;
  signals: string[];
}

// Hysteresis state to prevent rapid flipping
let lastPhase: string | null = null;
let phaseStability = 0;
const STABILITY_THRESHOLD = 2; // Require 2 consecutive confirmations to change phase

/**
 * Infer the current market rotation phase based on dominance and bucket metrics
 * 
 * Phases:
 * - BTC Accumulation: BTC dominance rising, altcoins underperforming
 * - BTC Dominance: BTC strong, altcoins weak
 * - Rotation to ETH: ETH outperforming BTC, majors starting to move
 * - Altcoin Season: Majors and mid-caps outperforming BTC/ETH
 * - Risk-Off: Everything declining, flight to stablecoins
 * - Consolidation: Mixed signals, no clear trend
 */
export function inferRotationPhase(
  bucketMetrics: BucketMetrics[],
  dominanceMetrics: DominanceMetrics
): RotationPhase {
  const btcMetrics = bucketMetrics.find(b => b.bucket === 'BTC');
  const ethMetrics = bucketMetrics.find(b => b.bucket === 'ETH');
  const majorsMetrics = bucketMetrics.find(b => b.bucket === 'Majors');
  const midCapsMetrics = bucketMetrics.find(b => b.bucket === 'Mid-caps');

  if (!btcMetrics || !ethMetrics || !majorsMetrics || !midCapsMetrics) {
    return {
      phase: 'Insufficient Data',
      confidence: 0,
      explanation: 'Not enough data to determine rotation phase.',
      signals: [],
    };
  }

  const signals: string[] = [];
  let phase = 'Consolidation';
  let confidence = 50;

  // BTC Dominance Phase
  if (btcMetrics.performance24h > 2 && btcMetrics.relativePerformanceVsBTC === 0) {
    if (ethMetrics.relativePerformanceVsBTC < -1 && majorsMetrics.relativePerformanceVsBTC < -1) {
      phase = 'BTC Dominance';
      confidence = 75;
      signals.push('BTC outperforming all altcoins');
      signals.push(`ETH underperforming by ${Math.abs(ethMetrics.relativePerformanceVsBTC).toFixed(1)}%`);
      signals.push(`Majors underperforming by ${Math.abs(majorsMetrics.relativePerformanceVsBTC).toFixed(1)}%`);
    }
  }

  // BTC Accumulation Phase
  if (btcMetrics.performance24h > 0 && btcMetrics.performance24h < 2) {
    if (ethMetrics.relativePerformanceVsBTC < 0 && majorsMetrics.relativePerformanceVsBTC < 0) {
      phase = 'BTC Accumulation';
      confidence = 65;
      signals.push('BTC slowly accumulating');
      signals.push('Altcoins consolidating');
    }
  }

  // Rotation to ETH Phase
  if (ethMetrics.relativePerformanceVsBTC > 1 && majorsMetrics.relativePerformanceVsBTC > 0) {
    phase = 'Rotation to ETH';
    confidence = 70;
    signals.push(`ETH outperforming BTC by ${ethMetrics.relativePerformanceVsBTC.toFixed(1)}%`);
    signals.push('Majors starting to move');
    if (majorsMetrics.breadth > 60) {
      signals.push(`${majorsMetrics.breadth.toFixed(0)}% of majors positive`);
      confidence += 10;
    }
  }

  // Altcoin Season Phase
  if (
    majorsMetrics.relativePerformanceVsBTC > 2 &&
    midCapsMetrics.relativePerformanceVsBTC > 1 &&
    majorsMetrics.breadth > 70
  ) {
    phase = 'Altcoin Season';
    confidence = 85;
    signals.push(`Majors outperforming BTC by ${majorsMetrics.relativePerformanceVsBTC.toFixed(1)}%`);
    signals.push(`Mid-caps outperforming BTC by ${midCapsMetrics.relativePerformanceVsBTC.toFixed(1)}%`);
    signals.push(`${majorsMetrics.breadth.toFixed(0)}% of majors positive`);
  }

  // Risk-Off Phase
  if (
    btcMetrics.performance24h < -2 &&
    ethMetrics.performance24h < -2 &&
    majorsMetrics.performance24h < -2
  ) {
    phase = 'Risk-Off';
    confidence = 80;
    signals.push('Broad market decline');
    signals.push(`BTC down ${btcMetrics.performance24h.toFixed(1)}%`);
    signals.push(`ETH down ${ethMetrics.performance24h.toFixed(1)}%`);
    signals.push('Flight to stablecoins likely');
  }

  // Apply hysteresis to prevent rapid phase changes
  if (lastPhase === phase) {
    phaseStability++;
  } else {
    phaseStability = 0;
  }

  if (phaseStability < STABILITY_THRESHOLD && lastPhase !== null) {
    // Return last phase with reduced confidence
    return {
      phase: lastPhase,
      confidence: Math.max(40, confidence - 20),
      explanation: `Monitoring potential shift to ${phase}. Current phase: ${lastPhase}.`,
      signals: [...signals, 'Phase transition in progress'],
    };
  }

  lastPhase = phase;

  const explanation = generateExplanation(phase, btcMetrics, ethMetrics, majorsMetrics, dominanceMetrics);

  return {
    phase,
    confidence,
    explanation,
    signals,
  };
}

function generateExplanation(
  phase: string,
  btcMetrics: BucketMetrics,
  ethMetrics: BucketMetrics,
  majorsMetrics: BucketMetrics,
  dominanceMetrics: DominanceMetrics
): string {
  switch (phase) {
    case 'BTC Dominance':
      return `Bitcoin is leading the market with ${btcMetrics.performance24h.toFixed(1)}% gain while altcoins lag. BTC dominance at ${dominanceMetrics.btcDominance.toFixed(1)}%.`;
    case 'BTC Accumulation':
      return `Bitcoin is slowly accumulating with ${btcMetrics.performance24h.toFixed(1)}% gain. Altcoins are consolidating, waiting for the next move.`;
    case 'Rotation to ETH':
      return `Capital is rotating from BTC to ETH and major altcoins. ETH is outperforming BTC by ${ethMetrics.relativePerformanceVsBTC.toFixed(1)}%.`;
    case 'Altcoin Season':
      return `Strong altcoin season in progress. Majors outperforming BTC by ${majorsMetrics.relativePerformanceVsBTC.toFixed(1)}% with ${majorsMetrics.breadth.toFixed(0)}% breadth.`;
    case 'Risk-Off':
      return `Market-wide decline with BTC down ${btcMetrics.performance24h.toFixed(1)}%. Risk-off sentiment prevails.`;
    case 'Consolidation':
      return `Mixed signals across buckets. Market is consolidating with no clear rotation trend.`;
    default:
      return 'Analyzing market rotation patterns...';
  }
}
