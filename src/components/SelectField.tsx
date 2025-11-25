import React from "react";

const SelectField = ({
  label,
  value,
  disabled = false,
  options = [],
  onChange,
}) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 font-medium mb-1">{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`px-4 py-2 rounded-lg border w-full outline-none transition
          ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"}
          focus:ring-2 focus:ring-sky-400 border-gray-300`}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectField;
