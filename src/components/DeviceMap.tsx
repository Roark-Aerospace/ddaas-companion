
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, Map } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate } from '@/utils/rewardUtils';
import { useIsMobile } from '@/hooks/use-mobile';

// Using your existing Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGRhYXNtYXAiLCJhIjoiY20zNGdjN2ZjMTltYzJxcHR5MjVsZXh2cyJ9.YzLN8rVHCdE8r3RoIBYHHA';

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
  user_id: string;
  added_at: string;
  last_seen: string | null;
}

interface DeviceReward {
  device_id: string;
  total_rewards: number | null;
}

export const DeviceMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [markers, setMarkers] = useState<mapboxgl.Marker[]>([]);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: devices, isLoading } = useQuery({
    queryKey: ['network-devices-map'],
    queryFn: async () => {
      // Fetch all devices from all users for the network map
      const { data, error } = await supabase
        .from('ddaas_devices')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) throw error;
      return data as DDaaSDevice[];
    },
  });

  const { data: rewards } = useQuery({
    queryKey: ['device-rewards-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('device_reward_summary')
        .select('device_id, total_rewards');

      if (error) throw error;
      return data as DeviceReward[];
    },
  });

  const initializeMap = () => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [0, 20], // Center on world view
      zoom: isMobile ? 1.5 : 2, // Slightly closer zoom on mobile
      pitch: isMobile ? 0 : 30, // Less pitch on mobile for better usability
      bearing: 0,
      touchZoomRotate: true,
      touchPitch: !isMobile, // Disable pitch gestures on mobile
      dragRotate: !isMobile, // Disable rotation on mobile
    });

    // Add navigation controls with mobile-optimized positioning
    const navControl = new mapboxgl.NavigationControl({ 
      showCompass: !isMobile,
      visualizePitch: !isMobile 
    });
    
    map.current.addControl(navControl, isMobile ? 'bottom-right' : 'top-right');

    // Add mobile-specific touch optimizations
    if (isMobile) {
      // Disable double-tap to zoom for better UX
      map.current.doubleClickZoom.disable();
      
      // Enable touch zoom rotate with better sensitivity
      map.current.touchZoomRotate.enable({ around: 'center' });
    }

    // Customize map style to match the purple/slate theme
    map.current.on('style.load', () => {
      map.current?.setPaintProperty('water', 'fill-color', '#1e293b');
      map.current?.setPaintProperty('land', 'background-color', '#0f172a');
    });
  };

  const navigateToMyDevices = () => {
    // Trigger navigation to devices tab
    const devicesTab = document.querySelector('[data-state="inactive"][value="devices"]') as HTMLElement;
    if (devicesTab) {
      devicesTab.click();
    }
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

      const deviceReward = rewards?.find(r => r.device_id === device.id);
      const isMyDevice = user?.id === device.user_id;

      // Create custom marker element with mobile-optimized sizing
      const markerElement = document.createElement('div');
      const markerSize = isMobile ? (isMyDevice ? 32 : 28) : (isMyDevice ? 28 : 24);
      const borderWidth = isMobile ? (isMyDevice ? 5 : 4) : (isMyDevice ? 4 : 3);
      
      markerElement.className = 'device-marker touch-manipulation';
      markerElement.style.cssText = `
        width: ${markerSize}px;
        height: ${markerSize}px;
        border-radius: 50%;
        border: ${borderWidth}px solid ${isMyDevice ? '#a855f7' : 'white'};
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        transition: transform 0.2s ease;
        background-color: ${getStatusColor(device.status)};
        position: relative;
        touch-action: manipulation;
      `;

      // Add hover/touch effects with mobile optimization
      markerElement.addEventListener('mouseenter', () => {
        if (!isMobile) markerElement.style.transform = 'scale(1.2)';
      });
      markerElement.addEventListener('mouseleave', () => {
        if (!isMobile) markerElement.style.transform = 'scale(1)';
      });
      
      // Touch events for mobile
      markerElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        markerElement.style.transform = 'scale(1.1)';
      });
      markerElement.addEventListener('touchend', () => {
        markerElement.style.transform = 'scale(1)';
      });

      // Create mobile-optimized popup content
      const popupContent = `
        <div style="padding: ${isMobile ? '16px' : '12px'}; background: linear-gradient(135deg, #1e293b 0%, #7c3aed 100%); border-radius: 8px; color: white; min-width: ${isMobile ? '280px' : '250px'}; max-width: ${isMobile ? '320px' : '300px'}; font-family: system-ui;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: ${isMobile ? '12px' : '8px'};">
            <h3 style="margin: 0; font-size: ${isMobile ? '18px' : '16px'}; font-weight: bold; line-height: 1.2;">${device.device_name || 'Unknown Device'}</h3>
            ${isMyDevice ? `<span style="background: #a855f7; padding: ${isMobile ? '4px 8px' : '2px 6px'}; border-radius: 4px; font-size: ${isMobile ? '11px' : '10px'}; font-weight: bold;">MY DEVICE</span>` : ''}
          </div>
          
          <div style="font-size: ${isMobile ? '13px' : '12px'}; opacity: 0.9; margin-bottom: ${isMobile ? '12px' : '8px'}; line-height: 1.4;">
            <p style="margin: ${isMobile ? '4px 0' : '2px 0'};"><strong>MAC:</strong> ${device.mac_address}</p>
            ${device.ip_address ? `<p style="margin: ${isMobile ? '4px 0' : '2px 0'};"><strong>IP:</strong> ${device.ip_address}</p>` : ''}
            <p style="margin: ${isMobile ? '4px 0' : '2px 0'};"><strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
          </div>
          
          <div style="margin: ${isMobile ? '12px 0' : '8px 0'}; padding: ${isMobile ? '8px' : '6px'}; background: rgba(0,0,0,0.2); border-radius: 4px;">
            <p style="margin: ${isMobile ? '4px 0' : '2px 0'}; font-size: ${isMobile ? '13px' : '12px'};">
              <strong>Status:</strong> <span style="color: ${getStatusTextColor(device.status)}; font-weight: bold;">${device.status || 'Unknown'}</span>
            </p>
            <p style="margin: ${isMobile ? '4px 0' : '2px 0'}; font-size: ${isMobile ? '12px' : '11px'}; opacity: 0.8;">
              <strong>Added:</strong> ${formatDate(device.added_at)}
            </p>
            <p style="margin: ${isMobile ? '4px 0' : '2px 0'}; font-size: ${isMobile ? '12px' : '11px'}; opacity: 0.8;">
              <strong>Last Seen:</strong> ${formatDate(device.last_seen)}
            </p>
          </div>
          
          <div style="margin: ${isMobile ? '12px 0' : '8px 0'}; padding: ${isMobile ? '8px' : '6px'}; background: rgba(16, 185, 129, 0.1); border-radius: 4px; border-left: 3px solid #10b981;">
            <p style="margin: ${isMobile ? '4px 0' : '2px 0'}; font-size: ${isMobile ? '13px' : '12px'}; color: #86efac;">
              <strong>Total Rewards:</strong> ${deviceReward?.total_rewards ? formatCurrency(Number(deviceReward.total_rewards)) : '$0.00'}
            </p>
          </div>
          
          ${device.manual_location_notes ? `<p style="margin: ${isMobile ? '8px 0 0 0' : '6px 0 0 0'}; font-size: ${isMobile ? '12px' : '11px'}; opacity: 0.7; font-style: italic;">${device.manual_location_notes}</p>` : ''}
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: ${isMobile ? '12px' : '8px'}; font-size: ${isMobile ? '11px' : '10px'}; opacity: 0.6;">
            <span>${device.manual_latitude ? 'Manual location' : 'Auto-detected location'}</span>
            ${isMyDevice ? `<button onclick="window.navigateToMyDevices && window.navigateToMyDevices()" style="background: #a855f7; border: none; padding: ${isMobile ? '6px 12px' : '4px 8px'}; border-radius: 4px; color: white; cursor: pointer; font-size: ${isMobile ? '11px' : '10px'}; display: flex; align-items: center; gap: 4px; touch-action: manipulation; min-height: ${isMobile ? '32px' : 'auto'};">View My Devices</button>` : ''}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: isMobile ? 35 : 25,
        closeButton: true,
        closeOnClick: isMobile, // Auto-close on mobile for better UX
        className: 'device-popup',
        maxWidth: isMobile ? '320px' : '300px',
        anchor: 'bottom'
      }).setHTML(popupContent);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to show all devices if any exist with mobile-friendly padding
    if (hasValidCoordinates && devices.length <= 50) {
      const padding = isMobile ? 30 : 50;
      map.current.fitBounds(bounds, { 
        padding,
        maxZoom: isMobile ? 12 : 15 // Prevent over-zooming on mobile
      });
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

  useEffect(() => {
    initializeMap();
  }, [isMobile]);

  useEffect(() => {
    if (devices && devices.length > 0 && map.current) {
      addDeviceMarkers(devices);
    }
  }, [devices, rewards, isMobile]);

  useEffect(() => {
    // Make navigation function globally available for popup buttons
    (window as any).navigateToMyDevices = navigateToMyDevices;
    
    return () => {
      markers.forEach(marker => marker.remove());
      map.current?.remove();
      delete (window as any).navigateToMyDevices;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
            <Map className="w-5 h-5 sm:w-6 sm:h-6" />
            Global Network Map
          </h3>
          <p className="text-slate-300 text-sm">
            {devices?.length || 0} devices network-wide • Your devices have purple borders
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={navigateToMyDevices}
            className="bg-purple-600/20 border-purple-400/30 text-purple-300 hover:bg-purple-600/30 touch-manipulation min-h-[44px] sm:min-h-auto"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            My Devices
          </Button>
        </div>
      </div>

      <Card className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
        <div className="relative">
          <div 
            ref={mapContainer} 
            className={`w-full ${isMobile ? 'h-80' : 'h-96'} touch-manipulation`}
            style={{ touchAction: 'pan-x pan-y' }}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <div>Loading network devices...</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
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
        <div className="text-xs text-slate-400 text-right">
          Purple border = Your devices
        </div>
      </div>
    </div>
  );
};
