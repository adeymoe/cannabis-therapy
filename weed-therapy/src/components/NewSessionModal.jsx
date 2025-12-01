// src/components/NewSessionModal.jsx
import React from "react";

const NewSessionModal = ({
  isOpen,
  onClose,
  anonymousNewSession,
  onToggleAnonymous,
  sessionTypes,
  onSelectSessionType,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-[#e1ddd3] max-h-[85vh] overflow-hidden flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#f0ebe1]">
          <h3 className="text-lg font-semibold text-[#2E3A33] mb-1">
            Start New Session
          </h3>
          <p className="text-xs text-[#7A6C58]">
            Choose the type of support you need right now
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Anonymous toggle */}
          <div className="p-4 rounded-xl border border-[#e1ddd3] bg-[#fdfcfa] flex items-start gap-3">
            <button
              type="button"
              onClick={onToggleAnonymous}
              className={`mt-0.5 w-11 h-6 flex items-center rounded-full border-2 transition flex-shrink-0 ${
                anonymousNewSession
                  ? "bg-[#6CB28E] border-[#6CB28E] justify-end"
                  : "bg-gray-200 border-gray-300 justify-start"
              }`}
            >
              <span className="w-4 h-4 bg-white rounded-full shadow-sm transition" />
            </button>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#2E3A33] flex items-center gap-1.5">
                🔒 Anonymous Mode
              </p>
              <p className="text-xs text-[#7A6C58] mt-1 leading-relaxed">
                Session stored without your identity. AI avoids asking for
                personal details.
              </p>
            </div>
          </div>

          {/* Session types */}
          <div className="space-y-2">
            {sessionTypes.map((type) => (
              <button
                key={type.code}
                type="button"
                onClick={() => onSelectSessionType(type.code)}
                className="w-full p-4 bg-[#fdfcfa] rounded-xl border-2 border-transparent hover:border-[#6CB28E] hover:shadow-sm cursor-pointer transition text-left"
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: type.color,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{type.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[#2E3A33] text-sm">
                      {type.name}
                    </h4>
                    <p className="text-xs text-[#7A6C58] mt-0.5 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#f0ebe1]">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-[#2E3A33] py-3 rounded-xl hover:bg-gray-200 transition font-medium text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSessionModal;