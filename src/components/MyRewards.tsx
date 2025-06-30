
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Gift, TrendingUp, Calendar, DollarSign, Router } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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

export const MyRewards = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: rewardSummaries, isLoading, error } = useQuery({
    queryKey: ['device-reward-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('device_reward_summary')
        .select('*')
        .order('total_rewards', { ascending: false });

      if (error) throw error;
      return data as DeviceRewardSummary[];
    },
    enabled: isOpen,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTotalRewards = () => {
    return rewardSummaries?.reduce((sum, device) => sum + device.total_rewards, 0) || 0;
  };

  const getTotal7Days = () => {
    return rewardSummaries?.reduce((sum, device) => sum + device.rewards_7_days, 0) || 0;
  };

  const getTotal30Days = () => {
    return rewardSummaries?.reduce((sum, device) => sum + device.rewards_30_days, 0) || 0;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline"
          className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 justify-start"
        >
          <Gift className="w-4 h-4 mr-2" />
          My Rewards
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 text-white border-white/20">
        <SheetHeader>
          <SheetTitle className="text-white">My Rewards by Device</SheetTitle>
          <SheetDescription className="text-slate-300">
            Rewards breakdown for each device MAC address
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-sm text-slate-300">7 Days</div>
                  <div className="text-lg font-bold text-green-400">
                    {formatCurrency(getTotal7Days())}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-sm text-slate-300">30 Days</div>
                  <div className="text-lg font-bold text-blue-400">
                    {formatCurrency(getTotal30Days())}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-3">
                <div className="text-center">
                  <div className="text-sm text-slate-300">All Time</div>
                  <div className="text-lg font-bold text-purple-400">
                    {formatCurrency(getTotalRewards())}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-slate-300">Loading rewards...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-300">Failed to load rewards</div>
            </div>
          ) : !rewardSummaries || rewardSummaries.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <div className="text-slate-300 mb-2">No rewards yet</div>
              <div className="text-slate-400 text-sm">
                Keep your devices online to start earning rewards
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-slate-300 mb-4">
                {rewardSummaries.length} device{rewardSummaries.length !== 1 ? 's' : ''} earning rewards
              </div>
              
              {rewardSummaries.map((device) => (
                <Card key={device.device_id} className="bg-white/10 backdrop-blur-lg border-white/20">
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
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
