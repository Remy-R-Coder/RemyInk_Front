"use client"

import React, { useState } from "react";
import httpClient from "../../api/httpClient";
import { CreditCard, ShieldCheck, Loader2 } from "lucide-react"; 

const CheckoutForm = ({ jobId, amountUSD }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCardPayment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // 1. Initiate session - matches your urls.py exactly
      const res = await httpClient.post("/payd/initiate/", {
        job_id: jobId,
      });

      // 2. IMPORTANT: Use 'checkout_url' to match your Django Response
      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else {
        throw new Error("Could not generate payment link.");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      // Try to get the specific error from Django (e.g., "Job not found")
      const errMsg = err.response?.data?.error || "Unable to connect to the payment gateway.";
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-checkout-container">
      <div className="payment-card shadow-lg border rounded-xl p-8 bg-white max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Secure Checkout</h2>
        <p className="text-gray-500 mb-6 text-sm">
          You are paying for Job #{jobId}
        </p>

        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-6">
          <span className="text-gray-600">Total Amount:</span>
          <span className="text-2xl font-bold text-blue-600">${amountUSD}</span>
        </div>

        <button
          onClick={handleCardPayment}
          disabled={isLoading}
          className="w-full bg-black text-white py-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <CreditCard size={20} />
              Pay with Card
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck size={14} />
          <span>Secured by Payd. Encrypted Card Processing.</span>
        </div>

        {error && (
          <p className="mt-4 text-red-500 text-center text-sm bg-red-50 p-2 rounded border border-red-100">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default CheckoutForm;