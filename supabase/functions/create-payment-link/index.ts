import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail } = await req.json();

    if (!userId || !userEmail) {
      throw new Error('userId e userEmail são obrigatórios');
    }

    // Pega a API key do AbacatePay dos secrets
    const abacatePayApiKey = Deno.env.get('ABACATEPAY_API_KEY');
    if (!abacatePayApiKey) {
      throw new Error('ABACATEPAY_API_KEY não configurada');
    }

    // Busca dados da loja do usuário
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('store_name')
      .eq('id', userId)
      .single();

    const { data: shop } = await supabase
      .from('shops')
      .select('name, document, contact_phone')
      .eq('user_id', userId)
      .single();

    if (!shop) {
      throw new Error('Loja não encontrada');
    }

    console.log('Criando link de pagamento para:', userEmail);

    // Dados de teste para dev mode (quando não fornecidos)
    const customerData = {
      email: userEmail,
      name: profile?.store_name || shop.name || 'Loja Teste',
      cellphone: shop.contact_phone || '(11) 99999-9999', // Telefone de teste
      taxId: shop.document || '123.456.789-09', // CPF de teste válido para dev mode
    };

    console.log('Dados do cliente:', customerData);

    // Cria o pedido no AbacatePay
    const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacatePayApiKey}`,
      },
      body: JSON.stringify({
        frequency: 'ONE_TIME', // Valores permitidos: ONE_TIME ou MULTIPLE_PAYMENTS
        methods: ['PIX'], // Apenas PIX para testes (suporta pagamento simulado)
        products: [
          {
            externalId: 'plano-pro',
            name: 'Aluga Bike Baixada - Plano Pro',
            description: 'Assinatura mensal do sistema de gestão de locação',
            quantity: 1,
            price: 9900, // R$ 99,00 em centavos
          }
        ],
        returnUrl: `${req.headers.get('origin')}/dashboard`,
        completionUrl: `${req.headers.get('origin')}/dashboard`,
        customer: customerData,
        metadata: {
          userId,
          planType: 'pro',
        }
      })
    });

    if (!abacateResponse.ok) {
      const errorText = await abacateResponse.text();
      console.error('Erro AbacatePay:', errorText);
      throw new Error(`Erro ao criar link de pagamento: ${errorText}`);
    }

    const abacateData = await abacateResponse.json();
    console.log('Link criado com sucesso:', abacateData.url);

    return new Response(
      JSON.stringify({ 
        paymentUrl: abacateData.url,
        billingId: abacateData.id 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
