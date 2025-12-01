// src/components/SessionPickerModal.jsx
import React from "react";

const SessionPickerModal = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#e1ddd3] max-h-[85vh] overflow-hidden flex flex-col animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#f0ebe1]">
          <h3 className="text-lg font-semibold text-[#2E3A33]">
            Your Sessions
          </h3>
          <p className="text-xs text-[#7A6C58] mt-1">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sessions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm text-[#7A6C58]">
                No sessions yet. Start your first one!
              </p>
            </div>
          )}

          {sessions.map((s) => (
            <div
              key={s._id}
              onClick={() => onSelectSession(s._id)}
              className={`p-4 bg-[#fdfcfa] rounded-xl border-2 cursor-pointer hover:border-[#6CB28E] hover:shadow-sm transition ${
                activeSessionId === s._id
                  ? "border-[#6CB28E] bg-[#EAF5EF]"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2E3A33] truncate">
                    {s.title}
                  </p>
                  <p className="text-xs text-[#7A6C58] flex items-center gap-2 flex-wrap mt-1">
                    <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{s.history.length - 1} msgs</span>
                    {s.metadata?.anonymous && (
                      <>
                        <span>•</span>
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] uppercase font-semibold">
                          🔒
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  {s.ended && (
                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                      Paused
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s._id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-[#E76F51] hover:bg-red-50 rounded-lg transition"
                    title="Delete session"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 2A1.75 1.75 0 007 3.75V4H4.75a.75.75 0 000 1.5h.307l.623 8.103A2.25 2.25 0 007.922 15.75h4.156a2.25 2.25 0 002.242-2.147L14.943 5.5h.307a.75.75 0 000-1.5H13v-.25A1.75 1.75 0 0011.25 2h-2.5zM8.5 5.5a.75.75 0 00-.75.75v5a.75.75 0 001.5 0v-5a.75.75 0 00-.75-.75zm3 0a.75.75 0 00-.75.75v5a.75.75 0 001.5 0v-5a.75.75 0 00-.75-.75z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#f0ebe1]">
          <button
            onClick={onClose}
            className="w-full bg-[#6CB28E] text-white py-3 rounded-xl hover:bg-[#5FA47F] transition font-medium text-sm shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionPickerModal;