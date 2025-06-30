
-- Create rewards table to track device rewards over time
CREATE TABLE public.device_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL REFERENCES public.ddaas_devices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reward_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  reward_type TEXT NOT NULL DEFAULT 'uptime' CHECK (reward_type IN ('uptime', 'data_sharing', 'location_sharing', 'bonus')),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT
);

-- Add RLS policies for device rewards
ALTER TABLE public.device_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own device rewards" 
  ON public.device_rewards 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own device rewards" 
  ON public.device_rewards 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX idx_device_rewards_device_id ON public.device_rewards(device_id);
CREATE INDEX idx_device_rewards_user_id ON public.device_rewards(user_id);
CREATE INDEX idx_device_rewards_earned_at ON public.device_rewards(earned_at);
CREATE INDEX idx_device_rewards_period ON public.device_rewards(period_start, period_end);

-- Create a view for reward summaries
CREATE OR REPLACE VIEW public.device_reward_summary AS
SELECT 
  dr.device_id,
  dr.user_id,
  dd.device_name,
  dd.mac_address,
  SUM(dr.reward_amount) as total_rewards,
  SUM(CASE WHEN dr.earned_at >= NOW() - INTERVAL '7 days' THEN dr.reward_amount ELSE 0 END) as rewards_7_days,
  SUM(CASE WHEN dr.earned_at >= NOW() - INTERVAL '30 days' THEN dr.reward_amount ELSE 0 END) as rewards_30_days,
  COUNT(dr.id) as total_reward_entries,
  MAX(dr.earned_at) as last_reward_date
FROM public.device_rewards dr
JOIN public.ddaas_devices dd ON dr.device_id = dd.id
GROUP BY dr.device_id, dr.user_id, dd.device_name, dd.mac_address;

-- Add RLS policy for the view
ALTER VIEW public.device_reward_summary SET (security_invoker = true);

-- Insert some sample reward data for testing (you can remove this later)
INSERT INTO public.device_rewards (device_id, user_id, reward_amount, reward_type, earned_at, period_start, period_end, notes)
SELECT 
  dd.id,
  dd.user_id,
  ROUND((RANDOM() * 50 + 10)::numeric, 2), -- Random rewards between 10-60
  CASE 
    WHEN RANDOM() < 0.6 THEN 'uptime'
    WHEN RANDOM() < 0.8 THEN 'data_sharing'
    ELSE 'location_sharing'
  END,
  NOW() - (RANDOM() * INTERVAL '60 days'), -- Random date within last 60 days
  NOW() - (RANDOM() * INTERVAL '60 days') - INTERVAL '1 day',
  NOW() - (RANDOM() * INTERVAL '60 days'),
  'Sample reward data'
FROM public.ddaas_devices dd
WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = dd.user_id)
LIMIT 20; -- Create up to 20 sample rewards
