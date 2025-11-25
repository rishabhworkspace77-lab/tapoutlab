import React, { useState } from "react";
import {
  Activity,
  Weight,
  Footprints,
  Flame,
  Droplet,
  Save,
  CheckCircle,
} from "lucide-react";

/**
 * ProgressTracker (Simplified)
 * Single form to log daily weight, steps, calories burned, and water intake.
 */
const ProgressTracker = ({ dailyLogs, updateDailyLog }) => {
  const today = new Date().toISOString().split("T")[0];
  const [logDate, setLogDate] = useState(today);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved'

  // Get existing log for selected date or defaults
  const log = dailyLogs[logDate] || {
    weight: "",
    steps: "",
    caloriesBurned: "",
    waterLiters: "",
  };

  // Local form state (allows editing before submit)
  const [form, setForm] = useState({
    weight: log.weight || "",
    steps: log.steps || "",
    caloriesBurned: log.caloriesBurned || "",
    waterLiters: log.waterLiters || "",
  });

  // Sync form when date changes
  const handleDateChange = (newDate) => {
    setLogDate(newDate);
    const existingLog = dailyLogs[newDate] || {};
    setForm({
      weight: existingLog.weight || "",
      steps: existingLog.steps || "",
      caloriesBurned: existingLog.caloriesBurned || "",
      waterLiters: existingLog.waterLiters || "",
    });
    setSaveStatus(null);
  };

  // Update form field
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveStatus(null);
  };

  // Submit all logs at once
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Only include fields that have values
    const updates = {};
    if (form.weight) updates.weight = Number(form.weight);
    if (form.steps) updates.steps = Number(form.steps);
    if (form.caloriesBurned) updates.caloriesBurned = Number(form.caloriesBurned);
    if (form.waterLiters) updates.waterLiters = Number(form.waterLiters);

    if (Object.keys(updates).length === 0) return;

    setSaveStatus("saving");
    updateDailyLog(logDate, updates);
    
    setTimeout(() => setSaveStatus("saved"), 300);
    setTimeout(() => setSaveStatus(null), 2000);
  };

  // Check if form has any data
  const hasData = form.weight || form.steps || form.caloriesBurned || form.waterLiters;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-sky-500" />
          Daily Log
        </h2>
        <input
          type="date"
          value={logDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg font-medium text-gray-700 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Weight */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="p-2 bg-green-100 rounded-lg">
            <Weight className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body Weight
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
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
          <div className="p-2 bg-blue-100 rounded-lg">
            <Footprints className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Steps Walked
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
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

        {/* Calories Burned */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calories Burned
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
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

        {/* Water Intake */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <Droplet className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Water Intake
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
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
          disabled={!hasData || saveStatus === "saving"}
          className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-all ${
            saveStatus === "saved"
              ? "bg-green-500"
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
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Daily Log
            </>
          )}
        </button>
      </form>

      {/* Quick Stats Preview */}
      {hasData && (
        <div className="mt-6 pt-4 border-t">
          <p className="text-sm text-gray-500 text-center">
            Logging for <span className="font-semibold text-gray-700">{logDate}</span>
            {logDate === today && " (Today)"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;