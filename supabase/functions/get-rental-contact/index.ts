import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { access_code } = await req.json();

    console.log('[get-rental-contact] request', { access_code });

    if (!access_code || typeof access_code !== 'string' || access_code.length < 10) {
      return new Response(
        JSON.stringify({ error: 'access_code inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRole);

    const { data, error } = await supabase
      .from('rentals')
      .select('status, shop_id')
      .eq('access_code', access_code)
      .maybeSingle();

    if (error) {
      console.error('[get-rental-contact] query error', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao consultar aluguel' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!data || data.status !== 'Ativo') {
      return new Response(
        JSON.stringify({ error: 'Aluguel não encontrado ou inativo' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let contact_phone: string | null = null;
    let name: string | null = null;

    if (data.shop_id) {
      const { data: shopRow, error: shopErr } = await supabase
        .from('shops')
        .select('name, contact_phone')
        .eq('id', data.shop_id)
        .maybeSingle();
      if (shopErr) {
        console.error('[get-rental-contact] shop query error', shopErr);
      }
      if (shopRow) {
        contact_phone = shopRow.contact_phone ?? null;
        name = shopRow.name ?? null;
      }
    }

    return new Response(
      JSON.stringify({ contact_phone, name }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[get-rental-contact] unexpected error', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
