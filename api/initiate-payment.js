import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbpbvoqfexofyxcexmmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGJ2b3FmZXhvZnl4Y2V4bW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDc0NTMsImV4cCI6MjA3NDkyMzQ1M30.hGn7ux2xnRxseYCjiZfCLchgOEwIlIAUkdS6h7byZqc'

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SWIFTPAY_API_KEY = process.env.SWIFTPAY_API_KEY || 'quickmartpayment-key';
const SWIFTPAY_TILL_ID = process.env.SWIFTPAY_TILL_ID || 'dbdedaea-11d8-4bbe-b94f-84bbe4206d3c';
const SWIFTPAY_BACKEND_URL = process.env.SWIFTPAY_BACKEND_URL || 'https://swiftpay-backend-uvv9.onrender.com';

function normalizePhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  if (cleaned.length !== 12 || !/^\d+$/.test(cleaned)) {
    return null;
  }
  return cleaned;
}

export default async (req, res) => {
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
    if (!req.body) {
      console.error('Request body is missing or empty');
      return res.status(400).json({ success: false, message: 'Request body is missing or invalid' });
    }
    let { phoneNumber, userId, amount = 10, description = 'SurvayPay Account Activation' } = req.body;

    console.log('Parsed request:', { phoneNumber, userId, amount, description });

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return res.status(400).json({ 
        error: 'Invalid phone number format. Use 07XXXXXXXX or 254XXXXXXXXX' 
      });
    }

    // Generate a unique reference for this payment
    const externalReference = `QUICKMART-${Date.now()}`;

    // Prepare request to SwiftPay API
    const swiftpayPayload = {
      phone_number: normalizedPhone,
      amount: amount,
      till_id: SWIFTPAY_TILL_ID
    };

    console.log('Making API request to SwiftPay');

    const response = await fetch(`${SWIFTPAY_BACKEND_URL}/api/mpesa/stk-push-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SWIFTPAY_API_KEY}`,
      },
      body: JSON.stringify(swiftpayPayload),
    });

    const responseText = await response.text();
    console.log('SwiftPay response status:', response.status);
    console.log('SwiftPay response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse SwiftPay response:', responseText);
      return res.status(502).json({ 
        success: false,
        message: 'Invalid response from payment service' 
      });
    }

    // Check if request was successful
    if (response.ok && (data.success === true || data.status === 'success')) {
      const checkoutId = data.data?.checkout_id || data.data?.request_id || data.CheckoutRequestID || externalReference;

      // Store transaction in Supabase
      try {
        const { error: dbError } = await supabase
          .from('transactions')
          .insert({
            transaction_request_id: checkoutId,
            amount: parseFloat(amount)
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
        } else {
          console.log('Transaction stored in database:', checkoutId);
        }
      } catch (dbErr) {
        console.error('Database error:', dbErr);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          requestId: checkoutId,
          checkoutRequestId: checkoutId,
          transactionRequestId: checkoutId
        }
      });
    } else {
      console.error('SwiftPay error:', data);
      return res.status(400).json({
        success: false,
        message: data.message || 'Payment initiation failed',
        details: data,
      });
    }
  } catch (error) {
    console.error('Global error in initiate-payment:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected server error occurred',
      error: error.message || String(error)
    });
  }
};
