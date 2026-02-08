import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Bell } from 'lucide-react';
import { useRotationRadarSettings } from '@/hooks/useRotationRadarSettings';

export function RotationAlertsPanel() {
  const { settings, updateSettings, isLoading } = useRotationRadarSettings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rotation Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Rotation Alerts
        </CardTitle>
        <CardDescription>
          Configure alerts for rotation events and threshold changes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-notifications">Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive alerts for significant rotation events
            </p>
          </div>
          <Switch
            id="push-notifications"
            checked={settings.enablePushNotifications}
            onCheckedChange={(checked) =>
              updateSettings({ ...settings, enablePushNotifications: checked })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Divergence Threshold</Label>
          <p className="text-sm text-muted-foreground">
            Alert when bucket performance diverges from BTC by this percentage
          </p>
          <div className="flex items-center gap-4">
            <Slider
              value={[settings.divergenceThreshold]}
              onValueChange={([value]) =>
                updateSettings({ ...settings, divergenceThreshold: value })
              }
              min={0.5}
              max={5}
              step={0.5}
              className="flex-1"
            />
            <span className="text-sm font-medium w-12 text-right">
              {settings.divergenceThreshold.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Long Entry Signal Threshold</Label>
          <p className="text-sm text-muted-foreground">
            Minimum confidence for long entry alerts
          </p>
          <div className="flex items-center gap-4">
            <Slider
              value={[settings.longEntrySignalThreshold]}
              onValueChange={([value]) =>
                updateSettings({ ...settings, longEntrySignalThreshold: value })
              }
              min={50}
              max={90}
              step={5}
              className="flex-1"
            />
            <span className="text-sm font-medium w-12 text-right">
              {settings.longEntrySignalThreshold.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Short Entry Signal Threshold</Label>
          <p className="text-sm text-muted-foreground">
            Minimum confidence for short entry alerts
          </p>
          <div className="flex items-center gap-4">
            <Slider
              value={[settings.shortEntrySignalThreshold]}
              onValueChange={([value]) =>
                updateSettings({ ...settings, shortEntrySignalThreshold: value })
              }
              min={50}
              max={90}
              step={5}
              className="flex-1"
            />
            <span className="text-sm font-medium w-12 text-right">
              {settings.shortEntrySignalThreshold.toFixed(0)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
