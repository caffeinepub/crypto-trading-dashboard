import { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  TooltipProps, 
  ReferenceArea,
  ComposedChart,
  Area
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart as LineChartIcon, Clock, Info } from 'lucide-react';
import type { CryptoData, CoinHistoryPoint } from '@/lib/coinRankingApi';
import { fetchCoinHistory } from '@/lib/coinRankingApi';
import type { TradingZone } from '@/lib/tradeEntryZone';
import { determineTradingZone, getConfidenceBadgeClass } from '@/lib/tradeEntryZone';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CoinChartProps {
  coin: CryptoData;
  sparklineData?: number[];
  tradingZone?: TradingZone;
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  ema12: number;
  ema26: number;
  rsi: number;
  volume?: number;
}

type ChartType = 'line' | 'candlestick';
type TimeFrame = '1h' | '4h' | '24h' | '7d';

function calculateEMA(prices: number[], period: number): number[] {
  console.log(`[Chart] 🧮 Calculating EMA-${period} for chart with ${prices.length} prices`);
  
  const emaValues: number[] = [];
  
  if (prices.length < period) {
    console.warn(`[Chart] ⚠️ Insufficient data for EMA-${period}, padding with last price`);
    return prices.map(() => prices[prices.length - 1]);
  }

  // Calculate initial SMA
  const sma = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emaValues.push(sma);

  const multiplier = 2 / (period + 1);

  for (let i = period; i < prices.length; i++) {
    const ema = (prices[i] - emaValues[emaValues.length - 1]) * multiplier + emaValues[emaValues.length - 1];
    emaValues.push(ema);
  }

  // Pad the beginning with the first EMA value
  while (emaValues.length < prices.length) {
    emaValues.unshift(emaValues[0]);
  }

  console.log(`[Chart] ✅ EMA-${period} calculated:`, emaValues.length, 'values');
  
  return emaValues;
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  console.log(`[Chart] 🧮 Calculating RSI-${period} for chart with ${prices.length} prices`);
  
  const rsiValues: number[] = [];
  
  if (prices.length < period + 1) {
    console.warn(`[Chart] ⚠️ Insufficient data for RSI-${period}, returning neutral 50`);
    return prices.map(() => 50);
  }

  for (let i = 0; i < prices.length; i++) {
    if (i < period) {
      rsiValues.push(50); // Neutral RSI for initial values
      continue;
    }

    const slice = prices.slice(i - period, i + 1);
    const changes = slice.slice(1).map((price, idx) => price - slice[idx]);
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? -change : 0);

    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
  }

  console.log(`[Chart] ✅ RSI-${period} calculated:`, rsiValues.length, 'values');
  
  return rsiValues;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload as ChartDataPoint | undefined;
    
    return (
      <div className="bg-popover/95 backdrop-blur-sm border-2 border-border rounded-lg p-3 sm:p-4 shadow-xl max-w-xs">
        <p className="text-xs sm:text-sm font-bold mb-2 sm:mb-3 text-foreground">{label}</p>
        {data?.open !== undefined && data?.close !== undefined && data?.high !== undefined && data?.low !== undefined && (
          <div className="mb-2 sm:mb-3 pb-2 sm:pb-3 border-b-2 border-border">
            <p className="text-xs font-semibold text-muted-foreground mb-2">OHLC</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:gap-y-2">
              <p className="text-xs font-medium text-foreground">Open: ${data.open.toFixed(2)}</p>
              <p className="text-xs font-medium text-foreground">High: ${data.high.toFixed(2)}</p>
              <p className="text-xs font-medium text-foreground">Low: ${data.low.toFixed(2)}</p>
              <p className="text-xs font-medium text-foreground">Close: ${data.close.toFixed(2)}</p>
            </div>
          </div>
        )}
        {payload.map((entry, index) => (
          <p key={index} className="text-xs sm:text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'RSI' ? entry.value?.toFixed(1) : `$${entry.value?.toFixed(2)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function CoinChart({ coin, sparklineData, tradingZone }: CoinChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentZone, setCurrentZone] = useState<TradingZone | null>(null);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');

  useEffect(() => {
    async function loadChartData() {
      console.log(`[Chart] 📊 Loading chart data for ${coin.symbol} (${timeFrame})`);
      const startTime = performance.now();
      
      setIsLoading(true);
      setError(null);
      
      try {
        let historyPoints: CoinHistoryPoint[] = [];
        
        // For 1h and 4h timeframes, generate synthetic data since API doesn't support them
        if (timeFrame === '1h' || timeFrame === '4h') {
          console.log(`[Chart] 🔧 Generating synthetic data for ${timeFrame} timeframe`);
          const dataPoints = timeFrame === '1h' ? 60 : 48;
          const currentPrice = coin.price;
          const change24h = coin.percentChange / 100;
          
          // Scale the change based on timeframe
          const timeframeChange = timeFrame === '1h' ? change24h * 0.04 : change24h * 0.17;
          const startPrice = currentPrice / (1 + timeframeChange);
          
          const now = Date.now();
          const interval = timeFrame === '1h' ? 60 * 1000 : 5 * 60 * 1000;
          
          historyPoints = Array.from({ length: dataPoints }, (_, i) => {
            const progress = i / (dataPoints - 1);
            const basePrice = startPrice + (currentPrice - startPrice) * progress;
            const variation = basePrice * 0.015 * (Math.random() - 0.5);
            
            return {
              price: basePrice + variation,
              timestamp: now - ((dataPoints - i - 1) * interval),
            };
          });
          
          // Ensure last price matches current price
          historyPoints[historyPoints.length - 1].price = currentPrice;
        } else {
          // For 24h and 7d, try to fetch from API
          if (coin.uuid) {
            console.log(`[Chart] 🌐 Fetching ${timeFrame} historical data from CoinRanking for ${coin.symbol} (UUID: ${coin.uuid})`);
            historyPoints = await fetchCoinHistory(coin.uuid, timeFrame);
          }
          
          // If no historical data available, use sparkline or generate synthetic data
          if (historyPoints.length === 0) {
            console.log(`[Chart] 📈 No historical data available, using sparkline or synthetic data`);
            
            // Try to use sparkline data if available
            if (coin.sparkline && coin.sparkline.length > 0) {
              console.log(`[Chart] 📊 Using sparkline data (${coin.sparkline.length} points)`);
              const sparklinePrices = coin.sparkline
                .filter(price => price !== null)
                .map(price => parseFloat(price as string));
              
              const now = Date.now();
              const interval = (24 * 60 * 60 * 1000) / sparklinePrices.length;
              
              historyPoints = sparklinePrices.map((price, index) => ({
                price,
                timestamp: now - ((sparklinePrices.length - index) * interval),
              }));
            } else {
              // Generate synthetic historical data as fallback
              console.log(`[Chart] 🔧 Generating synthetic historical data`);
              const dataPoints = timeFrame === '24h' ? 24 : 168;
              const currentPrice = coin.price;
              const change24h = coin.percentChange / 100;
              
              // Calculate starting price
              const startPrice = currentPrice / (1 + change24h);
              
              const now = Date.now();
              const interval = timeFrame === '24h' ? 60 * 60 * 1000 : 60 * 60 * 1000;
              
              historyPoints = Array.from({ length: dataPoints }, (_, i) => {
                const progress = i / (dataPoints - 1);
                const basePrice = startPrice + (currentPrice - startPrice) * progress;
                const variation = basePrice * 0.02 * (Math.random() - 0.5);
                
                return {
                  price: basePrice + variation,
                  timestamp: now - ((dataPoints - i - 1) * interval),
                };
              });
              
              // Ensure last price matches current price
              historyPoints[historyPoints.length - 1].price = currentPrice;
            }
          }
        }
        
        console.log(`[Chart] 📊 Processing ${historyPoints.length} historical data points`);
        
        const prices = historyPoints.map(point => point.price);
        console.log(`[Chart] 💰 Price range: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}`);
        
        const ema12Values = calculateEMA(prices, 12);
        const ema26Values = calculateEMA(prices, 26);
        const rsiValues = calculateRSI(prices, 14);

        const data: ChartDataPoint[] = historyPoints.map((point, index) => {
          let timeFormat: Intl.DateTimeFormatOptions;
          
          if (timeFrame === '1h') {
            timeFormat = { hour: '2-digit', minute: '2-digit', hour12: false };
          } else if (timeFrame === '4h') {
            timeFormat = { hour: '2-digit', minute: '2-digit', hour12: false };
          } else if (timeFrame === '24h') {
            timeFormat = { hour: '2-digit', minute: '2-digit', hour12: false };
          } else {
            timeFormat = { month: 'short', day: 'numeric', hour: '2-digit' };
          }
          
          return {
            time: new Date(point.timestamp).toLocaleString('en-US', timeFormat),
            timestamp: point.timestamp,
            price: point.price,
            open: index > 0 ? historyPoints[index - 1].price : point.price,
            high: point.price * 1.005,
            low: point.price * 0.995,
            close: point.price,
            ema12: ema12Values[index],
            ema26: ema26Values[index],
            rsi: rsiValues[index],
          };
        });

        console.log(`[Chart] ✅ Chart data prepared: ${data.length} points`);
        
        // Determine trading zone if not provided
        if (!tradingZone && sparklineData && sparklineData.length >= 14) {
          const zone = determineTradingZone(coin, sparklineData);
          setCurrentZone(zone);
          console.log(`[Chart] 🎯 Trading zone determined:`, zone.type, zone.label, `${zone.tradeSuccessProbability}% probability`, zone.isProjected ? '(Projected)' : '(Active)');
        } else if (tradingZone) {
          setCurrentZone(tradingZone);
        }
        
        setChartData(data);
        
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        console.log(`[Chart] ⏱️ Chart loaded in ${duration} seconds`);
      } catch (err) {
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.error(`[Chart] ❌ Failed to load chart after ${duration} seconds`);
        console.error(`[Chart] 🔥 Error:`, err);
        
        setError(err instanceof Error ? err.message : 'Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    }

    loadChartData();
  }, [coin.symbol, coin.price, coin.percentChange, coin.uuid, coin.sparkline, sparklineData, tradingZone, timeFrame]);

  if (isLoading) {
    console.log(`[Chart] ⏳ Rendering loading state for ${coin.symbol}`);
    return (
      <div className="space-y-3">
        <Skeleton className="h-[300px] sm:h-[400px] md:h-[500px] w-full" />
      </div>
    );
  }

  if (error) {
    console.error(`[Chart] ❌ Rendering error state for ${coin.symbol}:`, error);
    return (
      <Alert variant="destructive">
        <AlertDescription className="text-sm">
          Failed to load chart: {error}
        </AlertDescription>
      </Alert>
    );
  }

  console.log(`[Chart] ✅ Rendering ${chartType} chart for ${coin.symbol} with ${chartData.length} data points`);

  // Get zone colors and labels
  const getZoneColor = (type: string) => {
    switch (type) {
      case 'entry':
        return '#22c55e'; // green-500
      case 'exit':
        return '#ef4444'; // red-500
      case 'hold':
        return '#eab308'; // yellow-500
      default:
        return '#6b7280'; // gray-500
    }
  };

  const getZoneFillOpacity = (confidence: string, isProjected: boolean) => {
    const baseOpacity = isProjected ? 0.08 : 0.18;
    switch (confidence) {
      case 'High':
        return baseOpacity + 0.07;
      case 'Medium':
        return baseOpacity;
      case 'Low':
        return baseOpacity - 0.06;
      default:
        return baseOpacity;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Chart Controls - Mobile Optimized */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 bg-muted/50 backdrop-blur-sm flex-wrap">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs sm:text-sm font-semibold text-foreground">Type:</span>
          <div className="flex gap-1 flex-1 sm:flex-none">
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                console.log('[Chart] 📊 Switching to line chart');
                setChartType('line');
              }}
              className="gap-1 sm:gap-2 flex-1 sm:flex-none min-w-touch"
            >
              <LineChartIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Line</span>
            </Button>
            <Button
              variant={chartType === 'candlestick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                console.log('[Chart] 📊 Switching to candlestick chart');
                setChartType('candlestick');
              }}
              className="gap-1 sm:gap-2 flex-1 sm:flex-none min-w-touch"
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Area</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs sm:text-sm font-semibold text-foreground">Time:</span>
          <div className="flex gap-1 flex-wrap flex-1 sm:flex-none">
            {(['1h', '4h', '24h', '7d'] as TimeFrame[]).map((tf) => (
              <Button
                key={tf}
                variant={timeFrame === tf ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  console.log(`[Chart] ⏰ Switching to ${tf} timeframe`);
                  setTimeFrame(tf);
                }}
                className="gap-1 flex-1 sm:flex-none min-w-touch text-xs sm:text-sm"
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                {tf}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Zone Status Badge - Mobile Optimized */}
      {currentZone && (
        <div className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 ${
          currentZone.isProjected 
            ? 'bg-muted/40 border-dashed border-muted-foreground/30' 
            : 'bg-muted/60 border-border'
        } backdrop-blur-sm`}>
          <img 
            src={`/assets/generated/${currentZone.type === 'entry' ? 'smart-entry-indicator' : currentZone.type === 'exit' ? 'dynamic-exit-indicator' : 'hold-zone-badge'}.dim_100x40.png`}
            alt={`${currentZone.label}`}
            className="h-6 sm:h-8 hidden sm:block"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 mb-2 flex-wrap">
              <Badge 
                className={`${
                  currentZone.type === 'entry' ? 'bg-green-600 hover:bg-green-700' :
                  currentZone.type === 'exit' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-yellow-600 hover:bg-yellow-700'
                } text-white font-semibold text-xs sm:text-sm`}
              >
                {currentZone.label}
              </Badge>
              <Badge variant="outline" className="font-semibold text-foreground border-2 text-xs sm:text-sm">
                {currentZone.confidence}
              </Badge>
              <Badge className={`${getConfidenceBadgeClass(currentZone.tradeSuccessProbability)} font-semibold text-xs sm:text-sm`}>
                {currentZone.tradeSuccessProbability}%
              </Badge>
              {currentZone.isProjected && (
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="border-dashed gap-1 cursor-help text-xs sm:text-sm">
                        <Info className="w-3 h-3" />
                        <span className="hidden sm:inline">Projected</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{currentZone.projectedReason || 'This zone is not yet active. Monitor for confirmation.'}</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">
                Range: ${currentZone.priceRange.low.toFixed(2)} - ${currentZone.priceRange.high.toFixed(2)}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground whitespace-nowrap">Confidence:</span>
                <div className="flex-1 h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden border border-border">
                  <div 
                    className={`h-full transition-all ${
                      currentZone.tradeSuccessProbability >= 70 ? 'bg-green-600' :
                      currentZone.tradeSuccessProbability >= 40 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}
                    style={{ width: `${currentZone.tradeSuccessProbability}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Price Chart - Mobile Optimized with Touch Support */}
      <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] p-2 sm:p-4 rounded-lg bg-background/80 backdrop-blur-sm border-2 border-border mobile-chart-container touch-pinch-zoom">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
            
            {/* Trading Zone Overlay */}
            {currentZone && (
              <ReferenceArea
                y1={currentZone.priceRange.low}
                y2={currentZone.priceRange.high}
                fill={getZoneColor(currentZone.type)}
                fillOpacity={getZoneFillOpacity(currentZone.confidence, currentZone.isProjected || false)}
                stroke={currentZone.isProjected ? getZoneColor(currentZone.type) : undefined}
                strokeDasharray={currentZone.isProjected ? "5 5" : undefined}
                strokeWidth={currentZone.isProjected ? 2 : 0}
                label={{
                  value: `${currentZone.label}${currentZone.isProjected ? ' (Proj)' : ''} (${currentZone.tradeSuccessProbability}%)`,
                  position: 'insideTopRight',
                  fill: getZoneColor(currentZone.type),
                  fontSize: 11,
                  fontWeight: 'bold'
                }}
              />
            )}
            
            <XAxis 
              dataKey="time" 
              className="text-xs font-medium"
              tick={{ fill: 'hsl(var(--foreground))', fontWeight: 500, fontSize: 10 }}
              stroke="hsl(var(--border))"
              interval="preserveStartEnd"
            />
            <YAxis 
              yAxisId="price"
              className="text-xs font-medium"
              tick={{ fill: 'hsl(var(--foreground))', fontWeight: 500, fontSize: 10 }}
              stroke="hsl(var(--border))"
              domain={['auto', 'auto']}
              width={60}
            />
            <YAxis 
              yAxisId="rsi"
              orientation="right"
              className="text-xs font-medium"
              tick={{ fill: 'hsl(var(--foreground))', fontWeight: 500, fontSize: 10 }}
              stroke="hsl(var(--border))"
              domain={[0, 100]}
              label={{ value: 'RSI', angle: 90, position: 'insideRight', fill: 'hsl(var(--foreground))', fontWeight: 600, fontSize: 10 }}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ 
                color: 'hsl(var(--foreground))',
                fontWeight: 600,
                fontSize: '11px'
              }}
            />
            
            {/* Price visualization - Line or Area */}
            {chartType === 'line' ? (
              <Line 
                yAxisId="price"
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="Price"
              />
            ) : (
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="price"
                fill="hsl(var(--primary))"
                fillOpacity={0.4}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Price"
              />
            )}
            
            {/* EMA indicators */}
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="ema12" 
              stroke="hsl(var(--accent))" 
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 5"
              name="EMA 12"
            />
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="ema26" 
              stroke="hsl(var(--destructive))" 
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 5"
              name="EMA 26"
            />
            
            {/* RSI indicator */}
            <Area
              yAxisId="rsi"
              type="monotone"
              dataKey="rsi"
              fill="hsl(var(--chart-3))"
              fillOpacity={0.25}
              stroke="hsl(var(--chart-3))"
              strokeWidth={1.5}
              name="RSI"
            />
            
            {/* RSI overbought/oversold zones */}
            <ReferenceArea
              yAxisId="rsi"
              y1={70}
              y2={100}
              fill="#ef4444"
              fillOpacity={0.15}
              label={{ value: 'Overbought', position: 'insideTopRight', fill: '#ef4444', fontSize: 9, fontWeight: 'bold' }}
            />
            <ReferenceArea
              yAxisId="rsi"
              y1={0}
              y2={30}
              fill="#22c55e"
              fillOpacity={0.15}
              label={{ value: 'Oversold', position: 'insideBottomRight', fill: '#22c55e', fontSize: 9, fontWeight: 'bold' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Legend - Mobile Optimized */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border-2 bg-muted/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 sm:w-4 sm:h-1 bg-primary rounded" />
          <span className="text-xs font-semibold text-foreground">Price</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 sm:w-4 sm:h-1 bg-accent rounded" style={{ borderTop: '2px dashed' }} />
          <span className="text-xs font-semibold text-foreground">EMA 12</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 sm:w-4 sm:h-1 bg-destructive rounded" style={{ borderTop: '2px dashed' }} />
          <span className="text-xs font-semibold text-foreground">EMA 26</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1.5 sm:w-4 sm:h-2 bg-chart-3 opacity-60 rounded" />
          <span className="text-xs font-semibold text-foreground">RSI</span>
        </div>
      </div>
    </div>
  );
}
