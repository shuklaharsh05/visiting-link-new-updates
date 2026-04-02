"use client";
import React, { memo } from "react";
import { motion } from "framer-motion";

function Gettingstarted() {
  const container = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.25 },
    },
  };

  const textVariant = {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 70, damping: 15, delay: 0.2 },
    },
  };

  // Pop animation variant (for images only)
  const imagePop = {
    hidden: { opacity: 0, scale: 0.7, y: 60 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 120, damping: 10 },
    },
  };

  return (
    <div className="w-full bg-white mx-auto flex flex-col justify-around items-center md:gap-8 lg:gap-20 lg:pb-20 lg:py-0 md:py-10">
      {/* Steps Section */}
      <div className="w-full bg-white mx-auto flex flex-col justify-around items-center gap-20 overflow-hidden">
        <motion.div
          className="grid grid-cols-1 max-w-[80%] md:grid-cols-3 gap-10 md:gap-2 lg:gap-8 md:max-w-2xl lg:max-w-7xl mx-auto py-10 lg:py-28"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {[
            {
              num: "/1.svg",
              title: "Fillup Form",
              desc: "Fill up the form to initiate the profile creation process.",
            },
            {
              num: "/2.svg",
              title: "Verify Details",
              desc: "Check your details and confirm to proceed further.",
            },
            {
              num: "/3.svg",
              title: "Get Approved",
              desc: "Once verified, your profile will be activated successfully.",
            },
          ].map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-4 md:gap-3 md:p-1 lg:p-0 relative"
            >
              <div className="w-16 md:w-32 lg:w-24 flex justify-center">
                <img
                  src={step.num}
                  alt={`getting-started-${i + 1}`}
                  className="h-20 md:h-28 lg:h-34 object-contain"
                />
              </div>
              <motion.div
                variants={textVariant}
                className="flex flex-col justify-center gap-1 lg:gap-2"
              >
                <h1 className="text-lg md:text-xl lg:text-3xl font-semibold text-[#004aad]">
                  {step.title}
                </h1>
                <p className="text-sm md:text-md lg:text-lg">{step.desc}</p>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Business & QR Section */}
      <div className="flex lg:flex-row flex-col max-w-7xl mx-auto gap-8 justify-around">
        {/* Business Section */}
        <div
          className="w-[90%] mx-auto lg:w-[60%] flex justify-center lg:justify-around items-center rounded-xl md:rounded-3xl overflow-hidden md:overflow-visible"
          style={{
            background:
              "linear-gradient(180deg, #ffffff 22%, #a4c6dd 51%, #006fff 100%)",
          }}
        >
          <div className="w-full md:w-[60%] space-y-4 pl-4 py-8 md:space-y-6 md:my-auto md:pl-12 md:pr-6">
            <div className="md:gap-5 gap-2 flex flex-col">
              <h3 className="text-base md:text-3xl lg:text-4xl xl:text-4xl leading-[1.2] lg:leading-[1.5] font-bold">
                Get One Link For your Business Profile
              </h3>
              <p className="text-xs md:text-md xl:text-lg md:leading-[1.5]">
                A universal QR code solution for appointment software, perfect
                for Business to efficiently schedule all online meetings.
              </p>
            </div>
            <div>
              <a
                href="/login"
                className="bg-black text-white px-6 py-2 rounded-2xl text-sm md:text-xl poppins-semibold"
              >
                Business Link
              </a>
            </div>
          </div>

          {/* Animated Image */}
          <motion.div
            variants={imagePop}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="max-w-96 md:max-w-96 lg:overflow-visible "
          >
            <div className="relative xl:-top-[30px] md:-top-[37.5px] lg:top-[20px] top-[0px]">
              <img
                src="/person.png"
                alt="your-physical-card"
                className="scale-125 md:scale-125 lg:scale-150 h-[200px] w-[400px] md:w-full md:h-[300px]"
              />
            </div>
          </motion.div>
        </div>

        {/* QR Section */}
        <div
          className="w-[90%] mx-auto lg:w-[30%] flex flex-row-reverse md:flex-col items-center justify-center gap-8 md:gap-4 p-6 md:p-8 rounded-xl md:rounded-3xl"
          style={{
            background:
              "linear-gradient(180deg, #ffffff 22%, #a4c6dd 51%, #006fff 100%)",
          }}
        >
          {/* Animated QR Image */}
          <motion.img
            src="/qr.png"
            alt="your-physical-card"
            className="md:max-w-44 md:w-full w-20"
            variants={imagePop}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          />
          <p className="md:text-center text-sm md:text-lg xl:text-lg md:mt-6">
            QR code for appointment software allows businesses to manage and
            share details efficiently through a single profile or link.
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(Gettingstarted);
