// src/gemini/generateDietPlan.ts
/**
 * Strict & Safe Gemini diet plan generator
 * - Forces weekday labels (Monday -> Sunday)
 * - Robust parsing of functionCall OR text JSON
 * - Normalizes/expands single-day responses into full Mon-Sun 7-day plan
 * - Detailed debug logs
 * - Height parsing using priority logic:
 *    1) heightDecimalFt
 *    2) heightFt + heightIn
 *    3) legacy decimal in heightFt
 *    4) heightCm
 */

type Json = Record<string, any>;

// === CONFIG ===
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("⚠️ Gemini API key missing — diet plan generation will fail if called.");
}

// === TYPES ===
export interface DaySchedule {
  day: string; // Monday..Sunday
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
}

export interface DietPlan {
  schedule: DaySchedule[]; // length 7, Monday..Sunday
  physiological_impact: string;
}

interface ProfileData {
  age?: number;
  sex?: string;
  weightKg?: number;
  targetWeight?: number;
  dietType?: string;
  fitnessGoal?: string;
  foodAllergies?: string;
  dailyActivity?: string;

  heightFt?: number | string;
  heightIn?: number | string;
  heightDecimalFt?: number | string;
  heightCm?: number | string;
}

export interface Profile {
  id: string;
  username?: string;
  email?: string;
  data?: ProfileData | string | null;
}

// === HELPERS: HEIGHT (kept your priority logic) ===
function toNumberSafe(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function decimalFeetToFeetInches(decimalFeet: number) {
  const feet = Math.floor(decimalFeet);
  let inches = Math.round((decimalFeet - feet) * 12);
  if (inches === 12) return { feet: feet + 1, inches: 0 };
  return { feet, inches };
}

function cmToFeetInches(cm: number) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) return { feet: feet + 1, inches: 0 };
  return { feet, inches };
}

function parseLegacyHeightFromSingleValue(single: number) {
  const feet = Math.floor(single);
  const decimalPart = single - feet;
  const suspectedInches = Math.round(decimalPart * 100); // e.g., 0.10 -> 10
  if (
    suspectedInches >= 0 &&
    suspectedInches <= 11 &&
    Math.abs(decimalPart * 100 - suspectedInches) < 0.01
  ) {
    return { feet, inches: suspectedInches };
  }
  return decimalFeetToFeetInches(single);
}

function parseHeight(data: ProfileData | undefined | null) {
  if (!data) return { feet: 0, inches: 0, cm: null };

  const hDf = toNumberSafe((data as any).heightDecimalFt ?? data.heightDecimalFt);
  if (hDf !== null) {
    const parsed = decimalFeetToFeetInches(hDf);
    return { feet: parsed.feet, inches: parsed.inches, cm: Math.round(hDf * 12 * 2.54) };
  }

  const hFt = toNumberSafe((data as any).heightFt ?? data.heightFt);
  const hIn = toNumberSafe((data as any).heightIn ?? data.heightIn);
  if (hFt !== null && hIn !== null) {
    const cm = Math.round(((hFt * 12) + hIn) * 2.54);
    return { feet: Math.floor(hFt), inches: Math.round(hIn), cm };
  }

  if (hFt !== null) {
    const parsed = parseLegacyHeightFromSingleValue(hFt);
    const cm = Math.round(((parsed.feet * 12) + parsed.inches) * 2.54);
    return { feet: parsed.feet, inches: parsed.inches, cm };
  }

  const hCm = toNumberSafe((data as any).heightCm ?? data.heightCm);
  if (hCm !== null) {
    const parsed = cmToFeetInches(hCm);
    return { feet: parsed.feet, inches: parsed.inches, cm: Math.round(hCm) };
  }

  return { feet: 0, inches: 0, cm: null };
}

// === SCHEMA & UTILITIES FOR WEEKDAYS ===
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function isStringNonEmpty(v: any): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeDayObject(raw: any, idx: number): DaySchedule | null {
  if (!raw || typeof raw !== "object") return null;
  const dayRaw = raw.day ?? raw.Day ?? raw.day_name ?? raw.label ?? "";
  const dayStr = typeof dayRaw === "string" ? dayRaw.trim() : String(dayRaw ?? "");
  const breakfast = (raw.breakfast ?? raw.BREAKFAST ?? raw.Breakfast ?? "").toString().trim();
  const lunch = (raw.lunch ?? raw.LUNCH ?? raw.Lunch ?? "").toString().trim();
  const snack = (raw.snack ?? raw.SNACK ?? raw.Snack ?? "").toString().trim();
  const dinner = (raw.dinner ?? raw.DINNER ?? raw.Dinner ?? "").toString().trim();

  const allBlank = [breakfast, lunch, snack, dinner].every((s) => s === "" || s === "—");
  if (allBlank) return null;

  const day = WEEKDAYS.includes(dayStr) ? dayStr : WEEKDAYS[idx] ?? `Day ${idx + 1}`;

  return {
    day,
    breakfast: breakfast || "—",
    lunch: lunch || "—",
    snack: snack || "—",
    dinner: dinner || "—",
  };
}

function isDaySchedule(obj: any): obj is DaySchedule {
  return (
    obj &&
    typeof obj.day === "string" &&
    WEEKDAYS.includes(obj.day) &&
    isStringNonEmpty(obj.breakfast) &&
    isStringNonEmpty(obj.lunch) &&
    isStringNonEmpty(obj.snack) &&
    isStringNonEmpty(obj.dinner)
  );
}

function isDietPlan(obj: any): obj is DietPlan {
  return (
    obj &&
    Array.isArray(obj.schedule) &&
    obj.schedule.length >= 1 &&
    obj.schedule.every((s: any) => typeof s === "object") &&
    typeof obj.physiological_impact === "string"
  );
}

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJsonSubstring(text: string): string | null {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

/** Ensure final plan is a 7-day array labeled Monday..Sunday */
function finalizeToSevenWeekdays(rawPlan: any): DietPlan {
  // If parsed plan already fits and labels are weekdays in order, try to keep that
  if (isDietPlan(rawPlan)) {
    // normalize items
    const normalized = rawPlan.schedule.map((s: any, i: number) => {
      const dayObj = normalizeDayObject(s, i);
      return dayObj ?? {
        day: WEEKDAYS[i] ?? `Day ${i + 1}`,
        breakfast: String(s.breakfast ?? "—"),
        lunch: String(s.lunch ?? "—"),
        snack: String(s.snack ?? "—"),
        dinner: String(s.dinner ?? "—"),
      };
    });

    // if less than 7, fill/expand with clones
    while (normalized.length < 7) {
      const cloneSource = normalized[normalized.length - 1] ?? normalized[0] ?? {
        day: WEEKDAYS[normalized.length] ?? `Day ${normalized.length + 1}`,
        breakfast: "—",
        lunch: "—",
        snack: "—",
        dinner: "—",
      };
      normalized.push({ ...cloneSource, day: WEEKDAYS[normalized.length] ?? cloneSource.day });
    }

    // ensure exactly 7 and label Monday..Sunday
    const finalSchedule = normalized.slice(0, 7).map((s: any, idx: number) => ({
      day: WEEKDAYS[idx],
      breakfast: String(s.breakfast ?? "—"),
      lunch: String(s.lunch ?? "—"),
      snack: String(s.snack ?? "—"),
      dinner: String(s.dinner ?? "—"),
    }));

    return { schedule: finalSchedule, physiological_impact: String(rawPlan.physiological_impact ?? "") };
  }

  // If rawPlan is single DaySchedule-like, repeat across weekdays
  if (rawPlan && typeof rawPlan === "object" && (rawPlan.breakfast || rawPlan.lunch || rawPlan.dinner)) {
    const day = normalizeDayObject(rawPlan, 0) ?? {
      day: WEEKDAYS[0],
      breakfast: String(rawPlan.breakfast ?? "—"),
      lunch: String(rawPlan.lunch ?? "—"),
      snack: String(rawPlan.snack ?? "—"),
      dinner: String(rawPlan.dinner ?? "—"),
    };

    const schedule = WEEKDAYS.map((wd) => ({ ...day, day: wd }));
    return { schedule, physiological_impact: String(rawPlan.physiological_impact ?? "") };
  }

  // As last resort return empty placeholders for full week
  const placeholder = WEEKDAYS.map((wd) => ({ day: wd, breakfast: "—", lunch: "—", snack: "—", dinner: "—" }));
  return { schedule: placeholder, physiological_impact: "No plan available." };
}

// === MAIN: generateDietPlan ===
export async function generateDietPlan(profile: Profile): Promise<DietPlan> {
  if (!profile || !profile.id) throw new Error("Profile must include an id.");

  const user = typeof profile.data === "string" ? (safeJsonParse(profile.data) ?? {}) : (profile.data ?? {});
  const weightKg = toNumberSafe(user.weightKg);
  if (weightKg === null) throw new Error("Profile missing numeric weightKg (required).");

  const height = parseHeight(user);
  const heightDesc = height.cm ? `${height.cm} cm (${height.feet}'${height.inches}")` : "Not specified";

  // === Prompt: force weekdays and strict JSON functionCall ===
  const userPrompt = [
    "You are an expert clinical nutritionist. Produce a JSON-only response (no markdown, no extra text).",
    "Return exactly one object matching the function schema 'dietPlan' with keys: schedule (7-element array) and physiological_impact (string).",
    "Schedule MUST contain seven elements labeled exactly (in order): Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.",
    "Do NOT use Day 1 / Day 2 / 1 / 2 or arbitrary labels. Do NOT reorder the days.",
    "Each schedule element must contain: day (one of the weekdays above), breakfast, lunch, snack, dinner (all strings).",
    "Do NOT include any keys outside the schema.",
    "If allergies exist, avoid those ingredients explicitly in the meals.",
    "",
    "USER PROFILE:",
    `Name: ${profile.username ?? "User"}`,
    `Age: ${user.age ?? "Unknown"}`,
    `Sex: ${user.sex ?? "Unknown"}`,
    `WeightKg: ${weightKg}`,
    `TargetWeight: ${user.targetWeight ?? "Not provided"}`,
    `Height: ${heightDesc}`,
    `FitnessGoal: ${user.fitnessGoal ?? "Weight Loss"}`,
    `DietType: ${user.dietType ?? "Balanced"}`,
    `Allergies: ${user.foodAllergies ?? "None"}`,
    `ActivityLevel: ${user.dailyActivity ?? "Moderate"}`,
    "",
    "Return a 7-day schedule with balanced macro portions suited to the user's goal, Monday through Sunday.",
  ].join("\n");

  // === Gemini payload with enum for day ===
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const systemPrompt = "You are a JSON-only assistant (nutritionist). Return functionCall results conforming exactly to schema.";

  const payload: Json = {
    systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
    tools: [
      {
        functionDeclarations: [
          {
            name: "dietPlan",
            description: "Return a structured 7-day diet plan (Monday..Sunday).",
            parameters: {
              type: "object",
              properties: {
                schedule: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: {
                        type: "string",
                        enum: WEEKDAYS,
                      },
                      breakfast: { type: "string" },
                      lunch: { type: "string" },
                      snack: { type: "string" },
                      dinner: { type: "string" },
                    },
                    required: ["day", "breakfast", "lunch", "snack", "dinner"],
                  },
                  minItems: 7,
                  maxItems: 7,
                },
                physiological_impact: { type: "string" },
              },
              required: ["schedule", "physiological_impact"],
            },
          },
        ],
      },
    ],
    toolConfig: { functionCallingConfig: { mode: "ANY" } },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0.35, maxOutputTokens: 2000 },
  };

  // === retry loop ===
  const MAX_RETRIES = 4;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.debug(`[Gemini] Attempt ${attempt + 1} - calling API...`);
      const resp = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await resp.json().catch((e) => {
        console.error("[Gemini] Response parse error:", e);
        throw new Error("Gemini response parse failed.");
      });

      if (json?.error) {
        const code = json.error?.code ?? "unknown";
        const msg = json.error?.message ?? JSON.stringify(json.error);
        console.error(`[Gemini] API error code=${code} message=${msg}`);
        if (attempt < MAX_RETRIES && (code >= 500 || code === 429)) {
          const delay = Math.pow(2, attempt) * 1000;
          console.debug(`[Gemini] Retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(`Gemini API error: ${msg}`);
      }

      // pick candidate content/part
      const candidate = json?.candidates?.[0];
      const content = candidate?.content;
      const part = content?.parts?.[0] ?? null;

      if (!part) {
        console.error("[Gemini] No content.parts[0] found. Full response:", json);
        throw new Error("Gemini returned no usable parts.");
      }

      let parsed: any = null;

      // Preferred: functionCall.args (may be object or string)
      if (part.functionCall && part.functionCall.args) {
        const args = part.functionCall.args;
        parsed = typeof args === "string" ? safeJsonParse(args) : args;
        console.debug("[Gemini] functionCall.args parsed:", !!parsed);
      }

      // Fallback: part.text
      if (!parsed && typeof part.text === "string") {
        parsed = safeJsonParse(part.text.trim());
        console.debug("[Gemini] part.text parsed direct:", !!parsed);
      }

      // Fallback: extract JSON substring then parse
      if (!parsed && typeof part.text === "string") {
        const maybe = extractJsonSubstring(part.text);
        if (maybe) {
          parsed = safeJsonParse(maybe);
          console.debug("[Gemini] extracted JSON substring parsed:", !!parsed);
        }
      }

      if (!parsed) {
        console.error("[Gemini] Unable to extract JSON payload. Raw part:", part);
        throw new Error("Gemini returned an unparsable response format.");
      }

      // If parsed already is function-call style: might be { name: "dietPlan", arguments: {...} }
      if (parsed?.name === "dietPlan" && parsed.arguments) {
        parsed = parsed.arguments;
        console.debug("[Gemini] Extracted arguments from function-call wrapper.");
      }

      // If parsed looks like single day (flat) — normalize/expand to week
      if (isDietPlan(parsed)) {
        console.debug("[Gemini] Parsed object matches DietPlan-ish; will finalize to weekdays.");
        const final = finalizeToSevenWeekdays(parsed);
        // sanity-check and return
        if (!Array.isArray(final.schedule) || final.schedule.length !== 7) {
          console.warn("[Gemini] Finalized plan isn't 7 days - correcting.");
        }
        return final;
      }

      // If parsed is single-day object: finalizeToSevenWeekdays will repeat across weekdays
      if (parsed && typeof parsed === "object" && (parsed.breakfast || parsed.lunch || parsed.dinner)) {
        console.warn("[Gemini] Parsed single-day object; expanding to full week.");
        const final = finalizeToSevenWeekdays(parsed);
        return final;
      }

      // If parsed is an array (maybe list of days) — try to normalize and ensure weekdays
      if (Array.isArray(parsed)) {
        console.debug("[Gemini] Parsed an array; attempting to normalize to weekdays.");
        const mapped = parsed.map((p, i) => normalizeDayObject(p, i)).filter(Boolean) as DaySchedule[];
        if (mapped.length > 0) {
          // expand/trim to 7 and label weekdays
          const filled = [...mapped];
          while (filled.length < 7) {
            const clone = filled[filled.length - 1] ?? mapped[0] ?? { day: WEEKDAYS[filled.length], breakfast: "—", lunch: "—", snack: "—", dinner: "—" };
            filled.push({ ...clone, day: WEEKDAYS[filled.length] });
          }
          const final = { schedule: filled.slice(0, 7).map((s, idx) => ({ ...s, day: WEEKDAYS[idx] })), physiological_impact: String((parsed as any).physiological_impact ?? "") };
          return final;
        }
      }

      // If we've reached here, parsed didn't conform - but attempt best-effort finalize
      console.warn("[Gemini] Parsed JSON didn't match expected shapes; attempting best-effort finalize.");
      const finalBestEffort = finalizeToSevenWeekdays(parsed);
      return finalBestEffort;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const lastAttempt = attempt === MAX_RETRIES;
      console.error(`[Gemini] Attempt ${attempt + 1} failed: ${message}`);
      if (!lastAttempt) {
        const delay = Math.pow(2, attempt) * 1000;
        console.debug(`[Gemini] Will retry in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw new Error(`Failed to generate diet plan after ${MAX_RETRIES + 1} attempts: ${message}`);
    }
  }

  throw new Error("Unhandled: exceeded retries.");
}
