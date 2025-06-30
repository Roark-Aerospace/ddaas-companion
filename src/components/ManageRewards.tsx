
import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, CreditCard, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { FiatPaymentForm } from './FiatPaymentForm';
import { CryptoPaymentForm } from './CryptoPaymentForm';

interface PaymentPreference {
  id: string;
  user_id: string;
  payment_method: 'fiat' | 'usdc_solana';
  bank_name?: string;
  bank_address?: string;
  account_number?: string;
  sort_code?: string;
  routing_number?: string;
  iban?: string;
  swift_code?: string;
  wallet_address?: string;
  created_at: string;
  updated_at: string;
}

export const ManageRewards = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'fiat' | 'usdc_solana' | null>(null);

  const { data: paymentPreference, isLoading, refetch } = useQuery({
    queryKey: ['payment-preference'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_payment_preferences')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data as PaymentPreference | null;
    },
    enabled: isOpen,
  });

  const handleMethodSelect = (method: 'fiat' | 'usdc_solana') => {
    setSelectedMethod(method);
  };

  const handleBack = () => {
    setSelectedMethod(null);
  };

  const handleSuccess = () => {
    refetch();
    setSelectedMethod(null);
    toast({
      title: "Success",
      description: "Payment preferences updated successfully",
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline"
          className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 justify-start"
        >
          <Settings className="w-4 h-4 mr-2" />
          Manage My Rewards
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-gradient-to-br from-blue-900 via-purple-900 to-slate-900 text-white border-white/20">
        <SheetHeader>
          <SheetTitle className="text-white">Manage Payment Preferences</SheetTitle>
          <SheetDescription className="text-slate-300">
            Choose how you'd like to receive your rewards
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="text-slate-300">Loading preferences...</div>
            </div>
          ) : selectedMethod ? (
            <div>
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className="mb-4 text-slate-300 hover:text-white"
              >
                ← Back to options
              </Button>
              
              {selectedMethod === 'fiat' ? (
                <FiatPaymentForm 
                  existingData={paymentPreference}
                  onSuccess={handleSuccess}
                />
              ) : (
                <CryptoPaymentForm 
                  existingData={paymentPreference}
                  onSuccess={handleSuccess}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Settings */}
              {paymentPreference && (
                <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-base">Current Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {paymentPreference.payment_method === 'fiat' ? (
                        <>
                          <CreditCard className="w-4 h-4 text-green-400" />
                          <span className="text-slate-300">Bank Transfer (Fiat)</span>
                          <Badge className="bg-green-600/80 text-white ml-2">Active</Badge>
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 text-purple-400" />
                          <span className="text-slate-300">USDC on Solana</span>
                          <Badge className="bg-purple-600/80 text-white ml-2">Active</Badge>
                        </>
                      )}
                    </div>
                    {paymentPreference.payment_method === 'fiat' && paymentPreference.bank_name && (
                      <div className="mt-2 text-sm text-slate-400">
                        Bank: {paymentPreference.bank_name}
                      </div>
                    )}
                    {paymentPreference.payment_method === 'usdc_solana' && paymentPreference.wallet_address && (
                      <div className="mt-2 text-sm text-slate-400 font-mono">
                        Wallet: {paymentPreference.wallet_address.slice(0, 8)}...{paymentPreference.wallet_address.slice(-8)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Payment Method Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  {paymentPreference ? 'Change Payment Method' : 'Select Payment Method'}
                </h3>
                
                <Card 
                  className="bg-white/10 backdrop-blur-lg border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => handleMethodSelect('fiat')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-600/20 rounded-lg">
                        <CreditCard className="w-6 h-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">Receive in Fiat Currency</h4>
                        <p className="text-slate-300 text-sm">Get paid via bank transfer in your local currency</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="bg-white/10 backdrop-blur-lg border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                  onClick={() => handleMethodSelect('usdc_solana')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-600/20 rounded-lg">
                        <Wallet className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">Receive in USDC on Solana</h4>
                        <p className="text-slate-300 text-sm">Get paid in cryptocurrency via Phantom wallet</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
