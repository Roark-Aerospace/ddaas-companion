
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

// Using a valid public Mapbox token for demonstration
const MAPBOX_TOKEN = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

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
  const [mapLoaded, setMapLoaded] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: devices, isLoading } = useQuery({
    queryKey: ['network-devices-map'],
    queryFn: async () => {
      console.log('Fetching devices for network map...');
      // Fetch all devices from all users for the network map
      const { data, error } = await supabase
        .from('ddaas_devices')
        .select('*')
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error fetching devices:', error);
        throw error;
      }
      console.log('Fetched devices:', data);
      return data as DDaaSDevice[];
    },
  });

  const { data: rewards } = useQuery({
    queryKey: ['device-rewards-summary'],
    queryFn: async () => {
      console.log('Fetching device rewards...');
      const { data, error } = await supabase
        .from('device_reward_summary')
        .select('device_id, total_rewards');

      if (error) {
        console.error('Error fetching rewards:', error);
        throw error;
      }
      console.log('Fetched rewards:', data);
      return data as DeviceReward[];
    },
  });

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    console.log('Initializing map with token:', MAPBOX_TOKEN);
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12', // Using streets style which is more reliable
        center: [0, 20], // Center on world view
        zoom: isMobile ? 1.5 : 2,
        pitch: isMobile ? 0 : 30,
        bearing: 0,
        touchZoomRotate: true,
        touchPitch: !isMobile,
        dragRotate: !isMobile,
      });

      // Add navigation controls
      const navControl = new mapboxgl.NavigationControl({ 
        showCompass: !isMobile,
        visualizePitch: !isMobile 
      });
      
      map.current.addControl(navControl, isMobile ? 'bottom-right' : 'top-right');

      // Mobile optimizations
      if (isMobile) {
        map.current.doubleClickZoom.disable();
        map.current.touchZoomRotate.enable({ around: 'center' });
      }

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        toast({
          title: "Map Error",
          description: "Failed to load map tiles. The map may not display properly.",
          variant: "destructive",
        });
      });

      map.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          console.log('Map source loaded:', e.sourceId);
        }
      });

      map.current.on('styledata', () => {
        console.log('Map style loaded');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        title: "Map Initialization Error",
        description: "Failed to initialize map. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const navigateToMyDevices = () => {
    console.log('Navigating to my devices...');
    // Find the devices tab by its value attribute
    const devicesTab = document.querySelector('[value="devices"]') as HTMLElement;
    if (devicesTab) {
      devicesTab.click();
      console.log('Successfully clicked devices tab');
    } else {
      console.log('Devices tab not found, trying alternative approach');
      // Find all tab triggers and look for the one containing "Devices"
      const tabTriggers = document.querySelectorAll('[role="tab"]');
      let found = false;
      tabTriggers.forEach(tab => {
        if (tab.textContent?.toLowerCase().includes('devices')) {
          (tab as HTMLElement).click();
          found = true;
          console.log('Found and clicked devices tab by text content');
        }
      });
      if (!found) {
        console.log('Could not find devices tab');
        toast({
          title: "Navigation Error",
          description: "Could not navigate to devices tab",
          variant: "destructive",
        });
      }
    }
  };

  const addDeviceMarkers = (devices: DDaaSDevice[]) => {
    if (!map.current || !mapLoaded) {
      console.log('Map not ready for markers');
      return;
    }

    console.log('Adding device markers for', devices.length, 'devices');

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

      console.log(`Device ${device.device_name}: lat=${lat}, lng=${lng}`);

      if (!lat || !lng) {
        console.log(`Skipping device ${device.device_name} - no coordinates`);
        return;
      }

      hasValidCoordinates = true;
      bounds.extend([lng, lat]);

      const deviceReward = rewards?.find(r => r.device_id === device.id);
      const isMyDevice = user?.id === device.user_id;

      // Create custom marker element
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

      // Add hover/touch effects
      markerElement.addEventListener('mouseenter', () => {
        if (!isMobile) markerElement.style.transform = 'scale(1.2)';
      });
      markerElement.addEventListener('mouseleave', () => {
        if (!isMobile) markerElement.style.transform = 'scale(1)';
      });
      
      markerElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        markerElement.style.transform = 'scale(1.1)';
      });
      markerElement.addEventListener('touchend', () => {
        markerElement.style.transform = 'scale(1)';
      });

      // Create popup content
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
            ${isMyDevice ? `<button onclick="window.navigateToMyDevices()" style="background: #a855f7; border: none; padding: ${isMobile ? '6px 12px' : '4px 8px'}; border-radius: 4px; color: white; cursor: pointer; font-size: ${isMobile ? '11px' : '10px'}; display: flex; align-items: center; gap: 4px; touch-action: manipulation; min-height: ${isMobile ? '32px' : 'auto'};">View My Devices</button>` : ''}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: isMobile ? 35 : 25,
        closeButton: true,
        closeOnClick: isMobile,
        className: 'device-popup',
        maxWidth: isMobile ? '320px' : '300px',
        anchor: 'bottom'
      }).setHTML(popupContent);

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      newMarkers.push(marker);
      console.log(`Added marker for device ${device.device_name} at ${lat}, ${lng}`);
    });

    setMarkers(newMarkers);

    // Fit map to show all devices
    if (hasValidCoordinates && devices.length <= 50) {
      const padding = isMobile ? 30 : 50;
      try {
        map.current.fitBounds(bounds, { 
          padding,
          maxZoom: isMobile ? 12 : 15
        });
        console.log('Fitted map bounds to show all devices');
      } catch (error) {
        console.error('Error fitting bounds:', error);
      }
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
    
    return () => {
      markers.forEach(marker => marker.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isMobile]);

  useEffect(() => {
    if (devices && devices.length > 0 && mapLoaded) {
      console.log('Adding markers for', devices.length, 'devices');
      addDeviceMarkers(devices);
    }
  }, [devices, rewards, mapLoaded, user]);

  useEffect(() => {
    // Make navigation function globally available
    (window as any).navigateToMyDevices = navigateToMyDevices;
    
    return () => {
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
          {(isLoading || !mapLoaded) && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <div>{isLoading ? 'Loading network devices...' : 'Loading map...'}</div>
              </div>
            </div>
          )}
          {!mapLoaded && !isLoading && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-red-400 mb-2">Map failed to load</div>
                <div className="text-sm">Please check your internet connection</div>
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
