import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sliders, TrendingUp, TrendingDown, Target, Info, Zap, Shield, Activity } from 'lucide-react';
import {
  getSensitivitySettings,
  saveSensitivitySettings,
  determineSensitivityMode,
  getSensitivityModeDescription,
  getSensitivityModeBadgeClass,
  getPresetThresholds,
  calculateSensitivityStats,
  trackSensitivityPerformance,
  type SensitivitySettings,
  type SensitivityStats,
} from '@/lib/sensitivityControl';
import type { EntryZoneSignal, ExitZoneSignal } from '@/lib/tradeEntryZone';

interface SensitivityControlPanelProps {
  allEntryZones: EntryZoneSignal[];
  allExitZones: ExitZoneSignal[];
  onThresholdChange?: (threshold: number) => void;
}

export function SensitivityControlPanel({
  allEntryZones,
  allExitZones,
  onThresholdChange,
}: SensitivityControlPanelProps) {
  const [settings, setSettings] = useState<SensitivitySettings>(getSensitivitySettings());
  const [stats, setStats] = useState<SensitivityStats | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Calculate stats whenever threshold or zones change
  useEffect(() => {
    const newStats = calculateSensitivityStats(
      allEntryZones,
      allExitZones,
      settings.threshold
    );
    setStats(newStats);
    
    // Track performance
    trackSensitivityPerformance(newStats);
  }, [settings.threshold, allEntryZones, allExitZones]);

  const handleThresholdChange = (value: number[]) => {
    const newThreshold = value[0];
    const newMode = determineSensitivityMode(newThreshold);
    
    const newSettings: SensitivitySettings = {
      threshold: newThreshold,
      mode: newMode,
      lastUpdated: Date.now(),
    };
    
    setSettings(newSettings);
    setIsAdjusting(true);
    
    // Debounce save
    setTimeout(() => {
      saveSensitivitySettings(newSettings);
      onThresholdChange?.(newThreshold);
      setIsAdjusting(false);
    }, 500);
  };

  const handlePresetClick = (preset: { value: number; mode: 'aggressive' | 'balanced' | 'conservative' }) => {
    const newSettings: SensitivitySettings = {
      threshold: preset.value,
      mode: preset.mode,
      lastUpdated: Date.now(),
    };
    
    setSettings(newSettings);
    saveSensitivitySettings(newSettings);
    onThresholdChange?.(preset.value);
  };

  const presets = getPresetThresholds();

  return (
    <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sliders className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                Smart Trade Sensitivity Controls
                <Badge className={getSensitivityModeBadgeClass(settings.mode)}>
                  {settings.mode.charAt(0).toUpperCase() + settings.mode.slice(1)}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Adjust confidence thresholds to fine-tune signal sensitivity (50-90%)
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sensitivity Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Confidence Threshold</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg font-bold px-3 py-1">
                {settings.threshold}%
              </Badge>
              {isAdjusting && (
                <Badge variant="secondary" className="text-xs">
                  Updating...
                </Badge>
              )}
            </div>
          </div>
          
          <div className="relative">
            <Slider
              value={[settings.threshold]}
              onValueChange={handleThresholdChange}
              min={50}
              max={90}
              step={5}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>50% (Aggressive)</span>
              <span>70% (Balanced)</span>
              <span>90% (Conservative)</span>
            </div>
          </div>

          {/* Mode Description */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold mb-1">
                  {settings.mode.charAt(0).toUpperCase() + settings.mode.slice(1)} Mode
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {getSensitivityModeDescription(settings.mode)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Preset Buttons */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Quick Presets</Label>
          <div className="grid grid-cols-3 gap-3">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant={settings.mode === preset.mode ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetClick(preset)}
                className="flex flex-col items-center gap-1 h-auto py-3"
              >
                {preset.mode === 'aggressive' && <Zap className="w-4 h-4" />}
                {preset.mode === 'balanced' && <Activity className="w-4 h-4" />}
                {preset.mode === 'conservative' && <Shield className="w-4 h-4" />}
                <span className="text-xs font-semibold">{preset.label}</span>
                <span className="text-xs opacity-70">{preset.value}%</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Real-time Opportunity Counter */}
        {stats && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Active Opportunities at {settings.threshold}%</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">Total</span>
                </div>
                <p className="text-3xl font-bold">{stats.activeOpportunities}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.averageConfidence > 0 ? `Avg: ${stats.averageConfidence.toFixed(0)}%` : 'No data'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-semibold text-muted-foreground">Entry</span>
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.entryOpportunities}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Buy signals</p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-xs font-semibold text-muted-foreground">Exit</span>
                </div>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.exitOpportunities}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Sell signals</p>
              </div>
            </div>
          </div>
        )}

        {/* Performance Impact Visualization */}
        <div className="p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Performance Impact</p>
              <p className="text-xs text-muted-foreground mt-1">
                {settings.threshold >= 70 && 'Higher threshold = fewer but more reliable signals'}
                {settings.threshold >= 60 && settings.threshold < 70 && 'Balanced threshold = moderate signal frequency with good reliability'}
                {settings.threshold < 60 && 'Lower threshold = more frequent signals with varying reliability'}
              </p>
            </div>
          </div>
          
          {/* Visual indicator */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Signal Frequency:</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 via-yellow-600 to-orange-600 transition-all"
                style={{ width: `${((90 - settings.threshold) / 40) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold">
              {settings.threshold >= 70 ? 'Low' : settings.threshold >= 60 ? 'Medium' : 'High'}
            </span>
          </div>
        </div>

        {/* Explanatory Hints */}
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
                How Sensitivity Works
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                <li>• <strong>Lower thresholds (50-65%)</strong>: More opportunities, higher risk, requires careful analysis</li>
                <li>• <strong>Medium thresholds (65-75%)</strong>: Balanced approach, good for most traders</li>
                <li>• <strong>Higher thresholds (75-90%)</strong>: Fewer but higher quality signals, lower risk</li>
                <li>• Adjust based on your risk tolerance and trading strategy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(settings.lastUpdated).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
