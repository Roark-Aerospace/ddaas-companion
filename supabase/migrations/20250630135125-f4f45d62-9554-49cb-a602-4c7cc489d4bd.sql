
-- Create enum for payment methods
CREATE TYPE public.payment_method AS ENUM ('fiat', 'usdc_solana');

-- Create user payment preferences table
CREATE TABLE public.user_payment_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL,
  
  -- Fiat payment details
  bank_name TEXT,
  bank_address TEXT,
  account_number TEXT,
  sort_code TEXT,
  routing_number TEXT,
  iban TEXT,
  swift_code TEXT,
  
  -- Crypto payment details
  wallet_address TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure only one payment preference per user
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE public.user_payment_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment preferences" 
  ON public.user_payment_preferences 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own payment preferences" 
  ON public.user_payment_preferences 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own payment preferences" 
  ON public.user_payment_preferences 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own payment preferences" 
  ON public.user_payment_preferences 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_user_payment_preferences_user_id ON public.user_payment_preferences(user_id);

-- Add function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_user_payment_preferences_updated_at 
  BEFORE UPDATE ON public.user_payment_preferences 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
