import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Zap, Gauge } from 'lucide-react';
import { 
  getPerformanceModeSettings, 
  togglePerformanceMode,
  type PerformanceModeSettings 
} from '@/lib/performanceMode';

export function PerformanceModeToggle() {
  const [settings, setSettings] = useState<PerformanceModeSettings>(getPerformanceModeSettings());

  const handleToggle = (enabled: boolean) => {
    togglePerformanceMode(enabled);
    setSettings(getPerformanceModeSettings());
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle>High-Performance Mode</CardTitle>
            <CardDescription>Optimize for volatile market conditions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gauge className="w-5 h-5 text-muted-foreground" />
            <div>
              <Label htmlFor="performance-mode" className="text-base">Enable Performance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Reduces animations and increases caching
              </p>
            </div>
          </div>
          <Switch
            id="performance-mode"
            checked={settings.enabled}
            onCheckedChange={handleToggle}
          />
        </div>
        {settings.enabled && (
          <div className="p-3 rounded-lg bg-muted/50 border text-sm">
            <p className="font-medium mb-2">Active Optimizations:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>✓ Reduced UI animations</li>
              <li>✓ Increased data caching (2min)</li>
              <li>✓ Extended refresh interval (2min)</li>
              <li>✓ Simplified chart rendering</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
