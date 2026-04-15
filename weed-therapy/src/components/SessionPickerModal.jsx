// src/components/SessionPickerModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const SessionPickerModal = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
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
            className="fixed bottom-0 sm:bottom-auto sm:top-1/2 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-md sm:px-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e1ddd3] max-h-[88vh] overflow-hidden flex flex-col">

              {/* Drag handle — mobile */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
                <div className="w-10 h-1 bg-[#e1ddd3] rounded-full" />
              </div>

              {/* Header */}
              <div className="px-5 py-4 border-b border-[#f0ebe1] flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-base font-bold text-[#2E3A33]">Your Sessions</h3>
                  <p className="text-xs text-[#9a8e80] mt-0.5">
                    {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f5f3ee] text-[#7A6C58] hover:bg-[#e8e4dd] transition text-lg leading-none"
                >×</motion.button>
              </div>

              {/* Session list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="text-4xl mb-3"
                    >💬</motion.div>
                    <p className="text-sm text-[#9a8e80]">No sessions yet. Start your first one!</p>
                  </div>
                ) : (
                  sessions.map((s, i) => {
                    const isActive = activeSessionId === s._id;
                    return (
                      <motion.div
                        key={s._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => onSelectSession(s._id)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition ${
                          isActive
                            ? "border-[#6CB28E] bg-[#EAF5EF]"
                            : "border-[#f0ebe1] bg-[#fdfcfa] hover:border-[#6CB28E] hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {isActive && (
                                <span className="w-2 h-2 rounded-full bg-[#6CB28E] animate-pulse flex-shrink-0" />
                              )}
                              <p className="font-semibold text-[#2E3A33] truncate text-sm">{s.title}</p>
                            </div>
                            <p className="text-xs text-[#9a8e80] flex items-center gap-1.5 flex-wrap mt-1">
                              <span>{new Date(s.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                              <span>·</span>
                              <span>{Math.max(0, s.history.length - 1)} msgs</span>
                              {s.metadata?.anonymous && (
                                <>
                                  <span>·</span>
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold">🔒 Anon</span>
                                </>
                              )}
                              {s.ended && (
                                <>
                                  <span>·</span>
                                  <span className="px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-semibold">Paused</span>
                                </>
                              )}
                            </p>
                          </div>

                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDeleteSession(s._id); }}
                            className="p-1.5 text-[#c0b9b0] hover:text-[#E76F51] hover:bg-red-50 rounded-xl transition flex-shrink-0"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 2A1.75 1.75 0 007 3.75V4H4.75a.75.75 0 000 1.5h.307l.623 8.103A2.25 2.25 0 007.922 15.75h4.156a2.25 2.25 0 002.242-2.147L14.943 5.5h.307a.75.75 0 000-1.5H13v-.25A1.75 1.75 0 0011.25 2h-2.5zM8.5 5.5a.75.75 0 00-.75.75v5a.75.75 0 001.5 0v-5a.75.75 0 00-.75-.75zm3 0a.75.75 0 00-.75.75v5a.75.75 0 001.5 0v-5a.75.75 0 00-.75-.75z" clipRule="evenodd" />
                            </svg>
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#f0ebe1] flex-shrink-0 pb-[max(env(safe-area-inset-bottom),16px)]">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-[#6CB28E] to-[#5a9e7a] text-white py-3.5 rounded-2xl font-semibold text-sm shadow-sm"
                >
                  Done
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SessionPickerModal;