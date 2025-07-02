import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, MapPin, Clock, Trash2, Wifi, Activity, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface DDaaSDevice {
  id: string;
  mac_address: string;
  device_name: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  ip_address: string | null;
  status: string | null;
  last_ping_at: string | null;
  ping_response_time: number | null;
  added_at: string;
  last_seen: string | null;
}

export const MyDevicesList = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pingingDevices, setPingingDevices] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['ddaas-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ddaas_devices')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as DDaaSDevice[];
    },
    enabled: isOpen,
  });

  // Set up real-time subscription for device status updates
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('device-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'ddaas_devices'
        },
        (payload) => {
          console.log('Device status updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['ddaas-devices'] });
          
          // Show toast for status changes
          const newStatus = payload.new.status;
          const deviceName = payload.new.device_name || 'Device';
          
          if (newStatus === 'offline') {
            toast({
              title: "Device Offline",
              description: `${deviceName} is not responding to ping`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, queryClient]);

  const deleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('ddaas_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      toast({
        title: "Device Removed",
        description: "DDaaS device has been successfully removed.",
      });

      queryClient.invalidateQueries({ queryKey: ['ddaas-devices'] });
    } catch (error) {
      console.error('Delete device error:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to remove device. Please try again.",
        variant: "destructive",
      });
    }
  };

  const pingDevice = async (deviceId: string) => {
    setPingingDevices(prev => new Set([...prev, deviceId]));
    
    try {
      const { data, error } = await supabase.functions.invoke('monitor-devices', {
        body: { deviceId }
      });

      if (error) throw error;

      toast({
        title: "Ping Complete",
        description: data.pingResult.success 
          ? `Device responded in ${data.pingResult.responseTime}ms`
          : `Device unreachable: ${data.pingResult.error}`,
        variant: data.pingResult.success ? "default" : "destructive",
      });

      queryClient.invalidateQueries({ queryKey: ['ddaas-devices'] });
    } catch (error) {
      console.error('Ping device error:', error);
      toast({
        title: "Ping Failed",
        description: "Failed to ping device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPingingDevices(prev => {
        const newSet = new Set(prev);
        newSet.delete(deviceId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCoordinates = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return 'No location data';
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'offline':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'online':
        return 'bg-green-600/80 text-white';
      case 'offline':
        return 'bg-red-600/80 text-white';
      default:
        return 'bg-yellow-600/80 text-white';
    }
  };

  return (
    <TooltipProvider>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline"
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 justify-start"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            My DDaaS Devices
          </Button>
        </SheetTrigger>
        <SheetContent className="bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 text-white border-white/20 flex flex-col">
          <SheetHeader className="flex-shrink-0 pb-4">
            <SheetTitle className="text-white">My DDaaS Devices</SheetTitle>
            <SheetDescription className="text-slate-300">
              Monitor and manage your registered DDaaS devices
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-slate-300">Loading devices...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-300">Failed to load devices</div>
              </div>
            ) : !devices || devices.length === 0 ? (
              <div className="text-center py-8">
                <Smartphone className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <div className="text-slate-300 mb-2">No devices added yet</div>
                <div className="text-slate-400 text-sm">
                  Use "Add a DDaaS Device" to scan and register your first device
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-6">
                {devices.map((device) => (
                  <Card key={device.id} className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-white flex items-center">
                            <Smartphone className="w-5 h-5 mr-2" />
                            {device.device_name || 'Unknown Device'}
                            <div className="ml-2 flex items-center">
                              {getStatusIcon(device.status)}
                            </div>
                          </CardTitle>
                          <CardDescription className="text-slate-300">
                            MAC: {device.mac_address}
                          </CardDescription>
                          {device.ip_address && (
                            <div className="flex items-center mt-1">
                              <Wifi className="w-4 h-4 mr-1 text-blue-400" />
                              <span className="text-sm text-blue-300">{device.ip_address}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {device.ip_address && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => pingDevice(device.id)}
                                  disabled={pingingDevices.has(device.id)}
                                  className="text-blue-300 hover:text-blue-200 hover:bg-blue-900/20"
                                >
                                  {pingingDevices.has(device.id) ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Activity className="w-4 h-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Manual ping device</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDevice(device.id)}
                            className="text-red-300 hover:text-red-200 hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-slate-300">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{formatCoordinates(device.latitude, device.longitude)}</span>
                        </div>
                        {device.location_accuracy && (
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            ±{device.location_accuracy.toFixed(1)}m
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-slate-400">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Added: {formatDate(device.added_at)}</span>
                        </div>
                        {device.status && (
                          <Badge className={getStatusColor(device.status)}>
                            {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                          </Badge>
                        )}
                      </div>
                      
                      {device.last_ping_at && (
                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <div className="flex items-center">
                            <Activity className="w-4 h-4 mr-2" />
                            <span>Last ping: {formatDate(device.last_ping_at)}</span>
                          </div>
                          {device.ping_response_time && (
                            <Badge variant="outline" className="border-slate-500 text-slate-300">
                              {device.ping_response_time}ms
                            </Badge>
                          )}
                        </div>
                      )}

                      {device.last_seen && (
                        <div className="flex items-center text-sm text-slate-400">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Last seen: {formatDate(device.last_seen)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
};
