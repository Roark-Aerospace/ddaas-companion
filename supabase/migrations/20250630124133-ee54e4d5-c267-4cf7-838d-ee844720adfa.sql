
-- Create a table to store DDaaS devices
CREATE TABLE public.ddaas_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  mac_address TEXT NOT NULL,
  device_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_accuracy DECIMAL(8, 2),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own devices
ALTER TABLE public.ddaas_devices ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own devices
CREATE POLICY "Users can view their own ddaas devices" 
  ON public.ddaas_devices 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own devices
CREATE POLICY "Users can create their own ddaas devices" 
  ON public.ddaas_devices 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own devices
CREATE POLICY "Users can update their own ddaas devices" 
  ON public.ddaas_devices 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own devices
CREATE POLICY "Users can delete their own ddaas devices" 
  ON public.ddaas_devices 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index for better query performance
CREATE INDEX idx_ddaas_devices_user_id ON public.ddaas_devices(user_id);
CREATE INDEX idx_ddaas_devices_mac_address ON public.ddaas_devices(mac_address);
