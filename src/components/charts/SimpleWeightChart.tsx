import React from "react";

const SimpleWeightChart = ({ weightLogs }) => {
    if (weightLogs.length < 2) return <p className="text-center text-gray-500 mt-2 py-5">Log more data to see chart.</p>;
    const sortedLogs = [...weightLogs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const weights = sortedLogs.map(log => log.weightKg);
    const min = Math.min(...weights) * 0.98;
    const max = Math.max(...weights) * 1.02;
    const displayLogs = sortedLogs.slice(-10);

    return (
        <div className="relative w-full h-64 bg-white p-4 rounded-xl border flex items-end justify-between overflow-hidden">
             {displayLogs.map((log) => {
                const h = ((log.weightKg - min) / (max - min)) * 100;
                return (
                  <div key={log.id} className="w-1/12 bg-sky-200 hover:bg-sky-400 transition-all rounded-t-md relative group" style={{ height: `${Math.max(h, 5)}%` }}>
                    <div className="absolute bottom-full mb-1 text-xs text-gray-800 opacity-0 group-hover:opacity-100 bg-white p-1 rounded shadow">{log.weightKg}</div>
                  </div>
                )
             })}
        </div>
    );
};


export default SimpleWeightChart;
