import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rentalId } = await req.json();

    if (!rentalId) {
      return new Response(
        JSON.stringify({ error: 'rentalId is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar o aluguel
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select('*')
      .eq('id', rentalId)
      .single();

    if (fetchError || !rental) {
      console.error('Error fetching rental:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Rental not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (rental.status !== 'Ativo') {
      return new Response(
        JSON.stringify({ error: 'Rental is not active' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const now = new Date();
    const endTime = new Date(rental.end_time);
    const actualEndTime = now;

    // Calcular tempo total e custo no backend (seguro)
    let totalMinutes = Math.floor((actualEndTime.getTime() - new Date(rental.start_time).getTime()) / (1000 * 60));
    let totalAmount = 0;
    let overageMinutes = 0;

    const pricingModel = rental.pricing_model;

    if (pricingModel === 'per_minute') {
      totalAmount = totalMinutes * (rental.price_per_minute || 0);
    } else if (pricingModel === 'per_day') {
      const totalDays = Math.ceil(totalMinutes / (24 * 60));
      totalAmount = totalDays * (rental.price_per_day || 0);
    } else if (pricingModel === 'block') {
      const blockDurationMinutes = rental.block_duration_minutes || 60;
      const blocksUsed = Math.ceil(totalMinutes / blockDurationMinutes);
      totalAmount = blocksUsed * (rental.price_block || 0);
    } else if (pricingModel === 'fixed') {
      // Preço fixo já definido no rental.initial_cost
      totalAmount = rental.initial_cost || 0;
      
      // Se passou do tempo, calcular overage
      if (actualEndTime > endTime) {
        overageMinutes = Math.floor((actualEndTime.getTime() - endTime.getTime()) / (1000 * 60));
        const overageCost = overageMinutes * (rental.price_per_minute || 0);
        totalAmount += overageCost;
      }
    }

    // Garantir que o valor seja positivo
    totalAmount = Math.max(0, totalAmount);

    // Atualizar o aluguel
    const { error: updateError } = await supabase
      .from('rentals')
      .update({
        status: 'Concluído',
        actual_end_time: actualEndTime.toISOString(),
        total_cost: totalAmount,
        total_overage_minutes: overageMinutes
      })
      .eq('id', rentalId);

    if (updateError) {
      console.error('Error updating rental:', updateError);
      throw updateError;
    }

    // Atualizar o status do item
    if (rental.item_id) {
      await supabase
        .from('items')
        .update({ status: 'Disponível' })
        .eq('id', rental.item_id);
    }

    console.log(`Rental ${rentalId} finalized. Total: R$ ${totalAmount.toFixed(2)}, Overage: ${overageMinutes} min`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalAmount,
        overageMinutes,
        actualEndTime: actualEndTime.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in finalize-rental:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});