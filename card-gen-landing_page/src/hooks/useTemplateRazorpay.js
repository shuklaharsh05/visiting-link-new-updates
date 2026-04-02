import { useCallback, useEffect, useState } from "react";
import { apiService } from "../lib/api.js";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export function useTemplateRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    loadRazorpayScript()
      .then(() => setScriptLoaded(true))
      .catch((err) => {
        console.error("Razorpay script load error:", err);
        setError("Failed to load payment gateway");
      });
  }, []);

  const initiateTemplatePayment = useCallback(
    async ({
      categoryId,
      templateId,
      templateName,
      customerName,
      customerEmail,
      customerPhone,
      onSuccess,
      onFailure,
    }) => {
      setLoading(true);
      setError(null);

      try {
        if (!scriptLoaded) {
          await loadRazorpayScript();
          setScriptLoaded(true);
        }

        const orderResponse = await apiService.createTemplateOrder({
          categoryId,
          templateId,
        });

        if (!orderResponse.success) {
          throw new Error(orderResponse.error || "Failed to create payment order");
        }

        // Free template path
        const free = orderResponse.free || orderResponse.data?.free;
        if (free) {
          onSuccess?.({ free: true });
          setLoading(false);
          return;
        }

        const data = orderResponse.data || orderResponse;
        const { orderId, key, amount } = data;

        const options = {
          key,
          amount: amount * 100,
          currency: "INR",
          name: "VisitingLink",
          description: `Template: ${templateName || templateId}`,
          order_id: orderId,
          handler: async function (response) {
            try {
              const verifyResponse = await apiService.verifyTemplatePayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyResponse.success) {
                onSuccess?.(verifyResponse.data || verifyResponse);
              } else {
                throw new Error(verifyResponse.error || "Payment verification failed");
              }
            } catch (verifyError) {
              console.error("Template payment verification error:", verifyError);
              onFailure?.(verifyError.message || "Payment verification failed");
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: customerName || "",
            email: customerEmail || "",
            contact: customerPhone || "",
          },
          theme: { color: "#0f172a" },
          modal: {
            ondismiss: function () {
              setLoading(false);
              onFailure?.("Payment cancelled");
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", function (response) {
          setLoading(false);
          onFailure?.(response.error?.description || "Payment failed");
        });
        razorpay.open();
      } catch (err) {
        console.error("Template payment initiation error:", err);
        setError(err.message || "Failed to initiate payment");
        setLoading(false);
        onFailure?.(err.message || "Failed to initiate payment");
      }
    },
    [scriptLoaded]
  );

  return { initiateTemplatePayment, loading, error, scriptLoaded };
}

