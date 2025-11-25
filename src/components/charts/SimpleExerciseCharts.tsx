import React, { useState, useMemo } from "react";
import { EXERCISE_OPTIONS } from "../../constants/exerciseOptions";
/**
 * Helper: Exercise Chart for Progress Section
 */
const SimpleExerciseChart = ({ exerciseLogs }) => {
  const [selectedExercise, setSelectedExercise] = useState(EXERCISE_OPTIONS[0]);

  const filteredLogs = useMemo(() => {
    return exerciseLogs
      .filter(log => log.exerciseName === selectedExercise)
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [exerciseLogs, selectedExercise]);

  if (filteredLogs.length < 2) {
    return (
      <div className="w-full h-64 bg-white p-6 rounded-xl border flex flex-col items-center justify-center text-center">
         <div className="mb-4">
            <label className="text-sm font-bold text-gray-700 mr-2">View Progress For:</label>
            <select 
              value={selectedExercise} 
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="p-1 border rounded text-sm"
            >
              {EXERCISE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
         </div>
         <p className="text-gray-400 text-sm">
           Not enough data. Log at least 2 sessions of <strong>{selectedExercise}</strong> to see the graph.
         </p>
      </div>
    );
  }

  const oneRepMaxes = filteredLogs.map(log => log.oneRepMax);
  const min = Math.min(...oneRepMaxes) * 0.9;
  const max = Math.max(...oneRepMaxes) * 1.1;
  const displayLogs = filteredLogs.slice(-10);

  return (
    <div className="bg-white p-6 rounded-xl border shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-700">Strength Progress (Estimated 1RM)</h3>
        <select 
          value={selectedExercise} 
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500"
        >
          {EXERCISE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="relative w-full h-56 flex items-end justify-between overflow-hidden px-2">
        {[0, 50, 100].map(p => (
           <div key={p} className="absolute w-full border-t border-gray-100" style={{ bottom: `${p}%`, left: 0 }}></div>
        ))}

        {displayLogs.map((log) => {
          const h = ((log.oneRepMax - min) / (max - min)) * 100;
          return (
            <div key={log.id} className="w-1/12 flex flex-col items-center group relative h-full justify-end">
              <div 
                className="w-full bg-indigo-400 hover:bg-indigo-600 transition-all rounded-t-md relative" 
                style={{ height: `${Math.max(h, 5)}%` }}
              >
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max bg-gray-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition z-10 pointer-events-none">
                  <div className="font-bold">{log.date}</div>
                  <div>1RM: {log.oneRepMax}kg</div>
                  <div className="text-gray-400 text-[10px]">{log.weight}kg x {log.reps}</div>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 mt-2 rotate-45 origin-left translate-x-2">
                {new Date(log.date).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  );
};


export default SimpleExerciseChart;
