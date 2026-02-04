import { useState, useEffect, useMemo } from 'react';
import { Settings, Search, CheckCircle2, Circle, X, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { CryptoData } from '@/lib/coinRankingApi';

const STORAGE_KEY = 'tracked-coins-preferences';
const DEFAULT_TRACKED_COUNT = 20;

interface TrackedCoinsPreferences {
  trackedSymbols: string[];
  lastUpdated: string;
}

export function getTrackedCoinsPreferences(): TrackedCoinsPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('[TrackedCoinsManager] 📦 Loaded tracking preferences:', {
        count: parsed.trackedSymbols?.length || 0,
        lastUpdated: parsed.lastUpdated,
      });
      return parsed;
    }
  } catch (error) {
    console.error('[TrackedCoinsManager] ❌ Error loading preferences:', error);
  }
  
  // Return empty preferences - will be initialized with defaults when data is available
  return {
    trackedSymbols: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function saveTrackedCoinsPreferences(preferences: TrackedCoinsPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    console.log('[TrackedCoinsManager] 💾 Saved tracking preferences:', {
      count: preferences.trackedSymbols.length,
      timestamp: preferences.lastUpdated,
    });
  } catch (error) {
    console.error('[TrackedCoinsManager] ❌ Error saving preferences:', error);
  }
}

export function isTrackedCoin(symbol: string): boolean {
  const preferences = getTrackedCoinsPreferences();
  return preferences.trackedSymbols.includes(symbol);
}

export function filterTrackedCoins(data: CryptoData[]): CryptoData[] {
  const preferences = getTrackedCoinsPreferences();
  if (preferences.trackedSymbols.length === 0) {
    return data; // Show all if no tracking preferences set
  }
  return data.filter(coin => preferences.trackedSymbols.includes(coin.symbol));
}

interface TrackedCoinsManagerProps {
  availableCoins: CryptoData[];
  onPreferencesChange?: () => void;
}

export function TrackedCoinsManager({ availableCoins, onPreferencesChange }: TrackedCoinsManagerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trackedSymbols, setTrackedSymbols] = useState<string[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize tracking preferences
  useEffect(() => {
    if (availableCoins.length > 0 && !hasInitialized) {
      const preferences = getTrackedCoinsPreferences();
      
      if (preferences.trackedSymbols.length === 0) {
        // Initialize with top 20 cryptocurrencies by market cap
        const defaultTracked = availableCoins
          .slice(0, DEFAULT_TRACKED_COUNT)
          .map(coin => coin.symbol);
        
        setTrackedSymbols(defaultTracked);
        saveTrackedCoinsPreferences({
          trackedSymbols: defaultTracked,
          lastUpdated: new Date().toISOString(),
        });
        
        console.log('[TrackedCoinsManager] 🎯 Initialized with default tracking:', {
          count: defaultTracked.length,
          symbols: defaultTracked.slice(0, 5),
        });
      } else {
        setTrackedSymbols(preferences.trackedSymbols);
        console.log('[TrackedCoinsManager] 📋 Loaded existing preferences:', {
          count: preferences.trackedSymbols.length,
        });
      }
      
      setHasInitialized(true);
    }
  }, [availableCoins, hasInitialized]);

  // Filter coins based on search query
  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableCoins;
    }
    
    const query = searchQuery.toLowerCase();
    return availableCoins.filter(coin => 
      coin.symbol.toLowerCase().includes(query) ||
      coin.name.toLowerCase().includes(query)
    );
  }, [availableCoins, searchQuery]);

  const handleToggle = (symbol: string) => {
    const newTrackedSymbols = trackedSymbols.includes(symbol)
      ? trackedSymbols.filter(s => s !== symbol)
      : [...trackedSymbols, symbol];
    
    setTrackedSymbols(newTrackedSymbols);
    saveTrackedCoinsPreferences({
      trackedSymbols: newTrackedSymbols,
      lastUpdated: new Date().toISOString(),
    });
    
    console.log('[TrackedCoinsManager] 🔄 Tracking preference updated:', {
      symbol,
      action: trackedSymbols.includes(symbol) ? 'removed' : 'added',
      totalTracked: newTrackedSymbols.length,
    });
    
    onPreferencesChange?.();
  };

  const handleDeselect = (symbol: string) => {
    const newTrackedSymbols = trackedSymbols.filter(s => s !== symbol);
    
    setTrackedSymbols(newTrackedSymbols);
    saveTrackedCoinsPreferences({
      trackedSymbols: newTrackedSymbols,
      lastUpdated: new Date().toISOString(),
    });
    
    console.log('[TrackedCoinsManager] ❌ Deselected coin:', {
      symbol,
      totalTracked: newTrackedSymbols.length,
    });
    
    onPreferencesChange?.();
  };

  const handleSelectAll = () => {
    const allSymbols = availableCoins.map(coin => coin.symbol);
    setTrackedSymbols(allSymbols);
    saveTrackedCoinsPreferences({
      trackedSymbols: allSymbols,
      lastUpdated: new Date().toISOString(),
    });
    
    console.log('[TrackedCoinsManager] ✅ Selected all coins:', allSymbols.length);
    onPreferencesChange?.();
  };

  const handleDeselectAll = () => {
    setTrackedSymbols([]);
    saveTrackedCoinsPreferences({
      trackedSymbols: [],
      lastUpdated: new Date().toISOString(),
    });
    
    console.log('[TrackedCoinsManager] ❌ Deselected all coins');
    onPreferencesChange?.();
  };

  const handleSelectTop = (count: number) => {
    const topSymbols = availableCoins.slice(0, count).map(coin => coin.symbol);
    setTrackedSymbols(topSymbols);
    saveTrackedCoinsPreferences({
      trackedSymbols: topSymbols,
      lastUpdated: new Date().toISOString(),
    });
    
    console.log('[TrackedCoinsManager] 🔝 Selected top', count, 'coins');
    onPreferencesChange?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Manage Coins</span>
          <Badge variant="secondary" className="ml-1">
            {trackedSymbols.length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col modal-solid-bg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Tracked Coins Manager
          </DialogTitle>
          <DialogDescription>
            Select which cryptocurrencies you want to track and monitor. Your preferences will be saved automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Stats and Bulk Actions */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {trackedSymbols.length} Tracked
              </Badge>
              <Badge variant="outline">
                {availableCoins.length} Total
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectTop(20)}
                disabled={trackedSymbols.length === 20}
              >
                Top 20
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSelectTop(50)}
                disabled={trackedSymbols.length === 50}
              >
                Top 50
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={trackedSymbols.length === availableCoins.length}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={trackedSymbols.length === 0}
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Info Alert */}
          {trackedSymbols.length === 0 && (
            <Alert>
              <AlertDescription>
                No coins are currently tracked. Select coins to focus your dashboard on specific cryptocurrencies.
              </AlertDescription>
            </Alert>
          )}

          {/* Coins List */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-2 pr-4">
              {filteredCoins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No coins found matching "{searchQuery}"
                </div>
              ) : (
                filteredCoins.map((coin, index) => {
                  const isTracked = trackedSymbols.includes(coin.symbol);
                  
                  return (
                    <div key={coin.symbol}>
                      <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{coin.symbol}</span>
                              {isTracked && (
                                <Badge variant="default" className="text-xs">
                                  Tracked
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {coin.name}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-mono text-sm">
                              ${coin.price.toFixed(coin.price >= 1 ? 2 : 6)}
                            </p>
                            <p className={`text-xs ${coin.percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {coin.percentChange >= 0 ? '+' : ''}{coin.percentChange.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {isTracked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeselect(coin.symbol)}
                              className="gap-1 h-8 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Remove from tracked coins"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="text-xs font-medium">Deselect</span>
                            </Button>
                          )}
                          <Switch
                            checked={isTracked}
                            onCheckedChange={() => handleToggle(coin.symbol)}
                            id={`track-${coin.symbol}`}
                          />
                          <Label
                            htmlFor={`track-${coin.symbol}`}
                            className="sr-only"
                          >
                            Track {coin.symbol}
                          </Label>
                        </div>
                      </div>
                      {index < filteredCoins.length - 1 && <Separator />}
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Changes are saved automatically
          </p>
          <Button onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
