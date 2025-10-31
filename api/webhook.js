import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbpbvoqfexofyxcexmmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGJ2b3FmZXhvZnl4Y2V4bW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDc0NTMsImV4cCI6MjA3NDkyMzQ0NTN9.hGn7ux2xnRxseYCjiZfCLchgOEwIlIAUkdS6h7byZqc'

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));

    const {
      reference,
      status,
      amount,
      phone,
      receipt_number,
      transaction_date,
      result_description,
      transaction_request_id
    } = req.body;

    if (!reference) {
      console.error('No reference provided in webhook');
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    // Map Pesaflux status to our status
    let dbStatus = 'pending';
    if (status === 'success' || status === 'SUCCESS' || status === 'completed' || status === 'COMPLETED') {
      dbStatus = 'success';
    } else if (status === 'failed' || status === 'FAILED' || status === 'cancelled' || status === 'CANCELLED') {
      dbStatus = 'failed';
    }

    console.log(`Updating transaction ${reference} with status: ${dbStatus}`);

    // Update the transaction in Supabase
    const { data, error: updateError } = await supabase
      .from('transactions')
      .update({
        status: dbStatus,
        receipt_number: receipt_number || null,
        transaction_date: transaction_date || new Date().toISOString(),
        result_description: result_description || null,
        updated_at: new Date().toISOString()
      })
      .eq('reference', reference)
      .select();

    if (updateError) {
      console.error('Database update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
        error: updateError.message
      });
    }

    if (!data || data.length === 0) {
      console.log('Transaction not found, creating new entry');
      
      // If transaction doesn't exist, create it
      const { data: insertData, error: insertError } = await supabase
        .from('transactions')
        .insert({
          transaction_request_id: transaction_request_id || null,
          reference: reference,
          status: dbStatus,
          amount: amount || 10,
          phone: phone || null,
          receipt_number: receipt_number || null,
          transaction_date: transaction_date || new Date().toISOString(),
          result_description: result_description || null
        })
        .select();

      if (insertError) {
        console.error('Database insert error:', insertError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create transaction',
          error: insertError.message
        });
      }

      console.log('Transaction created:', insertData);
    } else {
      console.log('Transaction updated:', data);
    }

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message || String(error)
    });
  }
};
