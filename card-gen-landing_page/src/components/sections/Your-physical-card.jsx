"use client";
import React, { useRef, memo } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
function YourPhysicalCard() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const navigate = useNavigate();
  const phoneVariant = {
    hidden: { opacity: 0, x: -150 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 1, type: "spring", stiffness: 60 },
    },
  };

  const cardsVariant = {
    hidden: { opacity: 0, x: 150 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 1, type: "spring", stiffness: 60, delay: 0.2 },
    },
  };

  const featureCards = [
    {
      title: "One Card",
      desc: "Select your preferred card type to order and enjoy the benefits of an NFC-enabled card.",
    },
    {
      title: "Easy Share",
      desc: "Select your preferred card type to order and enjoy the benefits of an NFC-enabled card.",
    },
    {
      title: "All Link in one",
      desc: "Select your preferred card type to order and enjoy the benefits of an NFC-enabled card.",
    },
    {
      title: "Custom Profile",
      desc: "Select your preferred card type to order and enjoy the benefits of an NFC-enabled card.",
    },
  ];

  return (
    <section className="w-full pt-16 bg-white overflow-hidden">
      {/* Heading */}
      <h1 className="text-center font-bold text-2xl md:text-3xl lg:text-4xl text-black">
        Your Physical Card
      </h1>
      <p className="max-w-md md:mx-auto mx-8 text-sm md:text-md lg:text-lg text-center text-gray-600 py-4">
        Select your preferred card type to order and enjoy the benefits of an
        NFC-enabled card.
      </p>

      {/* Metal & PVC Cards Section */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-36 pt-28 md:gap-10 lg:gap-20 md:pt-32 xl:pt-40 px-6 relative">
        {/* Metal Card */}
        <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-md w-full max-w-sm max-h-[400px] flex flex-col items-center justify-end text-center p-4 overflow-visible">
          <img
            src="/card-1.png"
            alt="Metal Card"
            className="absolute -top-1/4 md:-top-1/4 left-1/2 -translate-x-1/2 w-[250px] md:w-[280px] xl:w-[330px] drop-shadow-lg scale-150 transition-transform duration-300"
          />
          <div className="lg:mt-32 md:mt-20 mt-20">
            <h2 className="text-xl md:text-3xl font-bold text-black">Metal Card</h2>
            <div className="md:w-36 w-24 h-[2px] mx-auto my-4 md:my-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <p className="text-black text-base md:text-base leading-relaxed px-2">
              Select your preferred card type to order and enjoy the benefits of
              an NFC-enabled card.
            </p>
            <button className="mt-6 bg-black text-white md:px-8 px-6 md:py-3 py-2 rounded-full font-medium hover:bg-gray-800 transition duration-200" onClick={() => navigate("/login")}>
              Get Card
            </button>
          </div>
        </div>

        {/* PVC Card */}
        <div className="relative bg-gradient-to-br from-gray-50 to-white rounded-3xl shadow-md w-full max-w-sm max-h-[400px] flex flex-col items-center justify-end text-center p-4 overflow-visible">
          <img
            src="/card-2.png"
            alt="PVC Card"
            className="absolute -top-1/4 md:-top-1/4 left-1/2 -translate-x-1/2 w-[250px] md:w-[280px] xl:w-[330px] drop-shadow-lg scale-150 transition-transform duration-300"
          />
          <div className="lg:mt-32 md:mt-20 mt-20">
            <h2 className="text-xl md:text-3xl font-bold text-black">PVC Card</h2>
            <div className="md:w-36 w-24 h-[2px] mx-auto my-4 md:my-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            <p className="text-black text-base leading-relaxed px-2">
              A PVC card equipped with NFC technology that lets you tap and
              share your details effortlessly.
            </p>
            <button className="mt-6 bg-black text-white md:px-8 px-6 md:py-3 py-2 rounded-full font-medium hover:bg-gray-800 transition duration-200" onClick={() => navigate("/login")}>
              Get Card
            </button>
          </div>
        </div>
      </div>

      {/* Phone + Info Cards Section */}
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="md:max-w-8xl mx-auto flex flex-col gap-4 md:gap-10 md:flex-row items-center justify-center py-12 md:py-4 lg:py-12 px-8 md:px-0 lg:px-6 md:pr-16 lg:pr-56"
      >
        {/* Phone Image */}
        <motion.div
          variants={phoneVariant}
          className="w-full md:w-1/2 flex justify-center pr-10 mr-12 md:pr-0 md:mr-0"
        >
          <img
            src="/phone-card.png"
            alt="Phone"
            className="w-auto scale-110 drop-shadow-2xl"
          />
        </motion.div>

        {/* Info Cards Grid */}
        <motion.div
          variants={cardsVariant}
          className="w-full md:w-1/2 grid grid-cols-2 sm:grid-cols-2 gap-3 lg:gap-10"
        >
          {featureCards.map((card, index) => (
            <div
              key={index}
              className="bg-white shadow-md rounded-2xl p-4 md:p-4 lg:p-10 text-left border border-gray-100 hover:shadow-lg transition-all duration-300"
            >
              <h3 className="md:font-bold font-semibold text-sm md:text-xl lg:text-2xl text-black mb-2">
                {card.title}
              </h3>
              <p className="text-gray-600 text-[10px] lg:text-base leading-[1.5] lg:leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Footer image */}
      <div>
        <img
          src="/buildings.png"
          alt="buildings"
          className="w-full lg:mt-12 mt-0 md:object-cover"
        />
      </div>
    </section>
  );
}

export default memo(YourPhysicalCard);
