import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, Target, Sparkles, AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatPercentage, formatLargeNumber } from '@/lib/utils';
import { CoinChart } from './CoinChart';
import type { CryptoData } from '@/lib/coinRankingApi';
import type { CryptoForecast } from '@/lib/forecastEngine';
import type { EntryZoneSignal, ExitZoneSignal, TradingZone } from '@/lib/tradeEntryZone';
import { getConfidenceBadgeClass } from '@/lib/tradeEntryZone';

interface CoinDetailDialogProps {
  coin: CryptoData | null;
  forecast?: CryptoForecast | null;
  entryZone?: EntryZoneSignal | null;
  exitZone?: ExitZoneSignal | null;
  tradingZone?: TradingZone | null;
  sparklineData?: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoinDetailDialog({ coin, forecast, entryZone, exitZone, tradingZone, sparklineData, open, onOpenChange }: CoinDetailDialogProps) {
  if (!coin) return null;

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High':
        return 'bg-green-600 text-white';
      case 'Medium':
        return 'bg-yellow-600 text-white';
      case 'Low':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto modal-solid-bg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl text-foreground">
            <span className="font-bold">{coin.symbol}</span>
            <span className="text-muted-foreground">-</span>
            <span>{coin.name}</span>
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Comprehensive analysis with Smart Trade Confidence System, AI forecasts, and dynamic entry/exit recommendations
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="forecast">AI Forecast</TabsTrigger>
            <TabsTrigger value="zones">Trade Zones</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="card-solid-bg">
              <CardHeader>
                <CardTitle className="text-foreground">Market Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Current Price</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(coin.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">24h Change</p>
                    <p className={`text-2xl font-bold ${coin.percentChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatPercentage(coin.percentChange)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Volume (24h)</p>
                    <p className="text-lg font-semibold text-foreground">{formatLargeNumber(coin.volume)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Market Cap</p>
                    <p className="text-lg font-semibold text-foreground">{formatLargeNumber(coin.marketCap)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-solid-bg">
              <CardHeader>
                <CardTitle className="text-foreground">Technical Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-foreground">RSI (14)</span>
                  <Badge 
                    variant="outline"
                    className={`font-semibold ${
                      coin.rsi > 70 ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-500/10' :
                      coin.rsi < 30 ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-500/10' :
                      'border-muted-foreground/30 text-foreground'
                    }`}
                  >
                    {coin.rsi.toFixed(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium text-foreground">EMA Signal</span>
                  <Badge 
                    className={`font-semibold ${coin.emaSignal === 'Bullish' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {coin.emaSignal}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chart Tab */}
          <TabsContent value="chart" className="space-y-4">
            <Card className="card-solid-bg">
              <CardHeader>
                <CardTitle className="text-foreground">Price Chart with Smart Trade Zones</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Visual representation with AI-powered confidence overlays
                </CardDescription>
              </CardHeader>
              <CardContent className="chart-container-solid">
                <CoinChart coin={coin} sparklineData={sparklineData} tradingZone={tradingZone || undefined} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Forecast Tab */}
          <TabsContent value="forecast" className="space-y-4">
            {forecast ? (
              <>
                <Card className="card-solid-bg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Sparkles className="w-5 h-5 text-accent" />
                      AI Price Predictions with Confidence Analysis
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Multi-timeframe forecasts with Smart Trade Confidence integration
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {forecast.predictions.map((prediction) => (
                      <div
                        key={prediction.timeframe}
                        className={`p-4 rounded-lg border-2 ${
                          prediction.isBullish
                            ? 'bg-green-500/10 border-green-500/40'
                            : 'bg-red-500/10 border-red-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {prediction.isBullish ? (
                              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                            <span className="font-bold text-foreground">{prediction.timeframe.toUpperCase()}</span>
                          </div>
                          <Badge className={getConfidenceColor(prediction.confidence)}>
                            {prediction.confidence}
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Predicted Change</p>
                          <p className={`text-2xl font-bold ${
                            prediction.isBullish ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {prediction.predictedChange > 0 ? '+' : ''}{prediction.predictedChange.toFixed(2)}%
                          </p>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{prediction.interpretation}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="card-solid-bg">
                <CardContent className="py-12 text-center">
                  <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No forecast data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Trade Zones Tab */}
          <TabsContent value="zones" className="space-y-4">
            {/* Entry Zone */}
            {entryZone?.isActive ? (
              <Card className="border-green-500/50 bg-green-500/5 card-solid-bg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                    Smart Entry Zone Active
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    AI-powered entry recommendation with dynamic confidence scoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Smart Entry Badge */}
                  <div className="p-4 rounded-lg bg-green-500/20 border-2 border-green-500/40">
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src="/assets/generated/smart-entry-indicator.dim_100x40.png" 
                        alt="Smart Entry" 
                        className="h-6"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        SMART ENTRY ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Activated at {new Date(entryZone.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Trade Success Probability */}
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">Trade Success Probability</span>
                      <Badge className={getConfidenceBadgeClass(entryZone.tradeSuccessProbability)}>
                        {entryZone.tradeSuccessProbability}%
                      </Badge>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full transition-all ${
                          entryZone.tradeSuccessProbability >= 70 ? 'bg-green-600' :
                          entryZone.tradeSuccessProbability >= 40 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${entryZone.tradeSuccessProbability}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground">
                      {entryZone.tradeSuccessProbability >= 70 ? '🎯 High confidence entry opportunity' : 
                       entryZone.tradeSuccessProbability >= 40 ? '⚠️ Medium confidence - proceed with caution' : 
                       '⚡ Low confidence - wait for better setup'}
                    </p>
                  </div>

                  {/* Entry Price Range */}
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Recommended Entry Price Range</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Low</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(entryZone.entryPriceRange.low)}</p>
                      </div>
                      <span className="text-muted-foreground">to</span>
                      <div>
                        <p className="text-xs text-muted-foreground">High</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(entryZone.entryPriceRange.high)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Confidence and Strength */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Confidence Level</p>
                      <Badge className={`${getConfidenceColor(entryZone.confidence)} text-base`}>
                        {entryZone.confidence}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Signal Strength</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {entryZone.strength}%
                      </p>
                    </div>
                  </div>

                  {/* AI Forecast Guidance */}
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-accent" />
                      <span className="text-sm font-semibold text-accent">AI Forecast Guidance</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      AI analysis indicates {entryZone.confidence.toLowerCase()} confidence for entry with {entryZone.tradeSuccessProbability}% success probability based on technical indicators and historical performance.
                    </p>
                  </div>

                  {/* Indicators */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <p className="text-sm font-semibold text-foreground mb-2">Active Indicators</p>
                    <div className="flex items-center gap-2">
                      {entryZone.indicators.rsiOversold ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={entryZone.indicators.rsiOversold ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        RSI Oversold (&lt;35)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {entryZone.indicators.emaCrossover ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={entryZone.indicators.emaCrossover ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        Bullish EMA Crossover
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {entryZone.indicators.macdPositive ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={entryZone.indicators.macdPositive ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        Positive MACD
                      </span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm font-semibold text-foreground mb-2">Smart Entry Recommendation</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {entryZone.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Exit Zone */}
            {exitZone?.isActive ? (
              <Card className="border-red-500/50 bg-red-500/5 card-solid-bg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    Dynamic Exit Zone Active
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    AI-powered exit recommendation with dynamic confidence scoring
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Dynamic Exit Badge */}
                  <div className="p-4 rounded-lg bg-red-500/20 border-2 border-red-500/40">
                    <div className="flex items-center gap-2 mb-2">
                      <img 
                        src="/assets/generated/dynamic-exit-indicator.dim_100x40.png" 
                        alt="Dynamic Exit" 
                        className="h-6"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-lg font-bold text-red-600 dark:text-red-400">
                        DYNAMIC EXIT RECOMMENDED
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Activated at {new Date(exitZone.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Trade Success Probability */}
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">Exit Success Probability</span>
                      <Badge className={getConfidenceBadgeClass(exitZone.tradeSuccessProbability)}>
                        {exitZone.tradeSuccessProbability}%
                      </Badge>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full transition-all ${
                          exitZone.tradeSuccessProbability >= 70 ? 'bg-red-600' :
                          exitZone.tradeSuccessProbability >= 40 ? 'bg-yellow-600' :
                          'bg-orange-600'
                        }`}
                        style={{ width: `${exitZone.tradeSuccessProbability}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground">
                      {exitZone.tradeSuccessProbability >= 70 ? '🎯 High confidence exit opportunity' : 
                       exitZone.tradeSuccessProbability >= 40 ? '⚠️ Medium confidence - monitor closely' : 
                       '⚡ Low confidence - wait for confirmation'}
                    </p>
                  </div>

                  {/* Exit Price Range */}
                  <div className="p-4 rounded-lg bg-muted/50 border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Recommended Exit Price Range</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Low</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(exitZone.exitPriceRange.low)}</p>
                      </div>
                      <span className="text-muted-foreground">to</span>
                      <div>
                        <p className="text-xs text-muted-foreground">High</p>
                        <p className="text-xl font-bold text-foreground">{formatCurrency(exitZone.exitPriceRange.high)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Confidence and Strength */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Confidence Level</p>
                      <Badge className={`${getConfidenceColor(exitZone.confidence)} text-base`}>
                        {exitZone.confidence}
                      </Badge>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Signal Strength</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {exitZone.strength}%
                      </p>
                    </div>
                  </div>

                  {/* AI Forecast Guidance */}
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-accent" />
                      <span className="text-sm font-semibold text-accent">AI Forecast Guidance</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      AI analysis indicates {exitZone.confidence.toLowerCase()} confidence for exit with {exitZone.tradeSuccessProbability}% success probability based on technical indicators and historical performance.
                    </p>
                  </div>

                  {/* Indicators */}
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <p className="text-sm font-semibold text-foreground mb-2">Active Indicators</p>
                    <div className="flex items-center gap-2">
                      {exitZone.indicators.rsiOverbought ? (
                        <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={exitZone.indicators.rsiOverbought ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        RSI Overbought (&gt;70)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {exitZone.indicators.emaBearishCrossover ? (
                        <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={exitZone.indicators.emaBearishCrossover ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        Bearish EMA Crossover
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {exitZone.indicators.macdNegative ? (
                        <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className={exitZone.indicators.macdNegative ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        Negative MACD
                      </span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <p className="text-sm font-semibold text-foreground mb-2">Dynamic Exit Recommendation</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {exitZone.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* No Active Zones */}
            {!entryZone?.isActive && !exitZone?.isActive && (
              <Card className="card-solid-bg">
                <CardContent className="py-12 text-center">
                  <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">No active entry or exit zones</p>
                  <p className="text-sm text-muted-foreground">
                    Smart Trade Confidence System is monitoring for optimal trading conditions
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
