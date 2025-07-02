
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Gift } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { RewardSummaryCards } from './RewardSummaryCards';
import { DeviceRewardCard } from './DeviceRewardCard';
import { EmptyRewardsState } from './EmptyRewardsState';
import { formatCurrency, formatDate } from '@/utils/rewardUtils';

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
      console.log('Fetching device reward summaries...');
      
      // First get all devices for the current user
      const { data: devices, error: devicesError } = await supabase
        .from('ddaas_devices')
        .select('id, device_name, mac_address, user_id');

      if (devicesError) {
        console.error('Error fetching devices:', devicesError);
        throw devicesError;
      }

      console.log('Devices fetched:', devices);

      if (!devices || devices.length === 0) {
        return [];
      }

      // Get device IDs
      const deviceIds = devices.map(d => d.id);

      // Get all rewards for these devices
      const { data: rewards, error: rewardsError } = await supabase
        .from('device_rewards')
        .select('device_id, reward_amount, earned_at, id')
        .in('device_id', deviceIds);

      if (rewardsError) {
        console.error('Error fetching rewards:', rewardsError);
        throw rewardsError;
      }

      console.log('Rewards fetched:', rewards);

      // Calculate summaries for each device
      const summaries: DeviceRewardSummary[] = devices.map(device => {
        const deviceRewards = rewards?.filter(r => r.device_id === device.id) || [];
        
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const totalRewards = deviceRewards.reduce((sum, r) => sum + Number(r.reward_amount), 0);
        const rewards7Days = deviceRewards
          .filter(r => new Date(r.earned_at) >= sevenDaysAgo)
          .reduce((sum, r) => sum + Number(r.reward_amount), 0);
        const rewards30Days = deviceRewards
          .filter(r => new Date(r.earned_at) >= thirtyDaysAgo)
          .reduce((sum, r) => sum + Number(r.reward_amount), 0);

        const lastRewardDate = deviceRewards.length > 0 
          ? deviceRewards.sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime())[0].earned_at
          : null;

        return {
          device_id: device.id,
          user_id: device.user_id,
          device_name: device.device_name,
          mac_address: device.mac_address,
          total_rewards: totalRewards,
          rewards_7_days: rewards7Days,
          rewards_30_days: rewards30Days,
          total_reward_entries: deviceRewards.length,
          last_reward_date: lastRewardDate,
        };
      });

      // Sort by total rewards descending
      return summaries.sort((a, b) => b.total_rewards - a.total_rewards);
    },
    enabled: isOpen,
  });

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
          <RewardSummaryCards
            total7Days={getTotal7Days()}
            total30Days={getTotal30Days()}
            totalAllTime={getTotalRewards()}
            formatCurrency={formatCurrency}
          />

          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-slate-300">Loading rewards...</div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-300">Failed to load rewards: {error.message}</div>
            </div>
          ) : !rewardSummaries || rewardSummaries.length === 0 ? (
            <EmptyRewardsState />
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-slate-300 mb-4">
                {rewardSummaries.length} device{rewardSummaries.length !== 1 ? 's' : ''} earning rewards
              </div>
              
              {rewardSummaries.map((device) => (
                <DeviceRewardCard
                  key={device.device_id}
                  device={device}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
