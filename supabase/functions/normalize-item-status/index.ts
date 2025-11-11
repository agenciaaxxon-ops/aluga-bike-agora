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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Normalizando status dos itens para minúsculo...');

    const normalize = async (from: string, to: string) => {
      const { data, error } = await supabase
        .from('items')
        .update({ status: to })
        .eq('status', from)
        .select('*');

      if (error) {
        console.error(`Erro ao normalizar de "${from}" para "${to}":`, error);
        return { from, to, updated: 0, error: error.message };
      }
      const updated = data?.length ?? 0;
      console.log(`Atualizados ${updated} registros de "${from}" para "${to}"`);
      return { from, to, updated };
    };

    const results = await Promise.all([
      normalize('Disponível', 'disponível'),
      normalize('Alugado', 'alugado'),
      normalize('Em manutenção', 'em manutenção'),
    ]);

    const totalUpdated = results.reduce((acc, r) => acc + (r.updated || 0), 0);

    console.log(`Normalização concluída. Total de registros atualizados: ${totalUpdated}`);

    return new Response(
      JSON.stringify({ success: true, totalUpdated, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro na função normalize-item-status:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
