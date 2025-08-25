"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export default function DateFilterDropdown({ onWeekViewSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedView, setSelectedView] = useState("week");
  const dropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  // Detect current route and update selected view
  useEffect(() => {
    if (pathname === "/today") {
      setSelectedView("today");
    } else {
      setSelectedView("week");
    }
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleViewChange = (view) => {
    setSelectedView(view);
    if (view === "today") {
      router.push("/today");
    } else if (view === "week") {
      router.push("/");
      onWeekViewSelect();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left w-40" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-gray-700 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-600 font-semibold px-4 py-2 rounded-md text-sm shadow flex items-center justify-between"
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {selectedView === "week" ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          {selectedView === "week" ? "Week View" : "Today’s View"}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-indigo-600" />}
      </button>

      {isOpen && (
        <div className="absolute mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg z-50">
          <button
            onClick={() => handleViewChange("week")}
            className={`w-full text-left px-2 py-1 text-sm flex items-center gap-2 ${
              selectedView === "week"
                ? "bg-indigo-100 text-indigo-800 dark:bg-gray-600 dark:text-indigo-400"
                : "text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Week View
          </button>
          <button
            onClick={() => handleViewChange("today")}
            className={`w-full text-left px-2 py-1 text-sm flex items-center gap-2 ${
              selectedView === "today"
                ? "bg-indigo-100 text-indigo-800 dark:bg-gray-600 dark:text-indigo-400"
                : "text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            Today’s View
          </button>
        </div>
      )}
    </div>
  );
}

// ...existing code...}