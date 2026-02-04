import { useEffect, useRef, useState } from 'react';
import {
  getAlertPreferences,
  shouldTriggerAlert,
  determineAlertType,
  showBrowserNotification,
  playAlertSound,
  addAlertToHistory,
  setCooldown,
  type AlertHistory,
} from '@/lib/alertSystem';
import type { EntryZoneSignal, ExitZoneSignal, ShortEntrySignal, CoverExitSignal } from '@/lib/tradeEntryZone';

export function useAlertSystem(
  entryZones: EntryZoneSignal[],
  exitZones: ExitZoneSignal[],
  shortEntryZones: ShortEntrySignal[] = [],
  coverExitZones: CoverExitSignal[] = []
) {
  const [activeToasts, setActiveToasts] = useState<AlertHistory[]>([]);
  const previousSignalsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const preferences = getAlertPreferences();
    if (!preferences.enabled) {
      return;
    }

    const currentSignals = new Set<string>();

    // Check LONG entry zones
    entryZones.forEach((zone) => {
      if (!zone.isActive) return;

      const alertType = determineAlertType(
        true,
        zone.tradeSuccessProbability,
        preferences.thresholds,
        false
      );

      if (!alertType) return;

      const signalKey = `${zone.symbol}-${alertType}`;
      currentSignals.add(signalKey);

      // Only trigger if this is a new signal
      if (!previousSignalsRef.current.has(signalKey)) {
        if (shouldTriggerAlert(zone.symbol, alertType, preferences)) {
          triggerAlert(
            zone.symbol,
            zone.name,
            alertType,
            zone.tradeSuccessProbability,
            zone.entryPriceRange.high,
            preferences
          );
        }
      }
    });

    // Check LONG exit zones
    exitZones.forEach((zone) => {
      if (!zone.isActive) return;

      const alertType = determineAlertType(
        false,
        zone.tradeSuccessProbability,
        preferences.thresholds,
        false
      );

      if (!alertType) return;

      const signalKey = `${zone.symbol}-${alertType}`;
      currentSignals.add(signalKey);

      // Only trigger if this is a new signal
      if (!previousSignalsRef.current.has(signalKey)) {
        if (shouldTriggerAlert(zone.symbol, alertType, preferences)) {
          triggerAlert(
            zone.symbol,
            zone.name,
            alertType,
            zone.tradeSuccessProbability,
            zone.exitPriceRange.high,
            preferences
          );
        }
      }
    });

    // Check SHORT entry zones
    shortEntryZones.forEach((zone) => {
      if (!zone.isActive) return;

      const alertType = determineAlertType(
        true,
        zone.tradeSuccessProbability,
        preferences.thresholds,
        true
      );

      if (!alertType) return;

      const signalKey = `${zone.symbol}-${alertType}`;
      currentSignals.add(signalKey);

      // Only trigger if this is a new signal
      if (!previousSignalsRef.current.has(signalKey)) {
        if (shouldTriggerAlert(zone.symbol, alertType, preferences)) {
          triggerAlert(
            zone.symbol,
            zone.name,
            alertType,
            zone.tradeSuccessProbability,
            zone.entryPriceRange.high,
            preferences
          );
        }
      }
    });

    // Check COVER exit zones
    coverExitZones.forEach((zone) => {
      if (!zone.isActive) return;

      const alertType = determineAlertType(
        false,
        zone.tradeSuccessProbability,
        preferences.thresholds,
        true
      );

      if (!alertType) return;

      const signalKey = `${zone.symbol}-${alertType}`;
      currentSignals.add(signalKey);

      // Only trigger if this is a new signal
      if (!previousSignalsRef.current.has(signalKey)) {
        if (shouldTriggerAlert(zone.symbol, alertType, preferences)) {
          triggerAlert(
            zone.symbol,
            zone.name,
            alertType,
            zone.tradeSuccessProbability,
            zone.exitPriceRange.high,
            preferences
          );
        }
      }
    });

    previousSignalsRef.current = currentSignals;
  }, [entryZones, exitZones, shortEntryZones, coverExitZones]);

  const triggerAlert = (
    symbol: string,
    name: string,
    type: 'entry' | 'exit' | 'strongBuy' | 'strongSell' | 'shortEntry' | 'coverExit',
    confidence: number,
    price: number,
    preferences: ReturnType<typeof getAlertPreferences>
  ) => {
    console.log('[Alert System] 🚨 Triggering alert:', { symbol, type, confidence });

    // Add to history
    const alert: Omit<AlertHistory, 'id' | 'dismissed'> = {
      symbol,
      name,
      type,
      confidence,
      timestamp: Date.now(),
      price,
    };
    addAlertToHistory(alert);

    // Set cooldown
    setCooldown(symbol, type);

    // Show browser notification
    if (preferences.browserNotifications) {
      showBrowserNotification(symbol, name, type, confidence);
    }

    // Show toast notification
    if (preferences.toastNotifications) {
      const toastAlert: AlertHistory = {
        ...alert,
        id: `${symbol}-${Date.now()}`,
        dismissed: false,
      };
      setActiveToasts((prev) => [...prev, toastAlert]);
    }

    // Play sound
    if (preferences.soundAlerts) {
      playAlertSound();
    }
  };

  const dismissToast = (id: string) => {
    setActiveToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return {
    activeToasts,
    dismissToast,
  };
}

