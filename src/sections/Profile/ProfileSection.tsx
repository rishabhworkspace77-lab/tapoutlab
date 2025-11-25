import React, { useState, useEffect } from "react";
import { Loader2, Save, Edit2, X, User, Ruler } from "lucide-react";
import { supabase } from "../../supabaseClient";

// Define the shape of the Profile object for better type safety (if available)
interface Profile {
  id: string;
  username: string;
  email: string;
  data: any | string | null; // Can be JSONB object or stringified JSONB from DB
}

interface ProfileSectionProps {
  profile: Profile | null; // Profile is now the actual data passed in, can be null initially
  setProfile: (p: Profile) => void;
}

// Define the shape of the Form State
interface ProfileFormState {
  username: string;
  email: string;
  phone: string;
  age: number | string;
  sex: string;
  weightKg: number | string;
  heightFt: number | string;
  heightIn: number | string;
  targetWeight: number | string;
  dietType: string;
  fitnessGoal: string;
  foodAllergies: string;
  dailyActivity: string;
}

const DietTypeOptions = [
  { value: "balanced", label: "Balanced" },
  { value: "keto", label: "Keto" },
  { value: "low-carb", label: "Low Carb" },
  { value: "high-protein", label: "High Protein" },
  { value: "vegetarian", label: "Vegetarian" }, // Added
  { value: "non-vegetarian", label: "Non-Vegetarian" }, // Added
  { value: "vegan", label: "Vegan" }, // Added
];

const GoalOptions = [
  { value: "Weight Loss", label: "Weight Loss" },
  { value: "Muscle Gain", label: "Muscle Gain" },
  { value: "Maintain", label: "Maintain" },
  { value: "Improve Endurance", label: "Improve Endurance" },
];

const ActivityOptions = [
  { value: "Sedentary", label: "Sedentary (desk job)" },
  { value: "Light", label: "Light (1-3 days/wk exercise)" },
  { value: "Moderate", label: "Moderate (3-5 days/wk exercise)" },
  { value: "Heavy", label: "Heavy (5-7 days/wk exercise)" },
  { value: "Very Heavy", label: "Very Heavy (athlete/physical job)" },
];

const SexOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
];

// ⚠️ IMPORTANT: In a real app, this ID comes from the Supabase Auth session
// This is used as a fallback/warning
const USER_ID_PLACEHOLDER = "user-id-from-session";

const ProfileSection: React.FC<ProfileSectionProps> = ({ profile: pProfile, setProfile }) => {
  // Use passed profile, or null if loading
  const profile = pProfile;
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // -------------------------------------------------------
  // UTILITY: Convert total feet (decimal) to feet + inches
  // -------------------------------------------------------
  const decimalFeetToFeetInches = (decimalFeet: number) => {
    const feet = Math.floor(decimalFeet);
    // Calculate remaining inches and round to nearest integer
    const inches = Math.round((decimalFeet - feet) * 12);
    // Handle rounding up to 12 inches (e.g., 5.999 ft -> 6'0")
    if (inches === 12) return { feet: feet + 1, inches: 0 };
    return { feet, inches };
  };

  // -------------------------------------------------------
  // UTILITY: Convert feet + inches to decimal feet
  // -------------------------------------------------------
  const feetInchesToDecimalFeet = (feet: number, inches: number) => {
    const result = feet + (inches / 12);
    return result;
  };

  // -------------------------------------------------------
  // UTILITY: Convert feet + inches to cm
  // -------------------------------------------------------
  const feetInchesToCm = (feet: number, inches: number) => {
    const totalInches = (feet * 12) + inches;
    return Math.round(totalInches * 2.54);
  };

  // -------------------------------------------------------
  // UTILITY: Convert cm to feet + inches
  // -------------------------------------------------------
  const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    // Handle rounding up to 12 inches
    if (inches === 12) return { feet: feet + 1, inches: 0 };
    return { feet, inches };
  };

  // -------------------------------------------------------
  // SYNC FORM WHEN PROFILE CHANGES (UPDATED LOGIC HERE)
  // -------------------------------------------------------
  useEffect(() => {
    // Only proceed if a profile object is actually available
    if (!profile) {
      setForm(null); // Keep in loading state if profile is null
      return;
    }

    console.log("🔄 ProfileSection: Syncing form with profile:", profile);

    // Ensure data is an object, even if it was stored as a stringified JSON (common DB issue)
    let d = profile.data || {};

    if (typeof d === 'string') {
      try {
        d = JSON.parse(d);
        console.log("📦 Parsed stringified profile.data");
      } catch (e) {
        console.error("❌ Failed to parse profile data:", e);
        d = {};
      }
    }

    console.log("📊 Profile data object:", d);

    // --- Height Parsing Logic (Kept as is) ---
    let heightFeet = 0;
    let heightInches = 0;

    if (d.heightFt !== undefined && d.heightIn !== undefined) {
      // 1. Already have feet and inches - USE THIS (most reliable)
      heightFeet = Number(d.heightFt) || 0;
      heightInches = Number(d.heightIn) || 0;
      console.log(`📏 Using feet+inches from data: ${heightFeet}'${heightInches}"`);
    } else if (d.heightDecimalFt) {
      // 2. Have pre-calculated decimal feet
      const decimalFt = Number(d.heightDecimalFt) || 0;
      const converted = decimalFeetToFeetInches(decimalFt);
      heightFeet = converted.feet;
      heightInches = converted.inches;
      console.log(`📏 Converted heightDecimalFt ${decimalFt}ft to ${heightFeet}'${heightInches}"`);
    } else if (d.heightFt !== undefined) {
      // 3. ⚠️ LEGACY/CORRUPTED: Only have a single number in heightFt
      const singleHeightValue = Number(d.heightFt) || 0;

      // Check if this looks like corrupted data (e.g., 5.10 or 5.11 stored instead of decimal 5.83 or 5.91)
      const decimalPart = singleHeightValue - Math.floor(singleHeightValue);
      // Check if the decimal part, when multiplied by 100, is close to an integer inch value (0-11)
      const suspectedInches = Math.round(decimalPart * 100);

      // Corrupted data check: If the decimal part is a clean two-digit number between .00 and .11
      // Check if the fractional part (multiplied by 100) is within 0.01 tolerance of the rounded integer value
      if (suspectedInches >= 0 && suspectedInches <= 11 && (Math.abs(decimalPart * 100 - suspectedInches) < 0.01)) {
        heightFeet = Math.floor(singleHeightValue);
        heightInches = suspectedInches;
        console.warn(`⚠️ DETECTED CORRUPTED HEIGHT DATA: ${singleHeightValue}ft → interpreting as ${heightFeet}'${heightInches}"`);
      } else {
        // Proper decimal feet, convert normally
        const converted = decimalFeetToFeetInches(singleHeightValue);
        heightFeet = converted.feet;
        heightInches = converted.inches;
        console.log(`📏 Converted decimal ${singleHeightValue}ft to ${heightFeet}'${heightInches}"`);
      }
    } else if (d.heightCm) {
      // 4. Have cm, convert to ft + in
      const converted = cmToFeetInches(Number(d.heightCm));
      heightFeet = converted.feet;
      heightInches = converted.inches;
      console.log(`📏 Converted ${d.heightCm}cm to ${heightFeet}'${heightInches}"`);
    }
    // -----------------------------------------

    const newFormState: ProfileFormState = {
      username: profile.username || "",
      email: profile.email || "",
      phone: d.phone || "",
      age: d.age || "",
      sex: d.sex || "Male",
      weightKg: d.weightKg || "",
      heightFt: heightFeet,
      heightIn: heightInches,
      targetWeight: d.targetWeight || "",
      dietType: d.dietType || "balanced",
      fitnessGoal: d.fitnessGoal || "Weight Loss",
      foodAllergies: d.foodAllergies || "None",
      dailyActivity: d.dailyActivity || "Moderate",
    };

    setForm(newFormState);

    // Force editing mode if mandatory fields missing (Good for first-time users)
    if (!d.weightKg || (!d.heightFt && !d.heightCm)) {
      setEditing(true);
    }

  }, [profile]);

  // -------------------------------------------------------
  // UPDATE FORM
  // -------------------------------------------------------
  const update = (field: keyof ProfileFormState, value: any) => {
    setForm((prev) => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  // -------------------------------------------------------
  // GET CALCULATED HEIGHT DISPLAY
  // -------------------------------------------------------
  const getHeightDisplay = () => {
    const feet = Number(form?.heightFt) || 0;
    const inches = Number(form?.heightIn) || 0;
    const cm = feetInchesToCm(feet, inches);

    if (feet === 0 && inches === 0) return "—";
    return `${feet}'${inches}" (${cm} cm)`;
  };

  // -------------------------------------------------------
  // SAVE PROFILE (Now uses real Supabase client)
  // -------------------------------------------------------
  const handleSave = async () => {
    // ⚠️ CRITICAL: Replace USER_ID_PLACEHOLDER with the actual logged-in user's ID
    const userId = profile?.id || USER_ID_PLACEHOLDER;

    if (!form || !profile || userId === USER_ID_PLACEHOLDER) {
      console.warn("Cannot save: Form or Profile is missing, or userId is a placeholder.");
      alert("Error: Missing user ID for saving. Please ensure you are logged in.");
      return;
    }

    setSaving(true);

    // Parse and validate inputs
    const heightFeet = Number(form.heightFt) || 0;
    const heightInches = Number(form.heightIn) || 0;
    const weightKg = Number(form.weightKg) || 0;
    const age = Number(form.age) || 0;
    const targetWeight = Number(form.targetWeight) || 0;

    // Validation
    if (!form.username?.trim()) {
      alert("Please enter your name.");
      setSaving(false);
      return;
    }

    if (heightFeet === 0 && heightInches === 0) {
      alert("Please enter a valid height.");
      setSaving(false);
      return;
    }

    if (heightInches >= 12) {
      alert("Inches must be less than 12. Please adjust your height.");
      setSaving(false);
      return;
    }

    if (weightKg === 0) {
      alert("Please enter a valid weight.");
      setSaving(false);
      return;
    }

    if (weightKg > 500) {
      alert("Please enter a realistic weight value.");
      setSaving(false);
      return;
    }

    // Calculate all height formats
    const heightDecimalFt = feetInchesToDecimalFeet(heightFeet, heightInches);
    const heightCm = feetInchesToCm(heightFeet, heightInches);

    // Construct payload - CRITICAL: Store ALL height formats for compatibility
    const payload = {
      username: form.username.trim(),
      data: {
        age: age > 0 ? age : null,
        sex: form.sex,
        weightKg: weightKg,

        // 🔥 Store ALL height formats to ensure compatibility with dashboard
        heightFt: heightFeet,
        heightIn: heightInches,
        heightDecimalFt: Number(heightDecimalFt.toFixed(4)), // Use 4 decimal places for precision
        heightCm: heightCm,

        targetWeight: targetWeight > 0 ? targetWeight : null,
        dietType: form.dietType,
        phone: form.phone?.trim() || null,
        fitnessGoal: form.fitnessGoal,
        foodAllergies: form.foodAllergies?.trim() || "None",
        dailyActivity: form.dailyActivity,
      },
    };

    console.log("💾 Saving profile with payload:", payload);

    // Execute update using the REAL supabase client
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      // Use the actual logged-in user ID
      .eq("id", userId)
      .select()
      .single();

    setSaving(false);

    if (error) {
      console.error("Supabase Error:", error);
      alert(`Failed to save profile: ${error.message}`);
      return;
    }

    console.log("✅ Save successful:", data);

    // Update parent state
    let cleanData = data;

    // Handle Supabase sometimes returning JSONB as a string
    if (data?.data && typeof data.data === "string") {
      try {
        cleanData = { ...data, data: JSON.parse(data.data) };
        console.log("📦 Parsed stringified data field");
      } catch {
        console.warn("⚠️ Could not parse data field, using as-is");
        cleanData = { ...data, data: {} };
      }
    }

    // Ensure email is always in the profile object
    cleanData = { ...cleanData, email: profile.email };

    console.log("🔄 Updating parent state with:", cleanData);
    setProfile(cleanData as Profile); // Cast back to Profile type
    setEditing(false);

    alert("✅ Profile saved successfully!");
  };

  // -------------------------------------------------------
  // LOADING STATE
  // -------------------------------------------------------
  // Show loader if form hasn't been initialized from profile yet
  if (!form) {
    return (
      <div className="flex justify-center p-20">
        <Loader2 className="w-10 h-10 animate-spin text-sky-600" />
      </div>
    );
  }

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-2xl shadow-xl border space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <User className="text-sky-600 w-8 h-8" /> Profile Settings
        </h2>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-5 py-2.5 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-100 font-semibold flex items-center gap-2 transition-colors"
          >
            <Edit2 className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <button
            onClick={() => setEditing(false)}
            className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-semibold flex items-center gap-2 transition-colors"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>

      {/* FORM */}
      <div className={!editing ? "opacity-60 pointer-events-none" : ""}>
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-sky-600" /> Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Email Address
              </label>
              <input
                disabled
                value={form.email}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="+1-555-0123"
              />
            </div>
          </div>
        </div>

        {/* Physical Metrics */}
        <div className="bg-sky-50 rounded-xl p-5 space-y-4 mt-6">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <Ruler className="w-5 h-5 text-sky-600" /> Physical Metrics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Age
              </label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="25"
                min="1"
                max="120"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Sex
              </label>
              <select
                value={form.sex}
                onChange={(e) => update("sex", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {SexOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Current Weight (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.weightKg}
                onChange={(e) => update("weightKg", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="70"
                min="1"
                max="500"
                step="0.1"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Target Weight (kg)
              </label>
              <input
                type="number"
                value={form.targetWeight}
                onChange={(e) => update("targetWeight", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                placeholder="65"
                min="1"
                max="500"
                step="0.1"
              />
            </div>
          </div>

          {/* HEIGHT INPUT - Feet + Inches */}
          <div className="bg-white rounded-lg p-4 border-2 border-sky-200">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Height <span className="text-red-500">*</span>
            </label>

            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Feet
                </label>
                <input
                  type="number"
                  value={form.heightFt}
                  onChange={(e) => update("heightFt", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg font-semibold"
                  placeholder="5"
                  min="0"
                  max="8"
                  required
                />
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Inches
                </label>
                <input
                  type="number"
                  value={form.heightIn}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val < 12) {
                      update("heightIn", e.target.value);
                    }
                  }}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg font-semibold"
                  placeholder="11"
                  min="0"
                  max="11"
                  required
                />
              </div>

              <div className="flex-1 md:flex-[1.5]">
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Calculated
                </label>
                <div className="p-3 bg-sky-50 border-2 border-sky-300 rounded-lg">
                  <div className="text-lg font-bold text-sky-700">
                    {getHeightDisplay()}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              💡 Enter your height in feet and inches. Metric conversion is calculated automatically.
            </p>
          </div>
        </div>

        {/* Fitness & Goals */}
        <div className="bg-green-50 rounded-xl p-5 space-y-4 mt-6">
          <h3 className="font-bold text-gray-800 text-lg">🎯 Fitness & Goals</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Fitness Goal
              </label>
              <select
                value={form.fitnessGoal}
                onChange={(e) => update("fitnessGoal", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {GoalOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Diet Preference
              </label>
              <select
                value={form.dietType}
                onChange={(e) => update("dietType", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {DietTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                Activity Level
              </label>
              <select
                value={form.dailyActivity}
                onChange={(e) => update("dailyActivity", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                {ActivityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div className="bg-amber-50 rounded-xl p-5 space-y-4 mt-6">
          <h3 className="font-bold text-gray-800 text-lg">🥗 Dietary Information</h3>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Food Allergies / Restrictions
            </label>
            <input
              type="text"
              value={form.foodAllergies}
              onChange={(e) => update("foodAllergies", e.target.value)}
              placeholder="e.g., Gluten, Dairy, Peanuts, Shellfish, Vegetarian, Vegan"
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Separate multiple items with commas. Enter "None" if no restrictions.
            </p>
          </div>
        </div>

        {/* SAVE BUTTON */}
        {editing && (
          <div className="flex justify-end gap-3 pt-6">
            <button
              onClick={() => setEditing(false)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-sky-600 to-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:from-sky-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;