import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autorização necessária');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    console.log('Buscando faturas para o usuário:', user.id, user.email);

    // Busca todas as cobranças do AbacatePay
    const abacateApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!abacateApiKey) {
      throw new Error('API key do AbacatePay não configurada');
    }

    const response = await fetch('https://api.abacatepay.com/v1/billing/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${abacateApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API AbacatePay:', response.status, errorText);
      throw new Error(`Erro ao buscar faturas: ${response.status}`);
    }

    const allBillings = await response.json();
    console.log('Total de billings retornados:', allBillings.length);

    // Filtra apenas as cobranças do usuário atual (por email)
    const userBillings = allBillings.filter((billing: any) => {
      const customerEmail = billing.customer?.metadata?.email;
      return customerEmail === user.email;
    });

    console.log('Billings do usuário:', userBillings.length);

    // Ordena por data de criação (mais recente primeiro)
    userBillings.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return new Response(
      JSON.stringify({ billings: userBillings }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao listar faturas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage, billings: [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
