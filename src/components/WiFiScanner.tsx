
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Wifi as WifiIcon, Network } from 'lucide-react';
import { NetworkScanner, type NetworkDevice } from '@/utils/networkScanner';

export interface WiFiDevice {
  bssid: string;
  ssid: string;
  level: number;
  ip?: string;
}

interface WiFiScannerProps {
  onDevicesFound: (devices: WiFiDevice[]) => void;
  onDeviceSelected: (device: WiFiDevice | null) => void;
  selectedDevice: WiFiDevice | null;
  wifiDevices: WiFiDevice[];
}

export const WiFiScanner = ({ onDevicesFound, onDeviceSelected, selectedDevice, wifiDevices }: WiFiScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isNetworkScanning, setIsNetworkScanning] = useState(false);

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
      onDevicesFound(mockDevices);
      
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
      
      onDevicesFound(updatedWifiDevices);
      
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

  return (
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
                    onClick={() => onDeviceSelected(device)}
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
  );
};
