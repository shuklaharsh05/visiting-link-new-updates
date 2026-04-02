import React from "react";
import { FaFacebook, FaInstagram, FaWhatsapp, FaLinkedin } from "react-icons/fa";
import { FiExternalLink, FiSearch } from "react-icons/fi";

function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 pt-12 md:py-6 xl:py-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 items-start text-center md:text-left space-y-0 md:space-y-0">
        
        {/* Left Section */}
        <div className="flex flex-col md:gap-2 items-center md:items-start">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <img src="/visitingLink-logo-white.png" alt="logo" className="h-8 md:h-16 lg:h-[50px] object-contain " />
          </div>
          <p className="text-gray-300 mt-1 text-sm lg:text-sm leading-relaxed max-w-sm">
            Earn More. Enjoy More. Your Benefits,<br /> Delivered with one link.
          </p>

          {/* Search bar */}
          <div className="relative mt-3 md:mt-8 w-full md:w-[90%] max-w-xs -ml-1">
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-white/5 border border-white/20 rounded-full py-2 pl-4 pr-10 outline-none text-white placeholder-gray-400 focus:ring-2 focus:ring-white/40 transition"
            />
            <FiSearch className="absolute right-5 top-1/2 -translate-y-1/2 text-white/80 text-lg" />
          </div>
          {/* <div className="flex md:hidden items-center justify-center md:justify-start gap-2">
            <img src="/Footer-logo.png" alt="logo" className="h-8 md:h-16 lg:h-[50px] object-contain " />
          </div> */}
        </div>

        {/* Middle Section */}
        <div className="flex flex-col items-center md:items-start border-t border-white/10 md:border-none pt-6 md:pt-0">
          <h4 className="font-semibold mb-3 text-gray-200 text-base sm:text-lg text-center md:text-left">
            Quick Links
          </h4>
          <ul className="space-y-2 text-gray-400 text-sm sm:text-base text-center md:text-left">
            <li><a href="#" className="hover:text-white transition">Home</a></li>
            <li><a href="#" className="hover:text-white transition">Benefits</a></li>
            <li><a href="#" className="hover:text-white transition">Welcome Offer</a></li>
            <li><a href="#" className="hover:text-white transition">FAQ</a></li>
            <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
          </ul>
        </div>

        {/* Right Section */}
        <div className="flex flex-col items-center md:items-end justify-between h-full gap-6 md:gap-0 border-t border-white/10 md:border-none pt-6 md:pt-0">
          <div className="text-center md:text-left">
            <h4 className="font-semibold mb-3 text-gray-200 text-base sm:text-lg">Policies</h4>
            <ul className="space-y-2 text-gray-400 text-sm sm:text-base">
              <li><a href="/terms-and-conditions" className="hover:text-white transition">Terms And Conditions</a></li>
              <li><a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="/refund-policy" className="hover:text-white transition">Refund Policy</a></li>
            </ul>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center md:justify-end mt-4">
            {[
              { icon: <FaLinkedin />, href: "#" },
              { icon: <FaWhatsapp />, href: "#" },
              { icon: <FaFacebook />, href: "#" },
              { icon: <FaInstagram />, href: "#" },
            ].map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="py-1 px-2 rounded-full bg-white/5 hover:bg-white/20 hover:scale-110 transition-all duration-200"
              >
                <div className="text-2xl">{item.icon}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Divider + Copyright */}
      <div className="md:py-8 py-4 text-center text-sm sm:text-base text-white">
        © 2025 Visitinglink. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;
