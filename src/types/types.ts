// src/types/types.ts

// The union type for all valid fitness goals used in the app.

export type FitnessGoal = 
  | "Fat Loss"
  | "Weight Loss"
  | "Weight Gain"
  | "Muscle Gain"
  | "Maintenance";

// The definition for the user's core data structure (MOCK_PROFILE).
export interface UserProfile {
  name: string;
  weightKg: number;
  targetWeight: number | null; // target weight can be optional/null if not set
  fitnessGoal: FitnessGoal;
  dietType: string;
  foodAllergies: string;
  dailyActivity: "Sedentary" | "Light" | "Moderate" | "Heavy";
  heightFt: number;
  age: number;
  sex: "Male" | "Female" | "Other" | string;
  // Note: Added optional fields that might exist in local state but not mockDB
  phone?: string; 
  email?: string;
}

// Interface for weight and activity logs (used by ProgressTracker)
export interface WeightLog {
    id: string;
    date: string;
    weightKg: number;
    timestamp: number;
    // Activity metrics added in ProgressTracker
    caloriesBurned?: number; 
    stepsTaken?: number;
}

// Interface for exercise set logs (used by ProgressTracker)
export interface ExerciseLog {
    id: string;
    date: string;
    exerciseName: string;
    reps: number;
    weight: number;
    timestamp: number;
    oneRepMax: number;
}

// Interface for the Daily Workout structure (from mockRoutine.tsx)
export interface Exercise {
    name: string;
    sets: number | string; // '3' or '2-3'
    reps: string; // '8-12', '10', or '30 min'
    notes?: string;
    isCardio?: boolean;
}

export interface DailyWorkout {
    day: string; // e.g., 'Day 1', 'Day 7'
    theme: string; // e.g., 'Push', 'Rest'
    focus: string;
    exercises: Exercise[];
}

export interface Routine {
    goal: FitnessGoal;
    duration: string;
    schedule: DailyWorkout[];
}