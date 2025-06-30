
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wifi, Clock, Smartphone } from 'lucide-react';
import { DeviceMonitoringStatus } from './DeviceMonitoringStatus';

interface DeviceDetailsProps {
  device: {
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
  };
}

export const DeviceDetails = ({ device }: DeviceDetailsProps) => {
  const formatCoordinates = (lat: number | null, lng: number | null) => {
    if (!lat || !lng) return 'No location data';
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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

  return (
    <div className="space-y-4">
      {/* Device Info Card */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            {device.device_name || 'Unknown Device'}
          </CardTitle>
          <CardDescription className="text-slate-300">
            Device Information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <span className="text-slate-400 text-sm">MAC Address:</span>
              <div className="text-white font-mono">{device.mac_address}</div>
            </div>
            
            {device.ip_address && (
              <div>
                <span className="text-slate-400 text-sm">IP Address:</span>
                <div className="flex items-center">
                  <Wifi className="w-4 h-4 mr-2 text-blue-400" />
                  <span className="text-blue-300 font-mono">{device.ip_address}</span>
                </div>
              </div>
            )}

            <div>
              <span className="text-slate-400 text-sm">Location:</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-green-400" />
                  <span className="text-white">{formatCoordinates(device.latitude, device.longitude)}</span>
                </div>
                {device.location_accuracy && (
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    ±{device.location_accuracy.toFixed(1)}m
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-sm">Added:</span>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-slate-400" />
                <span className="text-white">{formatDate(device.added_at)}</span>
              </div>
            </div>

            {device.last_seen && (
              <div>
                <span className="text-slate-400 text-sm">Last Seen:</span>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-slate-400" />
                  <span className="text-white">{formatDate(device.last_seen)}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Status Card */}
      {device.ip_address && (
        <DeviceMonitoringStatus 
          deviceId={device.id}
          deviceName={device.device_name || 'Unknown Device'}
          status={device.status}
          lastPingAt={device.last_ping_at}
          responseTime={device.ping_response_time}
        />
      )}
    </div>
  );
};
