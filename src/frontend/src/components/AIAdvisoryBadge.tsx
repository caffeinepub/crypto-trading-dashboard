import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import type { CryptoData } from '@/lib/coinRankingApi';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AIAdvisoryBadgeProps {
  coin: CryptoData;
  sparklineData?: number[];
  compact?: boolean;
}

/**
 * Generate AI advisory text snippet for a cryptocurrency
 * Analyzes momentum and reversal risk based on technical indicators
 */
function generateAdvisoryText(coin: CryptoData, sparklineData?: number[]): {
  text: string;
  type: 'bullish' | 'bearish' | 'neutral' | 'warning';
  icon: React.ReactNode;
} {
  const { rsi, emaSignal, percentChange } = coin;
  
  // Strong bullish momentum
  if (rsi < 35 && emaSignal === 'Bullish' && percentChange > 2) {
    return {
      text: 'Strong bullish momentum building',
      type: 'bullish',
      icon: <TrendingUp className="w-3 h-3" />,
    };
  }
  
  // Oversold with bullish signal
  if (rsi < 30 && emaSignal === 'Bullish') {
    return {
      text: 'Oversold, potential reversal upward',
      type: 'bullish',
      icon: <TrendingUp className="w-3 h-3" />,
    };
  }
  
  // Bullish momentum
  if (emaSignal === 'Bullish' && percentChange > 0 && rsi < 70) {
    return {
      text: 'Bullish momentum, trend intact',
      type: 'bullish',
      icon: <TrendingUp className="w-3 h-3" />,
    };
  }
  
  // Overbought warning
  if (rsi > 70 && emaSignal === 'Bullish') {
    return {
      text: 'Overbought, reversal risk increasing',
      type: 'warning',
      icon: <AlertTriangle className="w-3 h-3" />,
    };
  }
  
  // Strong bearish momentum
  if (rsi > 65 && emaSignal === 'Bearish' && percentChange < -2) {
    return {
      text: 'Strong bearish pressure, caution advised',
      type: 'bearish',
      icon: <TrendingDown className="w-3 h-3" />,
    };
  }
  
  // Overbought with bearish signal
  if (rsi > 70 && emaSignal === 'Bearish') {
    return {
      text: 'Overbought, bearish reversal likely',
      type: 'bearish',
      icon: <TrendingDown className="w-3 h-3" />,
    };
  }
  
  // Bearish momentum
  if (emaSignal === 'Bearish' && percentChange < 0 && rsi > 30) {
    return {
      text: 'Bearish momentum, downtrend active',
      type: 'bearish',
      icon: <TrendingDown className="w-3 h-3" />,
    };
  }
  
  // Oversold with bearish signal
  if (rsi < 30 && emaSignal === 'Bearish') {
    return {
      text: 'Oversold, potential bounce ahead',
      type: 'warning',
      icon: <AlertTriangle className="w-3 h-3" />,
    };
  }
  
  // Neutral/consolidation
  if (rsi >= 40 && rsi <= 60 && Math.abs(percentChange) < 2) {
    return {
      text: 'Consolidating, awaiting direction',
      type: 'neutral',
      icon: <Sparkles className="w-3 h-3" />,
    };
  }
  
  // Default neutral
  return {
    text: 'Monitoring market conditions',
    type: 'neutral',
    icon: <Sparkles className="w-3 h-3" />,
  };
}

export function AIAdvisoryBadge({ coin, sparklineData, compact = false }: AIAdvisoryBadgeProps) {
  const advisory = generateAdvisoryText(coin, sparklineData);
  
  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'bullish':
        return 'bg-green-600/90 hover:bg-green-700 text-white border-green-500';
      case 'bearish':
        return 'bg-red-600/90 hover:bg-red-700 text-white border-red-500';
      case 'warning':
        return 'bg-yellow-600/90 hover:bg-yellow-700 text-white border-yellow-500';
      case 'neutral':
      default:
        return 'bg-muted hover:bg-muted/80 text-foreground border-border';
    }
  };
  
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${getBadgeClass(advisory.type)} gap-1 cursor-help text-xs`}>
              {advisory.icon}
              AI
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs font-semibold">{advisory.text}</p>
            <p className="text-xs text-muted-foreground mt-1">
              RSI: {coin.rsi.toFixed(1)} | EMA: {coin.emaSignal}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <Badge className={`${getBadgeClass(advisory.type)} gap-1.5 text-xs font-medium`}>
      {advisory.icon}
      <span>{advisory.text}</span>
    </Badge>
  );
}
