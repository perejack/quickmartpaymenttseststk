import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbpbvoqfexofyxcexmmp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRicGJ2b3FmZXhvZnl4Y2V4bW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDc0NTMsImV4cCI6MjA3NDkyMzQ0NTN9.hGn7ux2xnRxseYCjiZfCLchgOEwIlIAUkdS6h7byZqc'

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    const { phoneNumber, userId, amount = 10, description = 'SurvayPay Account Activation' } = req.body;

    console.log('Parsed request:', { phoneNumber, userId, amount, description });

    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const API_KEY = 'PSFXyLBOrRV9';
    const EMAIL = 'frankyfreaky103@gmail.com';

    if (!API_KEY || !EMAIL) {
      console.error('PesaFlux API keys are not set');
      return res.status(500).json({ success: false, message: 'Server configuration error: PesaFlux API keys are missing.' });
    }

    const externalReference = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const pesafluxPayload = {
      api_key: API_KEY,
      email: EMAIL,
      amount: amount.toString(),
      msisdn: phoneNumber,
      reference: externalReference,
    };

    console.log('Making API request to PesaFlux');

    const response = await fetch('https://api.pesaflux.co.ke/v1/initiatestk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(pesafluxPayload),
    });

    const responseText = await response.text();
    console.log('PesaFlux response:', responseText);

    let data;
    try {
      const jsonStartIndex = responseText.indexOf('{');
      const cleanedResponseText = jsonStartIndex !== -1 ? responseText.substring(jsonStartIndex) : responseText;
      data = JSON.parse(cleanedResponseText);
    } catch (e) {
      console.error('Failed to parse PesaFlux response:', responseText);
      return res.status(502).json({
        success: false,
        message: 'Invalid response from payment service'
      });
    }

    if (data.success === '200' || data.success === 200) {
      try {
        const { error: dbError } = await supabase
          .from('transactions')
          .insert({
            transaction_request_id: data.transaction_request_id,
            status: 'pending',
            amount: amount,
            phone: phoneNumber,
            email: EMAIL,
            reference: externalReference,
          });

        if (dbError) {
          console.error('Database insert error:', dbError);
        } else {
          console.log('Transaction stored in database:', data.transaction_request_id);
        }
      } catch (dbErr) {
        console.error('Database error:', dbErr);
      }

      return res.status(200).json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          externalReference,
          checkoutRequestId: data.transaction_request_id,
          transactionRequestId: data.transaction_request_id
        }
      });
    } else {
      console.error('PesaFlux error:', data);
      return res.status(400).json({
        success: false,
        message: data.massage || data.message || 'Payment initiation failed',
        error: data
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
