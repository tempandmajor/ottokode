"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Shield, Key, Eye, Clock, AlertTriangle } from 'lucide-react';

export default function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  const loadSecuritySettings = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Get user settings
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile?.settings) {
        setMfaEnabled(profile.settings.mfa_enabled || false);
        setDataSharing(profile.settings.data_sharing !== false);
      }

      // Mock session data (in real app, you'd get this from auth provider)
      setSessions([
        {
          id: '1',
          device: 'MacBook Pro',
          location: 'San Francisco, CA',
          lastActive: new Date(),
          current: true
        },
        {
          id: '2',
          device: 'iPhone 15',
          location: 'San Francisco, CA',
          lastActive: new Date(Date.now() - 3600000),
          current: false
        }
      ]);
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  }, [supabase]);

  useEffect(() => {
    loadSecuritySettings();
  }, [loadSecuritySettings]);

  const updateSettings = async (key: string, value: any) => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('users')
        .update({
          settings: {
            [key]: value
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      toast({
        title: "Settings updated",
        description: "Your security settings have been updated."
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Update failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    toast({
      title: "Session revoked",
      description: "The session has been revoked successfully."
    });
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <p className="text-muted-foreground">Manage your account security and privacy settings.</p>
      </div>

      {/* Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication
          </CardTitle>
          <CardDescription>
            Manage your authentication methods and security preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={mfaEnabled}
                onCheckedChange={(checked) => {
                  setMfaEnabled(checked);
                  updateSettings('mfa_enabled', checked);
                }}
                disabled={loading}
              />
              <Badge variant={mfaEnabled ? 'default' : 'secondary'}>
                {mfaEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>

          <div className="border-t pt-4">
            <Button variant="outline" disabled>
              <Key className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Password changes are handled through your authentication provider.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Monitor and manage your active sessions across devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{session.device}</p>
                  {session.current && (
                    <Badge variant="default" className="text-xs">Current</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{session.location}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Last active: {session.lastActive.toLocaleDateString()}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeSession(session.id)}
                >
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>
            Control how your data is used and shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Usage Analytics</p>
              <p className="text-sm text-muted-foreground">
                Help improve Ottokode by sharing anonymous usage data
              </p>
            </div>
            <Switch
              checked={dataSharing}
              onCheckedChange={(checked) => {
                setDataSharing(checked);
                updateSettings('data_sharing', checked);
              }}
              disabled={loading}
            />
          </div>

          <div className="border-t pt-4">
            <Button variant="outline" disabled>
              Export Data
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Download a copy of all your data (coming soon).
            </p>
          </div>

          <div className="border-t pt-4">
            <Button variant="destructive" disabled>
              Delete Account
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Permanently delete your account and all associated data.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}