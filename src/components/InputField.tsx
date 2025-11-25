import React from "react";

const InputField = ({
  label,
  value,
  type = "text",
  placeholder = "",
  disabled = false,
  min,
  onChange,
}) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-600 font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`px-4 py-2 rounded-lg border w-full outline-none transition
          ${disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"}
          focus:ring-2 focus:ring-sky-400 border-gray-300`}
      />
    </div>
  );
};

export default InputField;
