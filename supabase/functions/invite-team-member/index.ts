import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  email: string;
  shop_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Create regular Supabase client for user verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Erro ao obter usuário:', userError);
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { email, shop_id }: InviteRequest = await req.json();

    if (!email || !shop_id) {
      throw new Error('Email e shop_id são obrigatórios');
    }

    console.log(`Processando convite de ${user.id} para ${email} na loja ${shop_id}`);

    // Verify if user is shop owner
    const { data: shop, error: shopError } = await supabaseClient
      .from('shops')
      .select('id, user_id')
      .eq('id', shop_id)
      .eq('user_id', user.id)
      .single();

    if (shopError || !shop) {
      console.error('Usuário não é dono da loja:', shopError);
      return new Response(
        JSON.stringify({ error: 'Apenas o dono da loja pode convidar membros' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user with this email already exists in the team
    const { data: existingMember } = await supabaseClient
      .from('team_members')
      .select('id, invited_email')
      .eq('shop_id', shop_id)
      .or(`invited_email.eq.${email}`)
      .maybeSingle();

    if (existingMember) {
      return new Response(
        JSON.stringify({ error: 'Este email já foi convidado para a equipe' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send invite using service role
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          shop_id: shop_id,
          role: 'funcionario'
        },
        redirectTo: `${req.headers.get('origin') || 'https://preview--aluga-bike-agora.lovable.app'}/dashboard`
      }
    );

    if (inviteError) {
      console.error('Erro ao enviar convite:', inviteError);
      throw inviteError;
    }

    console.log('Convite enviado com sucesso:', inviteData);

    // Create pending entry in team_members
    const { error: insertError } = await supabaseClient
      .from('team_members')
      .insert({
        shop_id: shop_id,
        invited_email: email,
        role: 'funcionario',
        invited_by: user.id,
        user_id: null // Will be filled when user confirms email
      });

    if (insertError) {
      console.error('Erro ao criar registro de convite:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Convite enviado para ${email}`,
        data: inviteData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Erro na função invite-team-member:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao processar convite' }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});