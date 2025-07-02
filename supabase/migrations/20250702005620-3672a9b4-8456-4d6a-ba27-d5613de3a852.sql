
-- Drop the existing view
DROP VIEW IF EXISTS public.device_reward_summary;

-- Create updated view that includes all devices, even those without rewards
CREATE VIEW public.device_reward_summary AS
SELECT 
    d.id as device_id,
    d.user_id,
    d.device_name,
    d.mac_address,
    COALESCE(r.total_rewards, 0) as total_rewards,
    COALESCE(r.rewards_7_days, 0) as rewards_7_days,
    COALESCE(r.rewards_30_days, 0) as rewards_30_days,
    COALESCE(r.total_reward_entries, 0) as total_reward_entries,
    r.last_reward_date
FROM 
    public.ddaas_devices d
LEFT JOIN (
    SELECT 
        device_id,
        SUM(reward_amount) as total_rewards,
        SUM(CASE WHEN earned_at >= NOW() - INTERVAL '7 days' THEN reward_amount ELSE 0 END) as rewards_7_days,
        SUM(CASE WHEN earned_at >= NOW() - INTERVAL '30 days' THEN reward_amount ELSE 0 END) as rewards_30_days,
        COUNT(*) as total_reward_entries,
        MAX(earned_at) as last_reward_date
    FROM 
        public.device_rewards
    GROUP BY 
        device_id
) r ON d.id = r.device_id;
