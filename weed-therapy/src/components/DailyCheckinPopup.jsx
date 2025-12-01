// src/components/DailyCheckinPopup.jsx
import React from "react";

const DailyCheckinPopup = ({ isOpen, onGoToCheckin, onSkip }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={onSkip}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-[#e1ddd3] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🌤️</div>
          <h3 className="text-lg font-semibold text-[#2E3A33] mb-1">
            Daily Check-In
          </h3>
          <p className="text-sm text-[#7A6C58]">
            Take 30 seconds to check in with yourself today
          </p>
        </div>

        <div className="bg-[#fdfcfa] border border-[#e1ddd3] rounded-xl p-4 mb-4">
          <p className="text-xs font-medium text-[#2E3A33] mb-2">
            We'll track:
          </p>
          <ul className="text-xs text-[#7A6C58] space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#6CB28E] rounded-full"></span>
              Mood, craving & stress levels
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#6CB28E] rounded-full"></span>
              Energy & coping activities
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#6CB28E] rounded-full"></span>
              Personal notes & patterns
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onGoToCheckin}
            className="w-full bg-[#6CB28E] text-white py-3 rounded-xl hover:bg-[#5FA47F] transition font-medium text-sm shadow-sm"
          >
            Do Today's Check-In
          </button>
          <button
            onClick={onSkip}
            className="w-full bg-gray-100 text-[#2E3A33] py-3 rounded-xl hover:bg-gray-200 transition font-medium text-sm"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckinPopup;