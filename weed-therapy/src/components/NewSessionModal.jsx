// src/components/NewSessionModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const NewSessionModal = ({
  isOpen,
  onClose,
  anonymousNewSession,
  onToggleAnonymous,
  sessionTypes,
  onSelectSessionType,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Bottom sheet on mobile, centered on desktop */}
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e1ddd3] max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col">

              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-10 h-1 bg-[#e1ddd3] rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-4 border-b border-[#f0ebe1] flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-bold text-[#2E3A33]">Start New Session</h3>
                  <p className="text-xs text-[#9a8e80] mt-0.5">Choose the support you need right now</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f3ee] text-[#7A6C58] hover:bg-[#e8e4dd] transition text-lg leading-none"
                >×</motion.button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">

                {/* Anonymous toggle */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl border border-[#e1ddd3] bg-[#fdfcfa] flex items-center gap-3"
                >
                  {/* Toggle switch */}
                  <motion.button
                    type="button"
                    onClick={onToggleAnonymous}
                    className={`w-12 h-6 rounded-full border-2 flex items-center flex-shrink-0 transition-colors ${
                      anonymousNewSession ? "bg-[#6CB28E] border-[#6CB28E]" : "bg-gray-200 border-gray-300"
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.span
                      animate={{ x: anonymousNewSession ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm flex-shrink-0"
                    />
                  </motion.button>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#2E3A33]">🔒 Anonymous Mode</p>
                    <p className="text-xs text-[#9a8e80] mt-0.5 leading-relaxed">
                      Session stored without your identity. AI avoids asking for personal details.
                    </p>
                  </div>
                </motion.div>

                {/* Session type cards */}
                <div className="space-y-2">
                  {sessionTypes.map((type, i) => (
                    <motion.button
                      key={type.code}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => onSelectSessionType(type.code)}
                      className="w-full p-4 bg-[#fdfcfa] rounded-2xl border border-[#e1ddd3] hover:border-[#6CB28E] hover:bg-[#EAF5EF] hover:shadow-sm cursor-pointer transition text-left group"
                      style={{ borderLeftWidth: "4px", borderLeftColor: type.color || "#6CB28E" }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl flex-shrink-0">{type.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-[#2E3A33] text-sm group-hover:text-[#2F7E57] transition">
                            {type.name}
                          </h4>
                          <p className="text-xs text-[#9a8e80] mt-0.5 leading-relaxed line-clamp-2">
                            {type.description}
                          </p>
                        </div>
                        <svg className="w-4 h-4 text-[#c0b9b0] group-hover:text-[#6CB28E] transition flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#f0ebe1] flex-shrink-0 pb-[max(env(safe-area-inset-bottom),16px)]">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="w-full bg-[#f5f3ee] text-[#7A6C58] py-3.5 rounded-2xl font-semibold text-sm hover:bg-[#ede9e1] transition"
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NewSessionModal;