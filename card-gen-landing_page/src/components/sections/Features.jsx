"use client";
import React, { useRef, memo } from "react";
import { motion, useInView } from "framer-motion";

function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const features = [
    {
      image: "/feature-1.png",
      title: "One smart Link",
      description: "Create a comprehensive one-link solution.",
      bg: "#09001b",
      color: "text-white",
    },
    {
      image: "/feature-2.png",
      title: "Easy Share",
      description: "Effortless Sharing Accessible to Everyone",
      bg: "#ffffff",
      color: "text-black",
    },
    {
      image: "/feature-3.png",
      title: "Appointment",
      description: "Get Leads for All with Appointment Software",
      bg: "#d1ecff",
      color: "text-black",
    },
  ];

 // Variants for animation
const leftVariant = {
  hidden: { opacity: 0, x: -350, rotate: -25 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 12,
      mass: 0.8,
      duration: 0.4,
      opacity: { duration: 0.2, ease: "easeOut" },
    },
  },
};

const centerVariant = {
  hidden: { opacity: 0, y: 250, scale: 0.75 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 10,
      mass: 0.9,
      duration: 0.4,
      opacity: { duration: 0.25, ease: "easeOut" },
    },
  },
};

const rightVariant = {
  hidden: { opacity: 0, x: 350, rotate: 25 },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 12,
      mass: 0.8,
      duration: 0.4,
      opacity: { duration: 0.2, ease: "easeOut" },
    },
  },
};



  return (
    <section
      ref={ref}
      className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-10 py-16 md:py-12 flex flex-col items-center"
    >
      {/* Header */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-16 lg:mb-24">
        <span className="bg-gradient-to-r from-[#000000] to-[#004bad] bg-clip-text text-transparent">
          Our Features
        </span>
      </h2>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 lg:gap-14">
        {/* LEFT BLOCK */}
        <motion.div
          variants={leftVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="rounded-[45px] lg:py-10 py-6 px-8 lg:px-16 flex flex-col items-center text-center shadow-lg hover:scale-105 transition-transform duration-100"
          style={{ backgroundColor: features[0].bg }}
        >
          <div className="w-32 h-32 lg:h-52 lg:w-56">
            <img
              src={features[0].image}
              alt={features[0].title}
              className="w-full h-full object-contain"
            />
          </div>
          <h3
            className={`md:text-2xl lg:text-3xl font-bold text-nowrap mb-2 ${features[0].color}`}
          >
            {features[0].title}
          </h3>
          <p
            className={`text-sm md:text-base leading-relaxed opacity-80 ${features[0].color}`}
          >
            {features[0].description}
          </p>
        </motion.div>

        {/* CENTER BLOCK */}
        <motion.div
          variants={centerVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="rounded-[45px] lg:py-10 py-6 px-8 lg:px-16 flex flex-col items-center text-center shadow-lg hover:scale-105 transition-transform duration-100"
          style={{ backgroundColor: features[1].bg }}
        >
          <div className="w-32 h-32 lg:h-52 lg:w-56">
          <img
              src={features[1].image}
              alt={features[1].title}
              className="w-full h-full object-contain"
            />
          </div>
          <h3
            className={`md:text-2xl lg:text-3xl font-bold mb-2 ${features[1].color}`}
            >
            {features[1].title}
          </h3>
          <p
            className={`text-sm md:text-base leading-relaxed opacity-80 ${features[1].color}`}
          >
            {features[1].description}
          </p>
        </motion.div>

        {/* RIGHT BLOCK */}
        <motion.div
          variants={rightVariant}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="rounded-[45px] lg:py-10 py-6 px-8 lg:px-16 flex flex-col items-center text-center shadow-lg hover:scale-105 transition-transform duration-100"
          style={{ backgroundColor: features[2].bg }}
        >
          <div className="w-32 h-32 lg:h-52 lg:w-56">
          <img
              src={features[2].image}
              alt={features[2].title}
              className="w-full h-full object-contain"
            />
          </div>
          <h3
            className={`md:text-2xl lg:text-3xl font-bold mb-2 ${features[2].color}`}
            >
            {features[2].title}
          </h3>
          <p
            className={`text-sm md:text-base leading-relaxed opacity-80 ${features[2].color}`}
          >
            {features[2].description}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(Features);
