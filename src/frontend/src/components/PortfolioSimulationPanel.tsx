import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, TrendingUp, TrendingDown, Plus, X, DollarSign, Target, Clock, PieChart } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { 
  getActivePositions, 
  getAvailableCapital, 
  openPosition, 
  closePosition, 
  calculatePortfolioMetrics,
  updatePositionPrices,
  resetPortfolio,
  type SimulatedPosition 
} from '@/lib/portfolioSimulation';
import type { CryptoData } from '@/lib/coinRankingApi';
import { SignalStrength } from '../backend';

interface PortfolioSimulationPanelProps {
  cryptoData: CryptoData[];
}

export function PortfolioSimulationPanel({ cryptoData }: PortfolioSimulationPanelProps) {
  const [positions, setPositions] = useState<SimulatedPosition[]>([]);
  const [capital, setCapital] = useState(0);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [signalType, setSignalType] = useState<'long' | 'short'>('long');

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    if (cryptoData.length > 0) {
      updatePositionPrices(cryptoData);
      loadPortfolio();
    }
  }, [cryptoData]);

  const loadPortfolio = () => {
    setPositions(getActivePositions());
    setCapital(getAvailableCapital());
  };

  const metrics = useMemo(() => 
    calculatePortfolioMetrics(cryptoData), 
    [positions, cryptoData]
  );

  const handleOpenPosition = () => {
    const crypto = cryptoData.find(c => c.symbol === selectedCrypto);
    if (!crypto || !quantity) return;

    // Determine signal strength based on RSI and EMA signal
    let signalStrength: SignalStrength;
    if (crypto.rsi < 30 && crypto.emaSignal === 'Bullish') {
      signalStrength = SignalStrength.strongBuy;
    } else if (crypto.rsi > 70 && crypto.emaSignal === 'Bearish') {
      signalStrength = SignalStrength.strongSell;
    } else if (crypto.emaSignal === 'Bullish') {
      signalStrength = SignalStrength.buy;
    } else if (crypto.emaSignal === 'Bearish') {
      signalStrength = SignalStrength.sell;
    } else {
      signalStrength = SignalStrength.hold;
    }

    const position = openPosition(
      crypto,
      parseFloat(quantity),
      signalType,
      signalStrength
    );

    if (position) {
      loadPortfolio();
      setIsOpenDialogOpen(false);
      setSelectedCrypto('');
      setQuantity('');
    }
  };

  const handleClosePosition = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    closePosition(positionId, position.currentPrice);
    loadPortfolio();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the portfolio? This will close all positions and reset capital.')) {
      resetPortfolio();
      loadPortfolio();
    }
  };

  const getPositionPnL = (position: SimulatedPosition) => {
    return position.signalType === 'long'
      ? (position.currentPrice - position.entryPrice) * position.quantity
      : (position.entryPrice - position.currentPrice) * position.quantity;
  };

  const getPositionROI = (position: SimulatedPosition) => {
    const pnl = getPositionPnL(position);
    return (pnl / (position.entryPrice * position.quantity)) * 100;
  };

  const getHoldingDuration = (position: SimulatedPosition) => {
    const duration = Date.now() - position.entryTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    return days > 0 ? `${days}d ${hours % 24}h` : `${hours}h`;
  };

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Portfolio Simulation</CardTitle>
              <CardDescription>Track virtual positions and performance</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Open Position
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Open New Position</DialogTitle>
                  <DialogDescription>
                    Create a simulated trading position
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cryptocurrency</Label>
                    <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crypto" />
                      </SelectTrigger>
                      <SelectContent>
                        {cryptoData.slice(0, 50).map(crypto => (
                          <SelectItem key={crypto.symbol} value={crypto.symbol}>
                            {crypto.symbol} - {formatCurrency(crypto.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Position Type</Label>
                    <Select value={signalType} onValueChange={(v) => setSignalType(v as 'long' | 'short')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="long">Long (Buy)</SelectItem>
                        <SelectItem value="short">Short (Sell)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">Available Capital</p>
                    <p className="text-xl font-bold">{formatCurrency(capital)}</p>
                  </div>
                  <Button onClick={handleOpenPosition} className="w-full">
                    Open Position
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(metrics.totalValue)}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Total P&L</p>
            </div>
            <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.totalPnL)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">ROI</p>
            </div>
            <p className={`text-2xl font-bold ${metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(metrics.roi)}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Positions</p>
            </div>
            <p className="text-2xl font-bold">{metrics.positionCount}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.winningPositions}W / {metrics.losingPositions}L
            </p>
          </div>
        </div>

        {/* Active Positions */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Active Positions</h3>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active positions</p>
              <p className="text-sm mt-1">Open a position to start tracking</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {positions.map(position => {
                  const pnl = getPositionPnL(position);
                  const roi = getPositionROI(position);
                  return (
                    <div key={position.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg">{position.symbol}</span>
                            <Badge variant={position.signalType === 'long' ? 'default' : 'destructive'}>
                              {position.signalType.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{position.name}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleClosePosition(position.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Close
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Entry</p>
                          <p className="font-mono">{formatCurrency(position.entryPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-mono">{formatCurrency(position.currentPrice)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">P&L</p>
                          <p className={`font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(pnl)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">ROI</p>
                          <p className={`font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(roi)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getHoldingDuration(position)}
                        </div>
                        <div>Qty: {position.quantity.toFixed(4)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
