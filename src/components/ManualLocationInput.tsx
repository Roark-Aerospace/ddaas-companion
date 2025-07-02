
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { MapPin, Save } from 'lucide-react';

export interface ManualLocationData {
  latitude: number;
  longitude: number;
  notes?: string;
}

interface ManualLocationInputProps {
  onLocationEntered: (location: ManualLocationData) => void;
  showForm: boolean;
}

export const ManualLocationInput = ({ onLocationEntered, showForm }: ManualLocationInputProps) => {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      toast({
        title: "Invalid Coordinates",
        description: "Please enter valid latitude and longitude values.",
        variant: "destructive",
      });
      return;
    }

    if (lat < -90 || lat > 90) {
      toast({
        title: "Invalid Latitude",
        description: "Latitude must be between -90 and 90 degrees.",
        variant: "destructive",
      });
      return;
    }

    if (lng < -180 || lng > 180) {
      toast({
        title: "Invalid Longitude", 
        description: "Longitude must be between -180 and 180 degrees.",
        variant: "destructive",
      });
      return;
    }

    onLocationEntered({
      latitude: lat,
      longitude: lng,
      notes: notes.trim() || undefined
    });

    toast({
      title: "Manual Location Set",
      description: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
    });
  };

  if (!showForm) return null;

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Manual Location Entry
        </CardTitle>
        <CardDescription className="text-slate-300">
          Enter precise coordinates manually for better accuracy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude" className="text-white">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g., 40.7128"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude" className="text-white">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g., -74.0060"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location-notes" className="text-white">Location Notes (Optional)</Label>
            <Textarea
              id="location-notes"
              placeholder="e.g., Building entrance, Room 101, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600/80 hover:bg-blue-600 text-white">
            <Save className="w-4 h-4 mr-2" />
            Set Manual Location
          </Button>

          <div className="text-xs text-slate-400 bg-white/5 p-2 rounded">
            <p><strong>Tip:</strong> You can find precise coordinates using Google Maps, GPS devices, or coordinate apps.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
