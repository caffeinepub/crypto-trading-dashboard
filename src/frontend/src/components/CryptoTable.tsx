import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Sparkles, Target, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatPercentage, formatLargeNumber } from '@/lib/utils';
import { AIAdvisoryBadge } from './AIAdvisoryBadge';
import type { CryptoData } from '@/lib/coinRankingApi';
import type { EntryZoneSignal, ExitZoneSignal } from '@/lib/tradeEntryZone';
import { getConfidenceBadgeClass } from '@/lib/tradeEntryZone';

interface CryptoTableProps {
  data: CryptoData[];
  entryZones?: EntryZoneSignal[];
  exitZones?: ExitZoneSignal[];
  onSelectCoin?: (coin: CryptoData) => void;
}

const ITEMS_PER_PAGE = 50;

export function CryptoTable({ data, entryZones = [], exitZones = [], onSelectCoin }: CryptoTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'price' | 'change' | 'volume' | 'marketCap'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const getEntryZone = (symbol: string) => {
    return entryZones.find(zone => zone.symbol === symbol);
  };

  const getExitZone = (symbol: string) => {
    return exitZones.find(zone => zone.symbol === symbol);
  };

  const getZoneStatus = (symbol: string) => {
    const entryZone = getEntryZone(symbol);
    const exitZone = getExitZone(symbol);

    if (entryZone?.isActive) {
      return {
        type: 'entry' as const,
        label: 'Smart Entry Active',
        confidence: entryZone.confidence,
        probability: entryZone.tradeSuccessProbability,
        badge: (
          <div className="flex flex-col gap-1">
            <Badge className={`${getConfidenceBadgeClass(entryZone.tradeSuccessProbability)} gap-1 animate-pulse`}>
              <Target className="w-3 h-3" />
              Smart Entry
            </Badge>
            <span className="text-xs text-muted-foreground">{entryZone.tradeSuccessProbability}% probability</span>
          </div>
        )
      };
    }

    if (exitZone?.isActive) {
      return {
        type: 'exit' as const,
        label: 'Dynamic Exit Recommended',
        confidence: exitZone.confidence,
        probability: exitZone.tradeSuccessProbability,
        badge: (
          <div className="flex flex-col gap-1">
            <Badge className={`${getConfidenceBadgeClass(exitZone.tradeSuccessProbability)} gap-1 animate-pulse`}>
              <AlertTriangle className="w-3 h-3" />
              Dynamic Exit
            </Badge>
            <span className="text-xs text-muted-foreground">{exitZone.tradeSuccessProbability}% probability</span>
          </div>
        )
      };
    }

    return {
      type: 'hold' as const,
      label: 'Hold',
      confidence: 'Medium' as const,
      probability: 50,
      badge: <span className="text-xs text-muted-foreground">Hold Zone</span>
    };
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        coin =>
          coin.symbol.toLowerCase().includes(query) ||
          coin.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'change':
          comparison = a.percentChange - b.percentChange;
          break;
        case 'volume':
          comparison = a.volume - b.volume;
          break;
        case 'marketCap':
          comparison = a.marketCap - b.marketCap;
          break;
        case 'rank':
        default:
          // Rank by market cap (higher market cap = lower rank number)
          comparison = b.marketCap - a.marketCap;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, searchQuery, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = filteredAndSortedData.slice(startIndex, endIndex);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by symbol or name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rank">Market Cap Rank</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="change">24h Change</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="marketCap">Market Cap</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedData.length)} of {filteredAndSortedData.length} cryptocurrencies
        {searchQuery && ` (filtered from ${data.length} total)`}
      </div>

      {/* Table */}
      <div className="rounded-md border-2 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px] font-bold">Rank</TableHead>
              <TableHead className="w-[100px] font-bold">Symbol</TableHead>
              <TableHead className="font-bold">Name</TableHead>
              <TableHead className="text-right cursor-pointer hover:bg-muted/50 font-bold" onClick={() => handleSort('price')}>
                Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:bg-muted/50 font-bold" onClick={() => handleSort('change')}>
                24h Change {sortBy === 'change' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:bg-muted/50 font-bold" onClick={() => handleSort('volume')}>
                Volume {sortBy === 'volume' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:bg-muted/50 font-bold" onClick={() => handleSort('marketCap')}>
                Market Cap {sortBy === 'marketCap' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="text-right font-bold">RSI (14)</TableHead>
              <TableHead className="text-center font-bold">EMA Signal</TableHead>
              <TableHead className="text-center font-bold">AI Advisory</TableHead>
              <TableHead className="text-center font-bold">Smart Trade Zone</TableHead>
              <TableHead className="text-center font-bold">Trend</TableHead>
              {onSelectCoin && <TableHead className="text-center font-bold">AI Forecast</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={onSelectCoin ? 13 : 12} className="text-center py-8 text-muted-foreground">
                  No cryptocurrencies found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((coin, index) => {
                const zoneStatus = getZoneStatus(coin.symbol);
                const rank = startIndex + index + 1;
                return (
                  <TableRow key={coin.symbol} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-sm text-muted-foreground font-semibold">#{rank}</TableCell>
                    <TableCell className="font-bold text-base">{coin.symbol}</TableCell>
                    <TableCell className="font-medium">{coin.name}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {formatCurrency(coin.price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className={`flex items-center justify-end gap-1 font-semibold ${
                        coin.percentChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {coin.percentChange >= 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                        <span>{formatPercentage(coin.percentChange)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatLargeNumber(coin.volume)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatLargeNumber(coin.marketCap)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant="outline"
                        className={`font-semibold ${
                          coin.rsi > 70 ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-500/10' :
                          coin.rsi < 30 ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-500/10' :
                          'border-muted-foreground/30 text-muted-foreground'
                        }`}
                      >
                        {coin.rsi.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={coin.emaSignal === 'Bullish' ? 'default' : 'secondary'}
                        className={`font-semibold ${coin.emaSignal === 'Bullish' 
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' 
                          : 'bg-red-600 hover:bg-red-700 text-white border-red-500'
                        }`}
                      >
                        {coin.emaSignal}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <AIAdvisoryBadge coin={coin} />
                    </TableCell>
                    <TableCell className="text-center">
                      {zoneStatus.badge}
                    </TableCell>
                    <TableCell className="text-center">
                      {coin.percentChange >= 0 ? (
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400 mx-auto" />
                      )}
                    </TableCell>
                    {onSelectCoin && (
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectCoin(coin)}
                          className="gap-1 hover:bg-accent/20"
                        >
                          <Sparkles className="w-4 h-4 text-accent" />
                          View
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
