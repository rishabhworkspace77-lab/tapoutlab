import React from "react";

const SelectField = ({ label, value, options, onChange, disabled = false }) => (
  <div className="flex flex-col space-y-1 w-full">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`p-2 border rounded-lg transition duration-150 shadow-sm w-full ${
        disabled 
        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
        : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500 bg-white'
      }`}
    >
      <option value="" disabled>Select {label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default SelectField;
