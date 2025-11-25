// src/App.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  User as UserIcon,
  BookOpen,
  Image as ImageIcon,
  Activity,
  Zap,
  Dumbbell,
  Menu,
  X,
  Loader2,
  LogOut,
} from "lucide-react";

import DashboardHome from "./sections/DashboardHome/DashboardHome";
import ProfileSection from "./sections/Profile/ProfileSection";
import DietChartSection from "./sections/DietChart/DietChartSection";
import PhotoJournalSection from "./sections/Photos/PhotoJournalSection";
import ProgressTracker from "./sections/ProgressTracker/ProgressTracker";
import VideosSection from "./sections/Videos/VideosSection";
import AuthPage from "./AuthPage";

import InitialProfileSetup from "./components/gatekeeper/InitailProfileSetup";

import { supabase } from "./supabaseClient";

// ------------------------------------------
// TYPES
// ------------------------------------------
interface Profile {
  id: string;
  username?: string;
  email?: string;
  phone?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

interface DailyLog {
  date: string;
  weight?: string;
  steps?: string;
  caloriesBurned?: string;
  waterLiters?: string;
  notes?: string;
  exercises?: any[];
}

// ------------------------------------------
// MAIN APP
// ------------------------------------------
const App: React.FC = () => {
  // Auth State
  const [session, setSession] = useState<any>(null);

  // UI State
  const [currentView, setCurrentView] = useState("dashboard");
  const [viewBuffer, setViewBuffer] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photoLogs, setPhotoLogs] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});

  // --------------------------------------------------------------
  // FETCH USER DATA
  // --------------------------------------------------------------
  const fetchUserData = useCallback(
    async (userId: string) => {
      try {
        setIsLoading(true);

        // PROFILE
        const { data: pData, error: pError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        if (pError) console.error("Profile Error:", pError);

        if (pData) {
          const clean = {
            ...pData,
            data:
              typeof pData.data === "object" && pData.data !== null
                ? pData.data
                : {},
          };
          setProfile(clean);
        } else {
          setProfile(null); // NEW USER => null
        }

        // DAILY LOGS
        const { data: logData } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", userId);

        if (logData) {
          const mapped = logData.reduce((acc: any, row: any) => {
            acc[row.date] = row;
            return acc;
          }, {});
          setDailyLogs(mapped);
        }

        // PHOTO LOGS
        const { data: phData } = await supabase
          .from("photo_journal")
          .select("*")
          .eq("user_id", userId);

        if (phData) setPhotoLogs(phData);
      } catch (err) {
        console.error("Supabase fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // --------------------------------------------------------------
  // AUTH LISTENER
  // --------------------------------------------------------------
  useEffect(() => {
    // 1. Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // 2. Listen for Login/Logout events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        // Cleanup on logout
        setProfile(null);
        setDailyLogs({});
        setPhotoLogs([]);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // --------------------------------------------------------------
  // UPDATE DAILY LOG
  // --------------------------------------------------------------
  const updateDailyLog = async (date: string, updates: Partial<DailyLog>) => {
    setDailyLogs((prev) => ({
      ...prev,
      [date]: { ...(prev[date] || {}), ...updates },
    }));

    if (!session?.user) return;

    await supabase.from("daily_logs").upsert({
      ...updates,
      date,
      user_id: session.user.id,
    });
  };

  // --------------------------------------------------------------
  // LOGOUT
  // --------------------------------------------------------------
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --------------------------------------------------------------
  // VIEW TRANSITION
  // --------------------------------------------------------------
  const handleViewChange = (view: string) => {
    if (view === currentView) return;
    setIsMobileMenuOpen(false);
    setViewBuffer(true);

    setTimeout(() => {
      setCurrentView(view);
      setViewBuffer(false);
    }, 450);
  };

  // --------------------------------------------------------------
  // CLOSE MOBILE MENU ON RESIZE
  // --------------------------------------------------------------
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // --------------------------------------------------------------
  // RENDER CONDITIONALS
  // --------------------------------------------------------------

  // 1. NOT LOGGED IN → Show Auth Page
  if (!session && !isLoading) {
    return <AuthPage />;
  }

  // 2. STILL LOADING SESSION OR PROFILE
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    );
  }

  // 3. LOGGED IN BUT NO PROFILE → Show Initial Setup
  if (session && !profile) {
    return (
      <InitialProfileSetup
        userId={session.user.id}
        email={session.user.email}
        onComplete={() => fetchUserData(session.user.id)}
      />
    );
  }

  // --------------------------------------------------------------
  // NAV ITEMS
  // --------------------------------------------------------------
  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, view: "dashboard" },
    { name: "Profile", icon: UserIcon, view: "profile" },
    { name: "Diet Chart", icon: BookOpen, view: "dietChart" },
    { name: "Gallery", icon: ImageIcon, view: "photos" },
    { name: "Tracker", icon: Activity, view: "progressTracker" },
    { name: "Library", icon: Zap, view: "videos" },
  ];

  // --------------------------------------------------------------
  // CONTENT SWITCH
  // --------------------------------------------------------------
  const renderContent = () => {
    if (viewBuffer) {
      return (
        <div className="h-full flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
        </div>
      );
    }

    switch (currentView) {
      case "dashboard":
        return <DashboardHome profile={profile} dailyLogs={dailyLogs} />;

      case "profile":
        return (
          <ProfileSection
            profile={profile}
            setProfile={(updates: any) =>
              setProfile((prev) =>
                prev
                  ? {
                      ...prev,
                      ...updates,
                      data: {
                        ...prev.data,
                        ...(updates.data || {}),
                      },
                    }
                  : prev
              )
            }
          />
        );

      case "dietChart":
        return <DietChartSection profile={profile} />;

      case "progressTracker":
        return (
          <ProgressTracker
            dailyLogs={dailyLogs}
            updateDailyLog={updateDailyLog}
          />
        );

      case "photos":
        return (
          <PhotoJournalSection
            photoLogs={photoLogs}
            onSavePhotoLog={(log) =>
              setPhotoLogs((prev) => [
                ...prev.filter((p) => p.date !== log.date),
                log,
              ])
            }
          />
        );

      case "videos":
        return <VideosSection />;

      default:
        return <div>Select a feature…</div>;
    }
  };

  // --------------------------------------------------------------
  // LAYOUT
  // --------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2 font-black text-sky-400 text-lg">
          <Dumbbell className="w-6 h-6" /> TAPOUT-LAB
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-slate-800 rounded-xl"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white shadow-2xl p-4
          flex flex-col transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0`}
      >
        <div className="hidden md:flex items-center gap-2 text-2xl font-black text-sky-400 mb-8 pl-2">
          <Dumbbell className="w-6 h-6" /> TAPOUT-LAB
        </div>

        <nav className="flex-grow space-y-2">
          {navItems.map(({ name, icon: Icon, view }) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              disabled={viewBuffer}
              className={`flex items-center w-full px-4 py-3 rounded-xl text-left transition ${
                currentView === view
                  ? "bg-sky-600 text-white font-bold scale-[1.03]"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {name}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          {profile && (
            <div className="flex items-center px-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center font-bold text-white">
                {profile.username?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm">{profile.username || "User"}</p>
                <p className="text-xs text-slate-500">Free Plan</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-xl transition group"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 p-4 md:p-6 lg:p-8">{renderContent()}</main>
    </div>
  );
};

export default App;









// // src/App.tsx
// import React, { useState, useEffect, useCallback } from "react";
// import {
//   LayoutDashboard,
//   User as UserIcon,
//   BookOpen,
//   Image as ImageIcon,
//   Activity,
//   Zap,
//   Dumbbell,
//   Menu,
//   X,
//   Loader2,
//   LogOut,
//   ChevronRight,
//   Sparkles,
// } from "lucide-react";

// import DashboardHome from "./sections/DashboardHome/DashboardHome";
// import ProfileSection from "./sections/Profile/ProfileSection";
// import DietChartSection from "./sections/DietChart/DietChartSection";
// import PhotoJournalSection from "./sections/Photos/PhotoJournalSection";
// import ProgressTracker from "./sections/ProgressTracker/ProgressTracker";
// import VideosSection from "./sections/Videos/VideosSection";
// import AuthPage from "./AuthPage";

// import { supabase } from "./supabaseClient";

// // ------------------------------------------
// // TYPES
// // ------------------------------------------
// interface Profile {
//   id: string;
//   username?: string;
//   email?: string;
//   phone?: string;
//   data?: Record<string, any>;
//   [key: string]: any;
// }

// interface DailyLog {
//   date: string;
//   weight?: string;
//   steps?: string;
//   caloriesBurned?: string;
//   waterLiters?: string;
//   notes?: string;
//   exercises?: any[];
// }

// // ------------------------------------------
// // NAV ITEMS (outside component to prevent re-creation)
// // ------------------------------------------
// const navItems = [
//   { name: "Dashboard", icon: LayoutDashboard, view: "dashboard", desc: "Overview & stats" },
//   { name: "Profile", icon: UserIcon, view: "profile", desc: "Your settings" },
//   { name: "Diet Chart", icon: BookOpen, view: "dietChart", desc: "Nutrition plans" },
//   { name: "Gallery", icon: ImageIcon, view: "photos", desc: "Progress photos" },
//   { name: "Tracker", icon: Activity, view: "progressTracker", desc: "Daily logging" },
//   { name: "Library", icon: Zap, view: "videos", desc: "Workout videos" },
// ];

// // ------------------------------------------
// // MAIN APP
// // ------------------------------------------
// const App: React.FC = () => {
//   // Auth State
//   const [session, setSession] = useState<any>(null);
//   const [authChecked, setAuthChecked] = useState(false); // NEW: Track if auth check is complete

//   // UI State
//   const [currentView, setCurrentView] = useState("dashboard");
//   const [viewBuffer, setViewBuffer] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   // Data State
//   const [profile, setProfile] = useState<Profile | null>(null);
//   const [photoLogs, setPhotoLogs] = useState<any[]>([]);
//   const [dailyLogs, setDailyLogs] = useState<Record<string, DailyLog>>({});

//   // --------------------------------------------------------------
//   // FETCH USER DATA
//   // --------------------------------------------------------------
//   const fetchUserData = useCallback(async (userId: string) => {
//     try {
//       setIsLoading(true);

//       // PROFILE
//       const { data: pData, error: pError } = await supabase
//         .from("profiles")
//         .select("*")
//         .eq("id", userId)
//         .maybeSingle();

//       if (pError) console.error("Profile Error:", pError);

//       if (pData) {
//         const clean = {
//           ...pData,
//           data: typeof pData.data === "object" && pData.data !== null ? pData.data : {},
//         };
//         setProfile(clean);
//       }

//       // DAILY LOGS
//       const { data: logData } = await supabase
//         .from("daily_logs")
//         .select("*")
//         .eq("user_id", userId);

//       if (logData) {
//         const mapped = logData.reduce((acc: any, row: any) => {
//           acc[row.date] = row;
//           return acc;
//         }, {});
//         setDailyLogs(mapped);
//       }

//       // PHOTO LOGS
//       const { data: phData } = await supabase
//         .from("photo_journal")
//         .select("*")
//         .eq("user_id", userId);

//       if (phData) setPhotoLogs(phData);
//     } catch (err) {
//       console.error("Supabase fetch error:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   // --------------------------------------------------------------
//   // AUTH LISTENER (FIXED for page refresh race condition)
//   // --------------------------------------------------------------
//   useEffect(() => {
//     let isMounted = true;
//     let initialSessionHandled = false;

//     // 1. Set up listener FIRST (critical for catching restored session)
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, currentSession) => {
//         if (!isMounted) return;

//         console.log("Auth event:", event);
//         setSession(currentSession);

//         if (event === "INITIAL_SESSION") {
//           // Supabase restored session from localStorage
//           initialSessionHandled = true;
//           if (currentSession?.user) {
//             await fetchUserData(currentSession.user.id);
//           } else {
//             setIsLoading(false);
//           }
//           if (isMounted) setAuthChecked(true);
//         } 
//         else if (event === "SIGNED_IN") {
//           if (currentSession?.user && !initialSessionHandled) {
//             await fetchUserData(currentSession.user.id);
//           }
//           if (isMounted) setAuthChecked(true);
//         } 
//         else if (event === "SIGNED_OUT") {
//           setProfile(null);
//           setDailyLogs({});
//           setPhotoLogs([]);
//           setIsLoading(false);
//           if (isMounted) setAuthChecked(true);
//         }
//         else if (event === "TOKEN_REFRESHED") {
//           console.log("Token refreshed");
//         }
//       }
//     );

//     // 2. Fallback for older Supabase versions (if INITIAL_SESSION doesn't fire)
//     const fallbackTimeout = setTimeout(async () => {
//       if (!isMounted || initialSessionHandled) return;

//       console.log("Fallback: checking session manually");
//       const { data: { session: fallbackSession } } = await supabase.auth.getSession();

//       if (!isMounted) return;

//       setSession(fallbackSession);
//       if (fallbackSession?.user) {
//         await fetchUserData(fallbackSession.user.id);
//       } else {
//         setIsLoading(false);
//       }
//       setAuthChecked(true);
//     }, 2000);

//     return () => {
//       isMounted = false;
//       clearTimeout(fallbackTimeout);
//       subscription.unsubscribe();
//     };
//   }, [fetchUserData]);

//   // --------------------------------------------------------------
//   // UPDATE DAILY LOG
//   // --------------------------------------------------------------
//   const updateDailyLog = async (date: string, updates: Partial<DailyLog>) => {
//     setDailyLogs((prev) => ({
//       ...prev,
//       [date]: { ...(prev[date] || {}), ...updates },
//     }));

//     if (!session?.user) return;

//     await supabase.from("daily_logs").upsert({
//       ...updates,
//       date,
//       user_id: session.user.id,
//     });
//   };

//   // --------------------------------------------------------------
//   // HANDLE LOGOUT
//   // --------------------------------------------------------------
//   const handleLogout = async () => {
//     await supabase.auth.signOut();
//   };

//   // --------------------------------------------------------------
//   // VIEW TRANSITION
//   // --------------------------------------------------------------
//   const handleViewChange = (view: string) => {
//     if (view === currentView) return;
//     setIsMobileMenuOpen(false);
//     setViewBuffer(true);
//     setTimeout(() => {
//       setCurrentView(view);
//       setViewBuffer(false);
//     }, 300);
//   };

//   // --------------------------------------------------------------
//   // CLOSE MOBILE MENU ON RESIZE
//   // --------------------------------------------------------------
//   useEffect(() => {
//     const onResize = () => {
//       if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
//     };
//     window.addEventListener("resize", onResize);
//     return () => window.removeEventListener("resize", onResize);
//   }, []);

//   // --------------------------------------------------------------
//   // RENDER CONDITIONALS
//   // --------------------------------------------------------------

//   // 1. Checking authentication (waiting for Supabase to restore session)
//   if (!authChecked) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900">
//         <div className="relative">
//           <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-xl animate-pulse" />
//           <div className="relative p-6 bg-slate-800/50 rounded-2xl backdrop-blur">
//             <Dumbbell className="w-12 h-12 text-sky-400 animate-bounce" />
//           </div>
//         </div>
//         <div className="mt-6 flex items-center gap-3">
//           <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
//           <p className="text-lg font-medium text-slate-300">Checking authentication...</p>
//         </div>
//       </div>
//     );
//   }

//   // 2. Loading user data
//   if (isLoading && session) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900">
//         <div className="relative">
//           <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-xl animate-pulse" />
//           <div className="relative p-6 bg-slate-800/50 rounded-2xl backdrop-blur">
//             <Dumbbell className="w-12 h-12 text-sky-400 animate-bounce" />
//           </div>
//         </div>
//         <div className="mt-6 flex items-center gap-3">
//           <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
//           <p className="text-lg font-medium text-slate-300">Loading your data...</p>
//         </div>
//       </div>
//     );
//   }

//   // 3. Unauthenticated -> Show AuthPage
//   if (!session) {
//     return <AuthPage />;
//   }

//   // 4. Setup Gate -> Mandatory Profile Setup
//   const isSetupNeeded = profile && (
//     !profile.data ||
//     !profile.data.weightKg ||
//     (!profile.data.heightCm && !profile.data.heightFt)
//   );

//   if (isSetupNeeded) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 flex items-center justify-center p-4">
//         <div className="absolute inset-0 overflow-hidden pointer-events-none">
//           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
//           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
//         </div>

//         <div className="relative bg-white/95 backdrop-blur p-8 rounded-3xl shadow-2xl max-w-lg w-full">
//           <div className="flex items-center gap-3 mb-6">
//             <div className="p-3 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl text-white shadow-lg">
//               <Sparkles className="w-6 h-6" />
//             </div>
//             <div>
//               <h2 className="text-2xl font-bold text-slate-800">
//                 Welcome, {profile.username || "Athlete"}!
//               </h2>
//               <p className="text-slate-500 text-sm">Let's complete your profile</p>
//             </div>
//           </div>

//           <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 mb-6">
//             <p className="text-sky-800 text-sm">
//               We need your <strong>height</strong> and <strong>weight</strong> to personalize
//               your dashboard and provide tailored recommendations.
//             </p>
//           </div>

//           <ProfileSection
//             profile={profile}
//             setProfile={(updates: any) =>
//               setProfile((prev) =>
//                 prev ? { ...prev, ...updates, data: { ...prev.data, ...(updates.data || {}) } } : prev
//               )
//             }
//           />
//         </div>
//       </div>
//     );
//   }

//   // 5. Authenticated & Setup Complete -> Dashboard

//   // --------------------------------------------------------------
//   // CONTENT SWITCH
//   // --------------------------------------------------------------
//   const renderContent = () => {
//     if (viewBuffer) {
//       return (
//         <div className="h-full flex items-center justify-center min-h-[50vh]">
//           <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
//         </div>
//       );
//     }

//     switch (currentView) {
//       case "dashboard":
//         return <DashboardHome profile={profile} dailyLogs={dailyLogs} />;
//       case "profile":
//         return (
//           <ProfileSection
//             profile={profile}
//             setProfile={(updates: any) =>
//               setProfile((prev) =>
//                 prev ? { ...prev, ...updates, data: { ...prev.data, ...(updates.data || {}) } } : prev
//               )
//             }
//           />
//         );
//       case "dietChart":
//         return <DietChartSection profile={profile} />;
//       case "progressTracker":
//         return <ProgressTracker dailyLogs={dailyLogs} updateDailyLog={updateDailyLog} />;
//       case "photos":
//         return (
//           <PhotoJournalSection
//             photoLogs={photoLogs}
//             onSavePhotoLog={(log) =>
//               setPhotoLogs((prev) => [...prev.filter((p) => p.date !== log.date), log])
//             }
//           />
//         );
//       case "videos":
//         return <VideosSection />;
//       default:
//         return <div>Select a feature…</div>;
//     }
//   };

//   // --------------------------------------------------------------
//   // LAYOUT
//   // --------------------------------------------------------------
//   return (
//     <div className="min-h-screen bg-slate-100">
//       {/* Mobile Header */}
//       <header className="md:hidden bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-lg">
//         <div className="flex items-center gap-2">
//           <div className="p-1.5 bg-sky-500 rounded-lg">
//             <Dumbbell className="w-5 h-5" />
//           </div>
//           <span className="font-black text-lg">TAPOUT-LAB</span>
//         </div>
//         <button
//           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//           className="p-2.5 hover:bg-slate-700 rounded-xl transition-colors"
//         >
//           {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
//         </button>
//       </header>

//       {/* Mobile Overlay */}
//       {isMobileMenuOpen && (
//         <div
//           className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
//           onClick={() => setIsMobileMenuOpen(false)}
//         />
//       )}

//       {/* SIDEBAR */}
//       <aside
//         className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-2xl
//           flex flex-col transition-transform duration-300 ease-out
//           ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
//       >
//         {/* Logo */}
//         <div className="p-6 border-b border-slate-800/50">
//           <div className="flex items-center gap-3">
//             <div className="p-2.5 bg-gradient-to-br from-sky-400 to-sky-600 rounded-xl shadow-lg shadow-sky-500/20">
//               <Dumbbell className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-xl font-black text-white tracking-tight">TAPOUT-LAB</h1>
//               <p className="text-xs text-slate-500">Transform Your Body</p>
//             </div>
//           </div>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-grow p-4 space-y-1.5 overflow-y-auto">
//           {navItems.map(({ name, icon: Icon, view, desc }) => {
//             const isActive = currentView === view;
//             return (
//               <button
//                 key={view}
//                 onClick={() => handleViewChange(view)}
//                 disabled={viewBuffer}
//                 className={`group flex items-center w-full px-4 py-3.5 rounded-xl text-left transition-all duration-200 ${
//                   isActive
//                     ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/25"
//                     : "text-slate-400 hover:bg-slate-800/70 hover:text-white"
//                 }`}
//               >
//                 <div className={`p-2 rounded-lg mr-3 transition-colors ${
//                   isActive ? "bg-white/20" : "bg-slate-800 group-hover:bg-slate-700"
//                 }`}>
//                   <Icon className="w-5 h-5" />
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="font-semibold truncate">{name}</p>
//                   <p className={`text-xs truncate ${isActive ? "text-sky-100" : "text-slate-500"}`}>
//                     {desc}
//                   </p>
//                 </div>
//                 {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
//               </button>
//             );
//           })}
//         </nav>

//         {/* User Section */}
//         <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
//           {profile && (
//             <div className="flex items-center p-3 bg-slate-800/50 rounded-xl mb-3">
//               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg">
//                 {profile.username?.[0]?.toUpperCase() || "U"}
//               </div>
//               <div className="ml-3 flex-1 min-w-0">
//                 <p className="font-semibold text-white truncate">{profile.username || "User"}</p>
//                 <p className="text-xs text-slate-500">Free Plan</p>
//               </div>
//             </div>
//           )}

//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:text-white hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 rounded-xl transition-all duration-200 group"
//           >
//             <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
//             <span className="font-medium">Sign Out</span>
//           </button>
//         </div>
//       </aside>

//       {/* MAIN CONTENT */}
//       <main className="md:ml-72 min-h-screen">
//         <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
//           {renderContent()}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default App;