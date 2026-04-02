"use client";
import React, { useRef, useEffect, useState, memo } from "react";
import { motion, useInView } from "framer-motion";

// CountUp Component (unchanged)
const CountUp = memo(function CountUp({ from = 0, to, step = 1, duration = 1.5 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    if (!isInView) return;

    setDisplayValue(from);
    const totalSteps = Math.ceil((to - from) / step);
    const intervalTime = (duration * 1000) / totalSteps;
    let current = from;

    const interval = setInterval(() => {
      current += step;
      if (current >= to) {
        current = to;
        clearInterval(interval);
      }
      setDisplayValue(
        Number.isInteger(to) ? Math.floor(current) : current.toFixed(1)
      );
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isInView, from, to, step, duration]);

  return <span ref={ref}>{displayValue}</span>;
});

function Slider() {
  const images = [
    "/logo-1.png",
    "/logo-2.png",
    "/logo-3.png",
    "/logo-4.png",
    "/logo-5.png",
    "/logo-6.png",
    "/logo-7.png",
  ];

  // Duplicate for seamless loop
  const marqueeImages = [...images, ...images, ...images, ...images, ...images, ...images];

  return (
    <div className="w-full bg-white flex flex-col justify-around items-center gap-10 md:py-0 md:gap-20 md:px-6 xl:px-20 md:mt-44 lg:mt-96 overflow-hidden">
      {/* Top Image Marquee */}
      <div className="w-full overflow-hidden flex justify-center items-center md:mt-16">
        <motion.div
          className="flex items-center gap-16"
          style={{ willChange: "transform" }}
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 25, // slower = smoother
          }}
        >
          {marqueeImages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`logo-${i}`}
              className="w-40 sm:w-52 md:w-44 lg:w-72 h-auto object-contain opacity-90 hover:opacity-100 transition-all duration-300 py-6 lg:py-0"
            />
          ))}
        </motion.div>
      </div>

      {/* Stats Section */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto gap-4 md:gap-4 xl:gap-14 px-6 md:px-0 lg:py-10 mt-8">
        {/* 1️⃣ */}
        <div className="flex flex-col items-center justify-around bg-[#71efe8]/[0.16] rounded-2xl p-5 md:p-6 xl:p-4">
          <div className="md:w-full w-28 h-20 md:h-32 flex justify-center items-center">
            <img
              src="/1.png"
              alt="stat-1"
              className="object-contain h-32 w-36 animate-bounce-gentle"
            />
          </div>
          <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-center mt-10 md:mt-2">
            <CountUp to={1200} step={16} duration={1.5} />+
          </h1>
          <p className="text-sm text-gray-700 text-center">
            Trusted Profile
          </p>
          </div>
        </div>

        {/* 2️⃣ */}
        <div className="flex flex-col items-center justify-around bg-[#71efe8]/[0.16] rounded-2xl p-5 md:p-6 xl:p-4">
          <div className="w-full h-32 md:h-32 flex justify-center items-center">
            <img
              src="/2.png"
              alt="stat-2"
              className="object-contain w-32 h-full md:w-44 md:h-44 animate-bounce-gentle"
            />
          </div>
          <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-center mt-2">
            <CountUp to={5000} step={70} duration={1.5} />+
          </h1>
          <p className="text-sm text-gray-700 text-center">Personal Profiles</p>
          </div>
        </div>

        {/* 3️⃣ */}
        <div className="flex flex-col items-center justify-around bg-[#71efe8]/[0.16] rounded-2xl p-5 md:p-6 xl:p-4">
          <div className="md:w-full w-32 h-20 md:h-32 flex justify-center items-center">
            <img
              src="/3.png"
              alt="stat-3"
              className="object-contain w-32 h-36 animate-bounce-gentle"
            />
          </div>
          <div>
          <h1 className="text-md md:text-2xl font-semibold text-center mt-2">
            <CountUp to={4.9} step={0.07} duration={1.5} />{" "}
            <span className="text-blue-500">★</span> Rated
          </h1>
          <p className="text-sm text-gray-700 text-center">
            Trusted Businesses Profile
          </p>
          </div>
        </div>

        {/* 4️⃣ */}
        <div className="flex flex-col items-center justify-around bg-[#71efe8]/[0.16] rounded-2xl p-5 md:p-4 xl:py-8 md:space-y-4">
          <div className="md:w-full h-20 w-16 md:h-32 flex justify-center items-center">
            <img
              src="/4.png"
              alt="stat-4"
              className="object-contain w-32 animate-bounce-gentle"
            />
          </div>
          <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-center mt-2">
            <CountUp to={200} step={3} duration={1.5} />+ Corporate
          </h1>
          <p className="text-sm text-gray-700 text-center">
            Corporate Bulk Profiles
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(Slider);
