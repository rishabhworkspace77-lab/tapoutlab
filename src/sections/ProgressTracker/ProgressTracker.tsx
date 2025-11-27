import React, { useState, useEffect } from "react";
import {
  Activity,
  Weight,
  Footprints,
  Flame,
  Droplet,
  Save,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../supabaseClient"; // adjust path as needed

// ------------------ AUTH HELPER ------------------
// Directly get the current logged-in user's ID
const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
        setUserId(null);
      } else {
        setUserId(user?.id || null);
      }
    };
    fetchUser();

    // Optional: subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return { user_id: userId };
};

// ------------------ SUPABASE API SERVICE ------------------
const apiService = async (logDate: string, updates: any, userId: string) => {
  console.log(`[API CALL] Saving log for ${userId} on ${logDate}:`, updates);
  try {
    const payload = { user_id: userId, date: logDate, ...updates };

    const { data, error } = await supabase
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,date" })
      .select();

    if (error) {
      console.error("Database save error:", error.message);
      return false;
    }

    console.log("[API SUCCESS] Log saved/updated:", data);
    return true;
  } catch (err) {
    console.error("API service general error:", err);
    return false;
  }
};

// ------------------ COMPONENT ------------------
interface ProgressTrackerProps {
  dailyLogs: Record<string, any>;
  updateDailyLog: (date: string, data: any) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ dailyLogs, updateDailyLog }) => {
  const { user_id } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [logDate, setLogDate] = useState(today);
  const [saveStatus, setSaveStatus] = useState<null | "saving" | "saved" | "error">(null);

  const getLogForDate = (date: string) => dailyLogs[date] || {
    weight: "",
    steps: "",
    caloriesBurned: "",
    waterLiters: "",
  };

  const currentLog = getLogForDate(logDate);
  const [form, setForm] = useState(currentLog);

  // Sync form when date or dailyLogs change
  useEffect(() => {
    setForm(getLogForDate(logDate));
    setSaveStatus(null);
  }, [logDate, dailyLogs]);

  // Update form field with basic number validation
  const updateField = (field: string, value: string) => {
    const sanitizedValue = value.replace(/[^0-9.]/g, "");
    setForm((prev) => ({ ...prev, [field]: sanitizedValue }));
    setSaveStatus(null);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user_id) {
      console.error("User ID not available.");
      setSaveStatus("error");
      return;
    }

    const updates: any = {};
    if (form.weight) updates.weight = Number(form.weight);
    if (form.steps) updates.steps = parseInt(form.steps, 10);
    if (form.caloriesBurned) updates.caloriesBurned = parseInt(form.caloriesBurned, 10);
    if (form.waterLiters) updates.waterLiters = Number(form.waterLiters);

    if (Object.keys(updates).length === 0) return;

    setSaveStatus("saving");
    const isSuccessful = await apiService(logDate, updates, user_id);

    if (isSuccessful) {
      updateDailyLog(logDate, updates);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2000);
    } else {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const hasData = form.weight || form.steps || form.caloriesBurned || form.waterLiters;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg animate-fade-in">
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-sky-500" /> Daily Log
        </h2>
        <input
          type="date"
          value={logDate}
          max={today}
          onChange={(e) => setLogDate(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg font-medium text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Weight */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="p-2 bg-green-100 rounded-lg"><Weight className="w-5 h-5 text-green-600" /></div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Body Weight</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                step="0.1"
                min="0"
                value={form.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                placeholder="Enter weight"
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <span className="text-gray-500 font-medium">kg</span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="p-2 bg-blue-100 rounded-lg"><Footprints className="w-5 h-5 text-blue-600" /></div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Steps Walked</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                min="0"
                value={form.steps}
                onChange={(e) => updateField("steps", e.target.value)}
                placeholder="Enter steps"
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <span className="text-gray-500 font-medium">steps</span>
            </div>
          </div>
        </div>

        {/* Calories */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="p-2 bg-orange-100 rounded-lg"><Flame className="w-5 h-5 text-orange-600" /></div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Calories Burned</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                min="0"
                value={form.caloriesBurned}
                onChange={(e) => updateField("caloriesBurned", e.target.value)}
                placeholder="Enter calories"
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <span className="text-gray-500 font-medium">kcal</span>
            </div>
          </div>
        </div>

        {/* Water */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="p-2 bg-cyan-100 rounded-lg"><Droplet className="w-5 h-5 text-cyan-600" /></div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Water Intake</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                step="0.1"
                min="0"
                value={form.waterLiters}
                onChange={(e) => updateField("waterLiters", e.target.value)}
                placeholder="Enter water"
                className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <span className="text-gray-500 font-medium">L</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!hasData || saveStatus === "saving" || saveStatus === "error"}
          className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
            saveStatus === "saved"
              ? "bg-green-500"
              : saveStatus === "error"
              ? "bg-red-500"
              : "bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          }`}
        >
          {saveStatus === "saving" ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : saveStatus === "saved" ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Saved!
            </>
          ) : saveStatus === "error" ? (
            <>
              <AlertTriangle className="w-5 h-5" />
              Error Saving!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Daily Log
            </>
          )}
        </button>
      </form>

      {hasData && (
        <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
          Logging for <span className="font-semibold text-gray-700">{logDate}</span>
          {logDate === today && " (Today)"}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
