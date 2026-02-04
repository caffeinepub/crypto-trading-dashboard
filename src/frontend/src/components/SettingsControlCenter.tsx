import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  ChevronDown, 
  ChevronUp, 
  Brain, 
  Bell, 
  Shield, 
  Clock, 
  Eye, 
  Zap,
  Info,
  RotateCcw,
  Smartphone
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useActor } from '@/hooks/useActor';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Settings as SettingsType } from '../backend';
import { PwaInstallHelp } from './PwaInstallHelp';

interface SettingsControlCenterProps {
  onSettingsChange?: (settings: SettingsType) => void;
}

const DEFAULT_SETTINGS: SettingsType = {
  aiForecastSensitivity: 1.0,
  alertThreshold: 60.0,
  riskTolerance: 2.0,
  preferredTimeframes: ['1h', '4h', '1d'],
  confidenceLevel: 60.0,
  enablePerformanceMode: false,
  enableBrowserNotifications: true,
  enableAudioAlerts: true,
  enableToastNotifications: true,
  enableTimeframeSync: true,
  displayUiTheme: 'system',
};

export function SettingsControlCenter({ onSettingsChange }: SettingsControlCenterProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    ai: true,
    alerts: false,
    risk: false,
    timeframes: false,
    display: false,
    performance: false,
    mobile: false,
  });

  // Fetch user settings
  const { data: userSettings, isLoading } = useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserSettings();
    },
    enabled: !!actor,
  });

  const [localSettings, setLocalSettings] = useState<SettingsType>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (userSettings) {
      setLocalSettings(userSettings);
    }
  }, [userSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: SettingsType) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveUserSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      toast.success('Settings saved successfully');
      onSettingsChange?.(localSettings);
    },
    onError: (error) => {
      toast.error('Failed to save settings');
      console.error('Settings save error:', error);
    },
  });

  // Reset settings mutation
  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetUserSettings();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      setLocalSettings(DEFAULT_SETTINGS);
      toast.success('Settings reset to defaults');
      onSettingsChange?.(DEFAULT_SETTINGS);
    },
    onError: (error) => {
      toast.error('Failed to reset settings');
      console.error('Settings reset error:', error);
    },
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(localSettings);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      resetSettingsMutation.mutate();
    }
  };

  const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleTimeframe = (timeframe: string) => {
    const current = localSettings.preferredTimeframes;
    const updated = current.includes(timeframe)
      ? current.filter(tf => tf !== timeframe)
      : [...current, timeframe];
    updateSetting('preferredTimeframes', updated);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            Settings & Strategy Control Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">Settings & Strategy Control</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Customize your trading platform experience
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetSettingsMutation.isPending}
              className="flex-1 sm:flex-none min-w-touch"
            >
              <RotateCcw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saveSettingsMutation.isPending}
              className="flex-1 sm:flex-none min-w-touch"
            >
              {saveSettingsMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <TooltipProvider>
          {/* AI Strategy Settings */}
          <Collapsible open={openSections.ai} onOpenChange={() => toggleSection('ai')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 sm:p-4 h-auto touch-manipulation">
                <div className="flex items-center gap-2 sm:gap-3 text-left">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base">AI Strategy Settings</p>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Forecast sensitivity and confidence</p>
                  </div>
                </div>
                {openSections.ai ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="forecast-sensitivity" className="flex items-center gap-2 text-sm sm:text-base">
                    <span>AI Forecast Sensitivity</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Adjusts how aggressive AI predictions are</p>
                        <p className="text-xs">Lower = Conservative, Higher = Aggressive</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Badge variant="outline" className="text-sm">{localSettings.aiForecastSensitivity.toFixed(1)}x</Badge>
                </div>
                <Slider
                  id="forecast-sensitivity"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[localSettings.aiForecastSensitivity]}
                  onValueChange={([value]) => updateSetting('aiForecastSensitivity', value)}
                  className="touch-manipulation"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conservative</span>
                  <span>Balanced</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="confidence-level" className="flex items-center gap-2 text-sm sm:text-base">
                    <span>Min Confidence</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Minimum confidence required for trade signals</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Badge variant="outline" className="text-sm">{localSettings.confidenceLevel.toFixed(0)}%</Badge>
                </div>
                <Slider
                  id="confidence-level"
                  min={40}
                  max={90}
                  step={5}
                  value={[localSettings.confidenceLevel]}
                  onValueChange={([value]) => updateSetting('confidenceLevel', value)}
                  className="touch-manipulation"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Alert Configuration */}
          <Collapsible open={openSections.alerts} onOpenChange={() => toggleSection('alerts')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 sm:p-4 h-auto touch-manipulation">
                <div className="flex items-center gap-2 sm:gap-3 text-left">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base">Alert Configuration</p>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Notification preferences</p>
                  </div>
                </div>
                {openSections.alerts ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="alert-threshold" className="flex items-center gap-2 text-sm sm:text-base">
                    <span>Alert Threshold</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Minimum confidence to trigger alerts</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Badge variant="outline" className="text-sm">{localSettings.alertThreshold.toFixed(0)}%</Badge>
                </div>
                <Slider
                  id="alert-threshold"
                  min={50}
                  max={90}
                  step={5}
                  value={[localSettings.alertThreshold]}
                  onValueChange={([value]) => updateSetting('alertThreshold', value)}
                  className="touch-manipulation"
                />
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2 py-2">
                  <Label htmlFor="browser-notifications" className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                    <span>Browser Notifications</span>
                  </Label>
                  <Switch
                    id="browser-notifications"
                    checked={localSettings.enableBrowserNotifications}
                    onCheckedChange={(checked) => updateSetting('enableBrowserNotifications', checked)}
                    className="touch-manipulation"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 py-2">
                  <Label htmlFor="audio-alerts" className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                    <span>Audio Alerts</span>
                  </Label>
                  <Switch
                    id="audio-alerts"
                    checked={localSettings.enableAudioAlerts}
                    onCheckedChange={(checked) => updateSetting('enableAudioAlerts', checked)}
                    className="touch-manipulation"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 py-2">
                  <Label htmlFor="toast-notifications" className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                    <span>Toast Notifications</span>
                  </Label>
                  <Switch
                    id="toast-notifications"
                    checked={localSettings.enableToastNotifications}
                    onCheckedChange={(checked) => updateSetting('enableToastNotifications', checked)}
                    className="touch-manipulation"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Risk Management */}
          <Collapsible open={openSections.risk} onOpenChange={() => toggleSection('risk')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 sm:p-4 h-auto touch-manipulation">
                <div className="flex items-center gap-2 sm:gap-3 text-left">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base">Risk Management</p>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Risk tolerance settings</p>
                  </div>
                </div>
                {openSections.risk ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="risk-tolerance" className="flex items-center gap-2 text-sm sm:text-base">
                    <span>Risk Tolerance</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Percentage of portfolio to risk per trade</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Badge variant="outline" className="text-sm">{localSettings.riskTolerance.toFixed(1)}%</Badge>
                </div>
                <Slider
                  id="risk-tolerance"
                  min={0.5}
                  max={5.0}
                  step={0.5}
                  value={[localSettings.riskTolerance]}
                  onValueChange={([value]) => updateSetting('riskTolerance', value)}
                  className="touch-manipulation"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conservative</span>
                  <span>Moderate</span>
                  <span>Aggressive</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Timeframe Controls */}
          <Collapsible open={openSections.timeframes} onOpenChange={() => toggleSection('timeframes')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 sm:p-4 h-auto touch-manipulation">
                <div className="flex items-center gap-2 sm:gap-3 text-left">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base">Timeframe Controls</p>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Analysis timeframes</p>
                  </div>
                </div>
                {openSections.timeframes ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
              <div className="space-y-3">
                <Label className="text-sm sm:text-base">Preferred Timeframes</Label>
                <div className="grid grid-cols-4 gap-2">
                  {['1h', '4h', '1d', '7d'].map((tf) => (
                    <Button
                      key={tf}
                      variant={localSettings.preferredTimeframes.includes(tf) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleTimeframe(tf)}
                      className="min-w-touch touch-manipulation"
                    >
                      {tf}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 py-2">
                <Label htmlFor="timeframe-sync" className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                  <span>Enable Timeframe Sync</span>
                </Label>
                <Switch
                  id="timeframe-sync"
                  checked={localSettings.enableTimeframeSync}
                  onCheckedChange={(checked) => updateSetting('enableTimeframeSync', checked)}
                  className="touch-manipulation"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Display Options */}
          <Collapsible open={openSections.display} onOpenChange={() => toggleSection('display')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 sm:p-4 h-auto touch-manipulation">
                <div className="flex items-center gap-2 sm:gap-3 text-left">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base">Display Options</p>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">UI theme preferences</p>
                  </div>
                </div>
                {openSections.display ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
              <div className="space-y-3">
                <Label htmlFor="ui-theme" className="text-sm sm:text-base">UI Theme</Label>
                <Select
                  value={localSettings.displayUiTheme}
                  onValueChange={(value) => updateSetting('displayUiTheme', value)}
                >
                  <SelectTrigger id="ui-theme" className="min-h-touch touch-manipulation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Performance Settings */}
          <Collapsible open={openSections.performance} onOpenChange={() => toggleSection('performance')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 sm:p-4 h-auto touch-manipulation">
                <div className="flex items-center gap-2 sm:gap-3 text-left">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base">Performance Settings</p>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Optimization controls</p>
                  </div>
                </div>
                {openSections.performance ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 sm:px-4 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between gap-2 py-2">
                <Label htmlFor="performance-mode" className="flex items-center gap-2 text-sm sm:text-base cursor-pointer">
                  <span>High-Performance Mode</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Optimize for volatile market conditions</p>
                      <p className="text-xs">Reduces animations and increases caching</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Switch
                  id="performance-mode"
                  checked={localSettings.enablePerformanceMode}
                  onCheckedChange={(checked) => updateSetting('enablePerformanceMode', checked)}
                  className="touch-manipulation"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Mobile App Installation */}
          <Collapsible open={openSections.mobile} onOpenChange={() => toggleSection('mobile')}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-3 sm:p-4 h-auto touch-manipulation">
                <div className="flex items-center gap-2 sm:gap-3 text-left">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base">Mobile App Installation</p>
                    <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Add to home screen</p>
                  </div>
                </div>
                {openSections.mobile ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 sm:px-4 pt-3 sm:pt-4">
              <PwaInstallHelp />
            </CollapsibleContent>
          </Collapsible>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
