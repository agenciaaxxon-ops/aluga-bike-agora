import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('userId é obrigatório');
    }

    console.log('Verificação manual de pagamento para userId:', userId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Busca o perfil atual
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('Perfil não encontrado');
    }

    // Se já está ativo, retorna sucesso
    if (profile.subscription_status === 'active') {
      console.log('✅ Assinatura já está ativa');
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'active',
          message: 'Assinatura já está ativa' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Busca o email do usuário
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authData.user) {
      throw new Error('Erro ao buscar dados do usuário');
    }

    const userEmail = authData.user.email;
    console.log('Verificando pagamentos para email:', userEmail);

    // Busca billings no AbacatePay
    const isDev = req.headers.get('origin')?.includes('lovable.app');
    const abacatePayApiKey = isDev 
      ? Deno.env.get('ABACATEPAY_API_KEY_TEST')
      : Deno.env.get('ABACATEPAY_API_KEY');

    if (!abacatePayApiKey) {
      throw new Error('ABACATEPAY_API_KEY não configurada');
    }

    // Lista billings recentes (últimos 30 dias)
    const listResponse = await fetch(
      'https://api.abacatepay.com/v1/billing/list?limit=50',
      {
        headers: {
          'Authorization': `Bearer ${abacatePayApiKey}`,
        }
      }
    );

    if (!listResponse.ok) {
      throw new Error('Erro ao consultar billings no AbacatePay');
    }

    const listData = await listResponse.json();
    const billings = listData.data || [];

    console.log(`Encontrados ${billings.length} billings`);

    // Procura por billing PAID para este email
    const paidBilling = billings.find((billing: any) => {
      const billingEmail = billing.customer?.metadata?.email || billing.customer?.email;
      const status = billing.status;
      return billingEmail === userEmail && status === 'PAID';
    });

    if (paidBilling) {
      console.log('✅ Pagamento confirmado encontrado! Ativando assinatura...');
      
      // Atualiza o status para active
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao atualizar status:', updateError);
        throw updateError;
      }

      console.log('✅ Assinatura ativada com sucesso!');

      return new Response(
        JSON.stringify({ 
          success: true, 
          status: 'active',
          message: 'Pagamento confirmado! Assinatura ativada.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    } else {
      console.log('⏳ Nenhum pagamento confirmado encontrado ainda');
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: profile.subscription_status,
          message: 'Aguardando confirmação do pagamento' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

  } catch (error) {
    console.error('Erro na verificação:', error);
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