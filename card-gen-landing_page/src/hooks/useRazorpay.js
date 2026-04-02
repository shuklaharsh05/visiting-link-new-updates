import { useState, useCallback, useEffect } from 'react';
import { apiService } from '../lib/api.js';

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

// Load Razorpay script dynamically
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load script on mount
  useEffect(() => {
    loadRazorpayScript()
      .then(() => setScriptLoaded(true))
      .catch((err) => {
        console.error('Razorpay script load error:', err);
        setError('Failed to load payment gateway');
      });
  }, []);

  const initiatePayment = useCallback(
    async ({ inquiryId, amount, customerName, customerEmail, customerPhone, onSuccess, onFailure }) => {
      setLoading(true);
      setError(null);

      try {
        // Ensure script is loaded
        if (!scriptLoaded) {
          await loadRazorpayScript();
          setScriptLoaded(true);
        }

        // Step 1: Create order
        const orderResponse = await apiService.createPaymentOrder(inquiryId, amount);

        if (!orderResponse.success) {
          throw new Error(orderResponse.error || 'Failed to create payment order');
        }

        const { orderId, key, amount: orderAmount } = orderResponse.data;

        // Step 2: Open Razorpay checkout
        const options = {
          key,
          amount: orderAmount * 100, // Amount in paise
          currency: 'INR',
          name: 'Visiting Links',
          description: 'Business Card Payment',
          order_id: orderId,
          handler: async function (response) {
            // Step 3: Verify payment
            try {
              const verifyResponse = await apiService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyResponse.success) {
                onSuccess?.(verifyResponse.data);
              } else {
                throw new Error(verifyResponse.error || 'Payment verification failed');
              }
            } catch (verifyError) {
              console.error('Payment verification error:', verifyError);
              onFailure?.(verifyError.message || 'Payment verification failed');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: customerName || '',
            email: customerEmail || '',
            contact: customerPhone || '',
          },
          theme: {
            color: '#2563eb',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              onFailure?.('Payment cancelled');
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
          setLoading(false);
          onFailure?.(response.error?.description || 'Payment failed');
        });
        razorpay.open();
      } catch (err) {
        console.error('Payment initiation error:', err);
        setError(err.message || 'Failed to initiate payment');
        setLoading(false);
        onFailure?.(err.message || 'Failed to initiate payment');
      }
    },
    [scriptLoaded]
  );

  return {
    initiatePayment,
    loading,
    error,
    scriptLoaded,
  };
}

