import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, Activity } from 'lucide-react';
import type { RotationPhase } from '@/lib/rotationPhase';

interface RotationPhasePanelProps {
  phase: RotationPhase | null;
}

export function RotationPhasePanel({ phase }: RotationPhasePanelProps) {
  if (!phase) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insufficient data to determine market rotation phase.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getPhaseColor = (phaseName: string) => {
    switch (phaseName) {
      case 'BTC Dominance':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
      case 'BTC Accumulation':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      case 'Rotation to ETH':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'Altcoin Season':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'Risk-Off':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 75) return 'text-success';
    if (confidence >= 50) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Current Market Phase
        </CardTitle>
        <CardDescription>
          Real-time rotation phase analysis with confidence scoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Badge className={`text-lg px-4 py-2 ${getPhaseColor(phase.phase)}`}>
            {phase.phase}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Confidence:</span>
            <span className={`text-lg font-bold ${getConfidenceColor(phase.confidence)}`}>
              {phase.confidence}%
            </span>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-sm leading-relaxed">{phase.explanation}</p>
        </div>

        {phase.signals.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Key Signals
            </h4>
            <ul className="space-y-1">
              {phase.signals.map((signal, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
