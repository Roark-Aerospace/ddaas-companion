
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Wifi, MapPin, Plus } from 'lucide-react';

interface WiFiDevice {
  BSSID: string;
  SSID: string;
  level: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

declare global {
  interface Window {
    Capacitor?: any;
  }
}

export const AddDeviceSheet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [wifiDevices, setWifiDevices] = useState<WiFiDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<WiFiDevice | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const scanWifiDevices = async () => {
    setIsScanning(true);
    try {
      // For web/development, we'll simulate WiFi scanning
      if (typeof navigator !== 'undefined' && !window.Capacitor) {
        // Simulate WiFi devices for web testing
        const mockDevices: WiFiDevice[] = [
          { BSSID: "00:11:22:33:44:55", SSID: "Home_Router", level: -45 },
          { BSSID: "AA:BB:CC:DD:EE:FF", SSID: "Office_WiFi", level: -60 },
          { BSSID: "12:34:56:78:90:AB", SSID: "Neighbor_WiFi", level: -75 },
          { BSSID: "FF:EE:DD:CC:BB:AA", SSID: "Smart_TV", level: -50 },
          { BSSID: "11:22:33:44:55:66", SSID: "IoT_Device", level: -65 },
        ];
        
        // Simulate scanning delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        setWifiDevices(mockDevices);
        
        toast({
          title: "WiFi Scan Complete",
          description: `Found ${mockDevices.length} devices`,
        });
      } else {
        // For mobile devices with Capacitor, we'll use a placeholder approach
        // In a real implementation, you would use a proper WiFi scanning plugin
        const mockDevices: WiFiDevice[] = [
          { BSSID: "00:11:22:33:44:55", SSID: "Mobile_Router", level: -45 },
          { BSSID: "AA:BB:CC:DD:EE:FF", SSID: "Mobile_WiFi", level: -60 },
        ];
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        setWifiDevices(mockDevices);
        
        toast({
          title: "WiFi Scan Complete",
          description: `Found ${mockDevices.length} devices`,
        });
      }
    } catch (error) {
      console.error('WiFi scanning error:', error);
      toast({
        title: "WiFi Scan Failed",
        description: "Unable to scan for WiFi devices. Make sure WiFi is enabled.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (typeof navigator !== 'undefined' && !window.Capacitor) {
        // For web/development, use browser geolocation
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          });
        });
        
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        setLocation(locationData);
        
        toast({
          title: "Location Found",
          description: `Coordinates: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
        });
      } else {
        // For mobile devices with Capacitor
        const coordinates = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        
        const locationData: LocationData = {
          latitude: coordinates.coords.latitude,
          longitude: coordinates.coords.longitude,
          accuracy: coordinates.coords.accuracy
        };
        
        setLocation(locationData);
        
        toast({
          title: "Location Found",
          description: `Coordinates: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
        });
      }
    } catch (error) {
      console.error('Location error:', error);
      toast({
        title: "Location Failed",
        description: "Unable to get current location. Please enable location services.",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  const saveDevice = async () => {
    if (!selectedDevice || !location) {
      toast({
        title: "Missing Information",
        description: "Please select a device and get location first.",
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

      const { error } = await supabase
        .from('ddaas_devices')
        .insert({
          user_id: user.id,
          mac_address: selectedDevice.BSSID,
          device_name: deviceName || selectedDevice.SSID || 'Unknown Device',
          latitude: location.latitude,
          longitude: location.longitude,
          location_accuracy: location.accuracy,
        });

      if (error) throw error;

      toast({
        title: "Device Added",
        description: "DDaaS device has been successfully added!",
      });

      // Reset form
      setSelectedDevice(null);
      setLocation(null);
      setDeviceName('');
      setWifiDevices([]);
      setIsOpen(false);
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline"
          className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 justify-start"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add a DDaaS Device
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 text-white border-white/20">
        <SheetHeader>
          <SheetTitle className="text-white">Add DDaaS Device</SheetTitle>
          <SheetDescription className="text-slate-300">
            Scan for WiFi devices and capture their location
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Step 1: WiFi Scanning */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Wifi className="w-5 h-5 mr-2" />
                Step 1: Scan WiFi Network
              </CardTitle>
              <CardDescription className="text-slate-300">
                Scan for available WiFi devices and their MAC addresses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={scanWifiDevices}
                disabled={isScanning}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4 mr-2" />
                    Scan WiFi Devices
                  </>
                )}
              </Button>

              {wifiDevices.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white">Select a Device:</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {wifiDevices.map((device, index) => (
                      <Card 
                        key={index}
                        className={`cursor-pointer transition-colors ${
                          selectedDevice?.BSSID === device.BSSID 
                            ? 'bg-white/30 border-white/50' 
                            : 'bg-white/10 border-white/20 hover:bg-white/20'
                        }`}
                        onClick={() => setSelectedDevice(device)}
                      >
                        <CardContent className="p-3">
                          <div className="text-sm">
                            <div className="font-medium text-white">{device.SSID || 'Hidden Network'}</div>
                            <div className="text-slate-300">MAC: {device.BSSID}</div>
                            <div className="text-slate-400">Signal: {device.level} dBm</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Location */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Step 2: Get Location
              </CardTitle>
              <CardDescription className="text-slate-300">
                Capture GPS coordinates for the device location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {isGettingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Getting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Get Current Location
                  </>
                )}
              </Button>

              {location && (
                <div className="bg-white/10 p-3 rounded-lg">
                  <div className="text-sm text-white">
                    <div>Latitude: {location.latitude.toFixed(6)}</div>
                    <div>Longitude: {location.longitude.toFixed(6)}</div>
                    <div>Accuracy: {location.accuracy.toFixed(1)}m</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Device Name and Save */}
          {selectedDevice && location && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Step 3: Save Device</CardTitle>
                <CardDescription className="text-slate-300">
                  Give your device a name and save it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName" className="text-white">Device Name (Optional)</Label>
                  <Input
                    id="deviceName"
                    placeholder={selectedDevice.SSID || 'Enter device name'}
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
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
                    'Save DDaaS Device'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
