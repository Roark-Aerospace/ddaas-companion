
import { Card, CardContent } from '@/components/ui/card';

interface RewardSummaryCardsProps {
  total7Days: number;
  total30Days: number;
  totalAllTime: number;
  formatCurrency: (amount: number) => string;
}

export const RewardSummaryCards = ({ 
  total7Days, 
  total30Days, 
  totalAllTime, 
  formatCurrency 
}: RewardSummaryCardsProps) => {
  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-3">
          <div className="text-center">
            <div className="text-sm text-slate-300">7 Days</div>
            <div className="text-lg font-bold text-green-400">
              {formatCurrency(total7Days)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-3">
          <div className="text-center">
            <div className="text-sm text-slate-300">30 Days</div>
            <div className="text-lg font-bold text-blue-400">
              {formatCurrency(total30Days)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-3">
          <div className="text-center">
            <div className="text-sm text-slate-300">All Time</div>
            <div className="text-lg font-bold text-purple-400">
              {formatCurrency(totalAllTime)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
