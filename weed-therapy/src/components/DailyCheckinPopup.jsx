// src/components/DailyCheckinPopup.jsx
import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const DailyCheckinPopup = ({ isOpen, onGoToCheckin, onSkip }) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          style={{ zIndex: 9999 }}
          className="fixed inset-0 flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-sm sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e1ddd3] overflow-hidden">
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 bg-[#e1ddd3] rounded-full" />
              </div>

              <div className="px-6 pt-4 pb-8 sm:py-6">
                <div className="text-center mb-5">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EAF5EF] to-[#d4edda] flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm"
                  >
                    🌤️
                  </motion.div>
                  <h3 className="text-lg font-bold text-[#2E3A33] mb-1">Daily Check-In</h3>
                  <p className="text-sm text-[#7A6C58]">Take 30 seconds to check in with yourself today</p>
                </div>

                <div className="bg-[#fdfcfa] border border-[#e1ddd3] rounded-2xl p-4 mb-5">
                  <p className="text-xs font-semibold text-[#2E3A33] mb-2">We'll track:</p>
                  <div className="space-y-2">
                    {[
                      { icon: "😊", text: "Mood, craving & stress levels" },
                      { icon: "⚡", text: "Energy & coping activities" },
                      { icon: "📝", text: "Personal notes & patterns" },
                    ].map(({ icon, text }, i) => (
                      <motion.div
                        key={text}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.07 }}
                        className="flex items-center gap-2.5 text-xs text-[#4B3F2F]"
                      >
                        <span className="text-base">{icon}</span>
                        <span>{text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onGoToCheckin}
                    className="w-full bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a] text-white py-4 rounded-2xl font-semibold text-sm shadow-sm"
                  >
                    Do Today's Check-In 🌱
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={onSkip}
                    className="w-full bg-[#f5f3ee] text-[#7A6C58] py-3 rounded-2xl font-medium text-sm hover:bg-[#ede9e1] transition"
                  >
                    Remind me later
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default DailyCheckinPopup;