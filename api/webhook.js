import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbpbvoqfexofyxcexmmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGJ2b3FmZXhvZnl4Y2V4bW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDc0NTMsImV4cCI6MjA3NDkyMzQ1M30.hGn7ux2xnRxseYCjiZfCLchgOEwIlIAUkdS6h7byZqc'

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to parse Pesaflux date format (YYYYMMDDHHmmss) to ISO
function parsePesafluxDate(dateString) {
  if (!dateString || dateString.length !== 14) {
    return new Date().toISOString();
  }
  
  try {
    // Format: YYYYMMDDHHmmss -> "20251031110702"
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const hour = dateString.substring(8, 10);
    const minute = dateString.substring(10, 12);
    const second = dateString.substring(12, 14);
    
    // Create ISO format: YYYY-MM-DDTHH:mm:ss.000Z
    return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
  } catch (error) {
    console.error('Error parsing date:', dateString, error);
    return new Date().toISOString();
  }
}

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
    console.log('Webhook received - Full Body:', JSON.stringify(req.body, null, 2));

    // Pesaflux webhook payload structure (from official documentation)
    const {
      ResponseCode,
      ResponseDescription,
      TransactionReference,  // This is OUR reference we sent
      TransactionReceipt,    // M-Pesa receipt number
      TransactionID,         // Pesaflux transaction ID
      TransactionAmount,
      TransactionDate,
      Msisdn
    } = req.body;

    // TransactionReference is our original reference
    if (!TransactionReference) {
      console.error('No TransactionReference in webhook. Body:', req.body);
      // Still return 200 so Pesaflux doesn't retry
      return res.status(200).json({ success: false, message: 'No TransactionReference found' });
    }
    
    console.log(`Processing webhook for reference: ${TransactionReference}, ResponseCode: ${ResponseCode}`);

    // Map ResponseCode to our status
    // ResponseCode 0 = Success, anything else = Failed
    let dbStatus = 'pending';
    if (ResponseCode === 0 || ResponseCode === '0') {
      dbStatus = 'success';
    } else {
      dbStatus = 'failed';
    }

    console.log(`Updating transaction ${TransactionReference} with status: ${dbStatus}`);

    // Parse the transaction date to ISO format
    const isoTransactionDate = parsePesafluxDate(TransactionDate);
    console.log(`Parsed date: ${TransactionDate} -> ${isoTransactionDate}`);

    // Update transaction by our reference
    const { data, error: updateError } = await supabase
      .from('transactions')
      .update({
        status: dbStatus,
        receipt_number: TransactionReceipt || null,
        transaction_date: isoTransactionDate,
        result_description: ResponseDescription || null,
        updated_at: new Date().toISOString()
      })
      .eq('reference', TransactionReference)
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
      console.log('Transaction not found in database, creating new entry');
      
      // If transaction doesn't exist, create it
      const { data: insertData, error: insertError } = await supabase
        .from('transactions')
        .insert({
          transaction_request_id: TransactionID,
          reference: TransactionReference,
          status: dbStatus,
          amount: TransactionAmount || 160,
          phone: Msisdn || null,
          receipt_number: TransactionReceipt || null,
          transaction_date: isoTransactionDate,
          result_description: ResponseDescription || null
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
