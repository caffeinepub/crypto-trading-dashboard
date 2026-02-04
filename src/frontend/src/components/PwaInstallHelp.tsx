import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Chrome, Globe, Share, Plus, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PwaInstallHelp() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Check if running in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Install as Mobile App
        </CardTitle>
        <CardDescription>
          Add this app to your home screen for a native app experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isStandalone ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <Info className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600 dark:text-green-400">
              <strong>Already installed!</strong> You're using the app in standalone mode.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* iOS Instructions */}
            {platform === 'ios' && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 font-semibold">
                  <Globe className="w-5 h-5 text-primary" />
                  iOS Safari Instructions
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground">1.</span>
                    <span>Tap the <Share className="w-4 h-4 inline mx-1" /> Share button at the bottom of Safari</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground">2.</span>
                    <span>Scroll down and tap "Add to Home Screen" <Plus className="w-4 h-4 inline mx-1" /></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground">3.</span>
                    <span>Tap "Add" in the top right corner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground">4.</span>
                    <span>The app icon will appear on your home screen</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Android Instructions */}
            {platform === 'android' && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 font-semibold">
                  <Chrome className="w-5 h-5 text-primary" />
                  Android Chrome Instructions
                </div>
                <ol className="space-y-2 text-sm text-muted-foreground ml-4">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground">1.</span>
                    <span>Tap the menu button (⋮) in the top right corner</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground">2.</span>
                    <span>Tap "Add to Home screen" or "Install app"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground">3.</span>
                    <span>Tap "Add" or "Install" to confirm</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground">4.</span>
                    <span>The app icon will appear on your home screen</span>
                  </li>
                </ol>
              </div>
            )}

            {/* Desktop Instructions */}
            {platform === 'desktop' && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 font-semibold">
                  <Chrome className="w-5 h-5 text-primary" />
                  Desktop Browser Instructions
                </div>
                <p className="text-sm text-muted-foreground">
                  Look for an install button in your browser's address bar (usually a <Plus className="w-4 h-4 inline mx-1" /> or <Smartphone className="w-4 h-4 inline mx-1" /> icon).
                  Click it to install the app on your desktop.
                </p>
              </div>
            )}

            {/* Benefits */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Benefits of Installing:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Badge variant="outline" className="justify-start py-2">
                  ⚡ Faster loading
                </Badge>
                <Badge variant="outline" className="justify-start py-2">
                  📱 Full-screen experience
                </Badge>
                <Badge variant="outline" className="justify-start py-2">
                  🔔 Better notifications
                </Badge>
                <Badge variant="outline" className="justify-start py-2">
                  📴 Works offline
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
