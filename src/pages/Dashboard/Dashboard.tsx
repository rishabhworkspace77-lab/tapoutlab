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

// --- Global Configuration ---
const apiKey = ""; // API Key provided by runtime

// --- Constants ---
/**
 * List of predefined exercises for the dropdown menu.
 */
const EXERCISE_OPTIONS = [
  "Squat", "Bench Press", "Deadlift", "Overhead Press", 
  "Barbell Row", "Pull Up", "Dumbbell Curl", "Leg Press", 
  "Lat Pulldown", "Plank"
];

// --- Mock Data ---

const MOCK_PROFILE = {
  id: 'demo-user-123',
  name: 'Jane Doe (Demo)',
  phone: '555-010-DEMO',
  email: 'jane.demo@tapout.com',
  sex: 'Female',
  age: 28,
  weightKg: 65,
  targetWeight: 60,
  heightFt: 5.4,
  foodAllergies: 'Nuts, Dairy',
  fitnessGoal: 'Weight Loss',
  dietType: 'Vegetarian',
  dailyActivity: 'Moderate',
};

const MOCK_WEIGHT_LOGS = [
  ['2025-10-01', 70],
  ['2025-10-08', 69.5],
  ['2025-10-15', 68.8],
  ['2025-10-22', 68.0],
  ['2025-10-29', 67.5],
  ['2025-11-05', 67.2],
  ['2025-11-12', 66.8],
  ['2025-11-19', 66.5],
  ['2025-11-26', 66.1],
  ['2025-12-03', 65.8],
].map(([date, weight], index) => ({
  id: `wlog-${index}-${Math.random()}`,
  date: date,
  weightKg: weight,
  timestamp: new Date(date).getTime(),
})).sort((a, b) => a.timestamp - b.timestamp);

const MOCK_EXERCISE_LOGS = [
  { exerciseName: 'Squat', weight: 80, reps: 5, date: '2025-12-03', oneRepMax: 90 },
  { exerciseName: 'Bench Press', weight: 60, reps: 8, date: '2025-12-01', oneRepMax: 72 },
  { exerciseName: 'Deadlift', weight: 100, reps: 3, date: '2025-11-29', oneRepMax: 108 },
].map((log, index) => ({
  ...log,
  id: `elog-${index}-${Math.random()}`,
  timestamp: new Date(log.date).getTime(),
})).sort((a, b) => b.timestamp - a.timestamp);

const MOCK_PHOTO_LOGS = [
  { id: 'p1', date: '2025-10-01', frontUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Start+Front', sideUrl: 'https://placehold.co/300x400/e2e8f0/1e293b?text=Start+Side' },
  { id: 'p2', date: '2025-12-03', frontUrl: 'https://placehold.co/300x400/e0f2fe/0369a1?text=Current+Front', sideUrl: 'https://placehold.co/300x400/e0f2fe/0369a1?text=Current+Side' },
];

// --- Helper Components ---

/**
 * Displays a single statistic in a card format.
 */
const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex items-start justify-between hover:shadow-xl transition-shadow">
    <div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-gray-800 mt-1">{value}</h4>
      {subtext && <p className={`text-xs mt-2 ${colorClass}`}>{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
  </div>
);

const SuggestionCard = ({ title, value, advice, icon: Icon, colorName }) => (
  <div className={`p-5 rounded-xl border border-${colorName}-100 bg-${colorName}-50 flex flex-col gap-3`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 bg-white rounded-lg text-${colorName}-600 shadow-sm`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className={`font-bold text-${colorName}-900`}>{title}</h4>
    </div>
    <div>
      <div className={`text-2xl font-bold text-${colorName}-700`}>{value}</div>
      <p className={`text-xs text-${colorName}-600 mt-1 leading-relaxed`}>{advice}</p>
    </div>
  </div>
);

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

/**
 * Reusable Select Dropdown component.
 */
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

// --- Core Sections ---

/**
 * 1. Dashboard Home
 * Overview section showing high-level KPIs and goal progress.
 */
const DashboardHome = ({ profile, weightLogs }) => {
  // 1. Sort logs to ensure accurate Start vs Current comparison
  const sortedLogs = [...weightLogs].sort((a, b) => a.timestamp - b.timestamp);
  
  // 2. Derive weights strictly from logs if available, else profile defaults
  const startWeight = sortedLogs.length > 0 ? sortedLogs[0].weightKg : profile.weightKg;
  const currentWeight = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].weightKg : profile.weightKg;
  
  // 3. Calculate Metrics
  const heightM = profile.heightFt * 0.3048;
  const bmi = (currentWeight / (heightM * heightM)).toFixed(1);
  const weightDiff = (currentWeight - startWeight).toFixed(1);
  const isWeightLoss = weightDiff < 0;
  const target = profile.targetWeight || startWeight;
  
  // Progress Calculation
  const totalToLose = startWeight - target;
  const lostSoFar = startWeight - currentWeight;
  // Prevent division by zero or negative progress visualization bugs
  let progressPercent = 0;
  if (totalToLose !== 0) {
      progressPercent = Math.min(Math.max((lostSoFar / totalToLose) * 100, 0), 100);
  }

  // 4. BMR & TDEE Calculation (Mifflin-St Jeor Equation) to generate suggestions
  // Activity Multipliers: Sedentary 1.2, Light 1.375, Moderate 1.55, Heavy 1.725
  let activityMultiplier = 1.2;
  if (profile.dailyActivity === 'Light') activityMultiplier = 1.375;
  if (profile.dailyActivity === 'Moderate') activityMultiplier = 1.55;
  if (profile.dailyActivity === 'Heavy') activityMultiplier = 1.725;

  // BMR Formula
  let bmr = 10 * currentWeight + 6.25 * (profile.heightFt * 30.48) - 5 * profile.age;
  bmr = profile.sex === 'Female' ? (bmr - 161) : (bmr + 5);

  // TDEE (Total Daily Energy Expenditure)
  const tdee = Math.round(bmr * activityMultiplier);
  
  // Calorie Target based on Goal
  let calorieTarget = tdee;
  let adviceText = "Maintain current intake.";
  
  if (profile.fitnessGoal === 'Weight Loss') {
    calorieTarget = tdee - 500; // Deficit
    adviceText = "Deficit required to lose ~0.5kg/week.";
  } else if (profile.fitnessGoal === 'Weight Gain') {
    calorieTarget = tdee + 500; // Surplus
    adviceText = "Surplus required to build muscle.";
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-sky-400">Hello, {profile.name.split(' ')[0]}! 👋</h1>
          <p className="opacity-80 mt-2 text-sm md:text-base max-w-lg">
            Current Focus: <span className="font-semibold text-white">{profile.fitnessGoal}</span>. 
            Based on your stats, we have calculated a personalized plan below.
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg text-center min-w-[100px]">
          <div className="text-xs text-sky-200 uppercase font-bold tracking-wider">Status</div>
          <div className="font-bold text-lg">{bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : 'Overweight'}</div>
        </div>
      </div>

      {/* Key Performance Indicators (KPIs) */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-sky-600" /> Live Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Starting Weight" 
            value={`${startWeight} kg`} 
            subtext={`Recorded on ${new Date(sortedLogs[0]?.date).toLocaleDateString()}`}
            icon={Weight} 
            colorClass="text-gray-500" 
          />
          <StatCard 
            title="Current Weight" 
            value={`${currentWeight} kg`} 
            subtext={`${Math.abs(weightDiff)}kg ${isWeightLoss ? 'lost' : 'gained'} total`}
            icon={Activity} 
            colorClass={isWeightLoss ? "text-green-600" : "text-orange-500"} 
          />
           <StatCard 
            title="Target Weight" 
            value={`${profile.targetWeight || 'N/A'} kg`} 
            subtext={`${Math.abs(currentWeight - (profile.targetWeight || 0)).toFixed(1)}kg to go`}
            icon={Target} 
            colorClass="text-sky-600" 
          />
          <StatCard 
            title="Current BMI" 
            value={bmi} 
            subtext="18.5 - 24.9 is ideal"
            icon={Info} 
            colorClass={bmi > 25 ? "text-orange-500" : "text-purple-600"} 
          />
        </div>
      </div>

      {/* Goal Progress Bar */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex justify-between items-end mb-2">
            <h3 className="text-lg font-bold text-gray-800">Overall Progress</h3>
            <span className="text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
              {Math.round(progressPercent)}% Completed
            </span>
        </div>
        <div className="relative pt-1">
          <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-100">
            <div 
              style={{ width: `${progressPercent}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-1000"
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 font-medium uppercase tracking-wider">
            <span>Start: {startWeight}kg</span>
            <span>Goal: {target}kg</span>
          </div>
        </div>
      </div>

      {/* Actionable Suggestions Grid */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-500" /> Daily Action Plan
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Nutrition Suggestion */}
          <SuggestionCard 
            title="Calories / Day"
            value={`${calorieTarget} kcal`}
            advice={adviceText}
            icon={Flame}
            colorName="orange"
          />

          {/* 2. Hydration Suggestion (Approx 35ml per kg) */}
          <SuggestionCard 
            title="Hydration Goal"
            value={`${(currentWeight * 0.035).toFixed(1)} Liters`}
            advice="Water is key for metabolism & recovery."
            icon={Droplet}
            colorName="blue"
          />

          {/* 3. Activity Suggestion */}
          <SuggestionCard 
            title="Daily Steps"
            value={profile.dailyActivity === 'Sedentary' ? '8,000+' : '10,000+'}
            advice="Maintain NEAT (Non-Exercise Activity)."
            icon={Footprints}
            colorName="green"
          />
        </div>
      </div>
    </div>
  );
};
/**
 * 2. Profile Section
 * Allows users to view and edit their personal details.
 */
const ProfileSection = ({ profile, setProfile, onSaveProfile }) => {
  const [localProfile, setLocalProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleSave = () => {
    setStatus('saving');
    setTimeout(() => {
      onSaveProfile(localProfile);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setIsEditing(false);
      }, 1500);
    }, 1000);
  };

  const handleCancel = () => {
    setLocalProfile(profile);
    setIsEditing(false);
  };

  const updateProfileField = (key, value) => {
    setLocalProfile({ ...localProfile, [key]: value });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl space-y-6 relative animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <UserIcon className="w-6 h-6 mr-2 text-sky-500" /> Profile Details
        </h2>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition font-medium"
          >
            <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
          </button>
        ) : (
          <button 
            onClick={handleCancel}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            <X className="w-4 h-4 mr-2" /> Cancel
          </button>
        )}
      </div>

      <div className={`transition-opacity duration-300 ${isEditing ? 'opacity-100' : 'opacity-90'}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField disabled={!isEditing} label="Full Name" type="text" value={localProfile.name} onChange={(v) => updateProfileField('name', v)} />
          <InputField disabled={!isEditing} label="Phone Number" type="tel" value={localProfile.phone} onChange={(v) => updateProfileField('phone', v)} />
          <InputField disabled={!isEditing} label="Email" type="email" value={localProfile.email} onChange={(v) => updateProfileField('email', v)} />
        </div>

        <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-4 border-t pt-4">Physical Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <SelectField disabled={!isEditing} label="Sex" value={localProfile.sex} options={['Male', 'Female', 'Other']} onChange={(v) => updateProfileField('sex', v)} />
          <InputField disabled={!isEditing} label="Age" type="number" min={1} value={localProfile.age} onChange={(v) => updateProfileField('age', v)} />
          <InputField disabled={!isEditing} label="Weight (kg)" type="number" min={1} value={localProfile.weightKg} onChange={(v) => updateProfileField('weightKg', v)} />
          <InputField disabled={!isEditing} label="Height (ft)" type="number" min={1} value={localProfile.heightFt} onChange={(v) => updateProfileField('heightFt', v)} />
          <InputField disabled={!isEditing} label="Target Weight (kg)" type="number" min={1} value={localProfile.targetWeight || ''} onChange={(v) => updateProfileField('targetWeight', v)} placeholder="Target" />
        </div>

        <h3 className="text-xl font-semibold text-gray-700 mt-8 mb-4 border-t pt-4">Fitness & Dietary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField disabled={!isEditing} label="Food Allergies" type="text" value={localProfile.foodAllergies} onChange={(v) => updateProfileField('foodAllergies', v)} />
          <SelectField disabled={!isEditing} label="Fitness Goal" value={localProfile.fitnessGoal} options={['Weight Loss', 'Weight Gain', 'Maintenance']} onChange={(v) => updateProfileField('fitnessGoal', v)} />
          <SelectField disabled={!isEditing} label="Daily Activity" value={localProfile.dailyActivity} options={['Sedentary', 'Light', 'Moderate', 'Heavy']} onChange={(v) => updateProfileField('dailyActivity', v)} />
        </div>
      </div>

      {isEditing && (
        <div className="pt-6 border-t mt-8 flex justify-end bg-gray-50 p-4 -mx-6 -mb-6 rounded-b-xl animate-fade-in">
          <button
            onClick={handleSave}
            disabled={status === 'saving'}
            className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-full hover:bg-sky-700 transition duration-200 disabled:bg-sky-400 shadow-lg flex items-center"
          >
            {status === 'saving' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" /> Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" /> Save Changes
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * 3. Photo Journal Section
 * Calendar based interface for logging and viewing progress photos.
 */
const PhotoJournalSection = ({ photoLogs, onSavePhotoLog }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tempFront, setTempFront] = useState(null);
  const [tempSide, setTempSide] = useState(null);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDate(null);
  };

  const getLogForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return photoLogs.find(log => log.date === dateStr);
  };

  const handleDateClick = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const existingLog = photoLogs.find(log => log.date === dateStr);
    
    setSelectedDate(dateStr);
    setTempFront(existingLog ? existingLog.frontUrl : null);
    setTempSide(existingLog ? existingLog.sideUrl : null);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'front') setTempFront(reader.result);
        if (type === 'side') setTempSide(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const savePhotos = () => {
    if (selectedDate && (tempFront || tempSide)) {
      onSavePhotoLog({
        id: `plog-${Date.now()}`,
        date: selectedDate,
        frontUrl: tempFront,
        sideUrl: tempSide
      });
      setSelectedDate(null);
    }
  };

  const sortedLogs = [...photoLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstLog = sortedLogs.length > 0 ? sortedLogs[0] : null;
  const lastLog = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1] : null;
  const showComparison = sortedLogs.length >= 2;

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="p-6 bg-white rounded-xl shadow-xl border border-gray-100 flex justify-between items-center">
         <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <ImageIcon className="w-6 h-6 mr-2 text-sky-500" /> Photo Gallery
            </h2>
            <p className="text-gray-500 text-sm mt-1">Track your visual transformation over time.</p>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left: Calendar */}
         <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
              <h3 className="text-xl font-bold text-gray-800">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm font-medium text-gray-500">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const hasLog = getLogForDate(day);
                const isSelected = selectedDate === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                return (
                  <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all
                      ${isSelected ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}
                    `}
                  >
                    <span className="text-sm font-medium">{day}</span>
                    {hasLog && (
                      <span className={`absolute bottom-2 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-sky-500'}`}></span>
                    )}
                  </button>
                );
              })}
            </div>
         </div>

         {/* Right: Action Panel */}
         <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col">
            {selectedDate ? (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" /> Entry: {selectedDate}
                </h3>
                
                <div className="space-y-4 flex-1">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition relative group">
                    {tempFront ? (
                      <img src={tempFront} alt="Front" className="w-full h-40 object-cover rounded-md" />
                    ) : (
                      <div className="py-8 text-gray-400">
                        <Camera className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs">Front View</p>
                      </div>
                    )}
                     <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition relative group">
                    {tempSide ? (
                      <img src={tempSide} alt="Side" className="w-full h-40 object-cover rounded-md" />
                    ) : (
                      <div className="py-8 text-gray-400">
                        <Camera className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-xs">Side View</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'side')} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button onClick={savePhotos} className="flex-1 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition">
                    Save Entry
                  </button>
                  <button onClick={() => setSelectedDate(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500">
                <Camera className="w-12 h-12 mb-3 text-gray-300" />
                <p className="font-medium">Select a date on the calendar to upload or view photos.</p>
              </div>
            )}
         </div>
       </div>

       {showComparison && (
         <div className="bg-slate-900 rounded-xl p-8 shadow-2xl text-white">
            <h3 className="text-2xl font-bold mb-6 flex items-center text-sky-400">
              <TrendingUp className="w-6 h-6 mr-2" /> Transformation Journey
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <div className="bg-slate-800 rounded-lg p-2 relative">
                    <span className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-full text-xs font-bold">BEFORE ({firstLog.date})</span>
                    <img src={firstLog.frontUrl} alt="Start" className="w-full h-64 object-cover rounded-md opacity-90" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="bg-slate-800 rounded-lg p-2 relative">
                    <span className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-full text-xs font-bold">AFTER ({lastLog.date})</span>
                    <img src={lastLog.frontUrl} alt="Current" className="w-full h-64 object-cover rounded-md" />
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

/**
 * 4. Diet Chart Section
 * Generates and displays a 7-day meal plan using AI.
 */
const DietChartSection = ({ profile }) => {
  const [dietData, setDietData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateDietPlan = async () => {
    if (!profile.fitnessGoal || !profile.weightKg) {
      setError('Please complete your profile details (Weight, Goal, etc.) first.');
      return;
    }
    setIsLoading(true);
    setError('');
    setDietData(null);

    const userDetails = `
      Name: ${profile.name || 'User'}
      Current Weight: ${profile.weightKg} kg
      Target Weight: ${profile.targetWeight || 'Not specified'} kg
      Goal: ${profile.fitnessGoal}
      Diet Type: ${profile.dietType}
      Allergies: ${profile.foodAllergies || 'None'}
      Activity Level: ${profile.dailyActivity}
    `;

    const systemPrompt = `
      You are a certified nutritionist. Create a 7-day meal plan in strict JSON format.
      The response must be a valid JSON object with this exact structure:
      {
        "schedule": [
          { "day": "Day 1", "breakfast": "...", "lunch": "...", "snack": "...", "dinner": "..." },
          ... (for 7 days)
        ],
        "physiological_impact": "A detailed explanation of exactly what these meals do to the body to achieve the ${profile.fitnessGoal} goal. Explain the biological impact of the selected macronutrients."
      }
      Do not use Markdown code blocks (like \`\`\`json). Just return the raw JSON string.
    `;

    const userQuery = `Generate a 7-day ${profile.fitnessGoal} diet chart for this user:\n${userDetails}`;

    if (!apiKey) {
      setTimeout(() => {
        setDietData({
          schedule: Array.from({ length: 7 }).map((_, i) => ({
            day: `Day ${i + 1}`,
            breakfast: "Oatmeal with berries & nuts",
            lunch: "Grilled Chicken/Tofu Salad",
            snack: "Greek Yogurt or Apple",
            dinner: "Steamed Vegetables with Quinoa"
          })),
          physiological_impact: "This diet focuses on high protein and fiber to boost metabolism and satiety. The complex carbohydrates provide sustained energy without spiking insulin, while the healthy fats support hormonal balance. This combination forces the body to utilize stored fat for energy (lipolysis) while preserving lean muscle mass."
        });
        setIsLoading(false);
      }, 1500);
      return;
    }

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      let textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(textResponse);
      setDietData(parsedData);

    } catch (e) {
      console.error(e);
      setError('Failed to generate a structured plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl space-y-6 animate-fade-in">
      <div className="flex justify-between items-center border-b pb-3 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-sky-500" /> Personalized Diet Chart
        </h2>
        <span className="text-xs font-semibold text-sky-600 bg-sky-100 px-3 py-1 rounded-full">
          {profile.dietType}
        </span>
      </div>

      {!dietData && (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <p className="text-gray-600 mb-4 text-center max-w-md">
            Generate a comprehensive 7-day meal plan tailored to your <strong>{profile.fitnessGoal}</strong> goal and <strong>{profile.dietType}</strong> preferences.
          </p>
          <button 
            onClick={generateDietPlan} 
            disabled={isLoading} 
            className="px-8 py-3 bg-pink-600 text-white font-bold rounded-full hover:bg-pink-700 shadow-lg flex items-center transition transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
            {isLoading ? 'Designing Plan...' : 'Generate Weekly Chart'}
          </button>
          {error && <p className="mt-4 text-red-500 text-sm flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> {error}</p>}
        </div>
      )}

      {dietData && (
        <div className="animate-fade-in">
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-start">
              <Target className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-bold text-indigo-800">Commitment Required</h4>
                <p className="text-indigo-700 text-sm mt-1">
                  Strictly follow this weekly schedule until you achieve your target weight of 
                  <span className="font-bold"> {profile.targetWeight || 'your goal'} kg</span>. 
                  Consistency is the key to physiological adaptation.
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl shadow-sm border border-gray-200 mb-8">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-white uppercase bg-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">Day</th>
                  <th scope="col" className="px-6 py-4">Breakfast</th>
                  <th scope="col" className="px-6 py-4">Lunch</th>
                  <th scope="col" className="px-6 py-4">Snack</th>
                  <th scope="col" className="px-6 py-4 rounded-tr-lg">Dinner</th>
                </tr>
              </thead>
              <tbody>
                {dietData.schedule.map((day, index) => (
                  <tr key={index} className={`border-b hover:bg-sky-50 transition ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{day.day}</td>
                    <td className="px-6 py-4">{day.breakfast}</td>
                    <td className="px-6 py-4">{day.lunch}</td>
                    <td className="px-6 py-4">{day.snack}</td>
                    <td className="px-6 py-4">{day.dinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-green-50 rounded-xl p-6 border border-green-100 shadow-inner">
            <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
              <Activity className="w-5 h-5 mr-2" /> Physiological Impact & Benefits
            </h3>
            <p className="text-green-800 leading-relaxed">
              {dietData.physiological_impact}
            </p>
          </div>
          
          <div className="mt-6 flex justify-end">
             <button 
               onClick={() => setDietData(null)} 
               className="text-sm text-gray-500 hover:text-red-500 underline"
             >
               Reset / Generate New Plan
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Helper: Weight Chart for Progress Section
 */
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

/**
 * 5. Progress Tracker Section
 * Logs weight and exercise sets.
 */
const ProgressTracker = ({ weightLogs, exerciseLogs, profile, onLogWeight, onLogExercise }) => {
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [exWeight, setExWeight] = useState('');
  const [exReps, setExReps] = useState('');

  const handleLogWeight = () => {
    if (!currentWeight) return;
    onLogWeight({ id: Date.now(), date: logDate, weightKg: Number(currentWeight), timestamp: Date.now() });
    setCurrentWeight('');
  };

  const handleLogExercise = () => {
    if (!exerciseName || !exWeight || !exReps) return;
    const calculated1RM = Math.round(Number(exWeight) * (1 + Number(exReps) / 30));
    onLogExercise({ 
      id: Date.now(), date: logDate, exerciseName, 
      weight: Number(exWeight), reps: Number(exReps), oneRepMax: calculated1RM,
      timestamp: Date.now() 
    });
    setExWeight(''); setExReps('');
  };

  const dailyExercises = exerciseLogs.filter(log => log.date === logDate);

  return (
    <div className="p-6 bg-white rounded-xl shadow-2xl space-y-8 animate-fade-in">
      <div className="flex justify-between items-center border-b pb-3 mb-6">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-sky-500" /> Activity Logger
        </h2>
        <input 
          type="date" 
          value={logDate} 
          onChange={(e) => setLogDate(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg font-medium text-gray-700 focus:ring-sky-500 focus:border-sky-500"
        />
      </div>

      <div className="bg-gray-50 p-6 rounded-xl border grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Weight Log */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-gray-200 pb-6 lg:pb-0 lg:pr-6">
          <h3 className="font-semibold mb-4 flex items-center text-gray-700">
            <Weight className="w-4 h-4 mr-2" /> Daily Body Weight
          </h3>
          <div className="flex items-end gap-4"> 
            <div className="flex-1 min-w-0">
               <InputField label="Weight" type="number" value={currentWeight} onChange={setCurrentWeight} placeholder="kg" />
            </div>
            <button 
              onClick={handleLogWeight} 
              disabled={!currentWeight} 
              className="h-[42px] px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition shrink-0 shadow-sm"
            >
              Log
            </button>
          </div>
        </div>

        {/* Right: Exercise Log */}
        <div className="lg:col-span-8">
          <h3 className="font-semibold mb-4 flex items-center text-gray-700">
            <Dumbbell className="w-4 h-4 mr-2" /> Workout Session
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2 flex flex-col space-y-1">
               <label className="text-sm font-medium text-gray-700">Exercise</label>
               <select 
                 value={exerciseName} 
                 onChange={(e) => setExerciseName(e.target.value)}
                 className="p-2 border border-gray-300 rounded-lg bg-white focus:ring-sky-500 focus:border-sky-500 h-[42px]"
               >
                 <option value="" disabled>Select Exercise</option>
                 {EXERCISE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
               </select>
            </div>
            <div className="flex flex-col space-y-1">
               <InputField label="Weight (kg)" type="number" value={exWeight} onChange={setExWeight} placeholder="0" />
            </div>
            <div className="flex flex-col space-y-1">
               <InputField label="Reps" type="number" value={exReps} onChange={setExReps} placeholder="0" />
            </div>
          </div>
          <button 
            onClick={handleLogExercise} 
            disabled={!exerciseName || !exWeight || !exReps}
            className="mt-4 w-full py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-semibold shadow-md disabled:opacity-50 disabled:bg-sky-400 transition flex justify-center items-center"
          >
            <Zap className="w-4 h-4 mr-2" /> Add Set
          </button>
        </div>
      </div>

      {dailyExercises.length > 0 && (
        <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4">
          <h4 className="text-sm font-bold text-indigo-800 mb-3 uppercase tracking-wider">
            Session Summary ({logDate})
          </h4>
          <div className="space-y-2">
            {dailyExercises.map((log) => (
              <div key={log.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                <span className="font-medium text-gray-800">{log.exerciseName}</span>
                <div className="flex items-center gap-4 text-sm">
                   <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                     {log.weight}kg × {log.reps}
                   </span>
                   <span className="text-indigo-600 font-bold" title="Estimated One Rep Max">
                     1RM: {log.oneRepMax}
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t">
        <div>
          <h3 className="font-semibold text-gray-700 mb-4">Body Weight Trend</h3>
          <SimpleWeightChart weightLogs={weightLogs} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-4">Exercise Volume/Strength</h3>
          <SimpleExerciseChart exerciseLogs={exerciseLogs} />
        </div>
      </div>
    </div>
  );
};

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

// --- Main App Shell ---

const App = () => {
  // State for View Routing
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [viewBuffer, setViewBuffer] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App Data State
  const [profile, setProfile] = useState(MOCK_PROFILE);
  const [weightLogs, setWeightLogs] = useState(MOCK_WEIGHT_LOGS);
  const [exerciseLogs, setExerciseLogs] = useState(MOCK_EXERCISE_LOGS);
  const [photoLogs, setPhotoLogs] = useState(MOCK_PHOTO_LOGS);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initialization
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Handlers ---

  const handleSaveProfile = (newProfile) => setProfile(newProfile);

  const handleLogWeight = (newLog) => {
    setWeightLogs(prev => [...prev, newLog].sort((a, b) => a.timestamp - b.timestamp));
    setProfile(p => ({ ...p, weightKg: newLog.weightKg }));
  };

  const handleLogExercise = (newLog) => {
    setExerciseLogs(prev => [...prev, newLog].sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleSavePhotoLog = (newLog) => {
    setPhotoLogs(prev => {
      const filtered = prev.filter(p => p.date !== newLog.date);
      return [...filtered, newLog];
    });
  };

  const handleViewChange = (viewName) => {
    if (currentView === viewName) return;
    // Close menu on selection (for mobile)
    setIsMobileMenuOpen(false);
    setViewBuffer(true);
    setTimeout(() => {
      setCurrentView(viewName);
      setViewBuffer(false);
    }, 600); 
  };

  // --- Loading Screen ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <Loader2 className="w-12 h-12 text-sky-600 animate-spin mb-4" />
        <p className="text-lg font-medium text-gray-600">Initializing Tapout-Lab...</p>
      </div>
    );
  }

  // --- View Router ---
  const renderContent = () => {
    if (viewBuffer) {
      return (
        <div className="h-full flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-sky-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading section...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardHome profile={profile} weightLogs={weightLogs} />;
      case 'profile':
        return <ProfileSection profile={profile} setProfile={setProfile} onSaveProfile={handleSaveProfile} />;
      case 'dietChart':
        return <DietChartSection profile={profile} />;
      case 'progressTracker':
        return <ProgressTracker weightLogs={weightLogs} exerciseLogs={exerciseLogs} profile={profile} onLogWeight={handleLogWeight} onLogExercise={handleLogExercise} />;
      case 'photos':
        return <PhotoJournalSection photoLogs={photoLogs} onSavePhotoLog={handleSavePhotoLog} />;
      case 'videos':
        return <VideosSection />;
      default:
        return <div className="p-8 text-gray-500">Select a feature.</div>;
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, view: 'dashboard' },
    { name: 'Profile', icon: UserIcon, view: 'profile' },
    { name: 'Diet Chart', icon: BookOpen, view: 'dietChart' },
    { name: 'Gallery', icon: ImageIcon, view: 'photos' },
    { name: 'Tracker', icon: Activity, view: 'progressTracker' },
    { name: 'Library', icon: Zap, view: 'videos' },
  
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header (Hamburger) */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2 font-black text-sky-400">
          <Dumbbell className="w-6 h-6" />
          TAPOUT-LAB
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-800 rounded-lg">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation 
          - Fixed on Mobile (Slide out)
          - Fixed on Desktop (Left Column)
      */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white shadow-2xl p-4 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:fixed md:inset-y-0
      `}>
        <div className="text-2xl font-black text-sky-400 mb-8 pl-2 tracking-tighter flex items-center gap-2 hidden md:flex">
          <Dumbbell className="w-6 h-6" />
          TAPOUT-LAB
        </div>
        
        <nav className="flex-grow space-y-2 mt-4 md:mt-0">
          {navItems.map(({ name, icon: Icon, view }) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              disabled={viewBuffer}
              className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                currentView === view
                  ? 'bg-sky-600 text-white font-bold shadow-lg transform scale-105'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 mr-3 ${currentView === view ? 'text-white' : 'text-slate-500'}`} />
              {name}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center px-2">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-sm font-bold">
              {profile.name.charAt(0)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{profile.name}</p>
              <p className="text-xs text-slate-500 truncate">Free Plan</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area 
          - Full Width (w-full)
          - Full Height (min-h-screen)
          - Left Margin on Desktop only (md:ml-64)
      */}
      <main className="flex-1 md:ml-64 transition-all duration-300 bg-gray-100 min-h-screen flex flex-col">
        <div className="w-full p-4 md:p-6 lg:p-8 flex-grow">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;