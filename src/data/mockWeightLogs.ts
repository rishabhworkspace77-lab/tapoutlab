export const MOCK_WEIGHT_LOGS = [
  ['2025-10-01', 70],
  ['2025-10-08', 69.5],
  ['2025-10-15', 68.8],
  ['2025-10-22', 68.0],
  ['2025-10-29', 67.5],
  ['2025-11-05', 67.2],
  ['2025-11-12', 66.8],
  ['2025-11-19', 66.5],
  ['2025-11-26', 66.1],
  ['2025-12-03', 65.8],
].map(([date, weight], index) => ({
  id: `wlog-${index}-${Math.random()}`,
  date: date,
  weightKg: weight,
  timestamp: new Date(date).getTime(),
})).sort((a, b) => a.timestamp - b.timestamp);