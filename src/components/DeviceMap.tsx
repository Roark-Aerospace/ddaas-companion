
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Settings } from 'lucide-react';

interface DDaaSDevice {
  id: string;
  mac_address: string;
  device_name: string | null;
  latitude: number | null;
  longitude: number | null;
  manual_latitude: number | null;
  manual_longitude: number | null;
  manual_location_notes: string | null;
  status: string | null;
  ip_address: string | null;
}

export const DeviceMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);

  const { data: devices, isLoading } = useQuery({
    queryKey: ['ddaas-devices-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ddaas_devices')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as DDaaSDevice[];
    },
    enabled: !!mapboxToken,
  });

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-74.006, 40.7128], // Default to NYC
      zoom: 10,
    });

    // Add navigation controls with dark theme
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Customize map style to match app theme
    map.current.on('style.load', () => {
      // Add custom styling to match the purple/slate theme
      map.current?.setPaintProperty('water', 'fill-color', '#1e293b');
      map.current?.setPaintProperty('land', 'background-color', '#0f172a');
    });
  };

  const addDeviceMarkers = (devices: DDaaSDevice[]) => {
    if (!map.current) return;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    setMarkers([]);

    const newMarkers: mapboxgl.Marker[] = [];
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    devices.forEach((device) => {
      // Use manual coordinates if available, otherwise fall back to auto-captured
      const lat = device.manual_latitude || device.latitude;
      const lng = device.manual_longitude || device.longitude;

      if (!lat || !lng) return;

      hasValidCoordinates = true;
      bounds.extend([lng, lat]);

      // Create custom marker element with status-based styling
      const markerElement = document.createElement('div');
      markerElement.className = 'device-marker';
      markerElement.style.cssText = `
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: transform 0.2s ease;
        background-color: ${getStatusColor(device.status)};
      `;

      // Add hover effect
      markerElement.addEventListener('mouseenter', () => {
        markerElement.style.transform = 'scale(1.2)';
      });
      markerElement.addEventListener('mouseleave', () => {
        markerElement.style.transform = 'scale(1)';
      });

      // Create popup content
      const popupContent = `
        <div style="padding: 8px; background: linear-gradient(135deg, #1e293b 0%, #7c3aed 100%); border-radius: 8px; color: white; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${device.device_name || 'Unknown Device'}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; opacity: 0.8;">MAC: ${device.mac_address}</p>
          ${device.ip_address ? `<p style="margin: 0 0 4px 0; font-size: 12px; opacity: 0.8;">IP: ${device.ip_address}</p>` : ''}
          <p style="margin: 0 0 4px 0; font-size: 12px;">
            Status: <span style="color: ${getStatusTextColor(device.status)}; font-weight: bold;">${device.status || 'Unknown'}</span>
          </p>
          ${device.manual_location_notes ? `<p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.7; font-style: italic;">${device.manual_location_notes}</p>` : ''}
          <p style="margin: 4px 0 0 0; font-size: 10px; opacity: 0.6;">
            ${device.manual_latitude ? 'Manual location' : 'Auto-detected location'}
          </p>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: 'device-popup'
      }).setHTML(popupContent);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to show all devices
    if (hasValidCoordinates) {
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'online':
        return '#10b981'; // green
      case 'offline':
        return '#ef4444'; // red
      default:
        return '#f59e0b'; // yellow
    }
  };

  const getStatusTextColor = (status: string | null) => {
    switch (status) {
      case 'online':
        return '#86efac';
      case 'offline':
        return '#fca5a5';
      default:
        return '#fde047';
    }
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapboxToken.trim()) {
      toast({
        title: "Token Required",
        description: "Please enter your Mapbox access token",
        variant: "destructive",
      });
      return;
    }

    setShowTokenInput(false);
    initializeMap(mapboxToken);
    
    toast({
      title: "Map Initialized",
      description: "Your device locations will now be displayed on the map",
    });
  };

  useEffect(() => {
    if (devices && devices.length > 0 && map.current) {
      addDeviceMarkers(devices);
    }
  }, [devices]);

  useEffect(() => {
    return () => {
      markers.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  if (showTokenInput) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Mapbox Configuration
          </CardTitle>
          <CardDescription className="text-slate-300">
            Enter your Mapbox access token to display device locations on the map
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mapbox-token" className="text-white">
                Mapbox Access Token
              </Label>
              <Input
                id="mapbox-token"
                type="password"
                placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>
            <Button type="submit" className="w-full bg-purple-600/80 hover:bg-purple-600 text-white">
              <MapPin className="w-4 h-4 mr-2" />
              Initialize Map
            </Button>
            <div className="text-xs text-slate-400 bg-white/5 p-3 rounded">
              <p className="font-medium mb-1">How to get your Mapbox token:</p>
              <p>1. Visit mapbox.com and create a free account</p>
              <p>2. Go to your Account page and find the "Access tokens" section</p>
              <p>3. Copy your "Default public token"</p>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Device Locations</h3>
          <p className="text-slate-300 text-sm">
            {devices?.length || 0} devices • Manual coordinates take preference
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTokenInput(true)}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Settings className="w-4 h-4 mr-2" />
          Reconfigure
        </Button>
      </div>

      <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
        <div className="relative">
          <div ref={mapContainer} className="w-full h-96" />
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-white">Loading devices...</div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex items-center space-x-4 text-sm text-slate-300">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
          Online
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
          Offline
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
          Unknown
        </div>
      </div>
    </div>
  );
};
