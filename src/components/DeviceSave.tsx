
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Zap } from 'lucide-react';
import { WiFiDevice } from './WiFiScanner';
import { LocationData } from './LocationCapture';
import { ManualLocationData } from './ManualLocationInput';

interface DeviceSaveProps {
  selectedDevice: WiFiDevice;
  location: LocationData;
  manualLocation: ManualLocationData | null;
  manualIp: string;
  onDeviceSaved: () => void;
}

export const DeviceSave = ({ selectedDevice, location, manualLocation, manualIp, onDeviceSaved }: DeviceSaveProps) => {
  const [deviceName, setDeviceName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const saveDevice = async () => {
    const deviceIp = selectedDevice.ip || manualIp;
    if (!deviceIp) {
      toast({
        title: "Missing IP Address",
        description: "Please provide an IP address for monitoring.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to save devices.",
          variant: "destructive",
        });
        return;
      }

      const deviceData = {
        user_id: user.id,
        mac_address: selectedDevice.bssid,
        device_name: deviceName || selectedDevice.ssid || 'Unknown Device',
        latitude: location.latitude,
        longitude: location.longitude,
        location_accuracy: location.accuracy,
        ip_address: deviceIp,
        status: 'unknown',
        // Add manual location data if provided
        manual_latitude: manualLocation?.latitude || null,
        manual_longitude: manualLocation?.longitude || null,
        manual_location_notes: manualLocation?.notes || null,
      };

      const { error } = await supabase
        .from('ddaas_devices')
        .insert(deviceData);

      if (error) throw error;

      const locationUsed = manualLocation ? 'manual' : 'GPS';
      const accuracyInfo = manualLocation 
        ? 'manually entered coordinates' 
        : `±${location.accuracy.toFixed(1)}m accuracy`;

      toast({
        title: "Device Added",
        description: `DDaaS device saved with ${locationUsed} location (${accuracyInfo})!`,
      });

      onDeviceSaved();
    } catch (error) {
      console.error('Save device error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save device. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Step 3: Save Device
        </CardTitle>
        <CardDescription className="text-slate-300">
          Give your device a name and save it for monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deviceName" className="text-white">Device Name (Optional)</Label>
          <Input
            id="deviceName"
            placeholder={selectedDevice.ssid || 'Enter device name'}
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
          />
        </div>

        <div className="bg-white/10 p-3 rounded-lg">
          <div className="text-sm text-white space-y-1">
            <div><strong>MAC:</strong> {selectedDevice.bssid}</div>
            <div><strong>IP:</strong> {selectedDevice.ip || manualIp}</div>
            <div><strong>Network:</strong> {selectedDevice.ssid}</div>
            
            <div className="pt-2 border-t border-white/20">
              <div><strong>GPS Location:</strong></div>
              <div className="text-xs ml-2">
                Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                <span className="text-slate-300"> (±{location.accuracy.toFixed(1)}m)</span>
              </div>
            </div>
            
            {manualLocation && (
              <div className="pt-2 border-t border-white/20">
                <div><strong>Manual Location:</strong></div>
                <div className="text-xs ml-2">
                  Lat: {manualLocation.latitude.toFixed(6)}, Lng: {manualLocation.longitude.toFixed(6)}
                  {manualLocation.notes && (
                    <div className="text-slate-300">Notes: {manualLocation.notes}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <Button 
          onClick={saveDevice}
          disabled={isSaving}
          className="w-full bg-green-600/80 hover:bg-green-600 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving Device...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Save DDaaS Device
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
