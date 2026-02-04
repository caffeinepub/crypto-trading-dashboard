import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Sliders, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { SensitivityMode } from '@/lib/forecastEngine';

interface ForecastSensitivityControlsProps {
  sensitivity: SensitivityMode;
  onSensitivityChange: (mode: SensitivityMode) => void;
}

export function ForecastSensitivityControls({ 
  sensitivity, 
  onSensitivityChange 
}: ForecastSensitivityControlsProps) {
  return (
    <Card className="border-accent/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <img 
            src="/assets/generated/forecast-sensitivity-controls.dim_300x100.png" 
            alt="Sensitivity" 
            className="w-8 h-8 rounded"
          />
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              Forecast Sensitivity
            </CardTitle>
            <CardDescription>Adjust prediction model tuning</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <RadioGroup value={sensitivity} onValueChange={(value) => onSensitivityChange(value as SensitivityMode)}>
          <div className="space-y-3">
            {/* Conservative Mode */}
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/5 transition-colors">
              <RadioGroupItem value="conservative" id="conservative" />
              <Label htmlFor="conservative" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold">Conservative</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    0.6x multiplier
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cautious predictions with reduced volatility estimates
                </p>
              </Label>
            </div>

            {/* Balanced Mode */}
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/5 transition-colors">
              <RadioGroupItem value="balanced" id="balanced" />
              <Label htmlFor="balanced" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">Balanced</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    1.0x multiplier
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Standard predictions based on technical indicators
                </p>
              </Label>
            </div>

            {/* Aggressive Mode */}
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/5 transition-colors">
              <RadioGroupItem value="aggressive" id="aggressive" />
              <Label htmlFor="aggressive" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">Aggressive</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    1.5x multiplier
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Bold predictions with amplified movement estimates
                </p>
              </Label>
            </div>
          </div>
        </RadioGroup>

        <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-muted-foreground">
            <strong className="text-yellow-600 dark:text-yellow-400">Note:</strong> Sensitivity affects prediction magnitude, not direction. 
            Higher sensitivity may increase both gains and losses in volatile markets.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
