// src/sections/DietChart/DietChartSection.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Loader2,
  Zap,
  AlertTriangle,
  Target,
  Activity,
} from "lucide-react";

import { generateDietPlan as generatePlanAPI } from "../../gemini/generateDietPlan";
import { supabase } from "../../supabaseClient";

// --------------------------------------------------
// TYPES
// --------------------------------------------------
interface Profile {
  id: string;
  username?: string;
  email?: string;
  data?: {
    weightKg?: number;
    targetWeight?: number;
    fitnessGoal?: string;
    dailyActivity?: string;
    dietType?: string;
    foodAllergies?: string;
  } | null;
}

interface DaySchedule {
  day: string;
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
}

interface DietPlan {
  schedule: DaySchedule[];
  physiological_impact: string;
}

interface DietChartSectionProps {
  profile: Profile | null;
}

// --------------------------------------------------
// VALIDATORS & NORMALIZERS (Strict & Safe)
// --------------------------------------------------
const isString = (v: any): v is string => typeof v === "string" && v.trim().length > 0;

function isDaySchedule(obj: any): obj is DaySchedule {
  return (
    obj &&
    isString(obj.day) &&
    isString(obj.breakfast) &&
    isString(obj.lunch) &&
    isString(obj.snack) &&
    isString(obj.dinner)
  );
}

function isDietPlan(obj: any): obj is DietPlan {
  return (
    obj &&
    Array.isArray(obj.schedule) &&
    obj.schedule.length > 0 &&
    obj.schedule.every(isDaySchedule) &&
    isString(obj.physiological_impact)
  );
}

/** Try to coerce various legacy/flat formats into DaySchedule */
function normalizeDay(raw: any, idxFallback = 0): DaySchedule | null {
  if (!raw || typeof raw !== "object") return null;

  // If it's already DaySchedule-ish
  if (isDaySchedule(raw)) {
    return {
      day: raw.day,
      breakfast: raw.breakfast,
      lunch: raw.lunch,
      snack: raw.snack,
      dinner: raw.dinner,
    };
  }

  // Flat-old-format: keys breakfast/lunch/snack/dinner present
  const breakfast = (raw.breakfast ?? raw.BREAKFAST ?? "").toString().trim();
  const lunch = (raw.lunch ?? raw.LUNCH ?? "").toString().trim();
  const snack = (raw.snack ?? raw.SNACK ?? "").toString().trim();
  const dinner = (raw.dinner ?? raw.DINNER ?? "").toString().trim();
  const day = (raw.day ?? `Day ${idxFallback + 1}`).toString().trim();

  const allBlank = [breakfast, lunch, snack, dinner].every((s) => s === "" || s === "—");

  if (allBlank) {
    // Can't normalize
    return null;
  }

  return {
    day: day || `Day ${idxFallback + 1}`,
    breakfast: breakfast || "—",
    lunch: lunch || "—",
    snack: snack || "—",
    dinner: dinner || "—",
  };
}

/** Normalize an incoming raw plan to DietPlan or return null */
function normalizeDietPlan(raw: any): DietPlan | null {
  if (!raw) return null;

  // If already proper
  if (isDietPlan(raw)) return raw;

  // If raw.schedule is array-like, try to normalize each item
  const candidateSchedule = Array.isArray(raw.schedule)
    ? raw.schedule
    : // If the raw object itself looks like a single day, wrap into array
    (raw.day && (raw.breakfast || raw.lunch || raw.dinner) ? [raw] : null);

  if (!candidateSchedule) {
    // maybe raw is an array of days
    if (Array.isArray(raw)) {
      // treat as array of possibly-flat day objects
      const normalized = raw.map((r, i) => normalizeDay(r, i)).filter(Boolean) as DaySchedule[];
      if (normalized.length > 0) {
        return {
          schedule: normalized,
          physiological_impact: String(raw.physiological_impact ?? "Balanced plan."),
        };
      }
      return null;
    }
    return null;
  }

  const normalized = (candidateSchedule as any[])
    .map((r, i) => normalizeDay(r, i))
    .filter(Boolean) as DaySchedule[];

  if (normalized.length === 0) return null;

  const impact = isString(raw.physiological_impact)
    ? raw.physiological_impact
    : isString((candidateSchedule as any).physiological_impact)
    ? (candidateSchedule as any).physiological_impact
    : "A balanced diet plan to support your goals.";

  return {
    schedule: normalized,
    physiological_impact: impact,
  };
}

// --------------------------------------------------
// SAFE Supabase helpers
// --------------------------------------------------
async function deleteCorruptPlan(userId: string) {
  try {
    console.warn(`[DietChart] Deleting corrupt plan for user ${userId}`);
    await supabase.from("diet_plans").delete().eq("user_id", userId);
  } catch (e) {
    console.error("[DietChart] Failed to delete corrupt plan:", e);
  }
}

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------
const DietChartSection: React.FC<DietChartSectionProps> = ({ profile }) => {
  const userId = profile?.id ?? null;

  const [dietData, setDietData] = useState<DietPlan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Load plan
  const loadDietPlan = useCallback(async () => {
    if (!userId) {
      setIsLoadingPlan(false);
      return;
    }

    console.log("%c[DietChart] Loading diet plan from Supabase…", "color: blue");
    setIsLoadingPlan(true);
    setError("");

    try {
      const { data, error: dbErr } = await supabase
        .from("diet_plans")
        .select("plan")
        .eq("user_id", userId)
        .single();

      if (dbErr) {
        // Row not found is OK; other errors log
        if (dbErr.code !== "PGRST116") {
          console.error("[DietChart] Supabase->select error:", dbErr);
          setError("Failed to load saved plan.");
        } else {
          console.log("[DietChart] No existing diet plan found.");
        }
        setIsLoadingPlan(false);
        return;
      }

      const rawPlan = data?.plan;
      if (!rawPlan) {
        setIsLoadingPlan(false);
        return;
      }

      // Try to normalize & validate
      const normalized = normalizeDietPlan(rawPlan);
      if (!normalized || !Array.isArray(normalized.schedule) || normalized.schedule.length === 0) {
        // Corrupt or incompatible — delete it and notify user
        console.warn("[DietChart] Plan incomplete or corrupt:", rawPlan);
        await deleteCorruptPlan(userId);
        setDietData(null);
        setError("Saved diet plan was corrupted and has been removed. Please generate a new one.");
        setIsLoadingPlan(false);
        return;
      }

      console.log("%c[DietChart] Found and loaded valid plan.", "color: green");
      setDietData(normalized);
    } catch (e) {
      console.error("[DietChart] Unexpected load error:", e);
      setError("Unexpected error while loading plan.");
    } finally {
      setIsLoadingPlan(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDietPlan();
  }, [loadDietPlan]);

  // Save plan helper
  const saveDietPlan = useCallback(
    async (plan: DietPlan) => {
      if (!userId) return;
      try {
        console.log("%c[DietChart] Saving plan to Supabase…", "color: purple");
        const { error: upsertErr } = await supabase.from("diet_plans").upsert({
          user_id: userId,
          plan,
        });
        if (upsertErr) {
          console.error("[DietChart] Save error:", upsertErr);
          setError("Failed to save diet plan. Try again.");
        }
      } catch (e) {
        console.error("[DietChart] Save exception:", e);
        setError("Failed to save diet plan.");
      }
    },
    [userId]
  );

  // Generate new plan via Gemini helper
  const handleGeneratePlan = useCallback(async () => {
    if (!profile || !userId) return;

    const userData = profile.data ?? {};
    const weightKg = Number(userData.weightKg ?? 0);
    if (!weightKg || isNaN(weightKg) || weightKg <= 0) {
      setError("Please update your profile with a valid Current Weight (kg).");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      console.log("%c[DietChart] Calling Gemini API…", "color: orange");
      // generatePlanAPI should itself be robust; we still validate response here
      const raw = await generatePlanAPI(profile);

      if (!raw) {
        throw new Error("Gemini returned an empty response.");
      }

      // Try normalizing strict schema
      const normalized = normalizeDietPlan(raw);

      if (!normalized || !Array.isArray(normalized.schedule) || normalized.schedule.length === 0) {
        console.error("[DietChart] Gemini produced invalid plan:", raw);
        throw new Error("Received malformed diet plan from generator. Try again.");
      }

      // Ensure minimum of 1 day; prefer 7 but we accept normalized shorter plans (UI shows whatever present)
      console.log("%c[DietChart] Received valid plan from Gemini.", "color: green");
      setDietData(normalized);

      // Persist normalized plan
      await saveDietPlan(normalized);
    } catch (e: any) {
      console.error("[DietChart] Generation error:", e);
      setError(e?.message ?? "Failed to generate diet plan.");
    } finally {
      setIsGenerating(false);
    }
  }, [profile, userId, saveDietPlan]);

  // Reset/delete plan
  const handleReset = useCallback(async () => {
    if (!userId) return;

    try {
      console.log("%c[DietChart] Resetting diet plan…", "color: red");
      await supabase.from("diet_plans").delete().eq("user_id", userId);
      setDietData(null);
      setError("");
    } catch (e) {
      console.error("[DietChart] Reset error:", e);
      setError("Failed to reset plan.");
    }
  }, [userId]);

  // ----------------------
  // RENDER
  // ----------------------
  if (!profile) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-2xl text-center text-gray-500">
        Loading profile…
      </div>
    );
  }

  const userData = profile.data ?? {};

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl border space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BookOpen className="text-sky-600 w-8 h-8" /> Personalized Diet Chart
        </h2>

        <span className="text-xs font-semibold text-sky-600 bg-sky-100 px-3 py-1 rounded-full">
          {userData.dietType ?? "Balanced"}
        </span>
      </div>

      {/* Loading */}
      {isLoadingPlan && (
        <div className="flex flex-col items-center p-10 text-gray-600">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          Checking saved diet plan…
        </div>
      )}

      {/* Empty / generate */}
      {!isLoadingPlan && !dietData && (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <p className="text-gray-600 mb-4 text-center max-w-md">
            Generate a tailored 7-day meal plan for your{" "}
            <strong>{userData.fitnessGoal ?? "Weight Loss"}</strong> goal.
          </p>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="px-8 py-3 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 shadow-lg flex items-center transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Designing Plan...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Generate Weekly Chart
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 text-red-500 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" /> {error}
            </p>
          )}
        </div>
      )}

      {/* Plan (safe render) */}
      {!isLoadingPlan && dietData && (
        <div>
          {/* Goal banner */}
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <Target className="w-5 h-5 text-indigo-600 mr-3" />
              <div>
                <h4 className="font-bold text-indigo-800">Commitment Required</h4>
                <p className="text-indigo-700 text-sm mt-1">
                  Follow this plan consistently to reach your target weight of{" "}
                  <strong>{userData.targetWeight ?? "N/A"} kg</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 mb-8">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-white uppercase bg-slate-800">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">Day</th>
                  <th className="px-6 py-4">Breakfast</th>
                  <th className="px-6 py-4">Lunch</th>
                  <th className="px-6 py-4">Snack</th>
                  <th className="px-6 py-4 rounded-tr-lg">Dinner</th>
                </tr>
              </thead>

              <tbody>
                {(dietData.schedule ?? []).map((day, idx) => (
                  <tr
                    key={idx}
                    className={`border-b hover:bg-sky-50 transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-gray-900">{day.day}</td>
                    <td className="px-6 py-4">{day.breakfast}</td>
                    <td className="px-6 py-4">{day.lunch}</td>
                    <td className="px-6 py-4">{day.snack}</td>
                    <td className="px-6 py-4">{day.dinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Impact */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-100 shadow-inner">
            <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
              <Activity className="w-5 h-5 mr-2" /> Physiological Impact & Benefits
            </h3>
            <p className="text-green-800 leading-relaxed">{dietData.physiological_impact}</p>
          </div>

          {/* Reset */}
          <div className="mt-6 flex justify-end">
            <button onClick={handleReset} className="text-sm text-gray-500 hover:text-red-500 underline">
              Reset / Generate New Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DietChartSection;
