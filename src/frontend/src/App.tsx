import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { Dashboard } from '@/pages/Dashboard';
import { Footer } from '@/components/Footer';
import { AlertToast } from '@/components/AlertToast';
import { useAlertSystem } from '@/hooks/useAlertSystem';
import { useMemo } from 'react';
import { fetchCryptoDataWithIndicators } from '@/lib/coinRankingApi';
import { 
  getActiveEntryZones, 
  getActiveExitZones,
  getActiveShortEntryZones,
  getActiveCoverExitZones
} from '@/lib/tradeEntryZone';
import { filterOpportunitiesByThreshold, getSensitivitySettings } from '@/lib/sensitivityControl';
import { useQuery, useQueryClient } from '@tanstack/react-query';

function AppContent() {
  const queryClient = useQueryClient();
  
  // Fetch crypto data for alert system
  const { data: cryptoData } = useQuery({
    queryKey: ['cryptoData'],
    queryFn: fetchCryptoDataWithIndicators,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // Calculate trade zones for alert system
  const { entryZones, exitZones, shortEntryZones, coverExitZones } = useMemo(() => {
    if (!cryptoData || cryptoData.length === 0) {
      return { 
        entryZones: [], 
        exitZones: [], 
        shortEntryZones: [],
        coverExitZones: []
      };
    }

    const sparklines = new Map<string, number[]>();
    cryptoData.forEach(coin => {
      if (coin.sparkline && coin.sparkline.length > 0) {
        const prices = coin.sparkline
          .filter(price => price !== null)
          .map(price => parseFloat(price as string));
        sparklines.set(coin.symbol, prices);
      }
    });

    const entries = getActiveEntryZones(cryptoData, sparklines);
    const exits = getActiveExitZones(cryptoData, sparklines);
    const shortEntries = getActiveShortEntryZones(cryptoData, sparklines);
    const coverExits = getActiveCoverExitZones(cryptoData, sparklines);

    const threshold = getSensitivitySettings().threshold;

    return { 
      entryZones: filterOpportunitiesByThreshold(entries, threshold), 
      exitZones: filterOpportunitiesByThreshold(exits, threshold),
      shortEntryZones: filterOpportunitiesByThreshold(shortEntries, threshold),
      coverExitZones: filterOpportunitiesByThreshold(coverExits, threshold)
    };
  }, [cryptoData]);

  // Initialize alert system with toast rendering
  const { activeToasts, dismissToast } = useAlertSystem(
    entryZones,
    exitZones,
    shortEntryZones,
    coverExitZones
  );

  const handleNavigate = (symbol: string) => {
    console.log('[App] Navigating to coin:', symbol);
  };

  const handleTrackingChange = () => {
    console.log('[App] 🔄 Tracking preferences changed, triggering data refresh');
    queryClient.invalidateQueries({ queryKey: ['cryptoData'] });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        availableCoins={cryptoData || []} 
        onTrackingChange={handleTrackingChange}
      />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Dashboard />
      </main>
      <Footer />
      <Toaster />
      
      {/* Render active toast notifications */}
      {activeToasts.map((toast) => (
        <AlertToast
          key={toast.id}
          alert={toast}
          onDismiss={dismissToast}
          onNavigate={handleNavigate}
        />
      ))}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem
      disableTransitionOnChange={false}
      storageKey="market-rotation-radar-theme"
    >
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
