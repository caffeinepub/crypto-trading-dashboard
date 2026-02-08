import { useState } from 'react';
import { Radar, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { TrackedCoinsManager } from '@/components/TrackedCoinsManager';
import LoginButton from '@/components/LoginButton';
import type { CryptoData } from '@/lib/coinRankingApi';

interface HeaderProps {
  availableCoins: CryptoData[];
  onTrackingChange: () => void;
}

export function Header({ availableCoins, onTrackingChange }: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  useState(() => {
    setMounted(true);
  });

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-2 sm:px-4 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Radar className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0" />
          <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">
            Market Rotation Radar
          </h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <TrackedCoinsManager 
            availableCoins={availableCoins}
            onPreferencesChange={onTrackingChange}
          />
          
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-8 h-8 sm:w-9 sm:h-9"
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          )}
          
          <LoginButton />
        </div>
      </div>
    </header>
  );
}
