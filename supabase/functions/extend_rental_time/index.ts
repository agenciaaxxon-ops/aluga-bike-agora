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

    console.log('📝 Extend rental request received');

    // Input validation
    if (!access_code || typeof access_code !== 'string' || access_code.length < 10) {
      console.error('❌ Invalid access_code format');
      return new Response(
        JSON.stringify({ error: "Código de acesso inválido" }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!minutes || typeof minutes !== 'number' || minutes <= 0 || minutes > 240) {
      console.error('❌ Invalid minutes value');
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

    console.log('🔍 Searching for rental');

    // Buscar aluguel ativo pelo access_code com dados de extensão
    const { data: rental, error: findError } = await adminClient
      .from("rentals")
      .select("id, start_time, end_time, status, shop_id, item_id, extension_count, total_extended_minutes, last_extension_at")
      .eq("access_code", access_code)
      .eq("status", "Ativo")
      .maybeSingle();

    if (findError) {
      console.error('❌ Database error:', findError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao processar solicitação" }), 
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

    console.log('✅ Rental found');

    // SECURITY: Rate limiting - max 10 extensions per rental
    if (rental.extension_count >= 10) {
      console.error('❌ Extension limit reached');
      return new Response(
        JSON.stringify({ error: "Limite de extensões atingido (máximo 10 extensões)" }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Max total extension time of 8 hours (480 minutes)
    if (rental.total_extended_minutes + minutes > 480) {
      console.error('❌ Total extension time limit exceeded');
      return new Response(
        JSON.stringify({ error: "Tempo máximo de extensão excedido (máximo 8 horas)" }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Prevent rapid successive extensions (min 5 minutes between extensions)
    if (rental.last_extension_at) {
      const timeSinceLastExtension = Date.now() - new Date(rental.last_extension_at).getTime();
      const minIntervalMs = 5 * 60 * 1000; // 5 minutes
      
      if (timeSinceLastExtension < minIntervalMs) {
        const waitMinutes = Math.ceil((minIntervalMs - timeSinceLastExtension) / 60000);
        console.error('❌ Extension too soon');
        return new Response(
          JSON.stringify({ error: `Aguarde ${waitMinutes} minuto(s) antes de estender novamente` }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Calcular novo end_time
    const currentEnd = new Date(rental.end_time);
    const newEnd = new Date(currentEnd.getTime() + minutes * 60 * 1000);

    console.log('⏰ Extending rental time');

    // Atualizar end_time E incrementar contadores de extensão
    const { data: updatedRental, error: updateError } = await adminClient
      .from("rentals")
      .update({ 
        end_time: newEnd.toISOString(),
        extension_count: rental.extension_count + 1,
        total_extended_minutes: rental.total_extended_minutes + minutes,
        last_extension_at: new Date().toISOString()
      })
      .eq("id", rental.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Database update error:', updateError.message);
      return new Response(
        JSON.stringify({ error: "Erro ao processar extensão" }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Rental extended successfully');

    return new Response(
      JSON.stringify({ rental: updatedRental }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log detailed error server-side, return generic error to client
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: "Erro ao processar solicitação" }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
