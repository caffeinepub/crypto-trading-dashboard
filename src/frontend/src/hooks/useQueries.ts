import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { fetchCryptoDataWithIndicators } from '@/lib/coinRankingApi';
import type { 
  Position, 
  Strategy, 
  Backtest, 
  TradeJournalEntry,
  UserProfile,
  SignalStrength,
  Settings
} from '../backend';

// Crypto Data Query
export function useCryptoData() {
  console.log('[React Query] 🔄 useCryptoData hook initialized');
  
  return useQuery({
    queryKey: ['cryptoData'],
    queryFn: async () => {
      console.log('[React Query] 🚀 Query function executing...');
      const startTime = performance.now();
      
      try {
        const data = await fetchCryptoDataWithIndicators();
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('[React Query] ✅ Query successful!');
        console.log('[React Query] ⏱️ Query duration:', duration, 'seconds');
        console.log('[React Query] 📊 Data points returned:', data.length);
        
        return data;
      } catch (error) {
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.error('[React Query] ❌ Query failed after', duration, 'seconds');
        console.error('[React Query] 🔥 Error:', error);
        
        throw error;
      }
    },
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60,
    retry: 3,
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
      console.log(`[React Query] 🔄 Retry attempt ${attemptIndex + 1} scheduled in ${delay}ms`);
      return delay;
    },
  });
}

// Position Queries
export function useUserPositions() {
  const { actor } = useActor();
  
  return useQuery({
    queryKey: ['userPositions'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserPositions();
    },
    enabled: !!actor,
  });
}

export function useCreatePosition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      portfolioId: bigint;
      asset: string;
      buyPrice: number;
      quantity: number;
      signalStrength: SignalStrength;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPosition(
        params.portfolioId,
        params.asset,
        params.buyPrice,
        params.quantity,
        params.signalStrength
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPositions'] });
    },
  });
}

export function useUpdatePosition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      positionId: bigint;
      sellPrice: number | null;
      stopLoss: number | null;
      takeProfit: number | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePosition(
        params.positionId,
        params.sellPrice,
        params.stopLoss,
        params.takeProfit
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPositions'] });
    },
  });
}

// Strategy Queries
export function useStrategies() {
  const { actor } = useActor();
  
  return useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllStrategies();
    },
    enabled: !!actor,
  });
}

export function useUserStrategies() {
  const { actor } = useActor();
  
  return useQuery({
    queryKey: ['userStrategies'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserStrategies();
    },
    enabled: !!actor,
  });
}

export function useCreateStrategy() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      performance: string;
      code: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createStrategy(
        params.name,
        params.description,
        params.performance,
        params.code
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userStrategies'] });
    },
  });
}

// Backtest Queries
export function useUserBacktests() {
  const { actor } = useActor();
  
  return useQuery({
    queryKey: ['userBacktests'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserBacktests();
    },
    enabled: !!actor,
  });
}

export function useCreateBacktest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      strategyId: bigint;
      performance: string;
      results: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createBacktest(
        params.strategyId,
        params.performance,
        params.results
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userBacktests'] });
    },
  });
}

// Trade Journal Queries
export function useTradeJournalEntries() {
  const { actor } = useActor();
  
  return useQuery({
    queryKey: ['tradeJournalEntries'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserTradeJournalEntries();
    },
    enabled: !!actor,
  });
}

export function useCreateJournalEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      positionId: bigint;
      outcome: string;
      notes: string;
      exitTime: bigint | null;
      pnl: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTradeJournalEntry(
        params.positionId,
        params.outcome,
        params.notes,
        params.exitTime,
        params.pnl
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tradeJournalEntries'] });
    },
  });
}

// User Profile Queries
export function useUserProfile() {
  const { actor } = useActor();
  
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

// User Settings Queries
export function useUserSettings() {
  const { actor } = useActor();
  
  return useQuery({
    queryKey: ['userSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserSettings();
    },
    enabled: !!actor,
  });
}

export function useSaveUserSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Settings) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveUserSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });
}

export function useResetUserSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetUserSettings();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
    },
  });
}
