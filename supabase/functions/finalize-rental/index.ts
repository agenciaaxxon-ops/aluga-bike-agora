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

    // Buscar o aluguel com dados do item_type para fallback
    const { data: rental, error: fetchError } = await supabase
      .from('rentals')
      .select(`
        *,
        item:items(
          item_type:item_types(
            pricing_model,
            price_per_minute,
            price_per_day,
            price_fixed,
            price_block,
            block_duration_unit,
            block_duration_value
          )
        )
      `)
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

    // Usar dados do rental, com fallback para item_type se necessário
    const itemType = rental.item?.item_type;
    const pricingModel = rental.pricing_model || itemType?.pricing_model || 'per_minute';
    const pricePerMinute = rental.price_per_minute ?? itemType?.price_per_minute ?? 0;
    const pricePerDay = rental.price_per_day ?? itemType?.price_per_day ?? 0;
    const priceFixed = rental.price_fixed ?? itemType?.price_fixed ?? 0;
    const priceBlock = rental.price_block ?? itemType?.price_block ?? 0;
    
    // Calcular block_duration_minutes se necessário
    let blockDurationMinutes = rental.block_duration_minutes;
    if (!blockDurationMinutes && itemType) {
      const unit = itemType.block_duration_unit || 'hour';
      const value = itemType.block_duration_value || 1;
      blockDurationMinutes = unit === 'day' ? value * 1440 : value * 60;
    }

    console.log(`Finalizing rental ${rentalId}: model=${pricingModel}, minutes=${totalMinutes}`);

    if (pricingModel === 'per_minute') {
      totalAmount = totalMinutes * pricePerMinute;
    } else if (pricingModel === 'per_day') {
      const totalDays = Math.ceil(totalMinutes / (24 * 60));
      totalAmount = totalDays * pricePerDay;
    } else if (pricingModel === 'block') {
      const blocksUsed = Math.ceil(totalMinutes / (blockDurationMinutes || 60));
      totalAmount = blocksUsed * priceBlock;
    } else if (pricingModel === 'fixed_rate') {
      // Preço fixo já definido no rental.initial_cost ou usar price_fixed
      totalAmount = rental.initial_cost || priceFixed;
      
      // Se passou do tempo, calcular overage
      if (actualEndTime > endTime) {
        overageMinutes = Math.floor((actualEndTime.getTime() - endTime.getTime()) / (1000 * 60));
        const overageCost = overageMinutes * pricePerMinute;
        totalAmount += overageCost;
      }
    }

    // Garantir que o valor seja positivo
    totalAmount = Math.max(0, totalAmount);

    // Atualizar o aluguel
    const { error: updateError } = await supabase
      .from('rentals')
      .update({
        status: 'Finalizado',
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
      console.log(`Atualizando item ${rental.item_id} para status: disponível`);
      
      const { error: itemUpdateError } = await supabase
        .from('items')
        .update({ status: 'disponível' })
        .eq('id', rental.item_id);

      if (itemUpdateError) {
        console.error('❌ ERRO ao atualizar status do item:', itemUpdateError);
      } else {
        console.log(`✅ Item ${rental.item_id} atualizado para disponível`);
      }
    }

    console.log(`Rental ${rentalId} finalized. Total: R$ ${totalAmount.toFixed(2)}, Overage: ${overageMinutes} min`);

    return new Response(
      JSON.stringify({ 
        success: true,
        totalAmount,
        overageMinutes,
        actualEndTime: actualEndTime.toISOString(),
        report: {
          totalAmount,
          overageMinutes,
          actualEndTime: actualEndTime.toISOString()
        }
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