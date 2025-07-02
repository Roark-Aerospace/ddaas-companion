
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Wifi as WifiIcon, MapPin, Plus, Network, Zap } from 'lucide-react';
import { NetworkScanner, type NetworkDevice } from '@/utils/networkScanner';

interface WiFiDevice {
  bssid: string;
  ssid: string;
  level: number;
  ip?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export const AddDeviceSheet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isNetworkScanning, setIsNetworkScanning] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [wifiDevices, setWifiDevices] = useState<WiFiDevice[]>([]);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<WiFiDevice | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [manualIp, setManualIp] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const scanWifiDevices = async () => {
    setIsScanning(true);
    try {
      console.log('WiFi scanning started...');
      
      // Mock WiFi devices for demo - in real app this would use native WiFi scanning
      const mockDevices: WiFiDevice[] = [
        { bssid: "00:11:22:33:44:55", ssid: "Home_Router", level: -45 },
        { bssid: "AA:BB:CC:DD:EE:FF", ssid: "Office_WiFi", level: -60 },
        { bssid: "12:34:56:78:90:AB", ssid: "Neighbor_WiFi", level: -75 },
        { bssid: "FF:EE:DD:CC:BB:AA", ssid: "Smart_TV", level: -50 },
        { bssid: "11:22:33:44:55:66", ssid: "IoT_Device", level: -65 },
        { bssid: "22:33:44:55:66:77", ssid: "Mobile_Hotspot", level: -55 },
      ];
      
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      setWifiDevices(mockDevices);
      
      toast({
        title: "WiFi Scan Complete",
        description: `Found ${mockDevices.length} WiFi networks`,
      });
      
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

  const scanNetworkDevices = async () => {
    setIsNetworkScanning(true);
    try {
      console.log('Network scanning started...');
      
      const devices = await NetworkScanner.scanLocalNetwork();
      setNetworkDevices(devices);
      
      // Try to match WiFi devices with network devices based on MAC address
      const updatedWifiDevices = wifiDevices.map(wifiDevice => {
        const networkDevice = devices.find(netDevice => 
          netDevice.mac.toLowerCase() === wifiDevice.bssid.toLowerCase()
        );
        return {
          ...wifiDevice,
          ip: networkDevice?.ip
        };
      });
      
      setWifiDevices(updatedWifiDevices);
      
      toast({
        title: "Network Scan Complete",
        description: `Found ${devices.length} network devices with IP addresses`,
      });
      
    } catch (error) {
      console.error('Network scanning error:', error);
      toast({
        title: "Network Scan Failed",
        description: "Unable to scan network for IP addresses.",
        variant: "destructive",
      });
    } finally {
      setIsNetworkScanning(false);
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
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
      } else {
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

      const { error } = await supabase
        .from('ddaas_devices')
        .insert({
          user_id: user.id,
          mac_address: selectedDevice.bssid,
          device_name: deviceName || selectedDevice.ssid || 'Unknown Device',
          latitude: location.latitude,
          longitude: location.longitude,
          location_accuracy: location.accuracy,
          ip_address: deviceIp,
          status: 'unknown',
        });

      if (error) throw error;

      toast({
        title: "Device Added",
        description: "DDaaS device has been successfully added with IP address for monitoring!",
      });

      // Reset form
      setSelectedDevice(null);
      setLocation(null);
      setDeviceName('');
      setManualIp('');
      setWifiDevices([]);
      setNetworkDevices([]);
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
      <SheetContent className="bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 text-white border-white/20 w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="text-white">Add DDaaS Device</SheetTitle>
          <SheetDescription className="text-slate-300">
            Scan for WiFi devices, detect IP addresses, and capture location
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden mt-6">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6 pb-6">
              {/* Step 1: WiFi Scanning */}
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <WifiIcon className="w-5 h-5 mr-2" />
                    Step 1: Scan WiFi Networks
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
                        Scanning WiFi...
                      </>
                    ) : (
                      <>
                        <WifiIcon className="w-4 h-4 mr-2" />
                        Scan WiFi Networks
                      </>
                    )}
                  </Button>

                  {wifiDevices.length > 0 && (
                    <>
                      <Button 
                        onClick={scanNetworkDevices}
                        disabled={isNetworkScanning}
                        className="w-full bg-blue-600/80 hover:bg-blue-600 text-white"
                      >
                        {isNetworkScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Scanning Network...
                          </>
                        ) : (
                          <>
                            <Network className="w-4 h-4 mr-2" />
                            Scan for IP Addresses
                          </>
                        )}
                      </Button>

                      <div className="space-y-2">
                        <Label className="text-white">Select a Device:</Label>
                        <div className="max-h-40 overflow-y-auto space-y-2">
                          {wifiDevices.map((device, index) => (
                            <Card 
                              key={index}
                              className={`cursor-pointer transition-colors ${
                                selectedDevice?.bssid === device.bssid 
                                  ? 'bg-white/30 border-white/50' 
                                  : 'bg-white/10 border-white/20 hover:bg-white/20'
                              }`}
                              onClick={() => setSelectedDevice(device)}
                            >
                              <CardContent className="p-3">
                                <div className="text-sm">
                                  <div className="font-medium text-white flex items-center justify-between">
                                    <span>{device.ssid || 'Hidden Network'}</span>
                                    {device.ip && (
                                      <Badge variant="secondary" className="bg-green-600/80 text-white">
                                        <Network className="w-3 h-3 mr-1" />
                                        {device.ip}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-slate-300">MAC: {device.bssid}</div>
                                  <div className="text-slate-400">Signal: {device.level} dBm</div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* IP Address Input */}
              {selectedDevice && !selectedDevice.ip && (
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Network className="w-5 h-5 mr-2" />
                      Manual IP Address
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Enter the IP address for monitoring this device
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="manualIp" className="text-white">IP Address</Label>
                      <Input
                        id="manualIp"
                        placeholder="192.168.1.100"
                        value={manualIp}
                        onChange={(e) => setManualIp(e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

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
              {selectedDevice && location && (selectedDevice.ip || manualIp) && (
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
                      <div className="text-sm text-white">
                        <div><strong>MAC:</strong> {selectedDevice.bssid}</div>
                        <div><strong>IP:</strong> {selectedDevice.ip || manualIp}</div>
                        <div><strong>Network:</strong> {selectedDevice.ssid}</div>
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
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
};
