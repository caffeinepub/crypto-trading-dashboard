import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Target, DollarSign } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { 
  getRiskParameters, 
  saveRiskParameters, 
  calculateRiskMetrics,
  type RiskParameters 
} from '@/lib/riskManagement';
import { getActivePositions } from '@/lib/portfolioSimulation';
import type { CryptoData } from '@/lib/coinRankingApi';

interface RiskManagementPanelProps {
  cryptoData: CryptoData[];
}

export function RiskManagementPanel({ cryptoData }: RiskManagementPanelProps) {
  const [params, setParams] = useState<RiskParameters>(getRiskParameters());
  const [metrics, setMetrics] = useState(calculateRiskMetrics(getActivePositions(), cryptoData));

  useEffect(() => {
    const positions = getActivePositions();
    setMetrics(calculateRiskMetrics(positions, cryptoData));
  }, [cryptoData]);

  const handleSave = () => {
    saveRiskParameters(params);
  };

  const getHeatLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return '';
    }
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle>Risk Management</CardTitle>
            <CardDescription>Configure position sizing and risk parameters</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Current Risk</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.currentRisk)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Max Risk</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.maxRisk)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Available Risk</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.availableRisk)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Heat Level</p>
            </div>
            <Badge className={getHeatLevelColor(metrics.portfolioHeatLevel)}>
              {metrics.portfolioHeatLevel.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Risk Parameters */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Risk Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account Size ($)</Label>
              <Input
                type="number"
                value={params.accountSize}
                onChange={(e) => setParams({ ...params, accountSize: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Risk Per Trade (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={params.riskPercentage}
                onChange={(e) => setParams({ ...params, riskPercentage: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Position Size (%)</Label>
              <Input
                type="number"
                step="1"
                value={params.maxPositionSize}
                onChange={(e) => setParams({ ...params, maxPositionSize: parseFloat(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Drawdown (%)</Label>
              <Input
                type="number"
                step="1"
                value={params.maxDrawdown}
                onChange={(e) => setParams({ ...params, maxDrawdown: parseFloat(e.target.value) })}
              />
            </div>
          </div>
          <Button onClick={handleSave} className="w-full">
            Save Parameters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
