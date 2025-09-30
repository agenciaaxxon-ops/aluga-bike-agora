import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { access_code, minutes } = await req.json();

    console.log('📝 Extend rental request:', { access_code, minutes });

    // Validações
    if (!access_code || typeof access_code !== 'string') {
      console.error('❌ Invalid access_code');
      return new Response(
        JSON.stringify({ error: "Código de acesso inválido" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!minutes || typeof minutes !== 'number' || minutes <= 0 || minutes > 240) {
      console.error('❌ Invalid minutes:', minutes);
      return new Response(
        JSON.stringify({ error: "Minutos inválidos (deve ser entre 1 e 240)" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase com service role para ignorar RLS
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔍 Searching for rental with access_code:', access_code);

    // Buscar aluguel ativo pelo access_code
    const { data: rental, error: findError } = await adminClient
      .from("rentals")
      .select("id, start_time, end_time, status, shop_id, vehicle_id")
      .eq("access_code", access_code)
      .eq("status", "Ativo")
      .maybeSingle();

    if (findError) {
      console.error('❌ Error finding rental:', findError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar aluguel" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!rental) {
      console.error('❌ Rental not found or not active');
      return new Response(
        JSON.stringify({ error: "Aluguel não encontrado ou não está ativo" }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Rental found:', rental.id);

    // Calcular novo end_time
    const currentEnd = new Date(rental.end_time);
    const newEnd = new Date(currentEnd.getTime() + minutes * 60 * 1000);

    console.log('⏰ Extending time from', currentEnd.toISOString(), 'to', newEnd.toISOString());

    // Atualizar end_time (isso vai disparar o realtime para o Dashboard)
    const { data: updatedRental, error: updateError } = await adminClient
      .from("rentals")
      .update({ end_time: newEnd.toISOString() })
      .eq("id", rental.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating rental:', updateError);
      return new Response(
        JSON.stringify({ error: "Falha ao atualizar aluguel" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Rental updated successfully:', updatedRental.id);

    return new Response(
      JSON.stringify({ rental: updatedRental }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
