-- SQL Schema setup for Supabase Database
-- Run this in the Supabase SQL Editor to set up your tables.

-- Create Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    store_name TEXT NOT NULL,
    receipt_date DATE NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_emissions NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Receipt Items Table
CREATE TABLE IF NOT EXISTS public.receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID REFERENCES public.receipts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    unit TEXT NOT NULL DEFAULT 'pcs',
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    category TEXT NOT NULL DEFAULT 'misc',
    co2e NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_fallback BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) on both tables
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only access their own receipts
CREATE POLICY "Users can insert their own receipts" 
ON public.receipts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own receipts" 
ON public.receipts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own receipts" 
ON public.receipts FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for items
CREATE POLICY "Users can insert items for their own receipts" 
ON public.receipt_items FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.receipts 
        WHERE receipts.id = receipt_items.receipt_id 
        AND receipts.user_id = auth.uid()
    )
);

CREATE POLICY "Users can view items for their own receipts" 
ON public.receipt_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.receipts 
        WHERE receipts.id = receipt_items.receipt_id 
        AND receipts.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete items for their own receipts" 
ON public.receipt_items FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.receipts 
        WHERE receipts.id = receipt_items.receipt_id 
        AND receipts.user_id = auth.uid()
    )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS receipts_user_id_idx ON public.receipts(user_id);
CREATE INDEX IF NOT EXISTS receipt_items_receipt_id_idx ON public.receipt_items(receipt_id);
