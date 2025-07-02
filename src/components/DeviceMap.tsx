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

// Using your Mapbox token
const MAPBOX_TOKEN = 'pk.eyJ1Ijoicm9hcmthZXJvc3BhY2UiLCJhIjoiY21jaHppZDQ5MDFvbTJqcXZyZWI1eGhudCJ9.Doqz785QAMfwql3jhYvduw';

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
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [0, 20],
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
          description: "Failed to load map tiles. Please check your internet connection.",
          variant: "destructive",
        });
      });

      // Fixed zoom event listener with proper throttling
      let zoomTimeout: NodeJS.Timeout;
      map.current.on('zoom', () => {
        clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
          if (map.current && markers.length > 0) {
            updateMarkerSizes();
          }
        }, 50);
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

  const getMarkerSize = (zoom: number, isMyDevice: boolean) => {
    // Linear scaling with better zoom range
    const minSize = 8;
    const maxSize = 24;
    
    // Clamp zoom between 0 and 18 for consistent scaling
    const clampedZoom = Math.max(0, Math.min(zoom, 18));
    const normalizedZoom = clampedZoom / 18;
    const size = minSize + (maxSize - minSize) * normalizedZoom;
    
    // Add extra size for user's own devices
    const finalSize = isMyDevice ? size * 1.2 : size;
    
    return Math.round(Math.max(minSize, finalSize));
  };

  const updateMarkerSizes = () => {
    if (!map.current || markers.length === 0) return;
    
    const currentZoom = map.current.getZoom();
    console.log('Updating marker sizes for zoom level:', currentZoom);
    
    markers.forEach((marker) => {
      const markerElement = marker.getElement();
      if (!markerElement) return;
      
      const isMyDevice = markerElement.dataset.isMyDevice === 'true';
      const newSize = getMarkerSize(currentZoom, isMyDevice);
      
      // Force update size with proper CSS
      markerElement.style.width = `${newSize}px`;
      markerElement.style.height = `${newSize}px`;
      markerElement.style.transform = 'translate(-50%, -50%)'; // Keep centered
      
      console.log(`Updated marker size to ${newSize}px for zoom ${currentZoom}`);
    });
  };

  const navigateToMyDevices = () => {
    console.log('Navigating to my devices...');
    
    // Find and click the devices tab
    const devicesTab = document.querySelector('[value="devices"]') as HTMLElement;
    if (devicesTab) {
      devicesTab.click();
      toast({
        title: "Navigation",
        description: "Switched to My Devices tab",
      });
    } else {
      toast({
        title: "Navigation Error",
        description: "Could not navigate to devices tab.",
        variant: "destructive",
      });
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
    const currentZoom = map.current.getZoom();

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

      // Create marker element with responsive sizing
      const markerElement = document.createElement('div');
      const markerSize = getMarkerSize(currentZoom, isMyDevice);
      
      markerElement.dataset.isMyDevice = isMyDevice.toString();
      markerElement.style.cssText = `
        width: ${markerSize}px;
        height: ${markerSize}px;
        border-radius: 50%;
        border: 2px solid ${isMyDevice ? '#a855f7' : 'white'};
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        background-color: ${getStatusColor(device.status)};
        position: absolute;
        transform: translate(-50%, -50%);
        z-index: 1;
      `;

      // Dynamic popup content with zoom-aware sizing
      const getPopupWidth = () => {
        const zoom = map.current?.getZoom() || 2;
        if (isMobile) return Math.min(280, window.innerWidth - 40);
        return zoom > 10 ? 300 : zoom > 6 ? 320 : 340;
      };

      const popupContent = `
        <div style="
          padding: 10px; 
          background: linear-gradient(135deg, #1e293b 0%, #7c3aed 100%); 
          border-radius: 6px; 
          color: white; 
          width: ${getPopupWidth()}px;
          max-width: calc(100vw - 40px);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          line-height: 1.3;
          box-sizing: border-box;
          overflow: hidden;
          word-wrap: break-word;
          position: relative;
        ">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; gap: 8px;">
            <h3 style="margin: 0; font-size: 13px; font-weight: 600; word-break: break-word; flex: 1; min-width: 0;">${device.device_name || 'Unknown Device'}</h3>
            ${isMyDevice ? `<span style="background: #a855f7; padding: 2px 5px; border-radius: 3px; font-size: 9px; font-weight: 600; white-space: nowrap; flex-shrink: 0;">MY DEVICE</span>` : ''}
          </div>
          
          <div style="margin-bottom: 6px; font-size: 10px;">
            <p style="margin: 1px 0; word-break: break-all;"><strong>MAC:</strong> ${device.mac_address}</p>
            ${device.ip_address ? `<p style="margin: 1px 0;"><strong>IP:</strong> ${device.ip_address}</p>` : ''}
            <p style="margin: 1px 0;"><strong>Location:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
          </div>
          
          <div style="margin: 6px 0; padding: 4px; background: rgba(0,0,0,0.25); border-radius: 3px; font-size: 10px;">
            <p style="margin: 1px 0;">
              <strong>Status:</strong> <span style="color: ${getStatusTextColor(device.status)}; font-weight: 600;">${device.status || 'Unknown'}</span>
            </p>
            <p style="margin: 1px 0; font-size: 9px; opacity: 0.9;">
              <strong>Added:</strong> ${formatDate(device.added_at)}
            </p>
            <p style="margin: 1px 0; font-size: 9px; opacity: 0.9;">
              <strong>Last Seen:</strong> ${formatDate(device.last_seen)}
            </p>
          </div>
          
          <div style="margin: 6px 0; padding: 4px; background: rgba(16, 185, 129, 0.15); border-radius: 3px; border-left: 2px solid #10b981; font-size: 10px;">
            <p style="margin: 1px 0; color: #86efac;">
              <strong>Total Rewards:</strong> ${deviceReward?.total_rewards ? formatCurrency(Number(deviceReward.total_rewards)) : '$0.00'}
            </p>
          </div>
          
          ${device.manual_location_notes ? `<p style="margin: 4px 0 0 0; font-size: 9px; opacity: 0.8; font-style: italic; word-break: break-word;">${device.manual_location_notes}</p>` : ''}
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 9px; opacity: 0.7; gap: 8px;">
            <span style="flex-shrink: 0;">${device.manual_latitude ? 'Manual location' : 'Auto-detected'}</span>
            ${isMyDevice ? `<button onclick="window.navigateToMyDevices()" style="background: #a855f7; border: none; padding: 3px 8px; border-radius: 3px; color: white; cursor: pointer; font-size: 9px; white-space: nowrap; flex-shrink: 0;">View My Devices</button>` : ''}
          </div>
        </div>
      `;

      // Create popup with dynamic positioning based on zoom level
      const getPopupOffset = () => {
        const zoom = map.current?.getZoom() || 2;
        const baseOffset = markerSize / 2 + 5;
        return [0, -baseOffset];
      };

      const getPopupAnchor = () => {
        const zoom = map.current?.getZoom() || 2;
        // At high zoom levels, use different anchoring to prevent cutoff
        if (zoom > 12) return 'bottom';
        if (zoom > 8) return 'bottom-left';
        return 'bottom';
      };

      const popup = new mapboxgl.Popup({
        offset: getPopupOffset(),
        closeButton: true,
        closeOnClick: false,
        className: 'device-popup',
        maxWidth: 'none',
        anchor: getPopupAnchor()
      }).setHTML(popupContent);

      // Create marker with center anchor for stable positioning
      const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center'
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      newMarkers.push(marker);
      console.log(`Added marker for device ${device.device_name} at ${lat}, ${lng} with size ${markerSize}px`);
    });

    setMarkers(newMarkers);

    // Fit map to show all devices with appropriate padding
    if (hasValidCoordinates && devices.length <= 50) {
      const padding = isMobile ? 50 : 80;
      try {
        map.current.fitBounds(bounds, { 
          padding,
          maxZoom: isMobile ? 10 : 12  // Reduced max zoom to prevent extreme cutoff
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
