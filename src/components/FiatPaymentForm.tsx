
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard } from 'lucide-react';

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

interface FiatPaymentFormProps {
  existingData?: PaymentPreference | null;
  onSuccess: () => void;
}

export const FiatPaymentForm = ({ existingData, onSuccess }: FiatPaymentFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: existingData?.bank_name || '',
    bank_address: existingData?.bank_address || '',
    account_number: existingData?.account_number || '',
    sort_code: existingData?.sort_code || '',
    routing_number: existingData?.routing_number || '',
    iban: existingData?.iban || '',
    swift_code: existingData?.swift_code || '',
  });

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

      const paymentData = {
        user_id: user.id,
        payment_method: 'fiat' as const,
        bank_name: formData.bank_name,
        bank_address: formData.bank_address,
        account_number: formData.account_number,
        sort_code: formData.sort_code,
        routing_number: formData.routing_number,
        iban: formData.iban,
        swift_code: formData.swift_code,
        wallet_address: null,
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-green-400" />
          <CardTitle className="text-white">Bank Account Information</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name" className="text-white">Bank Name *</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleInputChange('bank_name', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                placeholder="e.g., Chase Bank, Wells Fargo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_address" className="text-white">Bank Address</Label>
              <Input
                id="bank_address"
                value={formData.bank_address}
                onChange={(e) => handleInputChange('bank_address', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                placeholder="Bank's full address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number" className="text-white">Account Number *</Label>
              <Input
                id="account_number"
                value={formData.account_number}
                onChange={(e) => handleInputChange('account_number', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                placeholder="Your bank account number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_code" className="text-white">Sort Code</Label>
                <Input
                  id="sort_code"
                  value={formData.sort_code}
                  onChange={(e) => handleInputChange('sort_code', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  placeholder="XX-XX-XX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="routing_number" className="text-white">Routing Number</Label>
                <Input
                  id="routing_number"
                  value={formData.routing_number}
                  onChange={(e) => handleInputChange('routing_number', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  placeholder="9-digit number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban" className="text-white">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => handleInputChange('iban', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                placeholder="International Bank Account Number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swift_code" className="text-white">SWIFT Code</Label>
              <Input
                id="swift_code"
                value={formData.swift_code}
                onChange={(e) => handleInputChange('swift_code', e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                placeholder="8 or 11 character code"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit"
              disabled={isLoading || !formData.bank_name || !formData.account_number}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? "Saving..." : existingData ? "Update Bank Details" : "Save Bank Details"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
