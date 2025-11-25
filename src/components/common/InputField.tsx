import React, { useState, useEffect, useMemo } from 'react';
// Located near the top of the file
import {
  User as UserIcon,
  Activity,
  Zap,
  Dumbbell,
  BookOpen,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Weight,
  AlertTriangle,
  Loader2,
  CheckCircle,
  LayoutDashboard,
  TrendingUp,
  Edit2,
  Save,
  X,
  Target,
  ChevronLeft,
  ChevronRight,
  Camera,
  Menu,
  Info,
  // ADD THESE LINES:
  Flame, // Added
  Droplet, // Added
  Footprints // Added
} from 'lucide-react';

/**
 * Reusable Input Field component with standard styling.
 */
const InputField = ({ label, type, value, onChange, min = 0, placeholder = '', disabled = false }) => (
  <div className="flex flex-col space-y-1 w-full">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <input
      type={type}
      value={value}
      min={min}
      disabled={disabled}
      onChange={(e) => {
        const val = type === 'number' ? parseFloat(e.target.value) || '' : e.target.value;
        onChange(val);
      }}
      placeholder={placeholder}
      className={`p-2 border rounded-lg transition duration-150 shadow-sm w-full ${
        disabled 
        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' 
        : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500 bg-white'
      }`}
    />
  </div>
);


export default InputField;
