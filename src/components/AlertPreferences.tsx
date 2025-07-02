
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Mail, Smartphone, Settings } from 'lucide-react';

interface AlertPreferences {
  id?: string;
  email_alerts_enabled: boolean;
  push_notifications_enabled: boolean;
  alert_frequency: string;
}

export const AlertPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<AlertPreferences>({
    email_alerts_enabled: true,
    push_notifications_enabled: true,
    alert_frequency: 'immediate'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_alert_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading preferences:', error);
        toast({
          title: "Error",
          description: "Failed to load alert preferences",
          variant: "destructive",
        });
      } else if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_alert_preferences')
        .upsert({
          ...preferences,
          user_id: user.id,
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Your alert preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save alert preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Alert Preferences
        </CardTitle>
        <CardDescription className="text-slate-300">
          Configure how you want to be notified when your devices go offline or come back online.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email-alerts"
              checked={preferences.email_alerts_enabled}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, email_alerts_enabled: checked as boolean })
              }
            />
            <div className="flex items-center text-white">
              <Mail className="w-4 h-4 mr-2" />
              <label htmlFor="email-alerts" className="text-sm font-medium">
                Email Notifications
              </label>
            </div>
          </div>
          <p className="text-xs text-slate-400 ml-6">
            Receive email alerts when devices go offline or come back online
          </p>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="push-alerts"
              checked={preferences.push_notifications_enabled}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, push_notifications_enabled: checked as boolean })
              }
            />
            <div className="flex items-center text-white">
              <Smartphone className="w-4 h-4 mr-2" />
              <label htmlFor="push-alerts" className="text-sm font-medium">
                Push Notifications (Mobile)
              </label>
            </div>
          </div>
          <p className="text-xs text-slate-400 ml-6">
            Receive push notifications when using the mobile app
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Alert Frequency
          </label>
          <Select 
            value={preferences.alert_frequency} 
            onValueChange={(value) => setPreferences({ ...preferences, alert_frequency: value })}
          >
            <SelectTrigger className="bg-white/20 border-white/30 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="hourly">Maximum once per hour</SelectItem>
              <SelectItem value="daily">Maximum once per day</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-400">
            Control how often you receive alerts for the same device
          </p>
        </div>

        <Button
          onClick={savePreferences}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
};
