import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { History, TrendingUp, TrendingDown, Target, AlertTriangle, Search, Download, ArrowDown, ArrowUp } from 'lucide-react';
import { getAlertHistory, type AlertHistory } from '@/lib/alertSystem';
import { formatCurrency } from '@/lib/utils';

export function AlertHistoryPanel() {
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<AlertHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDays, setFilterDays] = useState<string>('7');

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [history, searchTerm, filterType, filterDays]);

  const loadHistory = () => {
    const alerts = getAlertHistory();
    setHistory(alerts.sort((a, b) => b.timestamp - a.timestamp));
    console.log('[Alert History] 📋 Loaded', alerts.length, 'alerts');
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Filter by days
    const daysNum = parseInt(filterDays);
    const cutoffTime = Date.now() - (daysNum * 24 * 60 * 60 * 1000);
    filtered = filtered.filter(alert => alert.timestamp > cutoffTime);

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.symbol.toLowerCase().includes(term) ||
        alert.name.toLowerCase().includes(term)
      );
    }

    setFilteredHistory(filtered);
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Symbol', 'Name', 'Type', 'Confidence', 'Price'],
      ...filteredHistory.map(alert => [
        new Date(alert.timestamp).toISOString(),
        alert.symbol,
        alert.name,
        alert.type,
        alert.confidence.toString(),
        alert.price.toString(),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alert-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('[Alert History] 📥 Exported', filteredHistory.length, 'alerts');
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'entry':
        return <Target className="w-4 h-4 text-green-600" />;
      case 'exit':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'strongBuy':
        return <TrendingUp className="w-4 h-4 text-green-700" />;
      case 'strongSell':
        return <TrendingDown className="w-4 h-4 text-red-700" />;
      case 'shortEntry':
        return <ArrowDown className="w-4 h-4 text-orange-600" />;
      case 'coverExit':
        return <ArrowUp className="w-4 h-4 text-blue-600" />;
      default:
        return <Target className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'entry':
        return <Badge className="bg-green-600 text-white">Entry</Badge>;
      case 'exit':
        return <Badge className="bg-red-600 text-white">Exit</Badge>;
      case 'strongBuy':
        return <Badge className="bg-green-700 text-white">Strong Buy</Badge>;
      case 'strongSell':
        return <Badge className="bg-red-700 text-white">Strong Sell</Badge>;
      case 'shortEntry':
        return <Badge className="bg-orange-600 text-white">Short Entry</Badge>;
      case 'coverExit':
        return <Badge className="bg-blue-600 text-white">Cover Exit</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const calculateStats = () => {
    const avgConfidence = filteredHistory.length > 0
      ? filteredHistory.reduce((sum, alert) => sum + alert.confidence, 0) / filteredHistory.length
      : 0;

    const byType = {
      entry: filteredHistory.filter(a => a.type === 'entry').length,
      exit: filteredHistory.filter(a => a.type === 'exit').length,
      strongBuy: filteredHistory.filter(a => a.type === 'strongBuy').length,
      strongSell: filteredHistory.filter(a => a.type === 'strongSell').length,
      shortEntry: filteredHistory.filter(a => a.type === 'shortEntry').length,
      coverExit: filteredHistory.filter(a => a.type === 'coverExit').length,
    };

    return { avgConfidence, byType };
  };

  const stats = calculateStats();

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Alert History</CardTitle>
              <CardDescription>
                View and analyze past alert notifications
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredHistory.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50 border">
          <div>
            <p className="text-xs text-muted-foreground">Total Alerts</p>
            <p className="text-2xl font-bold">{filteredHistory.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Long Signals</p>
            <p className="text-2xl font-bold text-green-600">{stats.byType.entry + stats.byType.strongBuy}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Short Signals</p>
            <p className="text-2xl font-bold text-orange-600">{stats.byType.shortEntry + stats.byType.coverExit}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Confidence</p>
            <p className="text-2xl font-bold">{stats.avgConfidence.toFixed(0)}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by symbol or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm">Alert Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="entry">Entry</SelectItem>
                <SelectItem value="exit">Exit</SelectItem>
                <SelectItem value="strongBuy">Strong Buy</SelectItem>
                <SelectItem value="strongSell">Strong Sell</SelectItem>
                <SelectItem value="shortEntry">Short Entry</SelectItem>
                <SelectItem value="coverExit">Cover Exit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="days" className="text-sm">Time Period</Label>
            <Select value={filterDays} onValueChange={setFilterDays}>
              <SelectTrigger id="days">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 Hours</SelectItem>
                <SelectItem value="3">Last 3 Days</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Alert List */}
        <ScrollArea className="h-[400px] rounded-lg border">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <History className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No alerts found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchTerm || filterType !== 'all' ? 'Try adjusting your filters' : 'Alerts will appear here when triggered'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredHistory.map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{alert.symbol}</span>
                          <span className="text-sm text-muted-foreground truncate">{alert.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {getAlertBadge(alert.type)}
                          <Badge variant="outline">{alert.confidence}%</Badge>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-mono">{formatCurrency(alert.price)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
