import React from "react";
import { Dumbbell } from "lucide-react";

const Sidebar = ({ currentView, setCurrentView, navItems, profile }) => {
  return (
    <aside
      className="
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white shadow-2xl p-4
        flex flex-col
      "
    >
      {/* Logo */}
      <div className="text-2xl font-black text-sky-400 mb-8 pl-2 tracking-tighter hidden md:flex items-center gap-2">
        <Dumbbell className="w-6 h-6" />
        TAPOUT-LAB
      </div>

      {/* Navigation */}
      <nav className="flex-grow space-y-2 mt-4 md:mt-0">
        {navItems?.map(({ name, icon: Icon, view }) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 text-left ${
              currentView === view
                ? "bg-sky-600 text-white font-bold shadow-lg scale-105"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Icon className="w-5 h-5 mr-3" />
            {name}
          </button>
        ))}
      </nav>

      {/* User Box */}
      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center px-2">
          <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center font-bold">
            {profile?.name?.charAt(0)}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">{profile?.name}</p>
            <p className="text-xs text-slate-500 truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
