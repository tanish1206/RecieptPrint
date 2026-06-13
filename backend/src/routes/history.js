import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../utils/supabaseClient.js';

const router = express.Router();

// Apply authentication middleware to all history routes
router.use(requireAuth);

/**
 * Route: POST /api/history
 * Desc: Saves a processed receipt and its items to Supabase
 */
router.post('/', async (req, res) => {
  try {
    const { storeName, receiptDate, totalAmount, totalEmissions, items = [] } = req.body;
    const userId = req.user.id;

    if (!storeName || !receiptDate) {
      return res.status(400).json({ error: 'Store name and receipt date are required.' });
    }

    // 1. Insert the receipt record
    const { data: receiptData, error: receiptError } = await supabase
      .from('receipts')
      .insert({
        user_id: userId,
        store_name: storeName,
        receipt_date: receiptDate,
        total_amount: parseFloat(totalAmount) || 0.0,
        total_emissions: parseFloat(totalEmissions) || 0.0
      })
      .select()
      .single();

    if (receiptError || !receiptData) {
      console.error('Error inserting receipt:', receiptError);
      throw new Error('Database insert failed.');
    }

    const receiptId = receiptData.id;

    // 2. Prepare items with receipt_id
    if (items.length > 0) {
      const itemsToInsert = items.map(item => ({
        receipt_id: receiptId,
        name: item.name || 'Unknown Item',
        quantity: parseFloat(item.quantity) || 1.0,
        unit: item.unit || 'pcs',
        price: parseFloat(item.price) || 0.0,
        category: item.category || 'misc',
        co2e: parseFloat(item.co2e) || 0.0,
        is_fallback: !!item.isFallback
      }));

      const { error: itemsError } = await supabase
        .from('receipt_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error inserting receipt items:', itemsError);
        // We might want to delete the receipt to maintain consistency if items insertion fails
        await supabase.from('receipts').delete().eq('id', receiptId);
        throw new Error('Database items insert failed.');
      }
    }

    res.status(201).json({
      message: 'Receipt saved successfully.',
      receiptId
    });

  } catch (error) {
    // Rule 5: Never expose internal error messages to client
    console.error('Failed to save receipt to history:', error);
    res.status(500).json({
      error: 'An error occurred while saving the receipt history.'
    });
  }
});

/**
 * Route: GET /api/history
 * Desc: Retrieves all receipts for the logged-in user, along with itemized details
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch receipts joined with receipt_items, ordered by receipt date descending
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select('*, items:receipt_items(*)')
      .eq('user_id', userId)
      .order('receipt_date', { ascending: false });

    if (error) {
      console.error('Error fetching receipt history:', error);
      throw new Error('Database fetch failed.');
    }

    res.status(200).json(receipts);

  } catch (error) {
    // Rule 5: Never expose internal error messages to client
    console.error('Failed to retrieve receipt history:', error);
    res.status(500).json({
      error: 'An error occurred while loading your history.'
    });
  }
});

/**
 * Route: DELETE /api/history/:id
 * Desc: Deletes a receipt and its associated items from Supabase (handled via cascade delete in DB)
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const receiptId = req.params.id;

    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', receiptId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting receipt:', error);
      throw new Error('Database delete failed.');
    }

    res.status(200).json({ message: 'Receipt deleted successfully.' });

  } catch (error) {
    console.error('Failed to delete receipt:', error);
    res.status(500).json({
      error: 'An error occurred while trying to delete the receipt.'
    });
  }
});

export default router;
