// src/components/Footer.jsx
import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-white/80 backdrop-blur-md border-t border-[#e1ddd3] py-3 px-4 sm:px-6 text-center">
      <p className="text-xs text-[#9a8e80] max-w-4xl mx-auto leading-relaxed">
        🔒 This app provides supportive guidance and is not a substitute for professional medical advice or treatment. Use responsibly.
      </p>
    </footer>
  );
};

export default Footer;