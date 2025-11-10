import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_code, latitude, longitude } = await req.json();

    console.log('Update location request:', { access_code, latitude, longitude });

    // Validação dos parâmetros
    if (!access_code || typeof latitude !== 'number' || typeof longitude !== 'number') {
      console.error('Invalid parameters:', { access_code, latitude, longitude });
      return new Response(
        JSON.stringify({ error: 'access_code, latitude e longitude são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validação de coordenadas válidas
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      console.error('Invalid coordinates:', { latitude, longitude });
      return new Response(
        JSON.stringify({ error: 'Coordenadas inválidas' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com service_role para bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Usar a função RPC existente que já valida se o aluguel está ativo
    const { error: rpcError } = await supabase.rpc('update_rental_location', {
      p_access_code: access_code,
      p_latitude: latitude,
      p_longitude: longitude,
    });

    if (rpcError) {
      console.error('Error updating location:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar localização', details: rpcError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Location updated successfully for access_code:', access_code);

    return new Response(
      JSON.stringify({ success: true, message: 'Localização atualizada com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-rental-location function:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
