
-- Create table for user alert preferences
CREATE TABLE public.user_alert_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  push_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  alert_frequency TEXT NOT NULL DEFAULT 'immediate', -- immediate, hourly, daily
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.user_alert_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user alert preferences
CREATE POLICY "Users can view their own alert preferences" 
  ON public.user_alert_preferences 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own alert preferences" 
  ON public.user_alert_preferences 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own alert preferences" 
  ON public.user_alert_preferences 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create table to track alert history to prevent spam
CREATE TABLE public.device_alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL, -- 'offline', 'online'
  notification_method TEXT NOT NULL, -- 'email', 'push', 'both'
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security for alert history
ALTER TABLE public.device_alert_history ENABLE ROW LEVEL SECURITY;

-- Create policy for alert history
CREATE POLICY "Users can view their own alert history" 
  ON public.device_alert_history 
  FOR SELECT 
  USING (user_id = auth.uid());

-- Create policy for system to insert alert history
CREATE POLICY "System can insert alert history" 
  ON public.device_alert_history 
  FOR INSERT 
  WITH CHECK (true);

-- Add trigger to update updated_at column
CREATE TRIGGER update_user_alert_preferences_updated_at
  BEFORE UPDATE ON public.user_alert_preferences
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
