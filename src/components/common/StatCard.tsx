import React, { useState, useRef, useEffect } from "react";

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, tooltip }) => {
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  // Close overlay when clicked outside
  useEffect(() => {
    const handleClick = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // --- Dynamic Popover Accent Colors ---
  let popoverAccentClass = 'text-sky-300'; // Default
  let popoverContextClass = 'text-blue-300'; // Default context
  let cardBorderClass = 'border'; // Default border class

  if (colorClass.includes('blue')) {
    popoverAccentClass = 'text-sky-300';
    popoverContextClass = 'text-blue-300';
    cardBorderClass = 'border border-blue-200';
  } else if (colorClass.includes('green')) {
    popoverAccentClass = 'text-emerald-300';
    popoverContextClass = 'text-green-300';
    cardBorderClass = 'border border-green-200';
  } else if (colorClass.includes('red')) {
    popoverAccentClass = 'text-rose-300';
    popoverContextClass = 'text-red-300';
    cardBorderClass = 'border border-red-200';
  }

  // Injecting the dynamic border class into the main card div
  return (
    <div 
      className={`relative bg-white p-5 rounded-xl shadow transition-all hover:shadow-lg ${cardBorderClass} hover:border-opacity-100 border-opacity-70`}
    >
      
      {/* --- Top-right Info Icon --- */}
      <div className="absolute top-3 right-3">
        <Icon
          // Use the dynamic colorClass for the icon
          className={`w-5 h-5 ${colorClass} cursor-pointer opacity-70 hover:opacity-100 transition`}
          onClick={() => tooltip && setOpen(!open)}
        />
      </div>

      {/* --- Main Content --- */}
      <h4 className="text-gray-500 text-sm">{title}</h4>

      <p className="text-2xl font-extrabold text-gray-900 mt-1">{value}</p>

      <p className="text-xs mt-1 text-gray-400">{subtext}</p>

      {/* --- Floating Popover --- */}
      {open && tooltip && (
        <div
          ref={popRef}
          className="
            absolute right-3 top-12 
            w-44 bg-slate-900 text-white 
            text-xs p-4 rounded-xl shadow-2xl z-30
            animate-fade-in border border-slate-700
          "
        >
          {/* Dynamic Popover Accent Text */}
          <div className={`font-semibold text-sm mb-1 ${popoverAccentClass}`}>BMI Status</div>
          <div className="text-white font-medium">{tooltip}</div>

          {/* subtle divider */}
          <div className="my-2 border-t border-slate-700"></div>

          {/* extra contextual description */}
          {tooltip === "Underweight" && (
            <div className={`text-[10px] ${popoverContextClass}`}>
              You may need higher calorie intake & strength training.
            </div>
          )}

          {tooltip === "Healthy" && (
            <div className={`text-[10px] ${popoverContextClass}`}>
              Great! Maintain current diet & activity level.
            </div>
          )}

          {tooltip === "Overweight" && (
            <div className={`text-[10px] ${popoverContextClass}`}>
              Focus on calorie deficit & daily step consistency.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;