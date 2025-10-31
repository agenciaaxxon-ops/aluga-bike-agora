-- ==========================================
-- MIGRAÇÃO: Aluga Bike → Alugaí
-- Sistema Genérico de Locação Multi-Item
-- ==========================================

-- ETAPA 1: Criar tabela "item_types" (categorias de inventário)
-- ==========================================
CREATE TABLE public.item_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pricing_model TEXT NOT NULL DEFAULT 'per_minute' 
        CHECK (pricing_model IN ('per_minute', 'per_day', 'fixed_rate')),
    price_per_minute NUMERIC(10, 2) DEFAULT 0,
    price_per_day NUMERIC(10, 2) DEFAULT 0,
    price_fixed NUMERIC(10, 2) DEFAULT 0,
    icon TEXT DEFAULT 'package',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.item_types ENABLE ROW LEVEL SECURITY;

-- Política de RLS: Lojistas gerenciam seus tipos
CREATE POLICY "Lojistas gerenciam seus tipos de item" 
ON public.item_types FOR ALL 
USING (
    is_shop_owner(auth.uid(), shop_id) OR is_team_member(auth.uid(), shop_id)
)
WITH CHECK (
    is_shop_owner(auth.uid(), shop_id) OR is_team_member(auth.uid(), shop_id)
);

-- ETAPA 2: Criar tipos de item padrão para lojas existentes
-- ==========================================
INSERT INTO public.item_types (shop_id, name, pricing_model, price_per_minute, icon)
SELECT 
    id as shop_id,
    'Bicicletas' as name,
    'per_minute' as pricing_model,
    COALESCE(price_per_minute, 0.50) as price_per_minute,
    'bike' as icon
FROM public.shops;

INSERT INTO public.item_types (shop_id, name, pricing_model, price_per_minute, icon)
SELECT 
    id as shop_id,
    'Triciclos' as name,
    'per_minute' as pricing_model,
    COALESCE(price_per_minute * 1.5, 0.75) as price_per_minute,
    'package' as icon
FROM public.shops;

INSERT INTO public.item_types (shop_id, name, pricing_model, price_per_minute, icon)
SELECT 
    id as shop_id,
    'Quadriciclos' as name,
    'per_minute' as pricing_model,
    COALESCE(price_per_minute * 2, 1.00) as price_per_minute,
    'box' as icon
FROM public.shops;

-- ETAPA 3: Renomear tabela "vehicles" para "items"
-- ==========================================
ALTER TABLE public.vehicles RENAME TO items;

-- ETAPA 4: Adicionar novas colunas em "items"
-- ==========================================
ALTER TABLE public.items
ADD COLUMN item_type_id UUID REFERENCES public.item_types(id) ON DELETE SET NULL,
ADD COLUMN description TEXT,
ADD COLUMN image_url TEXT;

-- ETAPA 5: Migrar dados existentes de "vehicles" para estrutura "items"
-- ==========================================
UPDATE public.items i
SET item_type_id = (
    SELECT it.id 
    FROM public.item_types it 
    WHERE it.shop_id = i.shop_id 
    AND (
        (i.type = 'bicicleta' AND it.name = 'Bicicletas') OR
        (i.type = 'triciclo' AND it.name = 'Triciclos') OR
        (i.type = 'quadriciclo' AND it.name = 'Quadriciclos')
    )
    LIMIT 1
)
WHERE i.type IS NOT NULL;

-- ETAPA 6: Remover coluna "type" de "items" (agora redundante)
-- ==========================================
ALTER TABLE public.items DROP COLUMN IF EXISTS type;

-- ETAPA 7: Atualizar tabela "rentals"
-- ==========================================
ALTER TABLE public.rentals RENAME COLUMN vehicle_id TO item_id;
ALTER TABLE public.rentals DROP COLUMN IF EXISTS vehicle_type;

-- ETAPA 8: Recriar políticas RLS para "items"
-- ==========================================
DROP POLICY IF EXISTS "Lojistas gerenciam seus próprios veículos" ON public.items;
DROP POLICY IF EXISTS "Donos e equipe podem ver veículos" ON public.items;
DROP POLICY IF EXISTS "Donos e equipe podem adicionar veículos" ON public.items;
DROP POLICY IF EXISTS "Donos e equipe podem atualizar veículos" ON public.items;

CREATE POLICY "Lojistas gerenciam seus próprios itens" 
ON public.items FOR ALL 
USING (
    is_shop_owner(auth.uid(), shop_id) OR is_team_member(auth.uid(), shop_id)
)
WITH CHECK (
    is_shop_owner(auth.uid(), shop_id) OR is_team_member(auth.uid(), shop_id)
);

-- ETAPA 9: Adicionar trigger para updated_at em item_types
-- ==========================================
CREATE TRIGGER update_item_types_updated_at
BEFORE UPDATE ON public.item_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ETAPA 10: Criar índices para performance
-- ==========================================
CREATE INDEX idx_items_item_type_id ON public.items(item_type_id);
CREATE INDEX idx_items_shop_id ON public.items(shop_id);
CREATE INDEX idx_item_types_shop_id ON public.item_types(shop_id);
CREATE INDEX idx_rentals_item_id ON public.rentals(item_id);

-- ==========================================
-- FIM DA MIGRAÇÃO
-- ==========================================