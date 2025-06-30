
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Router, Calendar, TrendingUp, DollarSign } from 'lucide-react';

interface DeviceRewardSummary {
  device_id: string;
  user_id: string;
  device_name: string | null;
  mac_address: string;
  total_rewards: number;
  rewards_7_days: number;
  rewards_30_days: number;
  total_reward_entries: number;
  last_reward_date: string | null;
}

interface DeviceRewardCardProps {
  device: DeviceRewardSummary;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string | null) => string;
}

export const DeviceRewardCard = ({ device, formatCurrency, formatDate }: DeviceRewardCardProps) => {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Router className="w-4 h-4 text-slate-400" />
              <CardTitle className="text-white text-base">
                {device.device_name || 'Unknown Device'}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-600 font-mono text-xs">
                MAC: {device.mac_address}
              </Badge>
            </div>
          </div>
          <Badge className="bg-green-600/80 text-white ml-2">
            {formatCurrency(device.total_rewards)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              <span className="text-xs text-slate-400">7 Days</span>
            </div>
            <div className="text-sm font-semibold text-green-400">
              {formatCurrency(device.rewards_7_days)}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="w-3 h-3 mr-1 text-slate-400" />
              <span className="text-xs text-slate-400">30 Days</span>
            </div>
            <div className="text-sm font-semibold text-blue-400">
              {formatCurrency(device.rewards_30_days)}
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-3 h-3 mr-1 text-slate-400" />
              <span className="text-xs text-slate-400">All Time</span>
            </div>
            <div className="text-sm font-semibold text-purple-400">
              {formatCurrency(device.total_rewards)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
          <div className="flex items-center">
            <DollarSign className="w-3 h-3 mr-1" />
            <span>{device.total_reward_entries} reward entries</span>
          </div>
          <div>
            Last: {formatDate(device.last_reward_date)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
