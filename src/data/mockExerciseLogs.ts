export const MOCK_EXERCISE_LOGS = [
  { exerciseName: 'Squat', weight: 80, reps: 5, date: '2025-12-03', oneRepMax: 90 },
  { exerciseName: 'Bench Press', weight: 60, reps: 8, date: '2025-12-01', oneRepMax: 72 },
  { exerciseName: 'Deadlift', weight: 100, reps: 3, date: '2025-11-29', oneRepMax: 108 },
].map((log, index) => ({
  ...log,
  id: `elog-${index}-${Math.random()}`,
  timestamp: new Date(log.date).getTime(),
})).sort((a, b) => b.timestamp - a.timestamp);
