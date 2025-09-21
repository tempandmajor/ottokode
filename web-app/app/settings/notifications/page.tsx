"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, Smartphone, Volume2, AlertCircle } from 'lucide-react';

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  desktop_notifications: boolean;
  sound_enabled: boolean;
  notification_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  project_updates: boolean;
  security_alerts: boolean;
  billing_notifications: boolean;
  marketing_emails: boolean;
}

export default function NotificationsSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    desktop_notifications: true,
    sound_enabled: true,
    notification_frequency: 'immediate',
    project_updates: true,
    security_alerts: true,
    billing_notifications: true,
    marketing_emails: false
  });
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    loadNotificationSettings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('settings')
        .eq('id', session.user.id)
        .single();

      if (profile?.settings?.notifications) {
        setSettings(prev => ({
          ...prev,
          ...profile.settings.notifications
        }));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const updateSettings = async (key: keyof NotificationSettings, value: any) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      const { error } = await supabase
        .from('users')
        .update({
          settings: {
            notifications: newSettings
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Your notification preferences have been updated."
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Update failed",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'This is a test notification from Ottokode.',
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Test Notification', {
              body: 'This is a test notification from Ottokode.',
              icon: '/favicon.ico'
            });
          }
        });
      }
    }

    toast({
      title: "Test notification sent",
      description: "Check your browser or system notifications."
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground">Configure your notification preferences and delivery methods.</p>
      </div>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications from Ottokode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <p className="font-medium">Email Notifications</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSettings('email_notifications', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                <p className="font-medium">Push Notifications</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive push notifications on your devices
              </p>
            </div>
            <Switch
              checked={settings.push_notifications}
              onCheckedChange={(checked) => updateSettings('push_notifications', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4" />
                <p className="font-medium">Desktop Notifications</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Show notifications in your browser or desktop app
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.desktop_notifications}
                onCheckedChange={(checked) => updateSettings('desktop_notifications', checked)}
                disabled={loading}
              />
              <Button variant="outline" size="sm" onClick={testNotification}>
                Test
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Sound Notifications</p>
              <p className="text-sm text-muted-foreground">
                Play sound with notifications
              </p>
            </div>
            <Switch
              checked={settings.sound_enabled}
              onCheckedChange={(checked) => updateSettings('sound_enabled', checked)}
              disabled={loading}
            />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">Notification Frequency</p>
                <p className="text-sm text-muted-foreground">
                  How often to group and send notifications
                </p>
              </div>
              <Select
                value={settings.notification_frequency}
                onValueChange={(value: any) => updateSettings('notification_frequency', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">Project Updates</p>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Updates about your projects, builds, and deployments
              </p>
            </div>
            <Switch
              checked={settings.project_updates}
              onCheckedChange={(checked) => updateSettings('project_updates', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">Security Alerts</p>
                <Badge variant="destructive" className="text-xs">Important</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Critical security notifications and account alerts
              </p>
            </div>
            <Switch
              checked={settings.security_alerts}
              onCheckedChange={(checked) => updateSettings('security_alerts', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Billing Notifications</p>
              <p className="text-sm text-muted-foreground">
                Payment receipts, billing reminders, and subscription updates
              </p>
            </div>
            <Switch
              checked={settings.billing_notifications}
              onCheckedChange={(checked) => updateSettings('billing_notifications', checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Marketing Emails</p>
              <p className="text-sm text-muted-foreground">
                Product updates, tips, and promotional content
              </p>
            </div>
            <Switch
              checked={settings.marketing_emails}
              onCheckedChange={(checked) => updateSettings('marketing_emails', checked)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage all your notification preferences at once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const allOn = {
                  email_notifications: true,
                  push_notifications: true,
                  desktop_notifications: true,
                  sound_enabled: true,
                  notification_frequency: 'immediate' as const,
                  project_updates: true,
                  security_alerts: true,
                  billing_notifications: true,
                  marketing_emails: true
                };
                setSettings(allOn);
                updateSettings('email_notifications', true);
              }}
            >
              Enable All
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const essentialOnly = {
                  email_notifications: true,
                  push_notifications: false,
                  desktop_notifications: false,
                  sound_enabled: false,
                  notification_frequency: 'daily' as const,
                  project_updates: false,
                  security_alerts: true,
                  billing_notifications: true,
                  marketing_emails: false
                };
                setSettings(essentialOnly);
                updateSettings('email_notifications', true);
              }}
            >
              Essential Only
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Security alerts and billing notifications are highly recommended to keep your account secure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}