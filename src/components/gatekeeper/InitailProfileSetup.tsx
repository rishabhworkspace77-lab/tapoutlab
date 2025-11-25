// src/pages/InitialProfileSetup.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2 } from "lucide-react";

export default function InitialProfileSetup() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const [form, setForm] = useState({
    username: "",
    phone: "",
    age: "",
    weightKg: "",
    heightFt: "",
    heightIn: "",
    gender: "",
    activityLevel: "",
    goal: "",
  });

  // Fetch auth user + check if profile exists
  useEffect(() => {
    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) return;

      setUserEmail(user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      // If profile already exists → skip onboarding
      if (profile && profile.username !== "none") {
        window.location.href = "/dashboard";
        return;
      }

      setLoading(false);
    };

    init();
  }, []);

  const handleChange = (k: string, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    // Create JSONB payload
    const dataPayload = {
      phone: form.phone,
      age: Number(form.age),
      weightKg: Number(form.weightKg),
      heightFt: Number(form.heightFt),
      heightIn: Number(form.heightIn),
      gender: form.gender,
      activityLevel: form.activityLevel,
      goal: form.goal,
    };

    // Insert profile row
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      username: form.username,
      email: user.email,
      data: dataPayload,
    });

    if (error) {
      alert("Error saving profile: " + error.message);
      setSubmitting(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        <Loader2 className="animate-spin h-6 w-6" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-gray-900 text-white rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Complete Your Profile</h1>

      <div className="space-y-4">

        <div>
          <label className="text-sm opacity-70">Email</label>
          <input
            value={userEmail}
            disabled
            className="w-full mt-1 px-3 py-2 bg-gray-700 rounded-lg opacity-80 cursor-not-allowed"
          />
        </div>

        <Input label="Full Name (Username)"
          value={form.username}
          onChange={e => handleChange("username", e.target.value)}
        />

        <Input label="Phone Number"
          value={form.phone}
          onChange={e => handleChange("phone", e.target.value)}
        />

        <Input label="Age"
          type="number"
          value={form.age}
          onChange={e => handleChange("age", e.target.value)}
        />

        <Input label="Weight (Kg)"
          type="number"
          value={form.weightKg}
          onChange={e => handleChange("weightKg", e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Height (ft)"
            type="number"
            value={form.heightFt}
            onChange={e => handleChange("heightFt", e.target.value)}
          />
          <Input label="Height (in)"
            type="number"
            value={form.heightIn}
            onChange={e => handleChange("heightIn", e.target.value)}
          />
        </div>

        <Select
          label="Gender"
          value={form.gender}
          onChange={e => handleChange("gender", e.target.value)}
          options={["Male", "Female", "Other"]}
        />

        <Select
          label="Activity Level"
          value={form.activityLevel}
          onChange={e => handleChange("activityLevel", e.target.value)}
          options={["Sedentary", "Light", "Moderate", "Active", "Athlete"]}
        />

        <Select
          label="Goal"
          value={form.goal}
          onChange={e => handleChange("goal", e.target.value)}
          options={["Lose", "Maintain", "Gain"]}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full mt-6 bg-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Submit"}
        </button>

      </div>
    </div>
  );
}

// Small helper components
function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="text-sm opacity-70">{label}</label>
      <input
        {...props}
        className="w-full mt-1 px-3 py-2 bg-gray-800 rounded-lg focus:outline-blue-500"
      />
    </div>
  );
}

function Select({ label, options, ...props }: any) {
  return (
    <div>
      <label className="text-sm opacity-70">{label}</label>
      <select
        {...props}
        className="w-full mt-1 px-3 py-2 bg-gray-800 rounded-lg"
      >
        <option value="">Select...</option>
        {options.map((op: string) => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>
    </div>
  );
}
