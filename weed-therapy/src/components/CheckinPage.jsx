// src/components/CheckinPage.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import { toast } from "react-toastify";

const CheckinPage = () => {
  const [todayCheckin, setTodayCheckin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    mood: 5,
    craving: 5,
    stress: 5,
    energy: 5,
    notes: "",
    copingActivities: [],
  });

  // Helper: get today's localStorage key
  const getTodayKey = () => {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    return `weedtherapy_checkin_prompt_${today}`;
  };

  useEffect(() => {
    const fetchTodayCheckin = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/auth");
          return;
        }

        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkin/today`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data.success && res.data.checkin) {
          const c = res.data.checkin;
          setTodayCheckin(c);
          setForm({
            mood: c.mood,
            craving: c.craving,
            stress: c.stress,
            energy: c.energy || 5,
            notes: c.notes || "",
            copingActivities: c.copingActivities || [],
          });
        }
      } catch (error) {
        console.error("Error fetching today's checkin:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/auth");
        }
        toast.error("Failed to load check-in data");
      } finally {
        setLoading(false);
      }
    };

    fetchTodayCheckin();
  }, [navigate]);

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: parseInt(value, 10),
    }));
  };

  const handleNotesChange = (e) => {
    setForm((prev) => ({
      ...prev,
      notes: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.mood || !form.craving || !form.stress || !form.energy) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      let res;

      if (todayCheckin && isEditing) {
        res = await axios.put(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/checkin/update/${todayCheckin._id}`,
          {
            mood: form.mood,
            craving: form.craving,
            stress: form.stress,
            energy: form.energy,
            notes: form.notes,
            copingActivities: form.copingActivities,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Check-in updated successfully!");
        setTodayCheckin(res.data.checkin || todayCheckin);

        // Set localStorage flag to prevent popup from showing again today
        const todayKey = getTodayKey();
        localStorage.setItem(todayKey, "done");
      } else if (!todayCheckin) {
        res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/checkin/create`,
          {
            mood: form.mood,
            craving: form.craving,
            stress: form.stress,
            energy: form.energy,
            notes: form.notes,
            copingActivities: form.copingActivities,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Check-in saved successfully!");
        setTodayCheckin(res.data.checkin);

        // Set localStorage flag to prevent popup from showing again today
        const todayKey = getTodayKey();
        localStorage.setItem(todayKey, "done");
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving check-in:", error);
      toast.error("Failed to save check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (todayCheckin) {
      setForm({
        mood: todayCheckin.mood,
        craving: todayCheckin.craving,
        stress: todayCheckin.stress,
        energy: todayCheckin.energy || 5,
        notes: todayCheckin.notes || "",
        copingActivities: todayCheckin.copingActivities || [],
      });
    }
    setIsEditing(false);
  };

  const copingOptions = [
    "Breathing",
    "Exercise",
    "Journaling",
    "Meditation",
    "Talking to friend",
    "Nature walk",
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fdfcfa] to-[#f5f3ee] flex flex-col">
        <Header title="Daily Check-In" />
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm border border-[#e1ddd3] rounded-xl px-6 py-4 shadow-sm text-[#6CB28E] text-sm">
            Loading your check-in...
          </div>
        </div>
      </div>
    );
  }

  const canEdit = todayCheckin && !isEditing;
  const showForm = !todayCheckin || isEditing;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fdfcfa] to-[#f5f3ee] pb-10">
      <Header title="Daily Check-In" />

      <div className="max-w-3xl mx-auto px-4 mt-6">
        {/* Top intro card */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl shadow-sm p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl sm:text-3xl">📓</div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#2E3A33] mb-1">
                How are you feeling today?
              </h2>
              <p className="text-xs sm:text-sm text-[#7A6C58] leading-relaxed">
                A quick daily check-in helps you and the AI therapist notice
                patterns in your mood, cravings, stress, and energy over time.
              </p>
            </div>
          </div>

          {todayCheckin && !isEditing && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#EAF5EF] px-3 py-1 border border-[#c6e3d1] text-xs text-[#2E3A33]">
              <span className="text-base">✔️</span>
              <span>Today&apos;s check-in completed</span>
            </div>
          )}
        </div>

        {/* Today summary card */}
        {canEdit && (
          <div className="bg-white/90 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl p-5 sm:p-6 mb-6 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between mb-4 gap-3">
              <div>
                <h3 className="font-semibold text-[#2E3A33]">Today at a glance</h3>
                <p className="text-xs text-[#7A6C58]">
                  You can still edit this check-in for today.
                </p>
              </div>
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#6CB28E] text-white text-xs sm:text-sm hover:bg-[#5FA47F] transition shadow-sm"
              >
                ✏️ Edit
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <MetricPill label="Mood" value={todayCheckin.mood} color="#6CB28E" />
              <MetricPill
                label="Craving"
                value={todayCheckin.craving}
                color="#E76F51"
              />
              <MetricPill
                label="Stress"
                value={todayCheckin.stress}
                color="#F4A261"
              />
              <MetricPill
                label="Energy"
                value={todayCheckin.energy || 5}
                color="#2A9D8F"
              />
            </div>

            {todayCheckin.copingActivities &&
              todayCheckin.copingActivities.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-[#7A6C58] mb-1">
                    Coping activities:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {todayCheckin.copingActivities.map((a) => (
                      <span
                        key={a}
                        className="px-2 py-1 rounded-full bg-[#f5f3ee] border border-[#e1ddd3] text-[11px] text-[#4B3F2F]"
                      >
                        {a.charAt(0).toUpperCase() + a.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {todayCheckin.notes && (
              <div className="mb-4">
                <p className="text-xs font-medium text-[#7A6C58] mb-1">Notes</p>
                <div className="text-xs sm:text-sm text-[#4B3F2F] bg-[#fdfcfa] border border-[#e1ddd3] rounded-xl px-3 py-2">
                  {todayCheckin.notes}
                </div>
              </div>
            )}

            {todayCheckin.summary && (
              <div className="mt-2 rounded-xl bg-[#fdfcfa] border border-[#e1ddd3] p-3">
                <p className="text-xs font-medium text-[#7A6C58] mb-1">
                  AI reflection
                </p>
                <div className="text-xs sm:text-sm text-[#4B3F2F] space-y-1.5">
                  <div>
                    <span className="font-semibold">Emotional state: </span>
                    {todayCheckin.summary.emotionalState}
                  </div>
                  <div>
                    <span className="font-semibold">Suggestion: </span>
                    {todayCheckin.summary.suggestion}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 sm:space-y-6 animate-slideUp"
          >
            <SliderCard
              label="Mood"
              name="mood"
              value={form.mood}
              minLabel="Very low"
              maxLabel="Very high"
              disabled={todayCheckin && !isEditing}
              onChange={handleSliderChange}
              accent="from-[#E9F7F0] to-[#fdfcfa]"
            />

            <SliderCard
              label="Cannabis craving"
              name="craving"
              value={form.craving}
              minLabel="No craving"
              maxLabel="Intense craving"
              disabled={todayCheckin && !isEditing}
              onChange={handleSliderChange}
              accent="from-[#FFEDE7] to-[#fdfcfa]"
            />

            <SliderCard
              label="Stress"
              name="stress"
              value={form.stress}
              minLabel="No stress"
              maxLabel="Very stressed"
              disabled={todayCheckin && !isEditing}
              onChange={handleSliderChange}
              accent="from-[#FFF3E3] to-[#fdfcfa]"
            />

            <SliderCard
              label="Energy"
              name="energy"
              value={form.energy}
              minLabel="Exhausted"
              maxLabel="Energized"
              disabled={todayCheckin && !isEditing}
              onChange={handleSliderChange}
              accent="from-[#E8F6F5] to-[#fdfcfa]"
            />

            {/* Coping Activities */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl p-5 sm:p-6">
              <p className="block text-sm font-medium text-[#2E3A33] mb-2">
                Coping activities used today{" "}
                <span className="text-xs text-[#7A6C58]">(optional)</span>
              </p>
              <p className="text-xs text-[#7A6C58] mb-3">
                What helped you the most today? This helps the app learn which
                tools really work for you.
              </p>
              <div className="flex flex-wrap gap-2">
                {copingOptions.map((activity) => {
                  const val = activity.toLowerCase();
                  const selected = form.copingActivities.includes(val);
                  return (
                    <button
                      key={activity}
                      type="button"
                      disabled={todayCheckin && !isEditing}
                      onClick={() => {
                        if (todayCheckin && !isEditing) return;
                        setForm((prev) => ({
                          ...prev,
                          copingActivities: selected
                            ? prev.copingActivities.filter((a) => a !== val)
                            : [...prev.copingActivities, val],
                        }));
                      }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition ${
                        selected
                          ? "bg-[#6CB28E] text-white border-[#6CB28E]"
                          : "bg-[#fdfcfa] text-[#4B3F2F] border-[#e1ddd3] hover:bg-[#F1EBE0]"
                      } ${todayCheckin && !isEditing ? "opacity-60" : ""}`}
                    >
                      {activity}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white/90 backdrop-blur-sm border border-[#e1ddd3] rounded-2xl p-5 sm:p-6">
              <label className="block text-sm font-medium text-[#2E3A33] mb-2">
                Additional notes{" "}
                <span className="text-xs text-[#7A6C58]">(optional)</span>
              </label>
              <p className="text-xs text-[#7A6C58] mb-3">
                Any triggers, thoughts, wins, or slips you want to remember?
              </p>
              <textarea
                value={form.notes}
                onChange={handleNotesChange}
                disabled={todayCheckin && !isEditing}
                placeholder="Example: Woke up anxious, cravings higher after work. Took a short walk instead of smoking."
                className="w-full min-h-[96px] p-3 border border-[#d9cfc0] rounded-xl focus:ring-2 focus:ring-[#6CB28E] focus:border-transparent text-sm bg-[#fdfcfa] disabled:opacity-60"
              />
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3 rounded-xl text-sm font-medium text-white shadow-sm transition ${
                  submitting
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-[#6CB28E] hover:bg-[#5FA47F] active:scale-[0.98]"
                }`}
              >
                {submitting
                  ? "Saving..."
                  : todayCheckin && isEditing
                  ? "Update today's check-in"
                  : "Save today's check-in"}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="w-full py-3 rounded-xl text-sm font-medium bg-white border border-[#d9cfc0] text-[#2E3A33] hover:bg-[#F1EBE0] transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};

const SliderCard = ({
  label,
  name,
  value,
  minLabel,
  maxLabel,
  disabled,
  onChange,
  accent,
}) => (
  <div
    className={`bg-gradient-to-br ${accent} border border-[#e1ddd3] rounded-2xl p-5 sm:p-6`}
  >
    <div className="flex items-center justify-between mb-1">
      <p className="text-sm font-medium text-[#2E3A33]">{label}</p>
      <span className="text-sm font-semibold text-[#6CB28E]">{value}/10</span>
    </div>
    <input
      type="range"
      name={name}
      min="1"
      max="10"
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-full h-2 bg-[#d9cfc0] rounded-lg appearance-none cursor-pointer disabled:opacity-50"
    />
    <div className="flex justify-between text-[11px] text-[#7A6C58] mt-1.5">
      <span>1 ({minLabel})</span>
      <span>10 ({maxLabel})</span>
    </div>
  </div>
);

const MetricPill = ({ label, value, color }) => (
  <div className="rounded-xl border border-[#e1ddd3] bg-[#fdfcfa] px-3 py-2 text-center">
    <p className="text-[11px] text-[#7A6C58] mb-1">{label}</p>
    <p
      className="text-sm font-semibold"
      style={{ color }}
    >
      {value}/10
    </p>
  </div>
);

export default CheckinPage;