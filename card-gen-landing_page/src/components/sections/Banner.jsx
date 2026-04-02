"use client";
import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function Banner() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });

  return (
    <section className="w-full bg-white flex flex-col items-center justify-center pt-20 md:pt-24 overflow-hidden">
      {/* Top Text Section */}
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold leading-tight text-black poppins-bold">
          All <span className=" bg-gradient-to-r from-black to-[#052aa1] bg-clip-text text-transparent">Information, One</span> <br /> Link, <span className=" bg-gradient-to-r from-black to-[#052aa1] bg-clip-text text-transparent">One Card</span>
        </h1>
        <p className="text-gray-700 text-base lg:text-2xl md:mt-4 lg:mt-8 leading-relaxed poppins-regular">
          Create one smart link for{" "}
          <span className="bg-gradient-to-r from-gray-600 to-[#004DFF] bg-clip-text text-transparent font-semibold">
            all your business{" "}<br className="lg:hidden block" />

          </span>
          {/* Responsive line break */}
          <br className="hidden lg:block" />
          and social media{" "}
          <span className="bg-gradient-to-r from-gray-600 to-[#004DFF] bg-clip-text text-transparent font-semibold">
            profiles.
          </span>
        </p>
      </div>

      {/* Center Image with Popup Animation */}
      <div ref={ref} className="flex justify-center items-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={
            isInView
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.3, y: 50 }
          }
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-[400px] md:w-[650px] lg:w-[1000px] drop-shadow-2xl -mt-12 md:-mt-24 lg:-mt-36"
        >
          <img
            src="/banner.png" // ✅ path from public
            alt="VisitingLink Banner"
            className="w-full h-auto object-contain"
          />
        </motion.div>
      </div>
    </section>
  );
}
