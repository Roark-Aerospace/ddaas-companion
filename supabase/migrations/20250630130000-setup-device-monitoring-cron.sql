
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to ping all devices every hour
SELECT cron.schedule(
  'monitor-ddaas-devices-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_get(
        url:='https://pwmndpdgkbtfyqabgvij.supabase.co/functions/v1/monitor-devices',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3bW5kcGRna2J0ZnlxYWJndmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyODY5ODksImV4cCI6MjA2Njg2Mjk4OX0.MUaFGBRl_8aHvXQpUkFLQnofhWKNE94D1SNmrioB4pI"}'::jsonb
    ) as request_id;
  $$
);
