
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PingResult {
  success: boolean;
  responseTime?: number;
  error?: string;
}

async function pingDevice(ip: string): Promise<PingResult> {
  try {
    const startTime = Date.now();
    
    // Use Deno's native fetch with timeout for ping simulation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      // Try to make a simple HTTP request to check if device responds
      const response = await fetch(`http://${ip}`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      return {
        success: true,
        responseTime,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // If HTTP fails, try a basic connectivity check using TCP
      try {
        const conn = await Deno.connect({ hostname: ip, port: 80 });
        conn.close();
        const responseTime = Date.now() - startTime;
        return {
          success: true,
          responseTime,
        };
      } catch (tcpError) {
        return {
          success: false,
          error: 'Device unreachable',
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      // Manual ping request for a specific device
      const { deviceId } = await req.json();
      
      const { data: device, error: deviceError } = await supabaseClient
        .from('ddaas_devices')
        .select('id, ip_address')
        .eq('id', deviceId)
        .single();

      if (deviceError || !device?.ip_address) {
        return new Response(
          JSON.stringify({ error: 'Device not found or no IP address' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const pingResult = await pingDevice(device.ip_address);
      
      // Update device status
      await supabaseClient
        .from('ddaas_devices')
        .update({
          status: pingResult.success ? 'online' : 'offline',
          last_ping_at: new Date().toISOString(),
          ping_response_time: pingResult.responseTime || null,
        })
        .eq('id', deviceId);

      // Record ping history
      await supabaseClient
        .from('device_ping_history')
        .insert({
          device_id: deviceId,
          response_time: pingResult.responseTime || null,
          status: pingResult.success ? 'success' : (pingResult.error?.includes('timeout') ? 'timeout' : 'error'),
          error_message: pingResult.error || null,
        });

      return new Response(
        JSON.stringify({ success: true, pingResult }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'GET') {
      // Scheduled monitoring - ping all devices
      console.log('Starting scheduled device monitoring...');
      
      const { data: devices, error: devicesError } = await supabaseClient
        .from('ddaas_devices')
        .select('id, ip_address, device_name')
        .not('ip_address', 'is', null);

      if (devicesError) {
        console.error('Error fetching devices:', devicesError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch devices' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const results = [];
      
      for (const device of devices) {
        console.log(`Pinging device ${device.device_name} (${device.ip_address})...`);
        
        const pingResult = await pingDevice(device.ip_address);
        
        // Update device status
        const { error: updateError } = await supabaseClient
          .from('ddaas_devices')
          .update({
            status: pingResult.success ? 'online' : 'offline',
            last_ping_at: new Date().toISOString(),
            ping_response_time: pingResult.responseTime || null,
          })
          .eq('id', device.id);

        if (updateError) {
          console.error(`Error updating device ${device.id}:`, updateError);
        }

        // Record ping history
        const { error: historyError } = await supabaseClient
          .from('device_ping_history')
          .insert({
            device_id: device.id,
            response_time: pingResult.responseTime || null,
            status: pingResult.success ? 'success' : (pingResult.error?.includes('timeout') ? 'timeout' : 'error'),
            error_message: pingResult.error || null,
          });

        if (historyError) {
          console.error(`Error recording ping history for device ${device.id}:`, historyError);
        }

        results.push({
          deviceId: device.id,
          deviceName: device.device_name,
          ip: device.ip_address,
          ...pingResult,
        });
      }

      console.log(`Monitoring complete. Checked ${results.length} devices.`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          devicesChecked: results.length,
          results 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in monitor-devices function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
