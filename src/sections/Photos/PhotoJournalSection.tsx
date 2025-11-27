// PhotoJournalSection.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Image as ImageIcon,
  Camera,
  Loader2,
  Trash,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp
} from "lucide-react";
import { supabase } from "../../supabaseClient"; // adjust path if needed

/**
 * PhotoJournalSection (Standalone)
 * - Loads/saves photo logs for the logged-in user
 * - Uploads files to storage bucket "photo-journal"
 * - Stores public URLs in table "photo_logs"
 *
 * Expects Supabase project to have:
 * - Storage bucket: photo-journal (public recommended for CDN urls)
 * - Table: photo_logs (id uuid PK, user_id uuid, date text, front_url text, side_url text, back_url text, created_at timestamp)
 *
 * Usage:
 *  <PhotoJournalSection />
 */

const bucketName = "photo-journal";

const PhotoJournalSection = () => {
  const [user, setUser] = useState(null);
  const [photoLogs, setPhotoLogs] = useState([]); // { id, user_id, date, front_url, side_url, back_url, created_at }
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Temporary local file objects (Files) for upload
  const [tempFront, setTempFront] = useState(null);
  const [tempSide, setTempSide] = useState(null);
  const [tempBack, setTempBack] = useState(null);

  // Previews for local files (object URLs)
  const [previewFront, setPreviewFront] = useState(null);
  const [previewSide, setPreviewSide] = useState(null);
  const [previewBack, setPreviewBack] = useState(null);

  // UI helpers
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Calendar helpers
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  // ---------- Supabase helpers ----------
  const getUser = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn("getUser error", error);
        return null;
      }
      return data?.user ?? null;
    } catch (err) {
      console.error("getUser exception", err);
      return null;
    }
  }, []);

  const fetchLogs = useCallback(async (uid) => {
    if (!uid) return;
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from("photo_journal")
        .select("*")
        .eq("user_id", uid)
        .order("date", { ascending: true });

      if (error) {
        console.error("fetchLogs error", error);
        setPhotoLogs([]);
      } else {
        setPhotoLogs(data || []);
      }
    } catch (err) {
      console.error("fetchLogs exception", err);
      setPhotoLogs([]);
    } finally {
      setFetching(false);
    }
  }, []);

  const uploadPhotoToStorage = async (file, path) => {
    // file should be a real File object
    if (!file || !(file instanceof File)) return null;
    try {
      const { error: uploadErr } = await supabase.storage
        .from(bucketName)
        .upload(path, file, { upsert: true, cacheControl: "3600" });

      if (uploadErr) {
        console.error("storage.upload error", uploadErr);
        return null;
      }

      const { data: publicData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path);

      return publicData?.publicUrl ?? null;
    } catch (err) {
      console.error("uploadPhotoToStorage exception", err);
      return null;
    }
  };
const upsertPhotoLog = async ({ userId, date, frontUrl, sideUrl, backUrl, frontPath, sidePath, backPath }) => {
  try {
    const payload = {
      user_id: userId,
      date,
      front_url: frontUrl ?? null,
      front_storage_path: frontPath ?? null,
      side_url: sideUrl ?? null,
      side_storage_path: sidePath ?? null,
      back_url: backUrl ?? null,
      back_storage_path: backPath ?? null,
    };

    const { data, error } = await supabase
      .from("photo_journal")
      .upsert(payload, { onConflict: ["user_id", "date"] }) // requires unique(user_id, date)
      .select();

    if (error) {
      console.error("upsertPhotoLog error", error);
      return null;
    }

    // return the upserted row (array)
    return Array.isArray(data) ? data[0] : data;
  } catch (err) {
    console.error("upsertPhotoLog exception", err);
    return null;
  }
};


  // ---------- Effects: fetch user & logs on mount ----------
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const u = await getUser();
      if (!mounted) return;
      setUser(u);
      if (u) await fetchLogs(u.id);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [getUser, fetchLogs]);

  // ---------- Clean up object URLs on file changes / unmount ----------
  useEffect(() => {
    if (tempFront) {
      const obj = URL.createObjectURL(tempFront);
      setPreviewFront(obj);
      return () => URL.revokeObjectURL(obj);
    } else {
      setPreviewFront(null);
    }
  }, [tempFront]);

  useEffect(() => {
    if (tempSide) {
      const obj = URL.createObjectURL(tempSide);
      setPreviewSide(obj);
      return () => URL.revokeObjectURL(obj);
    } else {
      setPreviewSide(null);
    }
  }, [tempSide]);

  useEffect(() => {
    if (tempBack) {
      const obj = URL.createObjectURL(tempBack);
      setPreviewBack(obj);
      return () => URL.revokeObjectURL(obj);
    } else {
      setPreviewBack(null);
    }
  }, [tempBack]);

  // ---------- Utility: format date string YYYY-MM-DD ----------
  const formatDate = (year, monthIndexOneBased, day) => {
    const y = year;
    const m = String(monthIndexOneBased).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatDateFromStr = (dateStr) => {
    // dateStr is YYYY-MM-DD
    return dateStr;
  };

  const getLogForDate = (day) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
    return photoLogs.find(log => log.date === dateStr);
  };

  // ---------- Calendar navigation ----------
  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    setSelectedDate(null);
    // clear temp files
    setTempFront(null); setTempSide(null); setTempBack(null);
  };

  const handleDateClick = (day) => {
    const dateStr = formatDate(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
    const existingLog = photoLogs.find(log => log.date === dateStr);

    setSelectedDate(dateStr);
    // set previews from DB urls (we set temp* to null - only local files show via preview object URL)
    setTempFront(null); setTempSide(null); setTempBack(null);
    setPreviewFront(existingLog?.front_url ?? null);
    setPreviewSide(existingLog?.side_url ?? null);
    setPreviewBack(existingLog?.back_url ?? null);
  };

  // ---------- File input handlers (store File objects only) ----------
  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (type === "front") {
      setTempFront(file);
    } else if (type === "side") {
      setTempSide(file);
    } else if (type === "back") {
      setTempBack(file);
    }
  };

  // Remove a single side/back/front local selection
  const removeTemp = (type) => {
    if (type === "front") setTempFront(null);
    if (type === "side") setTempSide(null);
    if (type === "back") setTempBack(null);
    // also clear preview if it was object URL (DB preview stays)
    if (type === "front" && previewFront && previewFront.startsWith("blob:")) setPreviewFront(null);
    if (type === "side" && previewSide && previewSide.startsWith("blob:")) setPreviewSide(null);
    if (type === "back" && previewBack && previewBack.startsWith("blob:")) setPreviewBack(null);
  };

  // ---------- Save photos: upload files and upsert DB ----------
  const savePhotos = async () => {
    if (!selectedDate) {
      alert("Please select a date first.");
      return;
    }
    if (!user) {
      alert("No user found. Please sign in.");
      return;
    }

    // nothing to save?
    if (!tempFront && !tempSide && !tempBack) {
      alert("Select at least one image (front, side or back) to save.");
      return;
    }

    setSaving(true);
    try {
      const userId = user.id;
      const datePath = selectedDate; // YYYY-MM-DD

      // generate file names with timestamp to avoid stale caching if desired
      const ts = Date.now();

      let frontUrl = previewFront && !tempFront ? previewFront : null;
      let sideUrl = previewSide && !tempSide ? previewSide : null;
      let backUrl = previewBack && !tempBack ? previewBack : null;

      if (tempFront instanceof File) {
        // make path consistent: userId/date/front-<ts>.<ext>
        const ext = tempFront.name.split(".").pop();
        const path = `${userId}/${datePath}/front-${ts}.${ext}`;
        const uploaded = await uploadPhotoToStorage(tempFront, path);
        if (uploaded) frontUrl = uploaded;
      }

      if (tempSide instanceof File) {
        const ext = tempSide.name.split(".").pop();
        const path = `${userId}/${datePath}/side-${ts}.${ext}`;
        const uploaded = await uploadPhotoToStorage(tempSide, path);
        if (uploaded) sideUrl = uploaded;
      }

      if (tempBack instanceof File) {
        const ext = tempBack.name.split(".").pop();
        const path = `${userId}/${datePath}/back-${ts}.${ext}`;
        const uploaded = await uploadPhotoToStorage(tempBack, path);
        if (uploaded) backUrl = uploaded;
      }

      // upsert DB row
      const upserted = await upsertPhotoLog({
        userId,
        date: datePath,
        frontUrl,
        sideUrl,
        backUrl,
      });

      if (!upserted) {
        alert("Failed to save photos. See console for details.");
      } else {
        // refresh logs
        await fetchLogs(user.id);
        // Reset selection and temps
        setSelectedDate(null);
        setTempFront(null); setTempSide(null); setTempBack(null);
        setPreviewFront(null); setPreviewSide(null); setPreviewBack(null);
      }
    } catch (err) {
      console.error("savePhotos error", err);
      alert("An error occurred while saving photos. Check console.");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Comparison data (earliest vs latest) ----------
  // sorted ascending by date
  const sortedLogs = [...photoLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstLog = sortedLogs.length > 0 ? sortedLogs[0] : null;
  const lastLog = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1] : null;
  const showComparison = sortedLogs.length >= 2;

  // ---------- Render ----------
  if (loading || fetching) {
    return (
      <div className="p-6 bg-white rounded-lg shadow text-center">
        <Loader2 className="animate-spin mx-auto w-8 h-8 text-sky-500" />
        <p className="text-sm text-gray-500 mt-2">Loading photo journal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="p-4 bg-white rounded-lg shadow border flex justify-between items-center">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-sky-500" /> Photo Journal
          </h2>
          <p className="text-gray-500 text-xs mt-1">Track your transformation day-by-day — front, side and back.</p>
        </div>

        <div className="text-right text-xs text-gray-500">
          <div>Signed in as</div>
          <div className="font-mono text-sm text-gray-700">{user?.email ?? "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            <h3 className="text-base font-semibold text-gray-800">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>

            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1 text-center text-xs font-medium text-gray-500">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const hasLog = Boolean(getLogForDate(day));
              const isSelected = selectedDate === formatDate(currentDate.getFullYear(), currentDate.getMonth() + 1, day);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`h-10 rounded-md text-xs relative transition-all
                    ${isSelected ? 'bg-sky-600 text-white ring-1 ring-sky-300' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}
                  `}
                >
                  {day}
                  {hasLog && (
                    <span className={`absolute bottom-1 w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-sky-500'}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-white p-4 rounded-lg shadow border flex flex-col">
          {selectedDate ? (
            <>
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" /> {selectedDate}
              </h3>

              <div className="space-y-3 flex-1">
                {/* Front */}
                <div className="border-2 border-dashed border-gray-200 rounded-md p-3 text-center hover:bg-gray-50 transition relative group">
                  {previewFront ? (
                    <img src={previewFront} alt="Front" className="w-full h-28 object-cover rounded-md" />
                  ) : (
                    <div className="text-gray-400 py-4">
                      <Camera className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-xs">Front View</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'front')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />

                  {(tempFront || (previewFront && previewFront.startsWith("blob:"))) && (
                    <button
                      onClick={() => removeTemp('front')}
                      className="absolute top-2 right-2 bg-white/70 p-1 rounded-full hover:bg-white"
                      title="Remove"
                    >
                      <Trash className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Side */}
                <div className="border-2 border-dashed border-gray-200 rounded-md p-3 text-center hover:bg-gray-50 transition relative group">
                  {previewSide ? (
                    <img src={previewSide} alt="Side" className="w-full h-28 object-cover rounded-md" />
                  ) : (
                    <div className="text-gray-400 py-4">
                      <Camera className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-xs">Side View</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'side')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />

                  {(tempSide || (previewSide && previewSide.startsWith("blob:"))) && (
                    <button
                      onClick={() => removeTemp('side')}
                      className="absolute top-2 right-2 bg-white/70 p-1 rounded-full hover:bg-white"
                      title="Remove"
                    >
                      <Trash className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Back */}
                <div className="border-2 border-dashed border-gray-200 rounded-md p-3 text-center hover:bg-gray-50 transition relative group">
                  {previewBack ? (
                    <img src={previewBack} alt="Back" className="w-full h-28 object-cover rounded-md" />
                  ) : (
                    <div className="text-gray-400 py-4">
                      <Camera className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-xs">Back View</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'back')}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />

                  {(tempBack || (previewBack && previewBack.startsWith("blob:"))) && (
                    <button
                      onClick={() => removeTemp('back')}
                      className="absolute top-2 right-2 bg-white/70 p-1 rounded-full hover:bg-white"
                      title="Remove"
                    >
                      <Trash className="w-4 h-4 text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={savePhotos}
                  disabled={saving}
                  className={`flex-1 py-2 ${saving ? 'bg-sky-300' : 'bg-sky-600 hover:bg-sky-700'} text-white text-sm rounded-md flex items-center justify-center gap-2`}
                >
                  {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  Save
                </button>

                <button
                  onClick={() => {
                    setSelectedDate(null);
                    setTempFront(null); setTempSide(null); setTempBack(null);
                    setPreviewFront(null); setPreviewSide(null); setPreviewBack(null);
                  }}
                  className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 p-3">
              <Camera className="w-10 h-10 mb-2 text-gray-300" />
              <p className="text-sm">Select a date to upload photos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Comparison */}
      {showComparison && (
        <div className="bg-slate-900 rounded-lg p-5 shadow text-white">
          <h3 className="text-lg font-bold mb-4 flex items-center text-sky-400">
            <TrendingUp className="w-5 h-5 mr-2" /> Transformation Journey
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* FRONT */}
            <div>
              <div className="bg-slate-800 rounded-lg p-1 relative">
                <span className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px]">
                  BEFORE ({firstLog?.date ?? "—"})
                </span>
                <img src={firstLog?.front_url} alt="Before Front" className="w-full h-48 object-cover rounded-md" />
              </div>

              <div className="bg-slate-800 rounded-lg p-1 mt-3 relative">
                <span className="absolute top-2 left-2 bg-green-600 px-2 py-0.5 rounded text-[10px]">
                  AFTER ({lastLog?.date ?? "—"})
                </span>
                <img src={lastLog?.front_url} alt="After Front" className="w-full h-48 object-cover rounded-md" />
              </div>

              <p className="text-xs text-slate-400 mt-2 text-center">Front view</p>
            </div>

            {/* SIDE */}
            <div>
              <div className="bg-slate-800 rounded-lg p-1 relative">
                <span className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px]">
                  BEFORE ({firstLog?.date ?? "—"})
                </span>
                <img src={firstLog?.side_url} alt="Before Side" className="w-full h-48 object-cover rounded-md" />
              </div>

              <div className="bg-slate-800 rounded-lg p-1 mt-3 relative">
                <span className="absolute top-2 left-2 bg-green-600 px-2 py-0.5 rounded text-[10px]">
                  AFTER ({lastLog?.date ?? "—"})
                </span>
                <img src={lastLog?.side_url} alt="After Side" className="w-full h-48 object-cover rounded-md" />
              </div>

              <p className="text-xs text-slate-400 mt-2 text-center">Side view</p>
            </div>

            {/* BACK */}
            <div>
              <div className="bg-slate-800 rounded-lg p-1 relative">
                <span className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px]">
                  BEFORE ({firstLog?.date ?? "—"})
                </span>
                <img src={firstLog?.back_url} alt="Before Back" className="w-full h-48 object-cover rounded-md" />
              </div>

              <div className="bg-slate-800 rounded-lg p-1 mt-3 relative">
                <span className="absolute top-2 left-2 bg-green-600 px-2 py-0.5 rounded text-[10px]">
                  AFTER ({lastLog?.date ?? "—"})
                </span>
                <img src={lastLog?.back_url} alt="After Back" className="w-full h-48 object-cover rounded-md" />
              </div>

              <p className="text-xs text-slate-400 mt-2 text-center">Back view</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoJournalSection;
