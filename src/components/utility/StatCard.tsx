import React, { useState, useRef, useEffect } from "react";

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, tooltip }) => {
  const [open, setOpen] = useState(false);
  const cardRef = useRef(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cardRef.current && !cardRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative bg-white p-5 rounded-xl shadow hover:shadow-md transition-all border"
    >
      {/* --- Icon with click toggle --- */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => tooltip && setOpen((prev) => !prev)}
      >
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>

      {/* --- Tooltip --- */}
      {tooltip && open && (
        <div className="absolute right-2 top-10 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-20 animate-fade-in">
          {tooltip}
        </div>
      )}

      <h4 className="text-gray-500 text-sm mt-3">{title}</h4>

      <p className="text-xl font-bold text-gray-900">{value}</p>

      <p className="text-xs mt-1 text-gray-400">{subtext}</p>
    </div>
  );
};

export default StatCard;
