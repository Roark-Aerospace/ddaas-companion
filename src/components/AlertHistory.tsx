
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { History, Mail, Smartphone, Clock } from 'lucide-react';

interface AlertHistoryItem {
  id: string;
  device_id: string;
  alert_type: string;
  notification_method: string;
  sent_at: string;
  device_name?: string;
}

export const AlertHistory = () => {
  const { user } = useAuth();
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAlertHistory();
    }
  }, [user]);

  const loadAlertHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('device_alert_history')
        .select(`
          *,
          ddaas_devices!inner(device_name)
        `)
        .eq('user_id', user?.id)
        .order('sent_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading alert history:', error);
      } else {
        const formattedData = data?.map(item => ({
          ...item,
          device_name: (item as any).ddaas_devices?.device_name || 'Unknown Device'
        })) || [];
        setAlertHistory(formattedData);
      }
    } catch (error) {
      console.error('Error loading alert history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-6">
          <div className="animate-pulse text-white">Loading alert history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <History className="w-5 h-5 mr-2" />
          Recent Alerts
        </CardTitle>
        <CardDescription className="text-slate-300">
          History of device notifications sent to you
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alertHistory.length === 0 ? (
          <p className="text-slate-300 text-center py-8">
            No alerts have been sent yet. Alerts will appear here when your devices go offline or come back online.
          </p>
        ) : (
          <div className="space-y-3">
            {alertHistory.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-white font-medium">{alert.device_name}</span>
                    <Badge 
                      variant={alert.alert_type === 'offline' ? 'destructive' : 'default'}
                      className={alert.alert_type === 'offline' ? 'bg-red-600' : 'bg-green-600'}
                    >
                      {alert.alert_type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(alert.sent_at).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {alert.notification_method.includes('email') && (
                        <Mail className="w-3 h-3" />
                      )}
                      {alert.notification_method.includes('push') && (
                        <Smartphone className="w-3 h-3" />
                      )}
                      <span>{alert.notification_method}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
