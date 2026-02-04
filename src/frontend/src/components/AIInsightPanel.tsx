import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { CryptoData } from '@/lib/coinRankingApi';

interface AIInsightPanelProps {
  data: CryptoData[];
}

export function AIInsightPanel({ data }: AIInsightPanelProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Calculate market insights
  const bullishCount = data.filter(coin => coin.emaSignal === 'Bullish').length;
  const bearishCount = data.filter(coin => coin.emaSignal === 'Bearish').length;
  const oversoldCount = data.filter(coin => coin.rsi < 30).length;
  const overboughtCount = data.filter(coin => coin.rsi > 70).length;
  const avgRSI = data.reduce((sum, coin) => sum + coin.rsi, 0) / data.length;
  
  const marketSentiment = bullishCount > bearishCount ? 'Bullish' : 'Bearish';
  const sentimentStrength = Math.abs(bullishCount - bearishCount) / data.length;

  // Generate insights
  const insights: string[] = [];
  
  if (sentimentStrength > 0.6) {
    insights.push(`Strong ${marketSentiment.toLowerCase()} momentum detected across ${Math.round(sentimentStrength * 100)}% of tracked cryptocurrencies.`);
  } else if (sentimentStrength > 0.3) {
    insights.push(`Moderate ${marketSentiment.toLowerCase()} trend observed in the market with ${bullishCount} bullish vs ${bearishCount} bearish EMA signals.`);
  } else {
    insights.push(`Market showing mixed signals with balanced bullish (${bullishCount}) and bearish (${bearishCount}) indicators.`);
  }

  if (oversoldCount > 0) {
    insights.push(`${oversoldCount} cryptocurrency${oversoldCount > 1 ? 'ies' : 'y'} showing oversold conditions (RSI < 30), potential buying opportunities.`);
  }

  if (overboughtCount > 0) {
    insights.push(`${overboughtCount} cryptocurrency${overboughtCount > 1 ? 'ies' : 'y'} in overbought territory (RSI > 70), consider taking profits.`);
  }

  if (avgRSI < 40) {
    insights.push(`Average market RSI of ${avgRSI.toFixed(1)} suggests overall oversold conditions across the market.`);
  } else if (avgRSI > 60) {
    insights.push(`Average market RSI of ${avgRSI.toFixed(1)} indicates strong momentum but potential for correction.`);
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Market Insights
        </CardTitle>
        <CardDescription>
          Real-time analysis based on technical indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Market Sentiment */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border">
          <div className="flex items-center gap-3">
            {marketSentiment === 'Bullish' ? (
              <TrendingUp className="w-6 h-6 text-green-500" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-500" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Market Sentiment</p>
              <p className="text-lg font-bold">{marketSentiment}</p>
            </div>
          </div>
          <Badge 
            variant={marketSentiment === 'Bullish' ? 'default' : 'secondary'}
            className={marketSentiment === 'Bullish' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-red-600 hover:bg-red-700 text-white'
            }
          >
            {Math.round(sentimentStrength * 100)}% Strength
          </Badge>
        </div>

        {/* Average RSI */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-background/50 border">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Average RSI</p>
              <p className="text-lg font-bold">{avgRSI.toFixed(1)}</p>
            </div>
          </div>
          <Badge 
            variant="outline"
            className={
              avgRSI < 30 ? 'border-green-500 text-green-600 dark:text-green-400' :
              avgRSI > 70 ? 'border-red-500 text-red-600 dark:text-red-400' :
              'border-muted-foreground/30'
            }
          >
            {avgRSI < 30 ? 'Oversold' : avgRSI > 70 ? 'Overbought' : 'Neutral'}
          </Badge>
        </div>

        {/* Insights List */}
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className="p-3 rounded-lg bg-background/50 border border-primary/20 text-sm"
            >
              <p className="text-foreground/90">{insight}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
