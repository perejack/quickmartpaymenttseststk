import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbpbvoqfexofyxcexmmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGJ2b3FmZXhvZnl4Y2V4bW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDc0NTMsImV4cCI6MjA3NDkyMzQ1M30.hGn7ux2xnRxseYCjiZfCLchgOEwIlIAUkdS6h7byZqc'

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test endpoint to manually update transaction status
export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { reference, status } = req.body;

    if (!reference || !status) {
      return res.status(400).json({
        success: false,
        message: 'Reference and status are required'
      });
    }

    console.log(`Test webhook: Updating ${reference} to ${status}`);

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('reference', reference)
      .select();

    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction updated',
      data: data[0]
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
