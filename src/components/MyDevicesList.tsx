
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, MapPin, Clock, Trash2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface DDaaSDevice {
  id: string;
  mac_address: string;
  device_name: string | null;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  added_at: string;
  last_seen: string | null;
}

export const MyDevicesList = () => {
  const [isOpen, setIsOpen] = useState(false);
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

      // Refresh the devices list
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

  return (
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
      <SheetContent className="bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 text-white border-white/20">
        <SheetHeader>
          <SheetTitle className="text-white">My DDaaS Devices</SheetTitle>
          <SheetDescription className="text-slate-300">
            Manage your registered DDaaS devices
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
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
            <div className="space-y-4">
              {devices.map((device) => (
                <Card key={device.id} className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center">
                          <Smartphone className="w-5 h-5 mr-2" />
                          {device.device_name || 'Unknown Device'}
                        </CardTitle>
                        <CardDescription className="text-slate-300">
                          MAC: {device.mac_address}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteDevice(device.id)}
                        className="text-red-300 hover:text-red-200 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-slate-300">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{formatCoordinates(device.latitude, device.longitude)}</span>
                      {device.location_accuracy && (
                        <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
                          ±{device.location_accuracy.toFixed(1)}m
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center text-sm text-slate-400">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Added: {formatDate(device.added_at)}</span>
                    </div>
                    
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
        </div>
      </SheetContent>
    </Sheet>
  );
};
