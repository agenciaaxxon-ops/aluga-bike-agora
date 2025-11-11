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

    console.log('[verify-admin-password] Request received:', { shopId, passwordLength: password?.length });

    if (!shopId || !password) {
      console.log('[verify-admin-password] Missing shopId or password');
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

    console.log('[verify-admin-password] Shop lookup:', { 
      found: !!shop, 
      hasPassword: !!shop?.admin_password,
      passwordStartsWith: shop?.admin_password?.substring(0, 4),
      error: error?.message 
    });

    if (error || !shop) {
      console.error('[verify-admin-password] Shop not found:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Shop not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Verificar senha usando a função de hash bcrypt
    console.log('[verify-admin-password] Calling verify_password RPC');
    const { data: verifyResult, error: verifyError } = await supabase
      .rpc('verify_password', {
        password: password,
        hash: shop.admin_password
      });

    console.log('[verify-admin-password] Verification result:', { 
      isValid: verifyResult, 
      error: verifyError?.message 
    });

    if (verifyError) {
      console.error('[verify-admin-password] Error verifying password:', verifyError);
      return new Response(
        JSON.stringify({ valid: false, error: 'Error verifying password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const isValid = verifyResult === true;

    console.log(`[verify-admin-password] Final result for shop ${shopId}: ${isValid ? 'SUCCESS' : 'FAILED'}`);

    return new Response(
      JSON.stringify({ valid: isValid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[verify-admin-password] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error', details: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});