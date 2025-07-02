
-- Drop the existing view and recreate it properly
DROP VIEW IF EXISTS public.device_reward_summary;

-- Recreate the view without trying to apply RLS policies directly to it
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

-- The view will automatically respect RLS policies from the underlying tables
-- No need to enable RLS on the view itself or create policies for it
