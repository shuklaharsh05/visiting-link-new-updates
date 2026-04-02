"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useRazorpay } from "../hooks/useRazorpay.js";
import { useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function PricingClient() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success' | 'error' | null
  const [paymentMessage, setPaymentMessage] = useState("");

  const { user } = useAuth();
  const {
    initiatePayment,
    loading: paymentLoading,
    error: paymentError,
  } = useRazorpay();
  const navigate = useNavigate();

  const cardPlans = [
    {
      name: "Card Lite",
      price: 899,
      description: "For most businesses that want to optimize web queries.",
      features: [
        "Digital visiting profile",
        "Name, photo, designation",
        "Call, WhatsApp, Email buttons",
        "Google Map location",
        "Multi-link buttons",
        "(Website, Social Media, Review link, etc.)",
        "Auto-generated clean layout",
        "QR code + Link",
        "PVC Physical Visiting link card",
      ],
      idealFor: "Individuals, shop owners quick online presence",
    },
    {
      name: "Card Pro",
      price: 1299,
      description: "For most businesses that want to optimize web queries.",
      features: [
        "All Business Profile ( Vision+ Mission )",
        "Professionally designed profile",
        "Brand UI & color theme",
        "Icon-based multi-link section",
        "About business section",
        "Services / products list",
        "Clean, business-ready link",
        "More trust + better presentation",
        "All Link Lite Features As well",
        "PVC Physical Visiting link card",
      ],
      idealFor: "Professionals, small businesses, service providers",
    },
  ];

  const webPlans = [
    {
      name: "Web Lite",
      price: 2499,
      description: "For most businesses that want to optimize web queries.",
      features: [
        "Digital visiting profile",
        "Name, photo, designation",
        "Call, WhatsApp, Email buttons",
        "Google Map location",
        "Multi-link buttons",
        "(Website, Social Media, Review link, etc.)",
        "Auto-generated clean layout",
        "QR code + Link",
        "PVC Physical Visiting link card",
        "All Business Profile ( Vision+ Mission )",
        "Professionally designed profile",
      ],
      idealFor: "Individuals, shop owners quick online presence",
    },
    {
      name: "Web Pro",
      price: 3499,
      description: "For most businesses that want to optimize web queries.",
      features: [
        " Custom-built website, 100% unique",
        " Tailored brand style and colors",
        " Clean modern layout with icons",
        " About, Services, and Contact sections",
        " Mobile-friendly and fast loading",
        " Business-ready professional look",
        " Boosts trust and online presence",
        " Optional PVC physical link card",
        " one year AMC ",
        " 24*7 Chat Support",
      ],
      idealFor: "Professionals, small businesses, service providers",
    },
  ];

  const getPrice = (plan) => {
    return billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;
  };

  const handlePlanSelect = async (plan) => {
    // If user is not logged in, redirect to login
    if (!user) {
      navigate("/login", {
        state: { from: "/pricing", selectedPlan: plan.name },
      });
      return;
    }

    // Check if user has an inquiry ID (required for payment)
    // For now, we'll use a placeholder. In production, you'd get this from user's active inquiry
    const inquiryId = user.inquiries?.[0]?._id || user.inquiries?.[0];

    if (!inquiryId) {
      setPaymentStatus("error");
      setPaymentMessage(
        "Please create a business card inquiry first before purchasing a plan."
      );
      return;
    }

    setSelectedPlan(plan.name);
    setPaymentStatus(null);
    setPaymentMessage("");

    const amount = getPrice(plan);

    initiatePayment({
      inquiryId,
      amount,
      customerName: user.name || "",
      customerEmail: user.email || "",
      customerPhone: user.phone || "",
      onSuccess: (data) => {
        setPaymentStatus("success");
        setPaymentMessage(
          `Payment successful! Your ${plan.name} plan is now active.`
        );
        setSelectedPlan(null);
        // Optionally redirect or refresh user data
        // navigate('/dashboard');
      },
      onFailure: (errorMessage) => {
        setPaymentStatus("error");
        setPaymentMessage(errorMessage || "Payment failed. Please try again.");
        setSelectedPlan(null);
      },
    });
  };

  return (
    <div className="bg-[#F1F5FF]">
      <div>
        <img src="/Pricing/banner.png" alt="Card Plans" />
      </div>

      <h1 className="text-center text-2xl md:text-4xl lg:text-6xl font-bold">
        All Information in One link, One Click{" "}
      </h1>
      <p className="text-center text-sm md:text-base lg:text-lg">
        Digital Business card link{" "}
      </p>

      <div className="flex items-center justify-center">
        <div className="flex items-center justify-center">
          <img src="/Pricing/24-hour.png" alt="Card Lite" />
          <h2>24*7 Chat Support</h2>
        </div>
        <div className="flex items-center justify-center">
          <img src="/Pricing/cart.png" alt="Card Lite" />
          <h2>One Time Purchase </h2>
        </div>
        <div className="flex items-center justify-center">
          <img src="/Pricing/refund.png" alt="Card Lite" />
          <h2>30 Days Design Back Guaranty </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 max-w-5xl mx-auto mb-10 lg:mt-12 lg:mb-20">
        {cardPlans.map((plan) => (
          <div>
            <div
              key={plan.name}
              className="h-full bg-white border border-gray-100 rounded-3xl p-4"
            >
              <div className="flex items-center justify-between w-full mb-4">
                <h2 className="text-2xl lg:text-3xl font-bold">{plan.name}</h2>
                <div className="flex flex-col items-center justify-center">
                  <img
                    src="/Pricing/view.png"
                    alt="View Sample"
                    className="w-10 h-10"
                  />
                  <p className="text-[10px]">View Sample</p>
                </div>
              </div>
              <div className="space-y-2 w-full">
                {plan.features.map((feature) => (
                  <p
                    key={feature}
                    className="flex items-center justify-start gap-2"
                  >
                    {" "}
                    <img
                      src="/Pricing/check.png"
                      alt="Check"
                      className="w-5 h-5"
                    />{" "}
                    {feature}
                  </p>
                ))}
              </div>
              <button
                className="flex items-center justify-center bg-black text-white rounded-2xl p-2 w-full mt-4 lg:mt-8"
                onClick={() => handlePlanSelect(plan)}
              >
                <p>Rs. {plan.price}/-</p>
              </button>
            </div>
            <div className="flex items-center justify-center">
              <p className="text-base lg:text-lg font-bold">Ideal For: </p>
              <p className="text-sm lg:text-base">{plan.idealFor}</p>
            </div>
          </div>
        ))}
      </div>

        <p className="text-center text-sm md:text-base lg:text-lg font-bold">Web Version </p>
      <h2 className="text-center text-2xl lg:text-3xl font-bold">Visiting Link website Profile </h2>
      <p className="text-center text-sm md:text-base lg:text-lg">
      Your Professional Business Profile That impress People 
      </p>

      <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 max-w-5xl mx-auto mb-10 lg:mt-12 lg:mb-20">
        {webPlans.map((plan) => (
          <div>
            <div
              key={plan.name}
              className="h-full bg-white border border-gray-100 rounded-3xl p-4"
            >
              <div className="flex items-center justify-between w-full mb-4">
                <h2 className="text-2xl lg:text-3xl font-bold">{plan.name}</h2>
                <div className="flex flex-col items-center justify-center">
                  <img
                    src="/Pricing/view.png"
                    alt="View Sample"
                    className="w-10 h-10"
                  />
                  <p className="text-[10px]">View Sample</p>
                </div>
              </div>
              <div className="space-y-2 w-full">
                {plan.features.map((feature) => (
                  <p
                    key={feature}
                    className="flex items-center justify-start gap-2"
                  >
                    {" "}
                    <img
                      src="/Pricing/check.png"
                      alt="Check"
                      className="w-5 h-5"
                    />{" "}
                    {feature}
                  </p>
                ))}
              </div>
              <button
                className="flex items-center justify-center bg-black text-white rounded-2xl p-2 w-full mt-4 lg:mt-8"
                onClick={() => handlePlanSelect(plan)}
              >
                <p>Rs. {plan.price}/-</p>
              </button>
            </div>
            <div className="flex items-center justify-center">
              <p className="text-base lg:text-lg font-bold">Ideal For: </p>
              <p className="text-sm lg:text-base">{plan.idealFor}</p>
            </div>
          </div>
        ))}
      </div>

      <img src="/Pricing/botton-banner.png" alt="Web Banner" className="w-full" />
      <div className="bg-[#A378ED] p-4 rounded-3xl text-white flex items-center justify-between mb-24 lg:mb-40">
        <div className="max-w-xl">
          <h2 className="text-2xl lg:text-4xl font-bold">No i want Custom Website Design only</h2>
          <p className="text-base lg:text-xl mt-4">By our Visiting link Certified Developers.</p>
        </div>
        <img src="/Pricing/fireworks.svg" alt="Developer" className="w-full h-full max-w-96" />
        <div className="max-w-xl">
          <p className="text-base lg:text-xl">We do custom designs, creating unique pieces tailored to your vision, style, and needs, bringing your ideas into reality beautifully</p>
          <button className="bg-white text-black rounded-2xl p-2 w-full mt-4 lg:mt-8">Contact Us</button>
        </div>

      </div>
      </div>
    </div>
  );
}
