import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export function RotationAlertHistoryPanel() {
  // Placeholder for rotation alert history
  // In a real implementation, this would fetch from local storage or backend
  const alertHistory: any[] = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Rotation Alert History
        </CardTitle>
        <CardDescription>
          Recent rotation events and alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alertHistory.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No rotation alerts yet. Alerts will appear here when rotation events are detected.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {alertHistory.map((alert, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{alert.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
