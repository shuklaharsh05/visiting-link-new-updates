"use client";
import React, { memo } from "react";
import { motion } from "framer-motion";

function CustomTemplate() {
  // Text fade + slide-up animation
  const textVariant = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  // Image scale-up animation
  const imageScale = {
    hidden: { opacity: 0, scale: 0.8, y: 60 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: [0.25, 0.8, 0.25, 1], // smooth cubic-bezier
      },
    },
  };

  return (
    <section className="w-full bg-white overflow-hidden pt-10 md:pt-20">
      {/* Heading */}
      <motion.h1
        className="text-2xl md:text-3xl lg:text-6xl text-center text-wrap font-bold text-black poppins-bold mx-4 md:mx-0"
        variants={textVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        The           
        <span className="bg-gradient-to-r from-black poppins-bold to-[#004DFF] bg-clip-text text-transparent font-semibold">Ultimate Digital</span><br/> 
        <span className="bg-gradient-to-r from-black poppins-bold to-[#004DFF] bg-clip-text text-transparent font-semibold">card Experience</span><br/> 
      </motion.h1>

      {/* Top Info Row */}
      <div className="py-4 flex justify-around items-center w-full">
        {/* Left Pin (invisible placeholder for symmetry) */}
        <div>
          <img
            src="/pin.png"
            alt="pin"
            className="mx-auto h-full object-cover lg:py-8 opacity-0 select-none"
          />
        </div>

        {/* Center Text */}
        <motion.div
          variants={textVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="text-sm md:text-md lg:text-xl text-black poppins-regular text-center lg:my-3 max-w-xl">
            Showcase everything you do with one smart link — your business,
            socials, services, and contact in one place
          </p>
          <h3 className="text-md md:text-xl text-center font-bold text-[#000000]">
            # Your Identity, Get your Card Today
          </h3>
        </motion.div>

        {/* Right Pin (visible) */}
        <motion.div
          variants={textVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <img
            src="/pin.png"
            alt="pin"
            className="mx-auto h-full object-cover lg:py-8"
          />
        </motion.div>
      </div>

      {/* Image scale-up reveal */}
      <motion.div
        variants={imageScale}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.4 }}
        className="flex justify-center items-center mt-6"
      >
        <img
          src="/custom-template.png"
          alt="custom-template"
          className="max-w-sm md:max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto h-full object-cover"
        />
      </motion.div>
    </section>
  );
}

export default memo(CustomTemplate);
