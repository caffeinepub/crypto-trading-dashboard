import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { RotationRadarSettings } from '../backend';

const DEFAULT_SETTINGS: RotationRadarSettings = {
  selectedBuckets: ['BTC', 'ETH', 'Majors', 'Mid-caps'],
  alertRules: [],
  divergenceThreshold: 1.5,
  enablePushNotifications: true,
  showAllRotations: false,
  longEntrySignalThreshold: 60.0,
  shortEntrySignalThreshold: 40.0,
  uiTheme: 'ugc_theme_light',
  createdAt: BigInt(Date.now() * 1000000),
  updatedAt: undefined,
};

export function useRotationRadarSettings() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const query = useQuery<RotationRadarSettings>({
    queryKey: ['rotationRadarSettings'],
    queryFn: async () => {
      if (!actor) return DEFAULT_SETTINGS;
      try {
        return await actor.getUserRotationRadarSettings();
      } catch (error) {
        console.error('Failed to fetch rotation radar settings:', error);
        return DEFAULT_SETTINGS;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async (settings: RotationRadarSettings) => {
      if (!actor) {
        // Store locally when not authenticated
        localStorage.setItem('rotationRadarSettings', JSON.stringify(settings));
        return;
      }
      await actor.saveUserRotationRadarSettings(settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotationRadarSettings'] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!actor) {
        localStorage.removeItem('rotationRadarSettings');
        return;
      }
      await actor.resetUserRotationRadarSettings();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rotationRadarSettings'] });
    },
  });

  return {
    settings: query.data || DEFAULT_SETTINGS,
    isLoading: actorFetching || query.isLoading,
    updateSettings: updateMutation.mutate,
    resetSettings: resetMutation.mutate,
  };
}
