
-- Add new columns to ddaas_devices table for IP address and status tracking
ALTER TABLE public.ddaas_devices 
ADD COLUMN ip_address INET,
ADD COLUMN status TEXT DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'unknown')),
ADD COLUMN last_ping_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ping_response_time INTEGER; -- in milliseconds

-- Create a table to store ping history for monitoring trends
CREATE TABLE public.device_ping_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID REFERENCES public.ddaas_devices(id) ON DELETE CASCADE,
  ping_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time INTEGER, -- in milliseconds, NULL if timeout/failed
  status TEXT NOT NULL CHECK (status IN ('success', 'timeout', 'error')),
  error_message TEXT
);

-- Add RLS policies for ping history
ALTER TABLE public.device_ping_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ping history for their devices" 
  ON public.device_ping_history 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.ddaas_devices 
      WHERE id = device_ping_history.device_id 
      AND user_id = auth.uid()
    )
  );

-- Create index for better performance on ping history queries
CREATE INDEX idx_device_ping_history_device_id ON public.device_ping_history(device_id);
CREATE INDEX idx_device_ping_history_ping_time ON public.device_ping_history(ping_time);

-- Enable realtime for device status updates
ALTER TABLE public.ddaas_devices REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.ddaas_devices;
