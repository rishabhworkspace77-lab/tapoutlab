import React, { useMemo, useState } from "react";
import {
  Activity, Weight, Target, Info, Zap, Flame, Droplet,
  Footprints, Trophy, Thermometer, CheckCircle, Smile,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// MOCK DATA & COMPONENTS (for demo purposes)
// ─────────────────────────────────────────────────────────────

const MOCK_PROFILE = {
  username: "Alex Johnson",
  weightKg: 85,
  heightFt: 5.9,
  age: 28,
  sex: "Male",
  targetWeight: 75,
  fitnessGoal: "Weight Loss",
  dailyActivity: "Moderate",
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
};

const MOCK_DAILY_LOGS = {
  "2025-01-15": { weightKg: 84.5, steps: 8500, caloriesBurned: 450, waterLiters: 2.1, exercises: [] },
  "2025-01-20": { weightKg: 83.8, steps: 10200, caloriesBurned: 520, waterLiters: 2.5, exercises: [{ name: "Running", duration: 30 }] },
  "2025-02-01": { weightKg: 82.5, steps: 9800, caloriesBurned: 480, waterLiters: 2.3, exercises: [] },
  "2025-11-23": { weightKg: 80.2, steps: 11500, caloriesBurned: 580, waterLiters: 2.8, exercises: [{ name: "Squats", sets: 3, reps: 12, weight: 60 }] },
};

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, tooltip }: any) => (
  <div className="bg-white p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <h4 className="text-sm font-medium text-gray-600">{title}</h4>
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </div>
    <div className={`text-2xl font-bold ${colorClass} mb-1`}>{value}</div>
    <p className="text-xs text-gray-500">{subtext}</p>
    {tooltip && <div className="text-xs text-gray-400 mt-1 italic">{tooltip}</div>}
  </div>
);

const SuggestionCard = ({ title, value, advice, icon: Icon, colorName }: any) => {
  const colorMap: any = {
    red: "text-red-500 bg-red-50 border-red-200",
    blue: "text-blue-500 bg-blue-50 border-blue-200",
    green: "text-green-500 bg-green-50 border-green-200",
  };
  return (
    <div className={`p-5 rounded-xl border shadow-md ${colorMap[colorName] || "bg-gray-50"}`}>
      <div className="flex items-center gap-3 mb-3">
        <Icon className={`w-6 h-6 ${colorMap[colorName]?.split(" ")[0]}`} />
        <h4 className="font-semibold text-gray-800">{title}</h4>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
      <p className="text-sm text-gray-600">{advice}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleDateString();
};

const parseNumber = (value: any, fallback = 0) => {
  if (value === "" || value === null || value === undefined) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const parseWeight = (value: any) => {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && num < 500 ? num : null;
};

const getBmiCategory = (bmi: number) => {
  if (bmi <= 0) return { label: "Unknown", colorClass: "text-gray-600" };
  if (bmi < 18.5) return { label: "Underweight", colorClass: "text-blue-500" };
  if (bmi < 25) return { label: "Healthy", colorClass: "text-green-600" };
  if (bmi < 30) return { label: "Overweight", colorClass: "text-orange-500" };
  return { label: "Obese", colorClass: "text-red-500" };
};

const getActivityMultiplier = (activity: string) => {
  const multipliers: Record<string, number> = {
    Sedentary: 1.2,
    Light: 1.375,
    Moderate: 1.55,
    Heavy: 1.725,
    "Very Heavy": 1.9,
  };
  return multipliers[activity] || 1.55;
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

const DashboardHome = ({ profile: pProfile, dailyLogs: pDailyLogs }: any) => {
  const [bmiModalOpen, setBmiModalOpen] = useState(false);
  const today = getTodayKey();

  // ─────────────────────────────────────────────────────────────
  // 1. NORMALIZE PROFILE DATA
  // ─────────────────────────────────────────────────────────────

  const profile = useMemo(() => {
    const raw = pProfile || MOCK_PROFILE;
    const nestedData = raw.data || {};
    
    // Handle height - convert to decimal feet for calculations
    let heightDecimalFt = 5.5; // default
    if (nestedData.heightDecimalFt) {
      // Use pre-calculated decimal feet if available (PRIORITY 1)
      heightDecimalFt = parseNumber(nestedData.heightDecimalFt, 5.5);
    } else if (nestedData.heightFt !== undefined && nestedData.heightIn !== undefined) {
      // Calculate from feet + inches (PRIORITY 2)
      const feet = parseNumber(nestedData.heightFt, 0);
      const inches = parseNumber(nestedData.heightIn, 0);
      heightDecimalFt = feet + (inches / 12);
    } else if (nestedData.heightFt || raw.heightFt) {
      // Check if it's stored as X.YY (feet.inches notation) - PRIORITY 3
      const heightValue = parseNumber(nestedData.heightFt || raw.heightFt, 5.5);
      const feet = Math.floor(heightValue);
      const decimalPart = heightValue - feet;
      
      // If decimal part looks like inches (e.g., 5.11 = 5'11"), convert it
      if (decimalPart > 0 && decimalPart <= 0.12) {
        const inches = Math.round(decimalPart * 100); // .11 becomes 11 inches
        heightDecimalFt = feet + (inches / 12);
      } else {
        // Already in decimal feet format
        heightDecimalFt = heightValue;
      }
    } else if (nestedData.heightCm) {
      // Convert from cm to decimal feet (PRIORITY 4 - FALLBACK ONLY)
      const cm = parseNumber(nestedData.heightCm, 0);
      heightDecimalFt = cm / 30.48;
    }
    
    return {
      ...raw,
      ...nestedData,
      name: raw.username || raw.name || "User",
      // Ensure all numeric fields have defaults
      weightKg: parseNumber(nestedData.weightKg || raw.weightKg, 70),
      heightFt: heightDecimalFt,
      age: parseNumber(nestedData.age || raw.age, 25),
      targetWeight: parseNumber(nestedData.targetWeight || raw.targetWeight, 70),
      sex: nestedData.sex || raw.sex || "Male",
      dailyActivity: nestedData.dailyActivity || raw.dailyActivity || "Moderate",
      fitnessGoal: nestedData.fitnessGoal || raw.fitnessGoal || "Maintain",
    };
  }, [pProfile]);

  const dailyLogs = pDailyLogs || MOCK_DAILY_LOGS;

  // ─────────────────────────────────────────────────────────────
  // 2. PROCESS DAILY LOGS & DETERMINE CURRENT WEIGHT
  // ─────────────────────────────────────────────────────────────
  const weightTracking = useMemo(() => {
    // Starting weight is ALWAYS from profile (baseline)
    const startWeight = profile.weightKg;
    const startDate = profile.createdAt || new Date().toISOString();

    // Parse and sort all weight logs
    const weightLogs = Object.entries(dailyLogs)
      .map(([dateKey, entry]: [string, any]) => {
        const rawWeight = entry?.weightKg ?? entry?.weight;
        const weightValue = parseWeight(rawWeight);
        return {
          date: dateKey,
          timestamp: new Date(dateKey).getTime(),
          weightKg: weightValue,
        };
      })
      .filter((log) => log.weightKg !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Determine current weight with clear priority
    const todayLog = dailyLogs[today];
    const todayWeightRaw = todayLog?.weightKg ?? todayLog?.weight;
    const todayWeight = parseWeight(todayWeightRaw);

    let currentWeight = startWeight;
    let currentWeightSource = "profile";
    let currentWeightDate = startDate;

    if (todayWeight !== null) {
      // Priority 1: Today's logged weight
      currentWeight = todayWeight;
      currentWeightSource = "today";
      currentWeightDate = today;
    } else if (weightLogs.length > 0) {
      // Priority 2: Most recent historical weight
      const latest = weightLogs[weightLogs.length - 1];
      currentWeight = latest.weightKg;
      currentWeightSource = "lastLog";
      currentWeightDate = latest.date;
    }
    // Priority 3: Profile weight (already set as default)

    return {
      startWeight,
      startDate,
      currentWeight,
      currentWeightSource,
      currentWeightDate,
      weightLogs,
      todayWeight,
    };
  }, [profile, dailyLogs, today]);

  // ─────────────────────────────────────────────────────────────
  // 3. CALCULATE BMI (using current weight)
  // ─────────────────────────────────────────────────────────────
  const bmiData = useMemo(() => {
    const heightMeters = profile.heightFt * 0.3048;
    const bmi = heightMeters > 0 
      ? Number((weightTracking.currentWeight / (heightMeters ** 2)).toFixed(1))
      : 0;
    const { label, colorClass } = getBmiCategory(bmi);
    
    return { bmi, bmiLabel: label, bmiColorClass: colorClass, heightMeters };
  }, [profile.heightFt, weightTracking.currentWeight]);

  // ─────────────────────────────────────────────────────────────
  // 4. CALCULATE PROGRESS
  // ─────────────────────────────────────────────────────────────
  const progress = useMemo(() => {
    const { startWeight, currentWeight } = weightTracking;
    const { targetWeight } = profile;

    const totalChange = startWeight - targetWeight;
    const achievedChange = startWeight - currentWeight;
    
    let progressPercent = 0;
    if (Math.abs(totalChange) > 0.1) {
      // Weight loss scenario (target < start)
      if (totalChange > 0) {
        progressPercent = Math.max(0, Math.min(100, (achievedChange / totalChange) * 100));
      } 
      // Weight gain scenario (target > start)
      else {
        progressPercent = Math.max(0, Math.min(100, ((currentWeight - startWeight) / (targetWeight - startWeight)) * 100));
      }
    }

    const remaining = Math.abs(targetWeight - currentWeight);
    const direction = totalChange > 0 ? "loss" : totalChange < 0 ? "gain" : "maintain";

    return {
      totalChange,
      achievedChange,
      progressPercent: Math.round(progressPercent),
      remaining,
      direction,
    };
  }, [weightTracking, profile.targetWeight]);

  // ─────────────────────────────────────────────────────────────
  // 5. CALCULATE METABOLISM (BMR & TDEE)
  // ─────────────────────────────────────────────────────────────
  const metabolism = useMemo(() => {
    const { currentWeight } = weightTracking;
    const heightCm = profile.heightFt * 30.48;
    const age = Math.max(1, profile.age);
    const sex = profile.sex;
    const activityLevel = profile.dailyActivity;

    // Mifflin-St Jeor BMR Formula (uses CURRENT weight)
    let bmr = 10 * currentWeight + 6.25 * heightCm - 5 * age;
    bmr = sex === "Female" ? bmr - 161 : bmr + 5;
    bmr = Math.max(0, Math.round(bmr));

    // TDEE = BMR × Activity Multiplier
    const activityMultiplier = getActivityMultiplier(activityLevel);
    const tdee = Math.max(0, Math.round(bmr * activityMultiplier));

    // Calorie target based on goal
    const fitnessGoal = (profile.fitnessGoal || "").toLowerCase();
    let calorieTarget = tdee;
    let adviceText = "Maintain current intake to preserve weight.";

    if (fitnessGoal.includes("loss") || fitnessGoal.includes("lose")) {
      calorieTarget = Math.max(1200, tdee - 500); // 500 cal deficit
      adviceText = "500 kcal deficit for ~0.5kg/week loss.";
    } else if (fitnessGoal.includes("gain") || fitnessGoal.includes("bulk")) {
      calorieTarget = tdee + 500; // 500 cal surplus
      adviceText = "500 kcal surplus to build muscle mass.";
    }

    return {
      bmr,
      tdee,
      activityMultiplier,
      calorieTarget,
      adviceText,
    };
  }, [weightTracking.currentWeight, profile]);

  // ─────────────────────────────────────────────────────────────
  // 6. TODAY'S DATA & GOALS
  // ─────────────────────────────────────────────────────────────
  const todayData = useMemo(() => {
    const entry = dailyLogs[today] || {};
    const steps = parseNumber(entry.steps || entry.stepCount, 0);
    const caloriesBurned = parseNumber(entry.caloriesBurned || entry.calories, 0);
    const water = parseNumber(entry.waterLiters || entry.water, 0);
    const exercises = Array.isArray(entry.exercises) ? entry.exercises : [];

    // Dynamic goals based on profile
    const hydrationGoal = Number((weightTracking.currentWeight * 0.035).toFixed(1));
    const stepGoal = profile.dailyActivity === "Sedentary" ? 8000 : 10000;
    
    // Calculate minimum calorie burn goal
    const calorieGoal = profile.fitnessGoal.toLowerCase().includes("loss")
      ? Math.round(metabolism.tdee * 0.25) // 25% of TDEE for weight loss
      : 250; // Minimum 250 for maintenance/gain

    return {
      steps,
      caloriesBurned,
      water,
      exercises,
      weight: weightTracking.todayWeight,
      hasData: Object.keys(entry).length > 0,
      goals: {
        steps: stepGoal,
        water: hydrationGoal,
        calories: calorieGoal,
      },
    };
  }, [dailyLogs, today, weightTracking, profile, metabolism]);

  // ─────────────────────────────────────────────────────────────
  // 7. GOAL STATUS
  // ─────────────────────────────────────────────────────────────
  const goalStatus = useMemo(() => {
    const stepsMet = todayData.steps >= todayData.goals.steps;
    const waterMet = todayData.water >= (todayData.goals.water - 0.1);
    const caloriesMet = todayData.caloriesBurned >= todayData.goals.calories;

    return {
      stepsMet,
      waterMet,
      caloriesMet,
      allMet: stepsMet && waterMet && caloriesMet,
    };
  }, [todayData]);

  // ─────────────────────────────────────────────────────────────
  // 8. RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-sky-400">
              Hello, {profile.name.split(" ")[0]}! 👋
            </h1>
            <p className="opacity-90 mt-2 text-sm max-w-lg">
              Current Focus: <span className="font-semibold text-white">{profile.fitnessGoal}</span>
              {" • "}Activity Level: <span className="font-semibold">{profile.dailyActivity}</span>
            </p>
          </div>
          <button
            onClick={() => setBmiModalOpen(true)}
            className="bg-white/10 backdrop-blur-sm p-4 rounded-xl hover:bg-white/20 transition-all hover:scale-105"
          >
            <div className="text-xs text-sky-200 uppercase font-bold tracking-wider">BMI</div>
            <div className={`font-bold text-2xl ${bmiData.bmiColorClass}`}>
              {bmiData.bmi > 0 ? bmiData.bmi : "N/A"}
            </div>
            <div className="text-xs text-sky-200 mt-1">{bmiData.bmiLabel}</div>
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-sky-600" /> Weight Tracking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Starting Weight"
            value={`${weightTracking.startWeight.toFixed(1)} kg`}
            subtext={`Baseline from ${formatDate(weightTracking.startDate)}`}
            icon={Weight}
            colorClass="text-gray-600"
          />
          <StatCard
            title="Current Weight"
            value={`${weightTracking.currentWeight.toFixed(1)} kg`}
            subtext={
              weightTracking.currentWeightSource === "today"
                ? "✓ Logged today"
                : weightTracking.currentWeightSource === "lastLog"
                ? `Last: ${formatDate(weightTracking.currentWeightDate)}`
                : "Using baseline"
            }
            icon={Activity}
            colorClass={progress.achievedChange > 0 ? "text-green-600" : progress.achievedChange < 0 ? "text-orange-500" : "text-gray-600"}
          />
          <StatCard
            title="Target Weight"
            value={`${profile.targetWeight.toFixed(1)} kg`}
            subtext={`${progress.remaining.toFixed(1)} kg to go`}
            icon={Target}
            colorClass="text-sky-600"
          />
          <button onClick={() => setBmiModalOpen(true)} className="text-left w-full">
            <StatCard
              title="Body Mass Index"
              value={bmiData.bmi > 0 ? bmiData.bmi : "N/A"}
              subtext={`${bmiData.bmiLabel} • Click for details`}
              icon={Info}
              colorClass={bmiData.bmiColorClass}
            />
          </button>
        </div>
      </section>

      {/* Today's Snapshot */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <h4 className="text-lg font-bold text-gray-800">Today's Activity • {today}</h4>
          {goalStatus.allMet && (
            <div className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-full">
              <CheckCircle className="w-5 h-5 mr-2" />
              All Goals Achieved! 🎉
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-xl transition-all ${goalStatus.stepsMet ? "bg-green-50 border-2 border-green-300 shadow-md" : "bg-gray-50 border border-gray-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase">Steps</span>
              {goalStatus.stepsMet && <CheckCircle className="w-4 h-4 text-green-600" />}
            </div>
            <div className="text-2xl font-bold text-gray-900">{todayData.steps.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">Goal: {todayData.goals.steps.toLocaleString()}</div>
          </div>

          <div className={`p-4 rounded-xl transition-all ${goalStatus.waterMet ? "bg-blue-50 border-2 border-blue-300 shadow-md" : "bg-gray-50 border border-gray-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase">Hydration</span>
              {goalStatus.waterMet && <CheckCircle className="w-4 h-4 text-blue-600" />}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {todayData.water > 0 ? `${todayData.water.toFixed(1)} L` : "—"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Goal: {todayData.goals.water} L</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Weight</div>
            <div className="text-2xl font-bold text-gray-900">
              {todayData.weight !== null ? `${todayData.weight.toFixed(1)} kg` : "—"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {todayData.weight !== null ? "✓ Logged" : "Not logged yet"}
            </div>
          </div>

          <div className={`p-4 rounded-xl transition-all ${goalStatus.caloriesMet ? "bg-orange-50 border-2 border-orange-300 shadow-md" : "bg-gray-50 border border-gray-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-600 uppercase">Calories</span>
              {goalStatus.caloriesMet && <CheckCircle className="w-4 h-4 text-orange-600" />}
            </div>
            <div className="text-2xl font-bold text-gray-900">{todayData.caloriesBurned}</div>
            <div className="text-xs text-gray-500 mt-1">Goal: {todayData.goals.calories} kcal</div>
          </div>
        </div>

        {todayData.exercises.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h5 className="text-sm font-bold text-gray-700 mb-3">Exercises Logged</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {todayData.exercises.map((ex: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-gradient-to-r from-sky-50 to-indigo-50 p-3 rounded-lg border border-sky-200">
                  <div>
                    <div className="text-sm font-bold text-gray-800">{ex.name || ex.exerciseName || "Exercise"}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {ex.sets ? `${ex.sets} sets × ${ex.reps || "—"} reps` : `${ex.duration || "—"} min`}
                    </div>
                  </div>
                  {ex.weight && <div className="text-sm font-bold text-sky-700">{ex.weight} kg</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Metabolism & Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Thermometer className="w-6 h-6 mr-2 text-red-500" /> Metabolism Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
              <div className="text-xs font-bold text-red-600 uppercase tracking-wide">Basal Metabolic Rate</div>
              <div className="text-3xl font-bold text-red-800 mt-2">{metabolism.bmr}</div>
              <div className="text-sm text-red-600 mt-1">kcal/day at rest</div>
              <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                Calories your body burns maintaining basic functions (breathing, circulation, etc.)
              </p>
            </div>

            <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wide">Total Daily Energy</div>
              <div className="text-3xl font-bold text-amber-800 mt-2">{metabolism.tdee}</div>
              <div className="text-sm text-amber-600 mt-1">kcal/day total</div>
              <p className="text-xs text-gray-600 mt-3 leading-relaxed">
                <span className="font-semibold">{profile.dailyActivity}</span> activity × {metabolism.activityMultiplier} multiplier
              </p>
            </div>
          </div>
          <div className="mt-4 p-4 bg-sky-50 rounded-lg border border-sky-200">
            <p className="text-sm text-gray-700">
              <span className="font-bold">Recommendation:</span> {metabolism.adviceText}
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-lg font-bold text-gray-800">Goal Progress</h3>
            <span className="text-xl font-bold text-sky-600 bg-sky-50 px-4 py-2 rounded-full">
              {progress.progressPercent}%
            </span>
          </div>
          
          <div className="relative mb-6">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 transition-all duration-1000 ease-out"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500">
              <span>{weightTracking.startWeight.toFixed(1)}kg</span>
              <span>{profile.targetWeight.toFixed(1)}kg</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Progress:</span>
              <span className="text-lg font-bold text-sky-600">
                {Math.abs(progress.achievedChange).toFixed(1)} kg
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Remaining:</span>
              <span className="text-lg font-bold text-gray-800">
                {progress.remaining.toFixed(1)} kg
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {progress.achievedChange > 0 && `You've lost ${progress.achievedChange.toFixed(1)}kg so far! Keep going! 💪`}
                {progress.achievedChange < 0 && `You've gained ${Math.abs(progress.achievedChange).toFixed(1)}kg. Stay focused on your goal.`}
                {progress.achievedChange === 0 && `Start tracking to see your progress!`}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Daily Action Plan */}
      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-yellow-500" /> Daily Action Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SuggestionCard
            title="Daily Calories"
            value={`${metabolism.calorieTarget} kcal`}
            advice={metabolism.adviceText}
            icon={Flame}
            colorName="red"
          />
          <SuggestionCard
            title="Hydration Target"
            value={`${todayData.goals.water} L`}
            advice="Drink consistently throughout the day for optimal hydration."
            icon={Droplet}
            colorName="blue"
          />
          <SuggestionCard
            title="Movement Goal"
            value={`${todayData.goals.steps.toLocaleString()} steps`}
            advice="Every step counts. Take breaks to walk throughout the day."
            icon={Footprints}
            colorName="green"
          />
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Trophy className="w-6 h-6 mr-2 text-amber-500" /> Achievements & Milestones
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <AchievementBadge
            icon={Trophy}
            title="Getting Started"
            subtitle="Profile created"
            unlocked={true}
          />
          <AchievementBadge
            icon={Trophy}
            title="5 Kg Milestone"
            subtitle={progress.achievedChange >= 5 ? "Achieved!" : `${(5 - progress.achievedChange).toFixed(1)}kg to go`}
            unlocked={progress.achievedChange >= 5}
            color="green"
          />
          <AchievementBadge
            icon={Trophy}
            title="Consistency"
            subtitle={weightTracking.weightLogs.length >= 7 ? "7+ logs" : "Keep logging"}
            unlocked={weightTracking.weightLogs.length >= 7}
            color="indigo"
          />
          <AchievementBadge
            icon={Trophy}
            title="Healthy BMI"
            subtitle={bmiData.bmi >= 18.5 && bmiData.bmi < 25 ? "In range!" : "Target"}
            unlocked={bmiData.bmi >= 18.5 && bmiData.bmi < 25}
            color="sky"
          />
          <AchievementBadge
            icon={Trophy}
            title="10 Kg Progress"
            subtitle={progress.achievedChange >= 10 ? "Outstanding!" : "Elite goal"}
            unlocked={progress.achievedChange >= 10}
            color="amber"
          />
          <AchievementBadge
            icon={Trophy}
            title="Goal Reached"
            subtitle={progress.progressPercent >= 100 ? "Complete!" : "Keep pushing"}
            unlocked={progress.progressPercent >= 100}
            color="green"
          />
        </div>
      </section>

      {/* BMI Modal */}
      {bmiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setBmiModalOpen(false)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div>
                <h4 className="text-2xl font-bold text-gray-900">Body Mass Index</h4>
                <p className="text-sm text-gray-600 mt-2">
                  Based on current weight: <span className="font-bold">{weightTracking.currentWeight.toFixed(1)} kg</span>
                </p>
              </div>
              <span className={`px-4 py-2 rounded-full font-bold text-sm ${bmiData.bmiColorClass} bg-gray-100`}>
                {bmiData.bmiLabel}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-sky-50 rounded-xl border border-sky-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-gray-700">Your BMI:</span>
                  <span className={`text-3xl font-bold ${bmiData.bmiColorClass}`}>{bmiData.bmi}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-gray-800 text-sm uppercase tracking-wide">BMI Categories</h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between p-2 rounded bg-blue-50">
                    <span>Underweight</span>
                    <span className="font-semibold text-blue-600">&lt; 18.5</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-green-50">
                    <span>Healthy Weight</span>
                    <span className="font-semibold text-green-600">18.5 - 24.9</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-orange-50">
                    <span>Overweight</span>
                    <span className="font-semibold text-orange-600">25.0 - 29.9</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-red-50">
                    <span>Obese</span>
                    <span className="font-semibold text-red-600">≥ 30.0</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-bold">Note:</span> BMI is a population-level screening tool. 
                  It doesn't account for muscle mass, bone density, or body composition. 
                  For a complete health assessment, combine BMI with other metrics like body fat percentage 
                  and consult healthcare professionals.
                </p>
              </div>

              <div className="text-xs text-gray-500 text-center">
                Formula: Weight (kg) ÷ Height² (m²)
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setBmiModalOpen(false)}
                className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-xl hover:bg-sky-700 transition-colors shadow-md hover:shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ACHIEVEMENT BADGE COMPONENT
// ─────────────────────────────────────────────────────────────

const AchievementBadge = ({ icon: Icon, title, subtitle, unlocked, color = "amber" }: any) => {
  const colorMap: any = {
    amber: "text-amber-500",
    green: "text-green-600",
    indigo: "text-indigo-500",
    sky: "text-sky-600",
  };
  const bgMap: any = {
    amber: "bg-amber-50 border-amber-300",
    green: "bg-green-50 border-green-300",
    indigo: "bg-indigo-50 border-indigo-300",
    sky: "bg-sky-50 border-sky-300",
  };

  return (
    <div
      className={`flex flex-col items-center p-4 border-2 rounded-xl shadow-sm text-center transition-all hover:scale-105 ${
        unlocked ? `${bgMap[color]} shadow-md` : "bg-gray-50 border-gray-200 opacity-50"
      }`}
    >
      <Icon className={`w-10 h-10 ${unlocked ? colorMap[color] : "text-gray-400"}`} />
      <p className="text-xs font-bold text-gray-800 mt-2">{title}</p>
      <p className="text-[10px] text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
};

export default DashboardHome;