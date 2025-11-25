import React from "react";

import { Zap } from "lucide-react";

/**
 * 6. Videos Section
 * Placeholder for training content.
 */
const VideosSection = () => (
  <div className="p-6 bg-white rounded-xl shadow-2xl space-y-6 animate-fade-in">
    <h2 className="text-3xl font-bold text-gray-800 border-b pb-3 mb-6 flex items-center">
      <Zap className="w-6 h-6 mr-2 text-sky-500" /> Training Hub
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {['Full Body', 'Core', 'HIIT'].map((t, i) => (
        <div key={i} className="bg-gray-100 h-40 rounded-xl flex items-center justify-center text-gray-400 font-bold border-2 border-dashed">
          Video Placeholder: {t}
        </div>
      ))}
    </div>
  </div>
);

export default VideosSection;
