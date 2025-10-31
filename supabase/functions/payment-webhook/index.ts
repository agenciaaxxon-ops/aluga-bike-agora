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
    const expectedSecret = Deno.env.get('ABACATEPAY_WEBHOOK_SECRET');
    
    // Valida o webhook secret via cabeçalho (produção) ou query string (testes)
    const webhookSecretHeader = req.headers.get('x-webhook-secret') || req.headers.get('X-Webhook-Secret');
    const url = new URL(req.url);
    const webhookSecretQuery = url.searchParams.get('secret');
    
    const isValidSecret = webhookSecretHeader === expectedSecret || webhookSecretQuery === expectedSecret;
    
    if (!isValidSecret) {
      console.error('Webhook secret inválido', { 
        hasHeader: !!webhookSecretHeader,
        hasQuery: !!webhookSecretQuery,
        origin: req.headers.get('origin') || 'unknown',
        method: req.method
      });
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('Webhook autenticado via:', webhookSecretHeader ? 'header' : 'query string');
    
    const payload = await req.json();
    console.log('Webhook recebido:', {
      status: payload.status,
      billingId: payload.id || payload.data?.id,
      metadata: payload.metadata,
      devMode: payload.devMode || payload.data?.devMode
    });

    // Verifica se é uma notificação de pagamento bem-sucedido
    if (payload.status === 'PAID' || payload.status === 'APPROVED') {
      const userId = payload.metadata?.userId;
      
      if (!userId) {
        console.error('userId não encontrado no metadata');
        throw new Error('userId não encontrado no webhook');
      }

      // Atualiza o status da assinatura para active
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', userId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
      }

      console.log(`Status de assinatura atualizado para active - userId: ${userId}`);

      return new Response(
        JSON.stringify({ success: true, message: 'Assinatura ativada' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Se não for um status de pagamento confirmado, retorna sucesso mas não faz nada
    console.log('Status não processado:', payload.status);
    return new Response(
      JSON.stringify({ success: true, message: 'Webhook recebido' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro no webhook:', error);
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
