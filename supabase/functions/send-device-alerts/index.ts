
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AlertRequest {
  deviceId: string;
  deviceName: string;
  userId: string;
  alertType: 'offline' | 'online';
  userEmail?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { deviceId, deviceName, userId, alertType, userEmail }: AlertRequest = await req.json();

    // Get user alert preferences
    const { data: preferences, error: prefsError } = await supabaseClient
      .from('user_alert_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError && prefsError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefsError);
      return new Response(JSON.stringify({ error: 'Failed to fetch preferences' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create default preferences if none exist
    if (!preferences) {
      const { error: insertError } = await supabaseClient
        .from('user_alert_preferences')
        .insert({
          user_id: userId,
          email_alerts_enabled: true,
          push_notifications_enabled: true,
          alert_frequency: 'immediate'
        });

      if (insertError) {
        console.error('Error creating default preferences:', insertError);
      }
    }

    const alertPrefs = preferences || {
      email_alerts_enabled: true,
      push_notifications_enabled: true,
      alert_frequency: 'immediate'
    };

    // Check if we should send alerts based on frequency
    const now = new Date();
    const shouldSendAlert = alertPrefs.alert_frequency === 'immediate' || 
      await shouldSendBasedOnFrequency(supabaseClient, deviceId, userId, alertPrefs.alert_frequency, now);

    if (!shouldSendAlert) {
      return new Response(JSON.stringify({ message: 'Alert suppressed due to frequency settings' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let notificationMethods = [];

    // Send email alert if enabled and email provided
    if (alertPrefs.email_alerts_enabled && userEmail) {
      try {
        const emailSubject = alertType === 'offline' 
          ? `Device Alert: ${deviceName} is offline`
          : `Device Alert: ${deviceName} is back online`;

        const emailHtml = `
          <h2>Device Status Alert</h2>
          <p>Your device <strong>${deviceName}</strong> is now <strong>${alertType}</strong>.</p>
          <p>Time: ${now.toLocaleString()}</p>
          <p>Device ID: ${deviceId}</p>
          <hr>
          <p>This is an automated alert from your DDaaS Companion app.</p>
        `;

        await resend.emails.send({
          from: 'DDaaS Companion <noreply@resend.dev>',
          to: [userEmail],
          subject: emailSubject,
          html: emailHtml,
        });

        notificationMethods.push('email');
        console.log(`Email alert sent to ${userEmail} for device ${deviceName}`);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }
    }

    // Push notifications would be handled here for mobile apps
    if (alertPrefs.push_notifications_enabled) {
      // For now, we'll just log that push notification would be sent
      // In a real implementation, you'd integrate with a push notification service
      console.log(`Push notification would be sent for device ${deviceName} (${alertType})`);
      notificationMethods.push('push');
    }

    // Record the alert in history
    if (notificationMethods.length > 0) {
      await supabaseClient
        .from('device_alert_history')
        .insert({
          device_id: deviceId,
          user_id: userId,
          alert_type: alertType,
          notification_method: notificationMethods.join(','),
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      notificationMethods,
      message: `Alert sent via: ${notificationMethods.join(', ')}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-device-alerts function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function shouldSendBasedOnFrequency(
  supabase: any, 
  deviceId: string, 
  userId: string, 
  frequency: string, 
  now: Date
): Promise<boolean> {
  if (frequency === 'immediate') return true;

  const hoursBack = frequency === 'hourly' ? 1 : 24;
  const cutoffTime = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));

  const { data: recentAlerts } = await supabase
    .from('device_alert_history')
    .select('sent_at')
    .eq('device_id', deviceId)
    .eq('user_id', userId)
    .gte('sent_at', cutoffTime.toISOString())
    .limit(1);

  return !recentAlerts || recentAlerts.length === 0;
}
