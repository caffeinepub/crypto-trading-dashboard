import { TrendingUp } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { TrackedCoinsManager } from './TrackedCoinsManager';
import type { CryptoData } from '@/lib/coinRankingApi';

interface HeaderProps {
  availableCoins?: CryptoData[];
  onTrackingChange?: () => void;
}

export function Header({ availableCoins = [], onTrackingChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex-shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-xl font-bold tracking-tight truncate">Crypto Insights</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Live Market Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {availableCoins.length > 0 && (
            <TrackedCoinsManager 
              availableCoins={availableCoins}
              onPreferencesChange={onTrackingChange}
            />
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
