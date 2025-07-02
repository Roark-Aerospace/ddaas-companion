
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Network } from 'lucide-react';

interface ManualIPInputProps {
  manualIp: string;
  onIpChange: (ip: string) => void;
}

export const ManualIPInput = ({ manualIp, onIpChange }: ManualIPInputProps) => {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Network className="w-5 h-5 mr-2" />
          Manual IP Address
        </CardTitle>
        <CardDescription className="text-slate-300">
          Enter the IP address for monitoring this device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="manualIp" className="text-white">IP Address</Label>
          <Input
            id="manualIp"
            placeholder="192.168.1.100"
            value={manualIp}
            onChange={(e) => onIpChange(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
          />
        </div>
      </CardContent>
    </Card>
  );
};
