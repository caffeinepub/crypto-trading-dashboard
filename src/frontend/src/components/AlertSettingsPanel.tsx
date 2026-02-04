import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Volume2, VolumeX, Settings, CheckCircle2, Clock } from 'lucide-react';
import {
  getAlertPreferences,
  saveAlertPreferences,
  requestNotificationPermission,
  calculateAlertStatistics,
  type AlertPreferences,
} from '@/lib/alertSystem';

export function AlertSettingsPanel() {
  const [preferences, setPreferences] = useState<AlertPreferences>(getAlertPreferences());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState(calculateAlertStatistics());

  useEffect(() => {
    setStats(calculateAlertStatistics());
  }, []);

  const handleSave = () => {
    saveAlertPreferences(preferences);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      setPreferences({ ...preferences, browserNotifications: true });
    }
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Alert Settings
                {preferences.enabled && (
                  <Badge variant="default" className="bg-green-600">
                    Active
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure notifications for high-confidence trade signals
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Enable/Disable */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-3">
            {preferences.enabled ? (
              <Bell className="w-5 h-5 text-green-600" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="enabled" className="text-base font-semibold">
                Enable Alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all alert notifications
              </p>
            </div>
          </div>
          <Switch
            id="enabled"
            checked={preferences.enabled}
            onCheckedChange={(checked) =>
              setPreferences({ ...preferences, enabled: checked })
            }
          />
        </div>

        {/* Alert Types */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Alert Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label htmlFor="browser" className="font-medium">
                  Browser Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Native browser push notifications
                </p>
              </div>
              <Switch
                id="browser"
                checked={preferences.browserNotifications}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, browserNotifications: checked })
                }
                disabled={!preferences.enabled || notificationPermission === 'denied'}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <Label htmlFor="toast" className="font-medium">
                  On-Screen Toasts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Non-intrusive corner notifications
                </p>
              </div>
              <Switch
                id="toast"
                checked={preferences.toastNotifications}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, toastNotifications: checked })
                }
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                {preferences.soundAlerts ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                <div>
                  <Label htmlFor="sound" className="font-medium">
                    Sound Alerts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Audio notification beep
                  </p>
                </div>
              </div>
              <Switch
                id="sound"
                checked={preferences.soundAlerts}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, soundAlerts: checked })
                }
                disabled={!preferences.enabled}
              />
            </div>
          </div>
        </div>

        {/* Browser Permission */}
        {notificationPermission !== 'granted' && preferences.browserNotifications && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                  Browser Permission Required
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click below to enable browser notifications for trade alerts
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestPermission}
                  className="mt-2"
                >
                  Grant Permission
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Categories */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Alert Categories</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-green-500/30 bg-green-500/5">
              <div>
                <Label htmlFor="entry" className="font-medium text-green-600 dark:text-green-400">
                  Entry Signals
                </Label>
                <p className="text-xs text-muted-foreground">
                  {preferences.thresholds.entry}%+ confidence
                </p>
              </div>
              <Switch
                id="entry"
                checked={preferences.categories.entry}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    categories: { ...preferences.categories, entry: checked },
                  })
                }
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-red-500/30 bg-red-500/5">
              <div>
                <Label htmlFor="exit" className="font-medium text-red-600 dark:text-red-400">
                  Exit Signals
                </Label>
                <p className="text-xs text-muted-foreground">
                  {preferences.thresholds.exit}%+ confidence
                </p>
              </div>
              <Switch
                id="exit"
                checked={preferences.categories.exit}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    categories: { ...preferences.categories, exit: checked },
                  })
                }
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-green-600/40 bg-green-600/10">
              <div>
                <Label htmlFor="strongBuy" className="font-medium text-green-700 dark:text-green-300">
                  Strong Buy
                </Label>
                <p className="text-xs text-muted-foreground">
                  {preferences.thresholds.strongBuy}%+ confidence
                </p>
              </div>
              <Switch
                id="strongBuy"
                checked={preferences.categories.strongBuy}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    categories: { ...preferences.categories, strongBuy: checked },
                  })
                }
                disabled={!preferences.enabled}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-red-600/40 bg-red-600/10">
              <div>
                <Label htmlFor="strongSell" className="font-medium text-red-700 dark:text-red-300">
                  Strong Sell
                </Label>
                <p className="text-xs text-muted-foreground">
                  {preferences.thresholds.strongSell}%+ confidence
                </p>
              </div>
              <Switch
                id="strongSell"
                checked={preferences.categories.strongSell}
                onCheckedChange={(checked) =>
                  setPreferences({
                    ...preferences,
                    categories: { ...preferences.categories, strongSell: checked },
                  })
                }
                disabled={!preferences.enabled}
              />
            </div>
          </div>
        </div>

        {/* Confidence Thresholds */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Confidence Thresholds</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Entry Signal Threshold</Label>
                <Badge variant="outline">{preferences.thresholds.entry}%</Badge>
              </div>
              <Slider
                value={[preferences.thresholds.entry]}
                onValueChange={([value]) =>
                  setPreferences({
                    ...preferences,
                    thresholds: { ...preferences.thresholds, entry: value },
                  })
                }
                min={50}
                max={90}
                step={5}
                disabled={!preferences.enabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Exit Signal Threshold</Label>
                <Badge variant="outline">{preferences.thresholds.exit}%</Badge>
              </div>
              <Slider
                value={[preferences.thresholds.exit]}
                onValueChange={([value]) =>
                  setPreferences({
                    ...preferences,
                    thresholds: { ...preferences.thresholds, exit: value },
                  })
                }
                min={50}
                max={90}
                step={5}
                disabled={!preferences.enabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Strong Buy Threshold</Label>
                <Badge variant="outline">{preferences.thresholds.strongBuy}%</Badge>
              </div>
              <Slider
                value={[preferences.thresholds.strongBuy]}
                onValueChange={([value]) =>
                  setPreferences({
                    ...preferences,
                    thresholds: { ...preferences.thresholds, strongBuy: value },
                  })
                }
                min={70}
                max={95}
                step={5}
                disabled={!preferences.enabled}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Strong Sell Threshold</Label>
                <Badge variant="outline">{preferences.thresholds.strongSell}%</Badge>
              </div>
              <Slider
                value={[preferences.thresholds.strongSell]}
                onValueChange={([value]) =>
                  setPreferences({
                    ...preferences,
                    thresholds: { ...preferences.thresholds, strongSell: value },
                  })
                }
                min={70}
                max={95}
                step={5}
                disabled={!preferences.enabled}
              />
            </div>
          </div>
        </div>

        {/* Cooldown Period - ENHANCED VISIBILITY */}
        <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">Alert Cooldown Period</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base">Cooldown Duration</Label>
              <Badge variant="default" className="text-base px-3 py-1">
                {preferences.cooldownMinutes} {preferences.cooldownMinutes === 1 ? 'minute' : 'minutes'}
              </Badge>
            </div>
            <Slider
              value={[preferences.cooldownMinutes]}
              onValueChange={([value]) =>
                setPreferences({ ...preferences, cooldownMinutes: value })
              }
              min={1}
              max={30}
              step={1}
              disabled={!preferences.enabled}
              className="py-2"
            />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Minimum time between alerts for the same cryptocurrency and signal type. 
              Prevents notification spam while ensuring you don't miss important signals.
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <h3 className="text-sm font-semibold mb-3">Alert Statistics (Last 7 Days)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Alerts</p>
              <p className="text-2xl font-bold">{stats.totalAlerts}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Entry</p>
              <p className="text-2xl font-bold text-green-600">{stats.byType.entry}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Exit</p>
              <p className="text-2xl font-bold text-red-600">{stats.byType.exit}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Confidence</p>
              <p className="text-2xl font-bold">{stats.accuracy.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} className="flex-1" disabled={!preferences.enabled && saved}>
            {saved ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
