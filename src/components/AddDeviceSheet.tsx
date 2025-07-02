
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { WiFiScanner, type WiFiDevice } from './WiFiScanner';
import { ManualIPInput } from './ManualIPInput';
import { LocationCapture, type LocationData } from './LocationCapture';
import { ManualLocationData } from './ManualLocationInput';
import { DeviceSave } from './DeviceSave';

export const AddDeviceSheet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [wifiDevices, setWifiDevices] = useState<WiFiDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<WiFiDevice | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [manualLocation, setManualLocation] = useState<ManualLocationData | null>(null);
  const [manualIp, setManualIp] = useState('');

  const handleDeviceSaved = () => {
    // Reset form
    setSelectedDevice(null);
    setLocation(null);
    setManualLocation(null);
    setManualIp('');
    setWifiDevices([]);
    setIsOpen(false);
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
        <SheetHeader className="flex-shrink-0 pb-4">
          <SheetTitle className="text-white">Add DDaaS Device</SheetTitle>
          <SheetDescription className="text-slate-300">
            Scan for WiFi devices, detect IP addresses, and capture location
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-6">
            <WiFiScanner
              onDevicesFound={setWifiDevices}
              onDeviceSelected={setSelectedDevice}
              selectedDevice={selectedDevice}
              wifiDevices={wifiDevices}
            />

            {selectedDevice && !selectedDevice.ip && (
              <ManualIPInput
                manualIp={manualIp}
                onIpChange={setManualIp}
              />
            )}

            <LocationCapture
              location={location}
              manualLocation={manualLocation}
              onLocationFound={setLocation}
              onManualLocationEntered={setManualLocation}
            />

            {selectedDevice && location && (selectedDevice.ip || manualIp) && (
              <DeviceSave
                selectedDevice={selectedDevice}
                location={location}
                manualLocation={manualLocation}
                manualIp={manualIp}
                onDeviceSaved={handleDeviceSaved}
              />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
