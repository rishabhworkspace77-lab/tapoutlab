import { type FitnessGoal } from "../types/types";

// Define a structured type for a single exercise within the routine
export interface Exercise {
  name: string;
  sets: number;
  reps: string; // Range like "8-12" or "10-15"
  notes?: string;
  isCardio?: boolean;
}

// Define the structure for a single day in the routine
export interface DailyWorkout {
  day: string;
  theme: string;
  focus: string;
  exercises: Exercise[];
}

// Define the overall structure for all goal-based routines
export interface WorkoutRoutine {
  goal: FitnessGoal; // 'Weight Loss', 'Muscle Gain', 'Weight Gain'
  schedule: DailyWorkout[];
}

// =====================================================================
// 🏋️ MOCK ROUTINES
// =====================================================================

// --- Routine 1: Muscle Gain (Hypertrophy / PPL Split) ---
const MUSCLE_GAIN_ROUTINE: WorkoutRoutine = {
  goal: "Muscle Gain",
  schedule: [
    {
      day: "Day 1",
      theme: "Push A",
      focus: "Chest, Shoulders, Triceps",
      exercises: [
        { name: "Barbell Bench Press", sets: 3, reps: "6-8" },
        { name: "Incline Dumbbell Press", sets: 3, reps: "8-10" },
        { name: "Overhead Press (Seated)", sets: 3, reps: "8-10" },
        { name: "Lateral Raises", sets: 3, reps: "12-15", notes: "Use light weight for high volume." },
        { name: "Triceps Pushdown", sets: 3, reps: "10-15" },
        { name: "Overhead Triceps Extension", sets: 3, reps: "10-12" },
      ],
    },
    {
      day: "Day 2",
      theme: "Pull A",
      focus: "Back, Biceps, Traps",
      exercises: [
        { name: "Barbell Deadlift", sets: 3, reps: "5-7", notes: "Heavy work for strength." },
        { name: "Pull-ups (or Lat Pulldown)", sets: 3, reps: "8-12" },
        { name: "Seated Cable Rows", sets: 3, reps: "10-12" },
        { name: "Barbell Curls", sets: 3, reps: "8-10" },
        { name: "Hammer Curls", sets: 3, reps: "10-12" },
      ],
    },
    {
      day: "Day 3",
      theme: "Legs A",
      focus: "Quads, Hamstrings, Calves",
      exercises: [
        { name: "Barbell Squat", sets: 3, reps: "6-8" },
        { name: "Leg Press", sets: 3, reps: "10-12" },
        { name: "Hamstring Curls (Seated)", sets: 3, reps: "10-12" },
        { name: "Calf Raises (Standing)", sets: 4, reps: "15-20" },
        { name: "Abdominal Crunches", sets: 3, reps: "15-20" },
      ],
    },
    {
      day: "Day 4",
      theme: "Push B",
      focus: "Shoulders, Chest, Triceps (Variation)",
      exercises: [
        { name: "Dumbbell Overhead Press", sets: 3, reps: "8-10" },
        { name: "Dumbbell Flyes", sets: 3, reps: "12-15" },
        { name: "Cable Crossover", sets: 3, reps: "10-12" },
        { name: "Triceps Skullcrushers", sets: 3, reps: "8-10" },
        { name: "Cable Rope Pulldown", sets: 3, reps: "12-15" },
      ],
    },
    {
      day: "Day 5",
      theme: "Pull B",
      focus: "Back Width, Bicep Peak",
      exercises: [
        { name: "Bent-Over Barbell Row", sets: 3, reps: "8-10" },
        { name: "Wide-Grip Lat Pulldown", sets: 3, reps: "10-12" },
        { name: "Face Pulls", sets: 3, reps: "15-20", notes: "Focus on rear delts/shoulder health." },
        { name: "Preacher Curls", sets: 3, reps: "8-10" },
        { name: "Reverse Barbell Curls", sets: 3, reps: "12-15" },
      ],
    },
    {
      day: "Day 6",
      theme: "Legs B",
      focus: "Posterior Chain & Volume",
      exercises: [
        { name: "Romanian Deadlift", sets: 3, reps: "8-10" },
        { name: "Leg Extension", sets: 3, reps: "12-15" },
        { name: "Walking Lunges (per leg)", sets: 3, reps: "10-12" },
        { name: "Seated Calf Raises", sets: 4, reps: "15-20" },
      ],
    },
    { day: "Day 7", theme: "Rest", focus: "Recovery", exercises: [] },
  ],
};

// --- Routine 2: Weight Loss (Hybrid / Full Body Focus) ---
const WEIGHT_LOSS_ROUTINE: WorkoutRoutine = {
  goal: "Weight Loss",
  schedule: [
    {
      day: "Day 1",
      theme: "Full Body & Cardio",
      focus: "Compound movements and metabolic conditioning",
      exercises: [
        { name: "Goblet Squat", sets: 3, reps: "12-15" },
        { name: "Push-ups (or Machine Chest Press)", sets: 3, reps: "Max Reps" },
        { name: "Dumbbell Rows (per arm)", sets: 3, reps: "12-15" },
        { name: "Plank", sets: 3, reps: "60 seconds" },
        { name: "Treadmill Run/Brisk Walk", sets: 1, reps: "30 minutes", isCardio: true, notes: "Maintain 70-75% Max HR." },
      ],
    },
    {
      day: "Day 2",
      theme: "Active Recovery",
      focus: "Low intensity cardio and mobility",
      exercises: [
        { name: "Yoga/Stretching Session", sets: 1, reps: "45 minutes", isCardio: true },
        { name: "Stationary Bike", sets: 1, reps: "30 minutes", isCardio: true, notes: "Easy pace." },
      ],
    },
    {
      day: "Day 3",
      theme: "Upper Body & HIIT",
      focus: "Strength endurance and calorie burn",
      exercises: [
        { name: "Overhead Press (Dumbbell)", sets: 3, reps: "12-15" },
        { name: "Lat Pulldown (Neutral Grip)", sets: 3, reps: "12-15" },
        { name: "Triceps Dips", sets: 3, reps: "Max Reps" },
        { name: "Bicep Curls (Alternating)", sets: 3, reps: "15-20" },
        { name: "Burpees", sets: 3, reps: "15 Reps", notes: "Focus on form and speed." },
      ],
    },
    {
      day: "Day 4",
      theme: "Rest/Low Steps Goal",
      focus: "Focus on meeting 8,000+ steps.",
      exercises: [],
    },
    {
      day: "Day 5",
      theme: "Lower Body & Full Body Circuit",
      focus: "Leg volume and core strength",
      exercises: [
        { name: "Walking Lunges (per leg)", sets: 3, reps: "15-20" },
        { name: "Box Jumps (or Step-ups)", sets: 3, reps: "15-20" },
        { name: "Leg Extensions (Light Weight)", sets: 3, reps: "20-25" },
        { name: "Russian Twists", sets: 3, reps: "30 reps total" },
        { name: "Elliptical/Stair Climber", sets: 1, reps: "30 minutes", isCardio: true, notes: "High resistance." },
      ],
    },
    {
      day: "Day 6",
      theme: "Full Body Hybrid",
      focus: "Metabolic circuit targeting all major groups",
      exercises: [
        { name: "Thrusters (Dumbbell)", sets: 3, reps: "15-20" },
        { name: "Kettlebell Swings", sets: 3, reps: "20 reps" },
        { name: "Mountain Climbers", sets: 3, reps: "60 seconds" },
        { name: "Jumping Jacks", sets: 3, reps: "60 seconds" },
        { name: "Rowing Machine", sets: 1, reps: "20 minutes", isCardio: true },
      ],
    },
    { day: "Day 7", theme: "Rest", focus: "Complete rest/active recovery", exercises: [] },
  ],
};

// --- Routine 3: Weight Gain (Strength & Mass / Heavy Lifts) ---
const WEIGHT_GAIN_ROUTINE: WorkoutRoutine = {
  goal: "Weight Gain",
  schedule: [
    {
      day: "Day 1",
      theme: "Upper Body Strength",
      focus: "Heavy compounds, low volume",
      exercises: [
        { name: "Barbell Bench Press", sets: 4, reps: "4-6", notes: "Primary focus on strength." },
        { name: "Pendlay Row (Heavy)", sets: 4, reps: "5-7" },
        { name: "Military Press", sets: 3, reps: "6-8" },
        { name: "Close-Grip Bench Press", sets: 3, reps: "8-10" },
        { name: "Weighted Chin-ups", sets: 3, reps: "Max Reps" },
      ],
    },
    {
      day: "Day 2",
      theme: "Lower Body Strength",
      focus: "Squat/Deadlift variations",
      exercises: [
        { name: "Barbell Back Squat", sets: 4, reps: "4-6" },
        { name: "Sumo Deadlift", sets: 3, reps: "5-7" },
        { name: "Leg Press (Heavy)", sets: 3, reps: "6-8" },
        { name: "Calf Raises (Heavy)", sets: 3, reps: "8-10" },
        { name: "Hanging Leg Raises", sets: 3, reps: "10-15" },
      ],
    },
    {
      day: "Day 3",
      theme: "Rest/Low Steps Goal",
      focus: "High calorie intake, minimal movement.",
      exercises: [],
    },
    {
      day: "Day 4",
      theme: "Upper Body Volume",
      focus: "High volume for hypertrophy",
      exercises: [
        { name: "Incline Dumbbell Press", sets: 3, reps: "8-10" },
        { name: "T-Bar Row", sets: 3, reps: "8-10" },
        { name: "Dumbbell Shrugs", sets: 3, reps: "10-12" },
        { name: "Face Pulls", sets: 3, reps: "15-20" },
        { name: "Preacher Curls", sets: 3, reps: "8-10" },
        { name: "Triceps Rope Extension", sets: 3, reps: "10-12" },
      ],
    },
    {
      day: "Day 5",
      theme: "Lower Body Volume",
      focus: "Isolation movements and muscle fatigue",
      exercises: [
        { name: "Front Squat", sets: 3, reps: "8-10" },
        { name: "Hack Squat", sets: 3, reps: "10-12" },
        { name: "Seated Hamstring Curls", sets: 3, reps: "12-15" },
        { name: "Leg Extensions", sets: 3, reps: "12-15" },
        { name: "Weighted Oblique Crunches (per side)", sets: 3, reps: "15-20" },
      ],
    },
    {
      day: "Day 6",
      theme: "Active Recovery/Mobility",
      focus: "Light cardio (optional) and deep stretching.",
      exercises: [
        { name: "Foam Rolling / Static Stretching", sets: 1, reps: "30 minutes" },
        { name: "Brisk Walk (Optional)", sets: 1, reps: "20 minutes", isCardio: true, notes: "No high-intensity effort." },
      ],
    },
    { day: "Day 7", theme: "Rest", focus: "Recovery and high caloric intake", exercises: [] },
  ],
};

// =====================================================================
// 📦 Export All Routines
// =====================================================================

export const MOCK_ROUTINES: WorkoutRoutine[] = [
  MUSCLE_GAIN_ROUTINE,
  WEIGHT_LOSS_ROUTINE,
  WEIGHT_GAIN_ROUTINE,
];