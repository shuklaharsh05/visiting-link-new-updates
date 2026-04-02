"use client";
import React, { useRef, memo } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
function Hero() {
  const navigate = useNavigate();
  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const imagePop = {
    hidden: { opacity: 0, scale: 0.8, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  // New variant for Hero-phone sliding in
  const imageSlideIn = {
    hidden: { opacity: 0, y: 100, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.2, // 0.2s delay after Hero.png
      },
    },
  };

  const textRef = useRef(null);
  const imgRef = useRef(null);

  const textInView = useInView(textRef, { once: true, amount: 0.4 });
  const imgInView = useInView(imgRef, { once: true, amount: 0.4 });

  return (
    <section className="w-full bg-white overflow-hidden transform translate-y-1/4 min-h-screen pb-32">
      <div className="mx-auto flex flex-col items-center text-center px-6 relative">
        {/* Text Section */}
        <motion.div
          ref={textRef}
          variants={fadeUp}
          initial="hidden"
          animate={textInView ? "visible" : "hidden"}
          className="flex flex-col items-center justify-center space-y-5 md:space-y-5 z-10 poppins-semibold"
        >
        <h1
          className="
            text-2xl md:text-4xl lg:text-6xl 
            poppins-bold 
            leading-[2rem] 
            md:leading-[3rem] 
            lg:leading-[5rem]
            text-black
          "
        >
          Share your{" "}
          <span className="bg-gradient-to-r from-[#000000] to-[#004DFF] bg-clip-text text-transparent">
            Business
          </span>
          <br />
          Details in One{" "}
          <span className="bg-gradient-to-r from-[#000000] to-[#004DFF] bg-clip-text text-transparent">
            Smart Link
          </span>
        </h1>

          <p className="text-black font-semibold text-sm sm:text-base md:text-3xl poppins-light max-w-[600px]">
            All information in <span className="font-bold">one link.</span> Get one card.
          </p>

          {/* Buttons */}
          <div className="flex flex-row justify-center items-center gap-3 md:gap-10 mt-32">
            <button className="px-5 py-2 md:px-6 md:py-3 border border-[#000000] rounded-[20px] text-xs md:text-base font-medium transition hover:bg-[#2C4AE5] hover:border-white hover:text-white" onClick={() => navigate("/login")}>
              <span className="bg-gradient-to-r from-[#000000] to-[#004DFF] bg-clip-text text-transparent hover:text-white">
                Professional Link
              </span>
            </button>
            <button className="px-8 py-2 md:px-11 md:py-3 bg-black text-white rounded-[20px] text-xs md:text-base font-medium hover:bg-white hover:text-black border border-black transition" onClick={() => navigate("/login")}>
              Business Link
            </button>
          </div>
        </motion.div>
      </div>

      {/* Mockup Section */}
      <div className="relative flex justify-center items-center mt-12 md:mt-20 w-full py-12 md:py-32 lg:py-56">
        {/* Hero.png */}
        <motion.div
          ref={imgRef}
          variants={imagePop}
          initial="hidden"
          animate={imgInView ? "visible" : "hidden"}
          className="relative w-full"
        >
          <motion.img
            src="/Hero.png"
            alt="Phone Mockup"
            className="w-full z-20 drop-shadow-2xl"
          />
        </motion.div>

        {/* Hero-phone.png */}
        <motion.div
          variants={imageSlideIn}
          initial="hidden"
          animate={imgInView ? "visible" : "hidden"}
          className="absolute w-full -top-16 md:-top-28 lg:-top-30 flex justify-center"
        >
          <motion.img
            src="/Hero-phone.png"
            alt="Phone Mockup"
            className="lg:min-w-[70%] scale-75 md:scale-50 lg:scale-75 mx-auto z-20 drop-shadow-2xl"
          />
        </motion.div>
      </div>
    </section>
  );
}

export default memo(Hero);
