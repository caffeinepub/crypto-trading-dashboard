import { useEffect, useState } from 'react';
import { X, TrendingUp, TrendingDown, Target, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { dismissAlert, type AlertHistory } from '@/lib/alertSystem';

interface AlertToastProps {
  alert: AlertHistory;
  onDismiss: (id: string) => void;
  onNavigate: (symbol: string) => void;
}

export function AlertToast({ alert, onDismiss, onNavigate }: AlertToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 10);

    // Auto-dismiss after 10 seconds
    const timeout = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => clearTimeout(timeout);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      dismissAlert(alert.id);
      onDismiss(alert.id);
    }, 300);
  };

  const handleNavigate = () => {
    onNavigate(alert.symbol);
    handleDismiss();
  };

  const getAlertConfig = () => {
    switch (alert.type) {
      case 'entry':
        return {
          icon: <Target className="w-5 h-5 text-green-600 dark:text-green-400" />,
          title: '🎯 Smart Entry Signal (LONG)',
          color: 'border-green-500 bg-green-500/10 dark:bg-green-500/20',
          badgeColor: 'bg-green-600 hover:bg-green-700 text-white',
        };
      case 'exit':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />,
          title: '⚠️ Dynamic Exit Signal (LONG)',
          color: 'border-red-500 bg-red-500/10 dark:bg-red-500/20',
          badgeColor: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'strongBuy':
        return {
          icon: <TrendingUp className="w-5 h-5 text-green-700 dark:text-green-300" />,
          title: '🚀 Strong Buy Signal (LONG)',
          color: 'border-green-600 bg-green-600/15 dark:bg-green-600/25',
          badgeColor: 'bg-green-700 hover:bg-green-800 text-white',
        };
      case 'strongSell':
        return {
          icon: <TrendingDown className="w-5 h-5 text-red-700 dark:text-red-300" />,
          title: '🔴 Strong Sell Signal (LONG)',
          color: 'border-red-600 bg-red-600/15 dark:bg-red-600/25',
          badgeColor: 'bg-red-700 hover:bg-red-800 text-white',
        };
      case 'shortEntry':
        return {
          icon: <ArrowDown className="w-5 h-5 text-red-600 dark:text-red-400" />,
          title: '🔻 Short Entry Signal',
          color: 'border-red-500 bg-red-500/10 dark:bg-red-500/20',
          badgeColor: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'coverExit':
        return {
          icon: <ArrowUp className="w-5 h-5 text-green-600 dark:text-green-400" />,
          title: '✅ Cover Exit Signal',
          color: 'border-green-500 bg-green-500/10 dark:bg-green-500/20',
          badgeColor: 'bg-green-600 hover:bg-green-700 text-white',
        };
      default:
        return {
          icon: <Target className="w-5 h-5" />,
          title: '📊 Trade Signal',
          color: 'border-muted bg-muted/10',
          badgeColor: 'bg-muted text-foreground',
        };
    }
  };

  const config = getAlertConfig();

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]
        p-4 rounded-lg border-2 shadow-2xl backdrop-blur-md
        transition-all duration-300 ease-out
        ${config.color}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-sm text-foreground">{config.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 hover:bg-background/50"
              onClick={handleDismiss}
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-foreground">{alert.symbol}</span>
              <span className="text-sm text-muted-foreground truncate">{alert.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Price:</span>
              <span className="font-mono font-bold text-foreground">{formatCurrency(alert.price)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Confidence:</span>
              <Badge className={config.badgeColor}>{alert.confidence}%</Badge>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="default"
              size="sm"
              onClick={handleNavigate}
              className="flex-1 font-semibold"
            >
              View Details
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="font-semibold"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
