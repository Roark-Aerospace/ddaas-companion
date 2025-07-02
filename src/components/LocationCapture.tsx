
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Geolocation } from '@capacitor/geolocation';
import { Loader2, MapPin, AlertTriangle } from 'lucide-react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
}

interface LocationCaptureProps {
  location: LocationData | null;
  onLocationFound: (location: LocationData) => void;
}

export const LocationCapture = ({ location, onLocationFound }: LocationCaptureProps) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    try {
      // Check if we're in a Capacitor environment (mobile app)
      const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

      if (isCapacitor) {
        // For mobile devices with Capacitor
        try {
          // First check permissions
          const permissions = await Geolocation.checkPermissions();
          console.log('Location permissions:', permissions);

          if (permissions.location === 'denied') {
            setLocationError('Location access denied. Please enable location services in your device settings.');
            toast({
              title: "Location Access Denied",
              description: "Please enable location services in your device settings and try again.",
              variant: "destructive",
            });
            return;
          }

          if (permissions.location === 'prompt' || permissions.location === 'prompt-with-rationale') {
            // Request permissions
            const requestResult = await Geolocation.requestPermissions();
            if (requestResult.location === 'denied') {
              setLocationError('Location permission denied. Please allow location access to continue.');
              toast({
                title: "Permission Required",
                description: "Location access is required to add devices. Please allow location access and try again.",
                variant: "destructive",
              });
              return;
            }
          }

          const coordinates = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000
          });
          
          const locationData: LocationData = {
            latitude: coordinates.coords.latitude,
            longitude: coordinates.coords.longitude,
            accuracy: coordinates.coords.accuracy
          };
          
          onLocationFound(locationData);
          
          toast({
            title: "Location Found",
            description: `Coordinates: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
          });
        } catch (capacitorError: any) {
          console.error('Capacitor location error:', capacitorError);
          
          if (capacitorError.message?.includes('location disabled') || capacitorError.message?.includes('location services')) {
            setLocationError('Location services are disabled. Please enable location services in your device settings.');
            toast({
              title: "Location Services Disabled",
              description: "Please enable location services in your device settings and try again.",
              variant: "destructive",
            });
          } else if (capacitorError.message?.includes('permission')) {
            setLocationError('Location permission denied. Please allow location access to continue.');
            toast({
              title: "Permission Denied",
              description: "Please allow location access in your device settings and try again.",
              variant: "destructive",
            });
          } else {
            throw capacitorError;
          }
        }
      } else {
        // Enhanced browser geolocation following MDN best practices
        console.log('Browser environment detected, using Web Geolocation API');
        
        // Check if geolocation is supported
        if (!('geolocation' in navigator)) {
          throw new Error('Geolocation is not supported by this browser');
        }

        // Check if we're in a secure context (HTTPS) - required for geolocation in modern browsers
        if (!window.isSecureContext && location.protocol !== 'http:' && location.hostname !== 'localhost') {
          setLocationError('Location access requires a secure connection (HTTPS). Please use HTTPS or localhost.');
          toast({
            title: "Secure Connection Required",
            description: "Location access requires HTTPS. Please use a secure connection.",
            variant: "destructive",
          });
          return;
        }

        // Check permissions using the Permissions API if available (Chrome/modern browsers)
        if ('permissions' in navigator) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
            console.log('Geolocation permission status:', permissionStatus.state);
            
            if (permissionStatus.state === 'denied') {
              setLocationError('Location access is blocked. Please click the location icon in your browser\'s address bar to allow location access, then refresh and try again.');
              toast({
                title: "Location Access Blocked",
                description: "Location is blocked in your browser. Click the location/lock icon in the address bar, allow location access, then refresh the page.",
                variant: "destructive",
              });
              return;
            }
          } catch (permissionError) {
            console.log('Permissions API not fully supported, proceeding with direct geolocation request');
          }
        }

        // Request location with optimal settings for accuracy and Chrome compatibility
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          const options: PositionOptions = {
            enableHighAccuracy: true,    // Request GPS if available
            timeout: 10000,              // 10 second timeout
            maximumAge: 60000            // Accept cached position up to 1 minute old
          };

          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('Browser geolocation success:', position);
              resolve(position);
            },
            (error) => {
              console.error('Browser geolocation error:', error);
              reject(error);
            },
            options
          );
        });
        
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        onLocationFound(locationData);
        
        toast({
          title: "Location Found",
          description: `Coordinates: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
        });
      }
    } catch (error: any) {
      console.error('Location error:', error);
      
      // Handle specific geolocation error codes
      if (error.code === 1) { // PERMISSION_DENIED
        setLocationError('Location access denied. Please allow location access when prompted, or click the location icon in your browser\'s address bar to enable location services.');
        toast({
          title: "Location Permission Denied",
          description: "Please allow location access when prompted, or click the location/lock icon in your browser's address bar to enable location access.",
          variant: "destructive",
        });
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        setLocationError('Location services unavailable. Please check your device location settings and ensure you have a good signal.');
        toast({
          title: "Location Unavailable",
          description: "Unable to determine your location. Please check your device location settings and network connection.",
          variant: "destructive",
        });
      } else if (error.code === 3) { // TIMEOUT
        setLocationError('Location request timed out. Please try again or check your connection.');
        toast({
          title: "Location Request Timeout",
          description: "Location request took too long. Please try again.",
          variant: "destructive",
        });
      } else if (error.message?.includes('secure context') || error.message?.includes('HTTPS')) {
        setLocationError('Location access requires a secure connection. Please use HTTPS.');
        toast({
          title: "Secure Connection Required",
          description: "Location access requires HTTPS. Please use a secure connection.",
          variant: "destructive",
        });
      } else {
        setLocationError('Unable to get location. Please check your browser settings and device location services.');
        toast({
          title: "Location Failed",
          description: "Unable to get current location. Please check your browser and device settings.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const openLocationSettings = () => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      // For mobile apps, we can't directly open settings, but provide instructions
      toast({
        title: "Enable Location Services",
        description: "Go to Settings > Privacy & Security > Location Services and enable location for this app.",
      });
    } else {
      // For web browsers, provide detailed Chrome-specific instructions
      const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
      const instructions = isChrome 
        ? "In Chrome: Click the location/lock icon in the address bar, select 'Allow' for location, then refresh the page. Or go to Settings > Privacy and security > Site Settings > Location."
        : "Click the location icon in your browser's address bar and select 'Allow', then refresh the page. You may also need to check your browser's location settings.";
      
      toast({
        title: "Enable Location Access",
        description: instructions,
        duration: 8000,
      });
    }
  };

  return (
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

        {locationError && (
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="p-3">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-200 text-sm">{locationError}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openLocationSettings}
                    className="mt-2 text-red-300 hover:text-red-200 hover:bg-red-800/20 h-8 px-3"
                  >
                    Help Enable Location
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
  );
};
