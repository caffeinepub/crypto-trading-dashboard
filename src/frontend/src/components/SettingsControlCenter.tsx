import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { HowToUseRotationRadarDialog } from './rotation/HowToUseRotationRadarDialog';

export function SettingsControlCenter() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings & Help
            </CardTitle>
            <CardDescription>
              Configure your Market Rotation Radar experience
            </CardDescription>
          </div>
          <HowToUseRotationRadarDialog />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Use the tabs above to access different settings panels including alerts, sensitivity controls, and tracked coins.
        </p>
      </CardContent>
    </Card>
  );
}
