import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, Chrome, Globe, AlertCircle } from 'lucide-react';
import { requestNotificationPermission, saveAlertPreferences, getAlertPreferences } from '@/lib/alertSystem';

const ONBOARDING_STORAGE_KEY = 'alert_onboarding_completed';

export function AlertOnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    // Check if onboarding has been completed
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    const notificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
    
    // Show onboarding if not completed and permission not granted
    if (!completed && notificationPermission !== 'granted') {
      console.log('[Alert Onboarding] 🎓 Starting first-use configuration guide');
      setOpen(true);
    }
  }, []);

  const handleRequestPermission = async () => {
    console.log('[Alert Onboarding] 🔔 Requesting browser notification permission');
    const granted = await requestNotificationPermission();
    
    if (granted) {
      console.log('[Alert Onboarding] ✅ Permission granted');
      setPermissionGranted(true);
      setPermissionDenied(false);
      
      // Enable browser notifications in preferences
      const preferences = getAlertPreferences();
      saveAlertPreferences({
        ...preferences,
        browserNotifications: true,
        enabled: true,
      });
      
      // Move to next step after a brief delay
      setTimeout(() => setStep(3), 1000);
    } else {
      console.log('[Alert Onboarding] ❌ Permission denied');
      setPermissionDenied(true);
      setPermissionGranted(false);
    }
  };

  const handleComplete = () => {
    console.log('[Alert Onboarding] ✅ Onboarding completed');
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setOpen(false);
  };

  const handleSkip = () => {
    console.log('[Alert Onboarding] ⏭️ Onboarding skipped');
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setOpen(false);
  };

  const getBrowserIcon = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return <Chrome className="w-6 h-6" />;
    // Use Globe icon for Firefox, Safari, and other browsers
    return <Globe className="w-6 h-6" />;
  };

  const getBrowserName = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari')) return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    return 'your browser';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Bell className="w-6 h-6 text-white" />
            </div>
            Welcome to Smart Alerts
          </DialogTitle>
          <DialogDescription>
            Get notified when high-confidence trade signals are detected
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Introduction */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  What are Smart Alerts?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Our AI-powered alert system monitors the Top 100 cryptocurrencies in real-time and notifies you when:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• <strong>Entry signals</strong> reach 70%+ confidence (optimal buy opportunities)</li>
                  <li>• <strong>Exit signals</strong> reach 70%+ confidence (optimal sell opportunities)</li>
                  <li>• <strong>Strong Buy</strong> signals reach 85%+ confidence (exceptional opportunities)</li>
                  <li>• <strong>Strong Sell</strong> signals reach 85%+ confidence (urgent exit recommendations)</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Bell className="w-5 h-5" />
                  Alert Types Available
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Browser Notifications</Badge>
                    <span className="text-muted-foreground">Native push notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Toast Pop-ups</Badge>
                    <span className="text-muted-foreground">On-screen corner notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Sound Alerts</Badge>
                    <span className="text-muted-foreground">Audio notification beep</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} className="flex-1">
                  Continue Setup
                </Button>
                <Button variant="outline" onClick={handleSkip}>
                  Skip for Now
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Browser Permission */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getBrowserIcon()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">
                      Enable Browser Notifications
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      To receive real-time alerts, we need your permission to show browser notifications. 
                      Click the button below and select "Allow" when {getBrowserName()} prompts you.
                    </p>
                    
                    {!permissionGranted && !permissionDenied && (
                      <Alert className="mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>Important:</strong> Look for the permission prompt at the top of your browser window. 
                          If you don't see it, check your browser's address bar for a notification icon.
                        </AlertDescription>
                      </Alert>
                    )}

                    {permissionGranted && (
                      <Alert className="mb-3 border-green-500/50 bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-sm text-green-600 dark:text-green-400">
                          <strong>Success!</strong> Browser notifications are now enabled. You'll receive alerts for high-confidence trade signals.
                        </AlertDescription>
                      </Alert>
                    )}

                    {permissionDenied && (
                      <Alert variant="destructive" className="mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          <strong>Permission Denied.</strong> You can still use toast pop-ups and sound alerts. 
                          To enable browser notifications later, go to Alert Settings or your browser's site settings.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <h3 className="font-semibold mb-2 text-sm text-yellow-600 dark:text-yellow-400">
                  Browser-Specific Instructions
                </h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Chrome/Edge:</strong> Click "Allow" in the popup at the top of the page</p>
                  <p><strong>Firefox:</strong> Click "Allow" in the notification bar</p>
                  <p><strong>Safari:</strong> Click "Allow" when prompted (macOS only)</p>
                </div>
              </div>

              <div className="flex gap-3">
                {!permissionGranted && (
                  <Button onClick={handleRequestPermission} className="flex-1">
                    <Bell className="w-4 h-4 mr-2" />
                    Grant Permission
                  </Button>
                )}
                {permissionGranted && (
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Continue
                  </Button>
                )}
                <Button variant="outline" onClick={permissionDenied ? () => setStep(3) : handleSkip}>
                  {permissionDenied ? 'Continue Anyway' : 'Skip'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Configuration Summary */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
                      You're All Set!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Smart Alerts are now configured with the following default settings:
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alert Types</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">Browser</Badge>
                      <Badge variant="outline">Toast</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Confidence Threshold</span>
                    <Badge variant="outline">70%</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Alerts trigger when signals reach 70%+ confidence
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cooldown Period</span>
                    <Badge variant="outline">5 minutes</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Prevents notification spam for the same cryptocurrency
                  </p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Alert Categories</span>
                    <div className="flex gap-1">
                      <Badge className="bg-green-600 text-white text-xs">Entry</Badge>
                      <Badge className="bg-red-600 text-white text-xs">Exit</Badge>
                      <Badge className="bg-green-700 text-white text-xs">Strong Buy</Badge>
                      <Badge className="bg-red-700 text-white text-xs">Strong Sell</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  You can customize these settings anytime by clicking the <strong>"Alerts"</strong> button in the dashboard header.
                </AlertDescription>
              </Alert>

              <Button onClick={handleComplete} className="w-full">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Start Receiving Alerts
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
