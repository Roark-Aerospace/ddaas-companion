
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface DeviceMonitoringStatusProps {
  deviceId: string;
  deviceName: string;
  status: string | null;
  lastPingAt: string | null;
  responseTime: number | null;
}

export const DeviceMonitoringStatus = ({ 
  deviceId, 
  deviceName, 
  status, 
  lastPingAt, 
  responseTime 
}: DeviceMonitoringStatusProps) => {
  const [isManualPinging, setIsManualPinging] = useState(false);

  const handleManualPing = async () => {
    setIsManualPinging(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('monitor-devices', {
        body: { deviceId }
      });

      if (error) throw error;

      toast({
        title: "Manual Ping Complete",
        description: data.pingResult.success 
          ? `${deviceName} responded in ${data.pingResult.responseTime}ms`
          : `${deviceName} is unreachable: ${data.pingResult.error}`,
        variant: data.pingResult.success ? "default" : "destructive",
      });

    } catch (error) {
      console.error('Manual ping error:', error);
      toast({
        title: "Ping Failed",
        description: "Failed to ping device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsManualPinging(false);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon()}
            <span className="ml-2">Monitoring Status</span>
          </div>
          <Badge className={getStatusColor()}>
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
          </Badge>
        </CardTitle>
        <CardDescription className="text-slate-300">
          Device connectivity monitoring for {deviceName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lastPingAt && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-slate-300">
              <Clock className="w-4 h-4 mr-2" />
              <span>Last checked: {new Date(lastPingAt).toLocaleString()}</span>
            </div>
            {responseTime && (
              <Badge variant="outline" className="border-slate-500 text-slate-300">
                {responseTime}ms
              </Badge>
            )}
          </div>
        )}
        
        <Button
          onClick={handleManualPing}
          disabled={isManualPinging}
          variant="outline"
          className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
        >
          {isManualPinging ? (
            <>
              <Activity className="w-4 h-4 mr-2 animate-spin" />
              Pinging...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 mr-2" />
              Manual Ping
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
