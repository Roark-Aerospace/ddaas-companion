
import { Gift } from 'lucide-react';

export const EmptyRewardsState = () => {
  return (
    <div className="text-center py-8">
      <Gift className="w-12 h-12 mx-auto mb-4 text-slate-400" />
      <div className="text-slate-300 mb-2">No rewards yet</div>
      <div className="text-slate-400 text-sm">
        Keep your devices online to start earning rewards
      </div>
    </div>
  );
};
