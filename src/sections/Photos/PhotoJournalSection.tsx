import React, { useState, useEffect } from "react";
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
  <div className="space-y-5 animate-fade-in">

    {/* Header */}
    <div className="p-4 bg-white rounded-lg shadow border flex justify-between items-center">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2 text-sky-500" /> Photo Gallery
        </h2>
        <p className="text-gray-500 text-xs mt-1">Track your transformation.</p>
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
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const hasLog = getLogForDate(day);
            const isSelected = selectedDate ===
              `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

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
                  <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-sky-500'}`} />
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
                {tempFront ? (
                  <img src={tempFront} alt="Front" className="w-full h-28 object-cover rounded-md" />
                ) : (
                  <div className="text-gray-400 py-4">
                    <Camera className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs">Front View</p>
                  </div>
                )}
                <input type="file" accept="image/*"
                  onChange={(e) => handleFileChange(e, 'front')}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>

              {/* Side */}
              <div className="border-2 border-dashed border-gray-200 rounded-md p-3 text-center hover:bg-gray-50 transition relative group">
                {tempSide ? (
                  <img src={tempSide} alt="Side" className="w-full h-28 object-cover rounded-md" />
                ) : (
                  <div className="text-gray-400 py-4">
                    <Camera className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs">Side View</p>
                  </div>
                )}
                <input type="file" accept="image/*"
                  onChange={(e) => handleFileChange(e, 'side')}
                  className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={savePhotos}
                className="flex-1 py-2 bg-sky-600 text-white text-sm rounded-md hover:bg-sky-700">
                Save
              </button>
              <button onClick={() => setSelectedDate(null)}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="bg-slate-800 rounded-lg p-1 relative">
              <span className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px]">
                BEFORE ({firstLog.date})
              </span>
              <img src={firstLog.frontUrl} className="w-full h-48 object-cover rounded-md" />
            </div>
          </div>

          <div>
            <div className="bg-slate-800 rounded-lg p-1 relative">
              <span className="absolute top-2 left-2 bg-green-600 px-2 py-0.5 rounded text-[10px]">
                AFTER ({lastLog.date})
              </span>
              <img src={lastLog.frontUrl} className="w-full h-48 object-cover rounded-md" />
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);

};


export default PhotoJournalSection;
