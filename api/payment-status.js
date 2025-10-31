import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbpbvoqfexofyxcexmmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGJ2b3FmZXhvZnl4Y2V4bW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDc0NTMsImV4cCI6MjA3NDkyMzQ0NTN9.hGn7ux2xnRxseYCjiZfCLchgOEwIlIAUkdS6h7byZqc'

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    console.log('Checking status for reference:', reference);

    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .select('*')
      .eq('reference', reference)
      .maybeSingle();

    if (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Error checking payment status',
        error: dbError.message || String(dbError)
      });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    let paymentStatus = 'PENDING';
    if (transaction.status === 'success') {
      paymentStatus = 'SUCCESS';
    } else if (transaction.status === 'failed') {
      paymentStatus = 'FAILED';
    } else if (transaction.status === 'cancelled') {
      paymentStatus = 'FAILED';
    }

    return res.status(200).json({
      success: true,
      payment: {
        status: paymentStatus,
        amount: transaction.amount,
        phoneNumber: transaction.phone,
        reference: transaction.reference,
        mpesaReceiptNumber: transaction.receipt_number,
        transactionDate: transaction.transaction_date,
        resultDescription: transaction.result_description
      }
    });
  } catch (error) {
    console.error('Payment status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
      error: error.message || String(error)
    });
  }
};
