
-- Drop the existing view and recreate it with proper security settings
DROP VIEW IF EXISTS public.device_reward_summary;

-- Recreate the view without security definer issues
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

-- Enable RLS on the view
ALTER VIEW public.device_reward_summary SET (security_invoker = true);

-- Create an RLS policy for the view that respects user permissions
CREATE POLICY "Users can view their own reward summaries" 
  ON public.device_reward_summary 
  FOR SELECT 
  USING (user_id = auth.uid());
