"use client";
import React, { useRef, memo } from "react";
import { motion, useInView } from "framer-motion";
import { useNavigate } from "react-router-dom";
function FullScreenFeatures() {
  const navigate = useNavigate();
  const sections = [
    {
      heading: "Create Your Business Smart Link",
      desc: "Your all-in-one digital identity — elegant, modern, and unforgettable.From contact details to portfolios and social profiles,",
      img: "/feature-hero-1.png",
    },
    {
      heading: "Get Leads With Appointment Feature",
      desc: "Offers effortless scheduling. Clients book meetings instantly from your digital card with one click.",
      img: "/feature-hero-2.png",
    },
    {
      heading: "Custom Profile Options",
      desc: "Custom profile creation feature for professionals who want a personalized touch.",
      img: "/feature-hero-3.png",
      button: "Get your Card",
    },
  ];

  const textVariant = {
    hidden: { opacity: 0, x: -80 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const imageVariant = {
    hidden: { opacity: 0, x: 80 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="w-full flex flex-col gap-10 lg:gap-0 py-6 md:py-16 lg:py-24">
      {sections.map((item, index) => {
        const ref = useRef(null);
        const inView = useInView(ref, { once: true, amount: 0.3 });
        const isEven = index % 2 === 1; // even index (2nd, 4th...) → image left

        return (
          <motion.div
            key={index}
            ref={ref}
            className={`h-fit flex flex-col md:flex-row items-center justify-center md:gap-10 lg:gap-24 px-6 py-6 lg:px-36  ${
              isEven ? "md:flex-row-reverse bg-[#ffffff]" : "bg-white"
            }`}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            variants={textVariant}
          >
            {/* TEXT SECTION */}
            <motion.div
              className={`flex-1 flex flex-col text-center md:text-left`}
              variants={textVariant}
            >
              {item.heading && (
                <h2 className="text-3xl lg:text-5xl font-bold mb-4 text-[#1e1e1e] leading-snug">
                  {item.heading}
                </h2>
              )}
              {item.desc && (
                <p className="text-gray-600 text-base lg:text-lg max-w-md mb-6">
                  {item.desc}
                </p>
              )}
              {item.button && (
                <button className="hidden md:block max-w-fit mt-8 mx-auto md:mx-0 bg-black text-white rounded-2xl px-8 py-3 font-medium hover:opacity-80 transition" onClick={() => navigate("/login")}>
                  {item.button}
                </button>
              )}
            </motion.div>

            {/* IMAGE SECTION */}
            {item.img && (
              <motion.div
                className="flex-1 flex justify-center items-center"
                variants={imageVariant}
              >
                <img
                  src={item.img}
                  alt={item.heading}
                  className="w-full object-contain "
                />
              </motion.div>
            )}
            {item.button && (
              <button className="md:hidden max-w-fit mt-8 mx-auto md:mx-0 bg-black text-white rounded-2xl px-8 py-3 font-medium hover:opacity-80 transition" onClick={() => navigate("/login")}>
                {item.button}
              </button>
            )}
          </motion.div>
        );
      })}
    </section>
  );
}

export default memo(FullScreenFeatures);
