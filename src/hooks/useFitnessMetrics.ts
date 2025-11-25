// src/hooks/useFitnessMetrics.ts

import { useMemo } from "react";
import { MOCK_PROFILE } from "../data/mockDB";

// ─────────────────────────────────────────────────────────────
// TYPES & UTILITIES (Moved from DashboardHome)
// ─────────────────────────────────────────────────────────────

// Define the shape of a single log entry
export interface DailyLogEntry {
    weight?: number | string;
    weightKg?: number | string;
    steps?: number | string;
    stepCount?: number | string;
    caloriesBurned?: number | string;
    calories?: number | string;
    waterLiters?: number | string;
    water?: number | string;
    exercises?: Array<any>; // Use a more specific type if known
    timestamp?: number | string;
}

// Define the shape of the user profile
export interface Profile {
    name: string;
    weightKg: number | string; // Use number for actual value, but allow string from input
    heightFt: number | string;
    age: number | string;
    sex: "Male" | "Female" | "Other";
    targetWeight: number | string;
    fitnessGoal: "Weight Loss" | "Weight Gain" | "Maintenance" | string;
    dailyActivity: "Sedentary" | "Light" | "Moderate" | "Heavy" | string;
    createdAt?: string;
    startDate?: string;
}

// Define the shape of the final calculated metrics object
export interface FitnessMetrics {
    startWeight: number;
    startDate: string | null;
    currentWeight: number;
    currentWeightSource: "profile" | "today" | "lastLog";
    currentWeightDate: string | null;
    sortedLogs: Array<DailyLogEntry & { weightKg: number | null, date: string, timestamp: number }>;
    bmi: number;
    bmiLabel: string;
    bmiColorClass: string;
    targetWeight: number;
    lostSoFar: number;
    progressPercent: number;
    activityMultiplier: number;
    bmr: number;
    tdee: number;
    calorieTarget: number;
    adviceText: string;
    hydrationGoalL: number;
    stepGoal: number;
    fitnessGoal: string;
}

const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseNumber = (value: any, fallback: number | null = null): number | null => {
    if (value === "" || value === null || value === undefined) return fallback;
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const parseWeight = (value: any): number | null => {
    if (value === "" || value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) && num > 0 && num < 1000 ? num : null;
};

const getBmiCategory = (bmi: number) => {
    if (bmi <= 0) return { label: "Unknown", colorClass: "text-gray-600" };
    if (bmi < 18.5) return { label: "Underweight", colorClass: "text-blue-500" };
    if (bmi < 25) return { label: "Healthy", colorClass: "text-green-600" };
    if (bmi < 30) return { label: "Overweight", colorClass: "text-orange-500" };
    return { label: "Obese", colorClass: "text-red-500" };
};

const getActivityMultiplier = (activity: string) => {
    const multipliers: { [key: string]: number } = {
        Sedentary: 1.2,
        Light: 1.375,
        Moderate: 1.55,
        Heavy: 1.725,
    };
    return multipliers[activity] || 1.2;
};


// ─────────────────────────────────────────────────────────────
// CUSTOM HOOK
// ─────────────────────────────────────────────────────────────

export const useFitnessMetrics = (
    pProfile: Partial<Profile> | null | undefined, 
    pDailyLogs: { [key: string]: DailyLogEntry } | null | undefined
): { metrics: FitnessMetrics; todayData: any; goalStatus: any; today: string } => {

    // Ensure we have profile and logs, falling back to mock/empty
    const profile = (pProfile as Profile) || (MOCK_PROFILE as Profile);
    const dailyLogs = pDailyLogs || {};
    const today = getTodayKey();
    
    // --- CORE METRICS CALCULATION (Your original useMemo logic) ---
    const metrics = useMemo((): FitnessMetrics => {
        
        // 1. Starting weight is ALWAYS from profile (the baseline)
        const startWeight = parseNumber(profile.weightKg, 70)!; // Use ! because we provide a fallback
        const startDate = profile.createdAt || profile.startDate || null;

        // 2. Parse all daily logs into sorted array for historical tracking
        const sortedLogs = Object.entries(dailyLogs)
            .map(([dateKey, entry]) => {
                const rawWeight = entry?.weightKg ?? entry?.weight;
                const weightValue = parseWeight(rawWeight);
                
                return {
                    date: dateKey,
                    timestamp: parseNumber(entry?.timestamp, new Date(dateKey).getTime())!,
                    weightKg: weightValue,
                    steps: parseNumber(entry?.steps || entry?.stepCount, 0)!,
                    caloriesBurned: parseNumber(entry?.caloriesBurned || entry?.calories, 0)!,
                    waterLiters: parseNumber(entry?.waterLiters || entry?.water, 0)!,
                    exercises: Array.isArray(entry?.exercises) ? entry.exercises : [],
                };
            })
            .filter((log) => log.weightKg !== null)
            // 🐛 FIX APPLIED HERE: Move the type assertion to the end 
            // of the entire chain to prevent syntax error on the next line.
            .sort((a, b) => a.timestamp - b.timestamp) as any[];

        // 3. Current weight priority: today's log → latest daily log → starting weight (profile)
        const todayLog = dailyLogs[today];
        const latestLog = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1] : null;

        const todayWeightRaw = todayLog?.weightKg ?? todayLog?.weight;
        const todayWeightParsed = parseWeight(todayWeightRaw);

        let currentWeight = startWeight;
        let currentWeightSource: FitnessMetrics['currentWeightSource'] = "profile";
        let currentWeightDate = startDate;

        if (todayWeightParsed !== null) {
            currentWeight = todayWeightParsed;
            currentWeightSource = "today";
            currentWeightDate = today;
        } else if (latestLog !== null && latestLog.weightKg !== null) {
            currentWeight = latestLog.weightKg;
            currentWeightSource = "lastLog";
            currentWeightDate = latestLog.date;
        }
        
        // 4. Profile measurements
        const heightFt = parseNumber(profile.heightFt, 5.5)!;
        const heightMeters = heightFt * 0.3048;
        const heightCm = heightFt * 30.48;
        const age = Math.max(1, parseNumber(profile.age, 25)!)!;
        const sex = profile.sex || "Male";

        // 5. BMI calculation (uses currentWeight)
        const bmi = heightMeters > 0
            ? parseNumber((currentWeight / (heightMeters ** 2)).toFixed(1), 0)!
            : 0;
        const { label: bmiLabel, colorClass: bmiColorClass } = getBmiCategory(bmi);

        // 6. Target & progress
        const targetWeight = parseNumber(profile.targetWeight, startWeight)!;
        const totalChange = startWeight - targetWeight;
        const achievedChange = startWeight - currentWeight;

        let progressPercent = 0;
        if (totalChange !== 0) {
            const progressNumerator = totalChange > 0 ? achievedChange : (currentWeight - startWeight);
            const progressDenominator = totalChange > 0 ? totalChange : (targetWeight - startWeight);
            
            progressPercent = (progressNumerator / progressDenominator) * 100;
        }
        progressPercent = Math.min(Math.max(progressPercent, 0), 100);

        // 7. BMR & TDEE (Mifflin-St Jeor, uses currentWeight)
        const activityMultiplier = getActivityMultiplier(profile.dailyActivity);
        let bmr = 10 * currentWeight + 6.25 * heightCm - 5 * age;
        bmr = sex.toLowerCase() === "female" ? bmr - 161 : bmr + 5;
        bmr = Math.max(0, Math.round(bmr));
        const tdee = Math.max(0, Math.round(bmr * activityMultiplier));

        // 8. Calorie target based on goal
        const fitnessGoal = (profile.fitnessGoal || "").toLowerCase();
        let calorieTarget = tdee;
        let adviceText = "Maintain current intake.";

        if (fitnessGoal.includes("loss")) {
            calorieTarget = Math.max(1200, tdee - 500); // Max 0.5kg/week loss safety net
            adviceText = "Deficit target (~0.5kg/week loss).";
        } else if (fitnessGoal.includes("gain")) {
            calorieTarget = tdee + 500;
            adviceText = "Surplus target to build mass.";
        }

        // 9. Daily goals
        // Hydration: ~35ml per kg body weight
        const hydrationGoalL = parseNumber((currentWeight * 0.035).toFixed(1))!; 
        const stepGoal = profile.dailyActivity === "Sedentary" ? 8000 : 10000;

        return {
            startWeight, startDate, currentWeight, currentWeightSource, currentWeightDate, sortedLogs,
            bmi, bmiLabel, bmiColorClass, targetWeight, lostSoFar: achievedChange,
            progressPercent: Math.round(progressPercent),
            activityMultiplier, bmr, tdee, calorieTarget, adviceText,
            hydrationGoalL, stepGoal, fitnessGoal,
        };
    }, [profile, dailyLogs]); // Dependencies remain the same

    // --- TODAY'S SNAPSHOT (Your original useMemo logic) ---
    const todayData = useMemo(() => {
        const entry = dailyLogs[today] || {};
        const rawWeight = entry.weightKg ?? entry.weight;

        return {
            weight: parseWeight(rawWeight),
            steps: parseNumber(entry.steps || entry.stepCount, 0)!,
            caloriesBurned: parseNumber(entry.caloriesBurned || entry.calories, 0)!,
            water: parseNumber(entry.waterLiters || entry.water, 0)!,
            exercises: Array.isArray(entry.exercises) ? entry.exercises : [],
            hasData: Object.keys(entry).length > 0,
        };
    }, [dailyLogs, today]);

    // --- DAILY GOAL STATUS (Your original useMemo logic) ---
    const goalStatus = useMemo(() => {
        const stepsMet = todayData.steps >= metrics.stepGoal;
        const waterMet = todayData.water >= metrics.hydrationGoalL - 0.1; // Allow small floating point tolerance
        
        // Define calories met based on having at least moderate activity logged
        const caloriesMet = metrics.fitnessGoal.includes("loss")
          ? todayData.caloriesBurned >= metrics.tdee * 0.3 // Ensure a reasonable workout was logged (e.g., 30% of TDEE)
          : todayData.caloriesBurned >= 200; // Just ensure some intentional activity was logged

        return {
            stepsMet,
            waterMet,
            caloriesMet,
            allMet: stepsMet && waterMet && caloriesMet,
        };
    }, [todayData, metrics]);


    return { metrics, todayData, goalStatus, today };
};