// src/data/mockDB.ts

// ---- Profile (default mock profile) ----
export const MOCK_PROFILE = {
  name: "Rishabh",
  weightKg: 72,
  targetWeight: 65,
  fitnessGoal: "Fat Loss",
  dietType: "Balanced",
  foodAllergies: "",
  dailyActivity: "Moderate",

  // Required Fields
  heightFt: 5.8, // or split later into feet/inches if needed
  age: 24,
  sex: "Male",
};

// ---- Photo Logs ----
export const MOCK_PHOTO_LOGS = [
  {
    id: "p1",
    date: "2025-10-01",
    frontUrl: "https://placehold.co/350x450/e2e8f0/1e293b?text=Start+Front",
    sideUrl: "https://placehold.co/350x450/e2e8f0/1e293b?text=Start+Side",
    // keep timestamp for consistency (ms since epoch)
    timestamp: new Date("2025-10-01").getTime(),
  },
  {
    id: "p2",
    date: "2025-12-03",
    frontUrl: "https://placehold.co/350x450/e0f2fe/0369a1?text=Current+Front",
    sideUrl: "https://placehold.co/350x450/e0f2fe/0369a1?text=Current+Side",
    timestamp: new Date("2025-12-03").getTime(),
  },
];

// ---- Weight Logs ----
export const MOCK_WEIGHT_LOGS = [
  {
    id: "w1",
    date: "2025-10-01",
    weightKg: 72,
    // timestamp in ms since epoch — used for reliable sorting & calculations
    timestamp: new Date("2025-10-01").getTime(),
  },
  {
    id: "w2",
    date: "2025-11-15",
    weightKg: 68,
    timestamp: new Date("2025-11-15").getTime(),
  },
  {
    id: "w3",
    date: "2025-12-03",
    weightKg: 66,
    timestamp: new Date("2025-12-03").getTime(),
  },
];

// ---- Exercise Logs ----
export const MOCK_EXERCISE_LOGS = [
  {
    id: "e1",
    date: "2025-11-01",
    exerciseName: "Bench Press",
    reps: 8,
    weight: 50,
    // make these real timestamps (ms) to avoid small-int ambiguity
    timestamp: new Date("2025-11-01").getTime(),
    oneRepMax: 62,
  },
  {
    id: "e2",
    date: "2025-12-01",
    exerciseName: "Bench Press",
    reps: 5,
    weight: 60,
    timestamp: new Date("2025-12-01").getTime(),
    oneRepMax: 69,
  },
];
