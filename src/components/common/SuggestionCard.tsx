import React from "react";

const SuggestionCard = ({ title, value, advice, icon: Icon, colorName }) => {
  const colorMap = {
    orange: "text-orange-500 bg-orange-50",
    blue: "text-blue-500 bg-blue-50",
    green: "text-green-500 bg-green-50",
    red: "text-red-500 bg-red-50",
    purple: "text-purple-600 bg-purple-50",
  };

  const iconColor = colorMap[colorName] || "text-purple-600 bg-purple-50";

  return (
    <div className="p-5 rounded-xl border border-purple-100 bg-white flex flex-col gap-3 shadow-sm hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg shadow-sm ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h4 className="font-bold text-gray-800">{title}</h4>
      </div>

      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{advice}</p>
      </div>
    </div>
  );
};

export default SuggestionCard;
