import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, TrendingUp, CheckCircle2, AlertCircle, Clock, Activity, AlertTriangle, Sparkles, Eye, EyeOff, Info, List } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { EntryZoneSignal, ExitZoneSignal, ShortEntrySignal, CoverExitSignal } from '@/lib/tradeEntryZone';
import { 
  getConfidenceBadgeClass, 
  getProjectedEntryZones, 
  getProjectedExitZones,
  getProjectedShortEntryZones,
  getProjectedCoverExitZones
} from '@/lib/tradeEntryZone';
import type { CryptoData } from '@/lib/coinRankingApi';
import { useState, useMemo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TradeEntryZonePanelProps {
  activeEntryZones: EntryZoneSignal[];
  activeExitZones: ExitZoneSignal[];
  activeShortEntryZones?: ShortEntrySignal[];
  activeCoverExitZones?: CoverExitSignal[];
  onZoneSelect?: (signal: EntryZoneSignal | ExitZoneSignal | ShortEntrySignal | CoverExitSignal) => void;
  cryptoData?: CryptoData[];
  sparklineData?: Map<string, number[]>;
}

export function TradeEntryZonePanel({ 
  activeEntryZones, 
  activeExitZones,
  activeShortEntryZones = [],
  activeCoverExitZones = [],
  onZoneSelect,
  cryptoData = [],
  sparklineData = new Map()
}: TradeEntryZonePanelProps) {
  const [showProjected, setShowProjected] = useState(true);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedZoneType, setSelectedZoneType] = useState<'longEntry' | 'longExit' | 'shortEntry' | 'coverExit' | null>(null);

  // Calculate projected zones
  const projectedEntryZones = useMemo(() => {
    if (!showProjected || cryptoData.length === 0) return [];
    console.log('[TradeZonePanel] 🔍 Calculating projected LONG entry zones...');
    const zones = getProjectedEntryZones(cryptoData, sparklineData);
    console.log(`[TradeZonePanel] ✅ Found ${zones.length} projected LONG entry zones`);
    return zones;
  }, [cryptoData, sparklineData, showProjected]);

  const projectedExitZones = useMemo(() => {
    if (!showProjected || cryptoData.length === 0) return [];
    console.log('[TradeZonePanel] 🔍 Calculating projected LONG exit zones...');
    const zones = getProjectedExitZones(cryptoData, sparklineData);
    console.log(`[TradeZonePanel] ✅ Found ${zones.length} projected LONG exit zones`);
    return zones;
  }, [cryptoData, sparklineData, showProjected]);

  const projectedShortEntryZones = useMemo(() => {
    if (!showProjected || cryptoData.length === 0) return [];
    console.log('[TradeZonePanel] 🔍 Calculating projected SHORT entry zones...');
    const zones = getProjectedShortEntryZones(cryptoData, sparklineData);
    console.log(`[TradeZonePanel] ✅ Found ${zones.length} projected SHORT entry zones`);
    return zones;
  }, [cryptoData, sparklineData, showProjected]);

  const projectedCoverExitZones = useMemo(() => {
    if (!showProjected || cryptoData.length === 0) return [];
    console.log('[TradeZonePanel] 🔍 Calculating projected COVER exit zones...');
    const zones = getProjectedCoverExitZones(cryptoData, sparklineData);
    console.log(`[TradeZonePanel] ✅ Found ${zones.length} projected COVER exit zones`);
    return zones;
  }, [cryptoData, sparklineData, showProjected]);

  const getConfidenceColorClass = (confidence: string) => {
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

  const getStrengthColor = (strength: number) => {
    if (strength >= 80) return 'text-green-600 dark:text-green-400';
    if (strength >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const hasActiveZones = activeEntryZones.length > 0 || activeExitZones.length > 0 || activeShortEntryZones.length > 0 || activeCoverExitZones.length > 0;
  const hasProjectedZones = projectedEntryZones.length > 0 || projectedExitZones.length > 0 || projectedShortEntryZones.length > 0 || projectedCoverExitZones.length > 0;

  const totalActiveZones = activeEntryZones.length + activeExitZones.length + activeShortEntryZones.length + activeCoverExitZones.length;
  const totalProjectedZones = projectedEntryZones.length + projectedExitZones.length + projectedShortEntryZones.length + projectedCoverExitZones.length;

  const handleZoneCountClick = (zoneType: 'longEntry' | 'longExit' | 'shortEntry' | 'coverExit') => {
    setSelectedZoneType(zoneType);
    setDetailsDialogOpen(true);
  };

  const getZonesForType = (zoneType: 'longEntry' | 'longExit' | 'shortEntry' | 'coverExit') => {
    switch (zoneType) {
      case 'longEntry':
        return activeEntryZones;
      case 'longExit':
        return activeExitZones;
      case 'shortEntry':
        return activeShortEntryZones;
      case 'coverExit':
        return activeCoverExitZones;
      default:
        return [];
    }
  };

  const renderZoneCard = (
    zone: EntryZoneSignal | ExitZoneSignal | ShortEntrySignal | CoverExitSignal, 
    zoneType: 'longEntry' | 'longExit' | 'shortEntry' | 'coverExit',
    isProjected: boolean = false
  ) => {
    const isEntry = zoneType === 'longEntry' || zoneType === 'shortEntry';
    const isShort = zoneType === 'shortEntry' || zoneType === 'coverExit';
    const borderColor = isEntry ? 'border-green-500' : 'border-red-500';
    
    return (
      <Button
        key={`${zone.symbol}-${zoneType}-${isProjected ? 'projected' : 'active'}`}
        variant="ghost"
        onClick={() => onZoneSelect?.(zone)}
        className={`p-5 h-auto rounded-xl border-2 ${
          isProjected 
            ? `border-dashed ${borderColor}/30 bg-gradient-to-br from-background/60 to-background/40`
            : `${borderColor}/40 bg-gradient-to-br from-background/80 to-background/60`
        } hover:${borderColor}/60 hover:shadow-lg hover:scale-[1.02] transition-all`}
      >
        <div className="w-full text-left">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">{zone.symbol}</h3>
              <p className="text-xs text-muted-foreground">{zone.name}</p>
            </div>
            <div className="flex flex-col gap-1 items-end">
              <Badge className={`${getConfidenceColorClass(zone.confidence)} text-xs`}>
                {zone.confidence}
              </Badge>
              {isProjected && (
                <Badge variant="outline" className="text-xs border-dashed">
                  Projected
                </Badge>
              )}
              {isShort && (
                <Badge variant="secondary" className="text-xs">
                  Short
                </Badge>
              )}
            </div>
          </div>

          {/* Zone Status Badge */}
          <div className={`mb-4 p-3 rounded-lg ${
            isProjected 
              ? `${isEntry ? 'bg-green-500/10' : 'bg-red-500/10'} border border-dashed ${isEntry ? 'border-green-500/30' : 'border-red-500/30'}`
              : `${isEntry ? 'bg-green-500/20' : 'bg-red-500/20'} border ${isEntry ? 'border-green-500/40' : 'border-red-500/40'}`
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-bold ${isEntry ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {isProjected 
                  ? (zoneType === 'longEntry' ? 'POTENTIAL LONG ENTRY' : 
                     zoneType === 'longExit' ? 'POTENTIAL LONG EXIT' :
                     zoneType === 'shortEntry' ? 'POTENTIAL SHORT ENTRY' :
                     'POTENTIAL COVER EXIT')
                  : (zoneType === 'longEntry' ? 'SMART ENTRY ACTIVE' : 
                     zoneType === 'longExit' ? 'DYNAMIC EXIT RECOMMENDED' :
                     zoneType === 'shortEntry' ? 'SHORT ENTRY ACTIVE' :
                     'COVER EXIT RECOMMENDED')
                }
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{new Date(zone.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Projected Reason (only for projected zones) */}
          {isProjected && zone.projectedReason && (
            <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/30 border-dashed">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-accent mb-1">Why Not Active Yet?</p>
                  <p className="text-xs text-foreground/80">{zone.projectedReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Trade Success Probability Meter */}
          <div className="mb-4 p-3 rounded-lg bg-background/60 border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold">
                {zoneType === 'longEntry' ? 'Long Entry' : 
                 zoneType === 'longExit' ? 'Long Exit' :
                 zoneType === 'shortEntry' ? 'Short Entry' :
                 'Cover Exit'} Success Probability
              </span>
              <Badge className={getConfidenceBadgeClass(zone.tradeSuccessProbability)}>
                {zone.tradeSuccessProbability}%
              </Badge>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  zone.tradeSuccessProbability >= 70 ? (isEntry ? 'bg-green-600' : 'bg-red-600') :
                  zone.tradeSuccessProbability >= 40 ? 'bg-yellow-600' :
                  'bg-orange-600'
                }`}
                style={{ width: `${zone.tradeSuccessProbability}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {zone.tradeSuccessProbability >= 70 ? `High confidence ${isEntry ? 'entry' : 'exit'}` : 
               zone.tradeSuccessProbability >= 40 ? `Medium confidence ${isEntry ? 'entry' : 'exit'}` : 
               'Low confidence - wait for better setup'}
            </p>
          </div>

          {/* Price Range */}
          <div className="mb-4 p-3 rounded-lg bg-background/60 border">
            <p className="text-xs text-muted-foreground mb-1">
              {zoneType === 'longEntry' ? 'Entry' : 
               zoneType === 'longExit' ? 'Exit' :
               zoneType === 'shortEntry' ? 'Short Entry' :
               'Cover Exit'} Price Range
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-mono font-semibold">
                {formatCurrency('entryPriceRange' in zone ? zone.entryPriceRange.low : zone.exitPriceRange.low)}
              </span>
              <span className="text-xs text-muted-foreground">to</span>
              <span className="text-sm font-mono font-semibold">
                {formatCurrency('entryPriceRange' in zone ? zone.entryPriceRange.high : zone.exitPriceRange.high)}
              </span>
            </div>
          </div>

          {/* Signal Strength */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Signal Strength</span>
              <span className={`text-sm font-bold ${getStrengthColor(zone.strength)}`}>
                {zone.strength}%
              </span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  zone.strength >= 80 ? (isEntry ? 'bg-green-600' : 'bg-red-600') :
                  zone.strength >= 60 ? 'bg-yellow-600' :
                  'bg-orange-600'
                }`}
                style={{ width: `${zone.strength}%` }}
              />
            </div>
          </div>

          {/* AI Forecast Guidance */}
          <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/30">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-accent">AI Forecast Guidance</span>
            </div>
            <p className="text-xs text-foreground/80">
              Based on technical indicators, {zone.symbol} shows {zone.confidence.toLowerCase()} confidence for {
                zoneType === 'longEntry' ? 'long entry' : 
                zoneType === 'longExit' ? 'long exit' :
                zoneType === 'shortEntry' ? 'short entry' :
                'cover exit'
              } with {zone.tradeSuccessProbability}% success probability.
            </p>
          </div>

          {/* Indicators */}
          <div className="space-y-2 mb-4">
            {'rsiOversold' in zone.indicators && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  {zone.indicators.rsiOversold ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={zone.indicators.rsiOversold ? 'text-foreground' : 'text-muted-foreground'}>
                    RSI Oversold (&lt;35)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {zone.indicators.emaCrossover ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={zone.indicators.emaCrossover ? 'text-foreground' : 'text-muted-foreground'}>
                    Bullish EMA Crossover
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {zone.indicators.macdPositive ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={zone.indicators.macdPositive ? 'text-foreground' : 'text-muted-foreground'}>
                    Positive MACD
                  </span>
                </div>
              </>
            )}
            {'rsiOverbought' in zone.indicators && (
              <>
                <div className="flex items-center gap-2 text-xs">
                  {zone.indicators.rsiOverbought ? (
                    <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={zone.indicators.rsiOverbought ? 'text-foreground' : 'text-muted-foreground'}>
                    RSI Overbought (&gt;70)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {zone.indicators.emaBearishCrossover ? (
                    <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={zone.indicators.emaBearishCrossover ? 'text-foreground' : 'text-muted-foreground'}>
                    Bearish EMA Crossover
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {zone.indicators.macdNegative ? (
                    <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={zone.indicators.macdNegative ? 'text-foreground' : 'text-muted-foreground'}>
                    Negative MACD
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Confirmation Status */}
          <div className={`p-3 rounded-lg ${isEntry ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'} mb-4`}>
            <div className="flex items-center gap-2 text-xs">
              {isEntry ? <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />}
              <span className={`font-semibold ${isEntry ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {zone.consecutiveReadings} consecutive confirmation{zone.consecutiveReadings !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Recommendation */}
          <div className="p-3 rounded-lg bg-background/80 border border-primary/10">
            <p className="text-xs text-foreground/90 leading-relaxed">
              {zone.recommendation}
            </p>
          </div>
        </div>
      </Button>
    );
  };

  if (!hasActiveZones && !hasProjectedZones) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Target className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                Smart Trade Confidence System
              </CardTitle>
              <CardDescription className="mt-1">
                No trade setups found. Displaying projected opportunities.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-2">
              Monitoring for optimal conditions with AI-powered confidence scoring
            </p>
            <p className="text-xs text-muted-foreground">
              Enable "Show Projected Zones" to see potential opportunities before they activate
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  Smart Trade Setups
                  <div className="flex gap-2 flex-wrap">
                    {totalActiveZones > 0 && (
                      <Badge variant="default" className="bg-primary hover:bg-primary/90">
                        {totalActiveZones} Active
                      </Badge>
                    )}
                    {showProjected && totalProjectedZones > 0 && (
                      <Badge variant="outline" className="border-dashed">
                        {totalProjectedZones} Projected
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <CardDescription className="mt-1">
                  AI-powered trade recommendations - click counts for detailed list
                </CardDescription>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log(`[TradeZonePanel] ${showProjected ? 'Hiding' : 'Showing'} projected zones`);
                      setShowProjected(!showProjected);
                    }}
                    className="gap-2"
                  >
                    {showProjected ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {showProjected ? 'Hide' : 'Show'} Projected
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    {showProjected 
                      ? 'Hide projected zones that haven\'t fully activated yet' 
                      : 'Show potential opportunities before they become active zones'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Stats with Clickable Counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activeEntryZones.length > 0 && (
              <Button
                variant="outline"
                onClick={() => handleZoneCountClick('longEntry')}
                className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-green-500/10 hover:border-green-500/50 transition-all"
              >
                <div className="flex items-center gap-2 w-full">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Long Entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">{activeEntryZones.length}</span>
                  <List className="w-4 h-4 text-muted-foreground" />
                </div>
              </Button>
            )}
            
            {activeExitZones.length > 0 && (
              <Button
                variant="outline"
                onClick={() => handleZoneCountClick('longExit')}
                className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
              >
                <div className="flex items-center gap-2 w-full">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-xs text-muted-foreground">Long Exit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-600">{activeExitZones.length}</span>
                  <List className="w-4 h-4 text-muted-foreground" />
                </div>
              </Button>
            )}
            
            {activeShortEntryZones.length > 0 && (
              <Button
                variant="outline"
                onClick={() => handleZoneCountClick('shortEntry')}
                className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-red-500/10 hover:border-red-500/50 transition-all"
              >
                <div className="flex items-center gap-2 w-full">
                  <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                  <span className="text-xs text-muted-foreground">Short Entry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-red-600">{activeShortEntryZones.length}</span>
                  <List className="w-4 h-4 text-muted-foreground" />
                </div>
              </Button>
            )}
            
            {activeCoverExitZones.length > 0 && (
              <Button
                variant="outline"
                onClick={() => handleZoneCountClick('coverExit')}
                className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-green-500/10 hover:border-green-500/50 transition-all"
              >
                <div className="flex items-center gap-2 w-full">
                  <AlertTriangle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Cover Exit</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-green-600">{activeCoverExitZones.length}</span>
                  <List className="w-4 h-4 text-muted-foreground" />
                </div>
              </Button>
            )}
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Active Zones ({totalActiveZones})
              </TabsTrigger>
              <TabsTrigger value="projected" disabled={!showProjected}>
                Projected Zones ({totalProjectedZones})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-6 mt-6">
              {totalActiveZones === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-2">No active trade zones found</p>
                  <p className="text-xs">
                    {showProjected 
                      ? 'Check the "Projected Zones" tab to see potential opportunities' 
                      : 'Enable "Show Projected" to see potential opportunities'}
                  </p>
                </div>
              ) : (
                <>
                  {/* Active Long Entry Zones */}
                  {activeEntryZones.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Active Long Entry Zones ({activeEntryZones.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeEntryZones.map((zone) => renderZoneCard(zone, 'longEntry', false))}
                      </div>
                    </div>
                  )}

                  {/* Active Long Exit Zones */}
                  {activeExitZones.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        Active Long Exit Zones ({activeExitZones.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeExitZones.map((zone) => renderZoneCard(zone, 'longExit', false))}
                      </div>
                    </div>
                  )}

                  {/* Active Short Entry Zones */}
                  {activeShortEntryZones.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400 rotate-180" />
                        Active Short Entry Zones ({activeShortEntryZones.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeShortEntryZones.map((zone) => renderZoneCard(zone, 'shortEntry', false))}
                      </div>
                    </div>
                  )}

                  {/* Active Cover Exit Zones */}
                  {activeCoverExitZones.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Active Cover Exit Zones ({activeCoverExitZones.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeCoverExitZones.map((zone) => renderZoneCard(zone, 'coverExit', false))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="projected" className="space-y-6 mt-6">
              {totalProjectedZones === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm mb-2">No projected trade zones found</p>
                  <p className="text-xs">
                    Projected zones appear when market conditions are partially met but not yet confirmed
                  </p>
                </div>
              ) : (
                <>
                  {/* Projected Long Entry Zones */}
                  {projectedEntryZones.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Projected Long Entry Zones ({projectedEntryZones.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectedEntryZones.map((zone) => renderZoneCard(zone, 'longEntry', true))}
                      </div>
                    </div>
                  )}

                  {/* Projected Long Exit Zones */}
                  {projectedExitZones.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        Projected Long Exit Zones ({projectedExitZones.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectedExitZones.map((zone) => renderZoneCard(zone, 'longExit', true))}
                      </div>
                    </div>
                  )}

                  {/* Projected Short Entry Zones */}
                  {projectedShortEntryZones.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400 rotate-180" />
                        Projected Short Entry Zones ({projectedShortEntryZones.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectedShortEntryZones.map((zone) => renderZoneCard(zone, 'shortEntry', true))}
                      </div>
                    </div>
                  )}

                  {/* Projected Cover Exit Zones */}
                  {projectedCoverExitZones.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Projected Cover Exit Zones ({projectedCoverExitZones.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectedCoverExitZones.map((zone) => renderZoneCard(zone, 'coverExit', true))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>

          {/* Confidence Color Legend */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold">Confidence Color Guide</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-600"></div>
                <span>70-100%: High Confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-600"></div>
                <span>40-69%: Medium Confidence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-600"></div>
                <span>0-39%: Low Confidence</span>
              </div>
            </div>
          </div>

          {/* Projected Zones Info */}
          {showProjected && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 border-dashed">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-accent mb-1">About Projected Zones</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    Projected zones show potential trade opportunities that haven't fully activated yet. 
                    They display predicted entry/exit price levels with confidence previews and explain 
                    what conditions are still needed (e.g., "awaiting RSI confirmation" or "EMA crossover pending"). 
                    Monitor these zones to prepare for upcoming opportunities.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-yellow-600 dark:text-yellow-400">Risk Warning:</strong> Smart Trade Confidence System uses AI-powered analysis with dynamic probability scoring. 
                Always use proper risk management, set stop-losses, and never invest more than you can afford to lose.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedZoneType === 'longEntry' && <Target className="w-5 h-5 text-green-600" />}
              {selectedZoneType === 'longExit' && <AlertTriangle className="w-5 h-5 text-red-600" />}
              {selectedZoneType === 'shortEntry' && <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />}
              {selectedZoneType === 'coverExit' && <AlertTriangle className="w-5 h-5 text-green-600" />}
              {selectedZoneType === 'longEntry' && 'Long Entry Zones'}
              {selectedZoneType === 'longExit' && 'Long Exit Zones'}
              {selectedZoneType === 'shortEntry' && 'Short Entry Zones'}
              {selectedZoneType === 'coverExit' && 'Cover Exit Zones'}
            </DialogTitle>
            <DialogDescription>
              All currently active {selectedZoneType === 'longEntry' ? 'long entry' : selectedZoneType === 'longExit' ? 'long exit' : selectedZoneType === 'shortEntry' ? 'short entry' : 'cover exit'} opportunities with detailed indicators
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-3">
              {selectedZoneType && getZonesForType(selectedZoneType).map((zone) => (
                <div
                  key={`${zone.symbol}-detail`}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    onZoneSelect?.(zone);
                    setDetailsDialogOpen(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{zone.symbol}</h4>
                      <p className="text-sm text-muted-foreground">{zone.name}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge className={getConfidenceColorClass(zone.confidence)}>
                        {zone.confidence}
                      </Badge>
                      <Badge className={getConfidenceBadgeClass(zone.tradeSuccessProbability)}>
                        {zone.tradeSuccessProbability}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Price Range</p>
                      <p className="font-mono font-semibold">
                        {formatCurrency('entryPriceRange' in zone ? zone.entryPriceRange.low : zone.exitPriceRange.low)} - {formatCurrency('entryPriceRange' in zone ? zone.entryPriceRange.high : zone.exitPriceRange.high)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Signal Strength</p>
                      <p className={`font-bold ${getStrengthColor(zone.strength)}`}>
                        {zone.strength}%
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-3">
                    {zone.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
