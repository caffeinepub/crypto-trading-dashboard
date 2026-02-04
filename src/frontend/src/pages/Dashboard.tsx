import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, TrendingUp, AlertCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CryptoTable } from '@/components/CryptoTable';
import { AIForecastPanel } from '@/components/AIForecastPanel';
import { TradeEntryZonePanel } from '@/components/TradeEntryZonePanel';
import { SensitivityControlPanel } from '@/components/SensitivityControlPanel';
import { AlertSettingsPanel } from '@/components/AlertSettingsPanel';
import { AlertHistoryPanel } from '@/components/AlertHistoryPanel';
import { DominanceMetricsPanel } from '@/components/DominanceMetrics';
import { Total3Chart } from '@/components/Total3Chart';
import { PerformanceAnalytics } from '@/components/PerformanceAnalytics';
import { ReadyToPump } from '@/components/ReadyToPump';
import { ReadyToDump } from '@/components/ReadyToDump';
import { SettingsControlCenter } from '@/components/SettingsControlCenter';
import { WhaleTrackerPanel } from '@/components/WhaleTrackerPanel';
import { AIOptimizerPanel } from '@/components/AIOptimizerPanel';
import { CorrelationHeatmap } from '@/components/CorrelationHeatmap';
import { ProfitZonePanel } from '@/components/ProfitZonePanel';
import { PortfolioSimulationPanel } from '@/components/PortfolioSimulationPanel';
import { BacktestingPanel } from '@/components/BacktestingPanel';
import { RiskManagementPanel } from '@/components/RiskManagementPanel';
import { PerformanceModeToggle } from '@/components/PerformanceModeToggle';
import { TradeJournalAnalyticsPanel } from '@/components/TradeJournalAnalyticsPanel';
import { CoinDetailDialog } from '@/components/CoinDetailDialog';
import { fetchCryptoDataWithIndicators, calculateDominanceMetrics, type CryptoData } from '@/lib/coinRankingApi';
import { 
  getActiveEntryZones, 
  getActiveExitZones,
  getActiveShortEntryZones,
  getActiveCoverExitZones,
  type EntryZoneSignal, 
  type ExitZoneSignal,
  type ShortEntrySignal,
  type CoverExitSignal
} from '@/lib/tradeEntryZone';
import { filterOpportunitiesByThreshold, getSensitivitySettings } from '@/lib/sensitivityControl';
import { filterTrackedCoins } from '@/components/TrackedCoinsManager';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { getRefreshInterval } from '@/lib/performanceMode';

export function Dashboard() {
  const [selectedCoin, setSelectedCoin] = useState<CryptoData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sensitivityThreshold, setSensitivityThreshold] = useState(getSensitivitySettings().threshold);
  const [showTrackedOnly, setShowTrackedOnly] = useState(false);

  // Fetch crypto data with dynamic refresh interval
  const refreshInterval = getRefreshInterval();
  const { data: cryptoData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['cryptoData'],
    queryFn: fetchCryptoDataWithIndicators,
    refetchInterval: refreshInterval,
    staleTime: 30000,
  });

  // Filter data based on tracking preferences
  const displayData = useMemo(() => {
    if (!cryptoData) return [];
    return showTrackedOnly ? filterTrackedCoins(cryptoData) : cryptoData;
  }, [cryptoData, showTrackedOnly]);

  // Calculate dominance metrics
  const dominanceMetrics = useMemo(() => {
    if (!cryptoData || cryptoData.length === 0) return null;
    return calculateDominanceMetrics(cryptoData.map(crypto => ({
      uuid: crypto.uuid,
      symbol: crypto.symbol,
      name: crypto.name,
      color: null,
      iconUrl: '',
      marketCap: crypto.marketCap.toString(),
      price: crypto.price.toString(),
      listedAt: 0,
      tier: 1,
      change: crypto.percentChange.toString(),
      rank: 0,
      sparkline: crypto.sparkline,
      lowVolume: false,
      coinrankingUrl: '',
      '24hVolume': crypto.volume.toString(),
      btcPrice: '0'
    })));
  }, [cryptoData]);

  // Calculate trade zones
  const { entryZones, exitZones, shortEntryZones, coverExitZones, sparklineData } = useMemo(() => {
    if (!displayData || displayData.length === 0) {
      return { 
        entryZones: [], 
        exitZones: [], 
        shortEntryZones: [],
        coverExitZones: [],
        sparklineData: new Map() 
      };
    }

    const sparklines = new Map<string, number[]>();
    displayData.forEach(coin => {
      if (coin.sparkline && coin.sparkline.length > 0) {
        const prices = coin.sparkline
          .filter(price => price !== null)
          .map(price => parseFloat(price as string));
        sparklines.set(coin.symbol, prices);
      }
    });

    const entries = getActiveEntryZones(displayData, sparklines);
    const exits = getActiveExitZones(displayData, sparklines);
    const shortEntries = getActiveShortEntryZones(displayData, sparklines);
    const coverExits = getActiveCoverExitZones(displayData, sparklines);

    return { 
      entryZones: entries, 
      exitZones: exits,
      shortEntryZones: shortEntries,
      coverExitZones: coverExits,
      sparklineData: sparklines 
    };
  }, [displayData]);

  // Filter zones by sensitivity
  const filteredEntryZones = useMemo(() => 
    filterOpportunitiesByThreshold(entryZones, sensitivityThreshold),
    [entryZones, sensitivityThreshold]
  );

  const filteredExitZones = useMemo(() => 
    filterOpportunitiesByThreshold(exitZones, sensitivityThreshold),
    [exitZones, sensitivityThreshold]
  );

  const filteredShortEntryZones = useMemo(() => 
    filterOpportunitiesByThreshold(shortEntryZones, sensitivityThreshold),
    [shortEntryZones, sensitivityThreshold]
  );

  const filteredCoverExitZones = useMemo(() => 
    filterOpportunitiesByThreshold(coverExitZones, sensitivityThreshold),
    [coverExitZones, sensitivityThreshold]
  );

  // Initialize alert system
  useAlertSystem(
    filteredEntryZones,
    filteredExitZones,
    filteredShortEntryZones,
    filteredCoverExitZones
  );

  const handleCoinSelect = (coin: CryptoData) => {
    setSelectedCoin(coin);
    setIsDialogOpen(true);
  };

  const handleEntryZoneSelect = (signal: EntryZoneSignal | ExitZoneSignal | ShortEntrySignal | CoverExitSignal) => {
    const coin = displayData?.find(c => c.symbol === signal.symbol);
    if (coin) {
      handleCoinSelect(coin);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleSensitivityChange = (threshold: number) => {
    setSensitivityThreshold(threshold);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading market data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load market data. Please check your connection and try again.
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8 pb-20 md:pb-8">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            <span className="truncate">Elite Swing Trading</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">
            Professional cryptocurrency market analysis with advanced trading tools
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefetching}
          variant="outline"
          size="sm"
          className="gap-2 min-w-touch"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefetching ? 'Refreshing...' : 'Refresh'}</span>
        </Button>
      </div>

      {/* Performance Mode Toggle */}
      <PerformanceModeToggle />

      {/* Main Content Tabs - Mobile Optimized */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-2 sm:mx-0 px-2 sm:px-0 py-2 border-b md:border-0">
          <TabsList className="grid w-full grid-cols-5 h-auto gap-1 bg-muted/50 p-1">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-background">
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Home</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-background">
              <span className="hidden sm:inline">Portfolio</span>
              <span className="sm:hidden">Port</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-background">
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-background">
              <span className="hidden sm:inline">Advanced</span>
              <span className="sm:hidden">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm py-2 sm:py-2.5 data-[state=active]:bg-background">
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Set</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-8 mt-4">
          {/* Dominance Metrics */}
          {dominanceMetrics && <DominanceMetricsPanel metrics={dominanceMetrics} />}

          {/* Total 3 Chart */}
          {dominanceMetrics && <Total3Chart metrics={dominanceMetrics} />}

          {/* Ready to Pump Section */}
          <ReadyToPump data={displayData || []} onCoinSelect={handleCoinSelect} />

          {/* Ready to Dump Section */}
          <ReadyToDump data={displayData || []} onCoinSelect={handleCoinSelect} />

          {/* Trade Entry Zones */}
          <TradeEntryZonePanel
            activeEntryZones={filteredEntryZones}
            activeExitZones={filteredExitZones}
            activeShortEntryZones={filteredShortEntryZones}
            activeCoverExitZones={filteredCoverExitZones}
            onZoneSelect={handleEntryZoneSelect}
            cryptoData={displayData || []}
            sparklineData={sparklineData}
          />

          {/* AI Forecast Panel */}
          <AIForecastPanel
            data={displayData || []}
            sparklineData={sparklineData}
            onCoinSelect={handleCoinSelect}
          />

          {/* Crypto Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">All Cryptocurrencies</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTrackedOnly(!showTrackedOnly)}
                className="min-w-touch"
              >
                <span className="hidden sm:inline">{showTrackedOnly ? 'Show All' : 'Show Tracked Only'}</span>
                <span className="sm:hidden">{showTrackedOnly ? 'All' : 'Tracked'}</span>
              </Button>
            </div>
            <div className="responsive-table">
              <CryptoTable
                data={displayData || []}
                entryZones={filteredEntryZones}
                exitZones={filteredExitZones}
                onSelectCoin={handleCoinSelect}
              />
            </div>
          </div>
        </TabsContent>

        {/* Portfolio & Risk Tab */}
        <TabsContent value="portfolio" className="space-y-4 sm:space-y-8 mt-4">
          <PortfolioSimulationPanel cryptoData={displayData || []} />
          <RiskManagementPanel cryptoData={displayData || []} />
          <BacktestingPanel cryptoData={displayData || []} sparklineData={sparklineData} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4 sm:space-y-8 mt-4">
          <TradeJournalAnalyticsPanel />
          <PerformanceAnalytics />
          <AlertHistoryPanel />
        </TabsContent>

        {/* Advanced Tools Tab */}
        <TabsContent value="advanced" className="space-y-4 sm:space-y-8 mt-4">
          <WhaleTrackerPanel data={displayData || []} sparklineData={sparklineData} />
          <AIOptimizerPanel />
          <CorrelationHeatmap data={displayData || []} sparklineData={sparklineData} />
          <ProfitZonePanel data={displayData || []} sparklineData={sparklineData} />
          <SensitivityControlPanel
            allEntryZones={entryZones}
            allExitZones={exitZones}
            onThresholdChange={handleSensitivityChange}
          />
          <AlertSettingsPanel />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 sm:space-y-8 mt-4">
          <SettingsControlCenter />
        </TabsContent>
      </Tabs>

      {/* Coin Detail Dialog */}
      {selectedCoin && (
        <CoinDetailDialog
          coin={selectedCoin}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          entryZone={filteredEntryZones.find(z => z.symbol === selectedCoin.symbol)}
          exitZone={filteredExitZones.find(z => z.symbol === selectedCoin.symbol)}
        />
      )}
    </div>
  );
}
