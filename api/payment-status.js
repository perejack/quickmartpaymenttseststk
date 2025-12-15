import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbpbvoqfexofyxcexmmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGJ2b3FmZXhvZnl4Y2V4bW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDc0NTMsImV4cCI6MjA3NDkyMzQ1M30.hGn7ux2xnRxseYCjiZfCLchgOEwIlIAUkdS6h7byZqc'

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

    console.log('Checking transaction status in database:', reference);

    // Query database for transaction status
    const { data: transaction, error: dbError } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_request_id', reference)
      .maybeSingle();

    if (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Error checking payment status',
        error: dbError.message || String(dbError)
      });
    }

    if (transaction) {
      console.log(`Payment status found for ${reference}:`, transaction);
      
      let paymentStatus = 'pending';
      if (transaction.status === 'success' || transaction.status === 'completed') {
        paymentStatus = 'success';
      } else if (transaction.status === 'failed' || transaction.status === 'cancelled') {
        paymentStatus = 'failed';
      }
      
      // If status is still pending, query M-Pesa via SwiftPay proxy
      if (paymentStatus === 'pending') {
        console.log(`Status is pending, querying M-Pesa via proxy for ${transaction.transaction_request_id}`);
        try {
          const proxyResponse = await queryMpesaPaymentStatus(transaction.transaction_request_id);
          console.log(`Proxy response for ${transaction.transaction_request_id}:`, proxyResponse);
          
          if (proxyResponse && proxyResponse.success === true) {
            console.log(`Proxy confirmed payment success for ${transaction.transaction_request_id}, updating database`);
            
            // Update transaction to success
            const { error: updateError } = await supabase
              .from('transactions')
              .update({ status: 'success' })
              .eq('id', transaction.id);
            
            if (!updateError) {
              paymentStatus = 'success';
              console.log(`Transaction ${transaction.transaction_request_id} updated to success`);
            } else {
              console.error('Error updating transaction:', updateError);
            }
          } else {
            console.log(`Proxy did not confirm success. Response:`, proxyResponse);
          }
        } catch (proxyError) {
          console.error('Error querying M-Pesa via proxy:', proxyError);
        }
      }
      
      // Return the status data in the format expected by frontend
      return res.status(200).json({
        success: true,
        payment: {
          status: paymentStatus,
          amount: transaction.amount,
          phoneNumber: transaction.phone,
          mpesaReceiptNumber: transaction.receipt_number,
          resultDesc: transaction.result_description,
          resultCode: transaction.result_code,
          timestamp: transaction.updated_at,
        }
      });
    } else {
      console.log(`Payment status not found for ${reference}, still pending`);
      
      return res.status(200).json({
        success: true,
        payment: {
          status: 'pending',
          message: 'Payment is still being processed'
        }
      });
    }
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
