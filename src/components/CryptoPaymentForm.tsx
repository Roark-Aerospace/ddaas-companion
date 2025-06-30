
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, ExternalLink } from 'lucide-react';

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
}

interface CryptoPaymentFormProps {
  existingData?: PaymentPreference | null;
  onSuccess: () => void;
}

export const CryptoPaymentForm = ({ existingData, onSuccess }: CryptoPaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState(existingData?.wallet_address || '');

  const connectPhantomWallet = async () => {
    try {
      // Check if Phantom wallet is installed
      if (typeof window !== 'undefined' && 'solana' in window) {
        const provider = (window as any).solana;
        
        if (provider.isPhantom) {
          const response = await provider.connect();
          setWalletAddress(response.publicKey.toString());
          toast({
            title: "Wallet Connected",
            description: "Phantom wallet connected successfully",
          });
        }
      } else {
        // Phantom not installed, redirect to download
        window.open('https://phantom.app/', '_blank');
        toast({
          title: "Install Phantom",
          description: "Please install Phantom wallet to continue",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect Phantom wallet",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save payment preferences",
          variant: "destructive",
        });
        return;
      }

      if (!walletAddress) {
        toast({
          title: "Error",
          description: "Please provide a wallet address",
          variant: "destructive",
        });
        return;
      }

      const paymentData = {
        user_id: user.id,
        payment_method: 'usdc_solana' as const,
        wallet_address: walletAddress,
        bank_name: null,
        bank_address: null,
        account_number: null,
        sort_code: null,
        routing_number: null,
        iban: null,
        swift_code: null,
      };

      if (existingData) {
        const { error } = await supabase
          .from('user_payment_preferences')
          .update(paymentData)
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_payment_preferences')
          .insert([paymentData]);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save payment preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-purple-400" />
          <CardTitle className="text-white">Solana Wallet Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2">About USDC on Solana</h4>
            <p className="text-slate-300 text-sm">
              You'll receive rewards in USDC (USD Coin) directly to your Solana wallet. 
              USDC is a stable cryptocurrency pegged to the US Dollar.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wallet_address" className="text-white">Solana Wallet Address *</Label>
              <div className="flex gap-2">
                <Input
                  id="wallet_address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 font-mono"
                  placeholder="Your Solana wallet address"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                type="button"
                onClick={connectPhantomWallet}
                variant="outline"
                className="w-full bg-purple-600/20 border-purple-600/30 text-purple-300 hover:bg-purple-600/30"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Phantom Wallet
              </Button>

              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                <span>Don't have Phantom?</span>
                <Button
                  type="button"
                  variant="link"
                  className="text-purple-400 hover:text-purple-300 p-0 h-auto"
                  onClick={() => window.open('https://phantom.app/', '_blank')}
                >
                  Download here
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit"
              disabled={isLoading || !walletAddress}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? "Saving..." : existingData ? "Update Wallet Address" : "Save Wallet Address"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
