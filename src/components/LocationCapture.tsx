import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, MapPin, AlertTriangle, Target, Edit } from 'lucide-react';
import { ManualLocationInput, ManualLocationData } from './ManualLocationInput';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
}

interface LocationCaptureProps {
  location: LocationData | null;
  manualLocation: ManualLocationData | null;
  onLocationFound: (location: LocationData) => void;
  onManualLocationEntered: (location: ManualLocationData) => void;
}

export const LocationCapture = ({ location, manualLocation, onLocationFound, onManualLocationEntered }: LocationCaptureProps) => {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    
    try {
      console.log('Using browser geolocation API with high accuracy');
      
      if (!('geolocation' in navigator)) {
        throw new Error('Geolocation is not supported by this browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 30000, // Increased timeout for better accuracy
          maximumAge: 0 // Don't use cached location
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('High accuracy geolocation success:', position);
            resolve(position);
          },
          (error) => {
            console.error('High accuracy geolocation error:', error);
            reject(error);
          },
          options
        );
      });
      
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed
      };
      
      onLocationFound(locationData);
      
      const accuracyText = locationData.accuracy < 10 
        ? "Very High" 
        : locationData.accuracy < 50 
        ? "High" 
        : locationData.accuracy < 100 
        ? "Medium" 
        : "Low";
      
      toast({
        title: "Location Found",
        description: `Accuracy: ${accuracyText} (±${locationData.accuracy.toFixed(1)}m). Coordinates: ${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
      });

    } catch (error: any) {
      console.error('Location error:', error);
      
      if (error.code === 1) {
        setLocationError('Location access denied. Please allow location access and ensure you\'re using HTTPS.');
        toast({
          title: "Location Permission Denied",
          description: "Please allow location access when prompted. Note: High accuracy requires HTTPS.",
          variant: "destructive",
        });
      } else if (error.code === 2) {
        setLocationError('Location services unavailable. Try moving to an area with better GPS signal.');
        toast({
          title: "Location Unavailable",
          description: "Unable to determine your location. Try moving outdoors for better GPS signal.",
          variant: "destructive",
        });
      } else if (error.code === 3) {
        setLocationError('Location request timed out. This may happen when seeking high accuracy.');
        toast({
          title: "Location Request Timeout",
          description: "High accuracy location took too long. Try again or move to an area with better GPS signal.",
          variant: "destructive",
        });
      } else {
        setLocationError('Unable to get location. Ensure location services are enabled and you\'re using HTTPS.');
        toast({
          title: "Location Failed",
          description: "Unable to get current location. Check your browser settings and location permissions.",
          variant: "destructive",
        });
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy < 10) return 'text-green-400';
    if (accuracy < 50) return 'text-yellow-400';
    if (accuracy < 100) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAccuracyDescription = (accuracy: number) => {
    if (accuracy < 10) return 'Very High (GPS)';
    if (accuracy < 50) return 'High (GPS/WiFi)';
    if (accuracy < 100) return 'Medium (Cell Tower)';
    return 'Low (IP-based)';
  };

  const isLowAccuracy = location && location.accuracy > 100;

  return (
    <div className="space-y-4">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Step 2: Get High-Accuracy Location
          </CardTitle>
          <CardDescription className="text-slate-300">
            Capture precise GPS coordinates (works best outdoors with HTTPS)
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
                Getting High-Accuracy Location...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Get Precise Location
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
                    <div className="mt-2 text-xs text-red-300">
                      <p>💡 Tips for better accuracy:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Go outdoors with clear sky view</li>
                        <li>Ensure site is loaded via HTTPS</li>
                        <li>Allow location access when prompted</li>
                        <li>Wait longer for GPS to acquire signal</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {location && (
            <div className="bg-white/10 p-3 rounded-lg space-y-2">
              <div className="text-sm text-white">
                <div>Latitude: {location.latitude.toFixed(8)}</div>
                <div>Longitude: {location.longitude.toFixed(8)}</div>
                <div className={`flex items-center ${getAccuracyColor(location.accuracy)}`}>
                  <Target className="w-4 h-4 mr-1" />
                  Accuracy: ±{location.accuracy.toFixed(1)}m ({getAccuracyDescription(location.accuracy)})
                </div>
                {location.altitude !== null && location.altitude !== undefined && (
                  <div>Altitude: {location.altitude.toFixed(1)}m</div>
                )}
              </div>
              {isLowAccuracy && (
                <div className="text-xs text-yellow-300 bg-yellow-900/20 p-2 rounded">
                  ⚠️ Low accuracy detected. For better results, try going outdoors or entering coordinates manually.
                </div>
              )}
            </div>
          )}

          {(isLowAccuracy || locationError) && (
            <Button 
              onClick={() => setShowManualInput(!showManualInput)}
              variant="outline"
              className="w-full bg-white/10 hover:bg-white/20 text-white border-white/30"
            >
              <Edit className="w-4 h-4 mr-2" />
              {showManualInput ? 'Hide Manual Entry' : 'Enter Coordinates Manually'}
            </Button>
          )}

          <div className="text-xs text-slate-400 bg-white/5 p-2 rounded">
            <p><strong>Note:</strong> Best accuracy requires GPS and HTTPS. Indoor locations may be less precise.</p>
          </div>
        </CardContent>
      </Card>

      <ManualLocationInput 
        showForm={showManualInput}
        onLocationEntered={(manualLoc) => {
          onManualLocationEntered(manualLoc);
          setShowManualInput(false);
        }}
      />

      {manualLocation && (
        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="p-3">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-200 text-sm font-medium">Manual Location Set</p>
                <div className="text-xs text-green-300 mt-1">
                  <div>Latitude: {manualLocation.latitude.toFixed(8)}</div>
                  <div>Longitude: {manualLocation.longitude.toFixed(8)}</div>
                  {manualLocation.notes && <div>Notes: {manualLocation.notes}</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
