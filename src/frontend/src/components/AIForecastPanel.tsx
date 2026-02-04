import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, TrendingDown, Clock, Target, BarChart3, AlertCircle, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CryptoData } from '@/lib/coinRankingApi';
import { generateCryptoForecast, getAccuracySummary, type CryptoForecast, type ForecastPrediction, type SensitivityMode } from '@/lib/forecastEngine';
import { ForecastAccuracyChart } from './ForecastAccuracyChart';
import { ForecastSensitivityControls } from './ForecastSensitivityControls';
import { formatCurrency } from '@/lib/utils';

interface AIForecastPanelProps {
  data: CryptoData[];
  sparklineData: Map<string, number[]>;
  selectedCoin?: CryptoData | null;
  onCoinSelect?: (coin: CryptoData) => void;
}

export function AIForecastPanel({ data, sparklineData, selectedCoin, onCoinSelect }: AIForecastPanelProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [forecast, setForecast] = useState<CryptoForecast | null>(null);
  const [showAccuracy, setShowAccuracy] = useState(false);
  const [showSensitivity, setShowSensitivity] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sensitivity, setSensitivity] = useState<SensitivityMode>('balanced');
  const [accuracySummary, setAccuracySummary] = useState<{
    overall: number;
    byTimeframe: { '1h': number; '4h': number; '1d': number };
    totalPredictions: number;
  }>({ overall: 0, byTimeframe: { '1h': 0, '4h': 0, '1d': 0 }, totalPredictions: 0 });

  // Update selected symbol when coin is selected from table
  useEffect(() => {
    if (selectedCoin) {
      console.log('[AI Forecast] 🎯 Coin selected from table:', selectedCoin.symbol);
      setSelectedSymbol(selectedCoin.symbol);
    }
  }, [selectedCoin]);

  // Generate forecast when symbol or sensitivity changes
  useEffect(() => {
    const crypto = data.find(c => c.symbol === selectedSymbol);
    if (!crypto) return;

    const sparkline = sparklineData.get(selectedSymbol);
    if (!sparkline || sparkline.length < 14) {
      console.warn(`[AI Forecast] ⚠️ Insufficient data for ${selectedSymbol}`);
      return;
    }

    setIsGenerating(true);
    console.log(`[AI Forecast] 🔮 Generating forecast for ${selectedSymbol} (${sensitivity} mode)`);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const newForecast = generateCryptoForecast(crypto, sparkline, sensitivity);
      setForecast(newForecast);
      setIsGenerating(false);
      console.log(`[AI Forecast] ✅ Forecast generated for ${selectedSymbol}`);
    }, 300);
  }, [selectedSymbol, data, sparklineData, sensitivity]);

  // Load accuracy summary
  useEffect(() => {
    const summary = getAccuracySummary(selectedSymbol, 7);
    setAccuracySummary(summary);
  }, [selectedSymbol]);

  if (!data || data.length === 0) {
    return null;
  }

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    const crypto = data.find(c => c.symbol === symbol);
    if (crypto && onCoinSelect) {
      onCoinSelect(crypto);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'Medium':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'Low':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      default:
        return 'bg-muted';
    }
  };

  const getTimeframeLabel = (timeframe: string) => {
    switch (timeframe) {
      case '1h':
        return '1 Hour';
      case '4h':
        return '4 Hours';
      case '1d':
        return '1 Day';
      default:
        return timeframe;
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    switch (timeframe) {
      case '1h':
        return '⚡';
      case '4h':
        return '🕐';
      case '1d':
        return '📅';
      default:
        return '⏱️';
    }
  };

  // Calculate forecasted price for each prediction
  const getForecastedPrice = (prediction: ForecastPrediction, currentPrice: number) => {
    return currentPrice * (1 + prediction.predictedChange / 100);
  };

  return (
    <Card className="border-accent/50 bg-gradient-to-br from-accent/10 to-primary/10 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-primary">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                AI Price Forecasting
              </CardTitle>
              <CardDescription className="mt-1">
                Multi-timeframe predictions using technical indicators
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSensitivity(!showSensitivity)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              {showSensitivity ? 'Hide' : 'Settings'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAccuracy(!showAccuracy)}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              {showAccuracy ? 'Hide' : 'Show'} Accuracy
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Cryptocurrency Selector with Scrollable Dropdown */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-background/60 border border-primary/20">
          <span className="text-sm font-semibold text-muted-foreground">Analyze:</span>
          <Select value={selectedSymbol} onValueChange={handleSymbolChange}>
            <SelectTrigger className="w-[240px] font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <ScrollArea className="h-[300px]">
                {data.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{crypto.symbol}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-sm">{crypto.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        {/* Sensitivity Controls */}
        {showSensitivity && (
          <ForecastSensitivityControls 
            sensitivity={sensitivity}
            onSensitivityChange={setSensitivity}
          />
        )}

        {/* Current Price */}
        {forecast && !isGenerating && (
          <div className="p-5 rounded-lg bg-gradient-to-br from-background/80 to-background/60 border-2 border-primary/30 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Current Price</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  ${forecast.currentPrice.toFixed(forecast.currentPrice >= 1 ? 2 : 6)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{forecast.name}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="gap-1 mb-2">
                  <Clock className="w-3 h-3" />
                  {new Date(forecast.timestamp).toLocaleTimeString()}
                </Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-muted-foreground">AI Analysis Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accuracy Summary */}
        {forecast && !isGenerating && accuracySummary.totalPredictions > 0 && (
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <img 
                src="/assets/generated/accuracy-summary-display.dim_400x200.png" 
                alt="Accuracy" 
                className="w-5 h-5"
              />
              <span className="text-sm font-semibold">Forecast Accuracy Summary</span>
            </div>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {selectedSymbol} forecast accuracy: {accuracySummary.overall.toFixed(0)}% last 7 days
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {accuracySummary.totalPredictions} verified predictions
            </p>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="p-8 rounded-lg bg-background/50 border border-primary/20 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Analyzing technical indicators...</p>
            </div>
          </div>
        )}

        {/* Forecast Predictions */}
        {forecast && !isGenerating && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold px-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-lg">Price Movement Predictions</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {sensitivity} mode
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {forecast.predictions.map((prediction: ForecastPrediction) => {
                const forecastedPrice = getForecastedPrice(prediction, forecast.currentPrice);
                
                return (
                  <div
                    key={prediction.timeframe}
                    className={`p-5 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-lg ${
                      prediction.isBullish
                        ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/40 hover:border-green-500/60'
                        : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/40 hover:border-red-500/60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {prediction.isBullish ? (
                          <div className="p-2 rounded-lg bg-green-500/20">
                            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-red-500/20">
                            <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-base flex items-center gap-1">
                            <span>{getTimeframeIcon(prediction.timeframe)}</span>
                            {getTimeframeLabel(prediction.timeframe)}
                          </p>
                          <p className="text-xs text-muted-foreground">Forecast</p>
                        </div>
                      </div>
                      <Badge className={`${getConfidenceColor(prediction.confidence)} text-xs`}>
                        {prediction.confidence}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {/* Forecasted Price */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background/60 border">
                        <span className="text-sm text-muted-foreground font-medium">Forecasted Price:</span>
                        <span className="text-lg font-bold font-mono">
                          {formatCurrency(forecastedPrice)}
                        </span>
                      </div>

                      {/* Predicted Change */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background/60 border">
                        <span className="text-sm text-muted-foreground font-medium">Change:</span>
                        <span
                          className={`text-2xl font-bold ${
                            prediction.isBullish ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {prediction.predictedChange > 0 ? '+' : ''}
                          {prediction.predictedChange.toFixed(2)}%
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-background/80 border border-primary/10">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-foreground/90 leading-relaxed">
                            {prediction.interpretation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Historical Accuracy Chart */}
        {showAccuracy && forecast && !isGenerating && (
          <div className="pt-4 border-t border-primary/20">
            <ForecastAccuracyChart symbol={selectedSymbol} />
          </div>
        )}

        {/* Disclaimer */}
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-yellow-600 dark:text-yellow-400">Disclaimer:</strong> These predictions are generated using technical analysis and should not be considered financial advice. 
              Cryptocurrency markets are highly volatile and unpredictable. Always do your own research and invest responsibly.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
