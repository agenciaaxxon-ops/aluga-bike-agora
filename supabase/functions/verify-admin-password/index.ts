import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shopId, password } = await req.json();

    if (!shopId || !password) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing shopId or password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar a senha admin armazenada para a loja
    const { data: shop, error } = await supabase
      .from('shops')
      .select('admin_password')
      .eq('id', shopId)
      .single();

    if (error || !shop) {
      console.error('Error fetching shop:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Shop not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Comparar senha fornecida com a armazenada (em plain text por enquanto)
    // TODO: Em produção, usar bcrypt para hash
    const isValid = password === shop.admin_password;

    console.log(`Admin password verification for shop ${shopId}: ${isValid ? 'SUCCESS' : 'FAILED'}`);

    return new Response(
      JSON.stringify({ valid: isValid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-admin-password:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});