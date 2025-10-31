import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Utilitários
const onlyDigits = (str: string) => str.replace(/\D/g, '');

const isValidCPF = (cpf: string): boolean => {
  const cleaned = onlyDigits(cpf);
  
  // Deve ter 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Rejeita sequências repetidas conhecidas e CPFs blacklistados
  const blacklist = ['00000000000', '11111111111', '22222222222', '33333333333', 
                     '44444444444', '55555555555', '66666666666', '77777777777', 
                     '88888888888', '99999999999', '12345678909', '12345678900'];
  if (blacklist.includes(cleaned)) return false;
  
  // Valida dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, userEmail, mode = 'prod' } = await req.json();

    if (!userId || !userEmail) {
      throw new Error('userId e userEmail são obrigatórios');
    }

    // Seleciona a API key do AbacatePay baseado no modo
    const abacatePayApiKey = mode === 'test' 
      ? Deno.env.get('ABACATEPAY_API_KEY_TEST')
      : Deno.env.get('ABACATEPAY_API_KEY');
    
    if (!abacatePayApiKey) {
      throw new Error(`ABACATEPAY_API_KEY${mode === 'test' ? '_TEST' : ''} não configurada`);
    }
    
    console.log(`Modo de pagamento: ${mode}`);

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

    // Sanitiza e valida taxId (CPF/CNPJ)
    const rawTaxId = shop.document || '';
    const sanitizedTaxId = onlyDigits(rawTaxId);
    let taxId = sanitizedTaxId;
    let usedFallback = false;
    
    if (!isValidCPF(sanitizedTaxId)) {
      console.log('CPF inválido ou não fornecido, usando fallback');
      taxId = '52998224725'; // CPF válido para testes
      usedFallback = true;
    }

    // Sanitiza telefone
    const rawPhone = shop.contact_phone || '';
    const cellphone = onlyDigits(rawPhone) || '11999999999';

    const customerData = {
      email: userEmail,
      name: profile?.store_name || shop.name || 'Loja Teste',
      cellphone,
      taxId,
      metadata: {
        userId,
      }
    };

    console.log('Dados do cliente:', { 
      email: customerData.email, 
      name: customerData.name,
      cellphone: customerData.cellphone,
      taxId: `${taxId.substring(0, 3)}****${taxId.substring(taxId.length - 3)}`,
      usedFallback 
    });

    // Primeiro, cria o cliente no AbacatePay
    const customerResponse = await fetch('https://api.abacatepay.com/v1/customer/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacatePayApiKey}`,
      },
      body: JSON.stringify(customerData)
    });

    if (!customerResponse.ok) {
      const errorText = await customerResponse.text();
      console.error('Erro ao criar cliente no AbacatePay:', errorText);
      throw new Error(`Erro ao criar cliente: ${errorText}`);
    }

    const customerResult = await customerResponse.json();
    const customerId = customerResult.data?.id || customerResult.id;
    console.log('Cliente criado com ID:', customerId);

    // Agora cria a cobrança usando o customerId
    const abacateResponse = await fetch('https://api.abacatepay.com/v1/billing/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${abacatePayApiKey}`,
      },
      body: JSON.stringify({
        frequency: 'ONE_TIME',
        methods: ['PIX'],
        products: [
          {
            externalId: 'plano-pro',
            name: 'Aluga Bike Baixada - Plano Pro',
            description: 'Assinatura mensal do sistema de gestão de locação',
            quantity: 1,
            price: 9900,
          }
        ],
        returnUrl: `${req.headers.get('origin')}/planos?from_payment=true`,
        completionUrl: `${req.headers.get('origin')}/planos?from_payment=true`,
        customerId,
        allowCoupons: true,
        metadata: {
          userId,
          email: userEmail,
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
    console.log('Resposta completa do AbacatePay:', JSON.stringify(abacateData, null, 2));

    // Extrai URL de várias possíveis estruturas de resposta
    const paymentUrl = abacateData.data?.url || abacateData.url || abacateData.checkoutUrl;
    const billingId = abacateData.id || abacateData.data?.id;
    const devMode = abacateData.data?.devMode || abacateData.devMode || false;

    if (!paymentUrl) {
      console.error('URL de pagamento não encontrada na resposta:', JSON.stringify(abacateData));
      throw new Error('URL de pagamento não foi gerada pela API');
    }

    console.log('Link criado com sucesso:', paymentUrl);
    console.log('Modo dev AbacatePay:', devMode);
    console.log('Billing ID:', billingId);

    return new Response(
      JSON.stringify({ 
        paymentUrl,
        billingId,
        devMode
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
