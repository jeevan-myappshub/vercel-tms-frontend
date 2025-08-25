"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Clock, Eye, AlertCircle, Calendar, Briefcase, CheckCircle } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "../../components/header";
import Sidebar from "../../components/sidebar";
import Footer from "../../components/footer";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
const CURRENT_EMAIL = process.env.NEXT_PUBLIC_EMAIL || "";

// StatusIcon Component
const StatusIcon = ({ status }) => {
  const statusMap = {
    Approved: {
      color: 'bg-green-500 text-white',
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
        </svg>
      ),
    },
    Pending: {
      color: 'bg-yellow-500 text-white',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    Rejected: {
      color: 'bg-red-500 text-white',
      icon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  };

  const item = statusMap[status] || {
    color: 'bg-gray-400 text-white',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="8" cy="8" r="8" />
      </svg>
    ),
  };

  return (
    <div className="relative group w-fit">
      <div className={`${item.color} rounded-full p-0.5`}>{item.icon}</div>
      <span className="absolute left-1/2 transform -translate-x-1/2 bottom-6 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
        {status}
      </span>
    </div>
  );
};

// Utility functions
function toYYYYMMDD(date) {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
}

function getDayOfWeek(dateStr) {
  if (!isValidDate(dateStr)) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", { weekday: "long" });
}

function isValidDate(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function formatFloatToTime(hours) {
  if (typeof hours !== "number" || isNaN(hours)) return "0:00";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function formatStatusReview(status) {
  if (!status || status === "Pending" || status === "pending" || status === null) return "Pending";
  if (status === "Approved" || status === "approved") return "Approved";
  if (status === "Rejected" || status === "rejected") return "Rejected";
  return "Unknown";
}

function sumTotalHours(logs) {
  return logs.reduce((total, log) => {
    let hours = 0;
    if (typeof log.total_hours === "string" && log.total_hours !== "0:00") {
      const [h, m] = log.total_hours.split(":").map(Number);
      hours = h + m / 60;
    } else if (typeof log.total_hours === "number" && !isNaN(log.total_hours)) {
      hours = log.total_hours;
    }
    return total + hours;
  }, 0);
}

function mapStatusToBackend(status) {
  if (status === "Pending") return "pending";
  if (status === "Approved") return "approved";
  if (status === "Rejected") return "rejected";
  return status;
}

// DailyLogChangesDialog Component
const DailyLogChangesDialog = ({ open, onOpenChange, logId, projects }) => {
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    const fetchChanges = async () => {
      if (!logId || String(logId).startsWith("temp-")) {
        setChanges([]);
        return;
      }
      try {
        const response = await fetch(`${BASE_URL}/api/daily-logs/${logId}/changes`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.AUTH_TOKEN || ""}`,
          },
          cache: "no-store",
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch changes");
        }
        const data = await response.json();
        setChanges(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(`Error fetching changes: ${error.message}`
        );
        setChanges([]);
      }
    };

    if (open && logId) {
      fetchChanges();
    }
  }, [open, logId]);

  const getProjectName = (pid) => {
    const proj = projects.find((p) => String(p.id) === String(pid));
    return proj ? proj.name : "Unknown";
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 transition-opacity duration-300 ${
        open ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-labelledby="dialog-title"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md sm:max-w-lg p-6 max-h-[80vh] overflow-y-auto transform transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h3 id="dialog-title" className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-600" />
            Change History for Log #{logId}
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close dialog"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {changes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Changed At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {changes.map((change, index) => (
                  <tr key={change.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{getProjectName(change.project_id)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{change.new_description || "N/A"}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusIcon status={formatStatusReview(change.status_review)} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {index === 0
                        ? "Initial Entry"
                        : new Date(change.changed_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4 text-sm">No changes recorded for this log.</div>
        )}
      </div>
    </div>
  );
};

// TimesheetTable Component
const TimesheetTable = ({ day, logs, projects, loading, onViewChanges }) => {
  const totalDailyHours = sumTotalHours(logs);

  // Check if any log is rejected
  const showRejectionReason = logs.some((log) => log.status_review === "Rejected");

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-400 shadow-sm bg-white">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Project
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Description
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Total Hours
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Reviewer
            </th>
            {showRejectionReason && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Rejection Reason
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {logs.length > 0 ? (
            logs.map((log) => (
              <tr
                key={`${log.id}-${day.date}`}
                className={`hover:bg-gray-50 transition-colors ${log.error ? "bg-red-50" : ""}`}
              >
                <td className="px-4 py-3 text-sm text-gray-600">
                  {projects.find((p) => String(p.id) === String(log.project_id))?.name || "Unknown"}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {log.description || "No description provided"}
                </td>
                <td
                  className={`px-4 py-3 text-sm text-gray-600 flex items-center gap-2 ${
                    log.error ? "text-red-600" : ""
                  }`}
                >
                  {typeof log.total_hours === "number"
                    ? formatFloatToTime(log.total_hours)
                    : log.total_hours || "0:00"}
                  {log.error && <AlertCircle className="h-4 w-4 text-red-600" title={log.error} />}
                </td>
                <td className="px-4 py-3 text-sm">
                  <StatusIcon status={formatStatusReview(log.status_review)} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {log.reviewer_name || "N/A"}
                </td>
                {showRejectionReason && (
                  <td className="px-4 py-3 text-sm text-red-500">
                    {log.status_review === "Rejected" ? log.rejection_reason || "N/A" : "-"}
                  </td>
                )}
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewChanges(log.id)}
                    disabled={!log.id || String(log.id).startsWith("temp-") || loading}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100 hover:border-indigo-500 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`View changes for log ${log.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={showRejectionReason ? 7 : 6}
                className="text-gray-500 text-center py-6 text-sm"
              >
                No logs found for this day.
              </td>
            </tr>
          )}
        </tbody>
        {logs.length > 0 && (
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Total Hours for {day.date}:
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                {formatFloatToTime(totalDailyHours)}
              </td>
              <td></td>
              {showRejectionReason && <td></td>}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

// PreviousTimesheet Component
export default function PreviousTimesheet() {
  const [employee, setEmployee] = useState(null);
  const [projects, setProjects] = useState([]);
  const [logsByDay, setLogsByDay] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const router = useRouter();

  const today = toYYYYMMDD(new Date());
  const weekDates = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      const dateStr = toYYYYMMDD(date);
      days.push({
        date: dateStr,
        day: getDayOfWeek(dateStr),
      });
    }
    return days;
  }, []);

  const grandTotalHours = useMemo(() => {
    return Object.values(logsByDay).reduce((total, logs) => total + sumTotalHours(logs), 0);
  }, [logsByDay]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${BASE_URL}/api/employee-info?email=${encodeURIComponent(CURRENT_EMAIL)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.AUTH_TOKEN || ""}`,
            },
            cache: "no-store",
          }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch employee data");
        }
        const data = await response.json();
        setEmployee(data.employee || null);
        setProjects(data.projects || []);
      } catch (error) {
        toast.error(`Error fetching employee data: ${error.message}`);
        setEmployee(null);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
  }, []);

  useEffect(() => {
    if (employee?.id) {
      handleApplyFilters();
    }
  }, [employee?.id]);

  const handleApplyFilters = useCallback(async () => {
    if (filterStartDate && filterEndDate && new Date(filterStartDate) > new Date(filterEndDate)) {
      toast.error("Start date must be before or equal to end date.");
      return;
    }

    if (!employee?.id) {
      toast.error("Employee data not loaded. Please try again.");
      return;
    }

    setLoading(true);
    try {
      let url = `${BASE_URL}/api/daily-logs/filter/${employee.id}`;
      const queryParams = new URLSearchParams();
      if (filterStartDate) queryParams.append("start_date", filterStartDate);
      if (filterEndDate) queryParams.append("end_date", filterEndDate);
      if (filterProjectId && filterProjectId !== "all") queryParams.append("project_id", filterProjectId);
      if (filterStatus && filterStatus !== "all") queryParams.append("status_review", mapStatusToBackend(filterStatus));
      if (queryParams.toString()) url += `?${queryParams.toString()}`;
      else url = `${BASE_URL}/api/daily-logs/latest-seven-days/${employee.id}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.AUTH_TOKEN || ""}`,
        },
        cache: "no-store",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch logs (Status: ${response.status})`);
      }
      const data = await response.json();

      let logsData = Array.isArray(data) ? data : data.logs || [];
      if (!Array.isArray(logsData)) {
        console.error("Received logsData is not an array:", logsData);
        throw new Error("Invalid response format: logs data must be an array");
      }

      const logsMap = {};
      logsData.forEach((log) => {
        const logDate = log.log_date;
        if (!logsMap[logDate]) {
          logsMap[logDate] = [];
        }
        if (!logsMap[logDate].some((existingLog) => String(existingLog.id) === String(log.id))) {
          const newLog = {
            id: String(log.id),
            project_id: log.project_id?.toString() || "",
            description: log.task_description || "",
            total_hours: log.total_hours !== null && !isNaN(log.total_hours) ? formatFloatToTime(log.total_hours) : "0:00",
            log_date: log.log_date,
            status_review: formatStatusReview(log.status_review),
            reviewer_name: log.reviewer_name || "",
            rejection_reason: log.rejection_reason || "",
            error: null,
          };
          logsMap[logDate].push(newLog);
        }
      });

      const filteredLogsMap = Object.fromEntries(
        Object.entries(logsMap).filter(([_, logs]) => logs.length > 0)
      );

      setLogsByDay(filteredLogsMap);
      toast.success(
        Object.keys(filteredLogsMap).length > 0
          ? "Logs loaded successfully!"
          : "No logs found for the selected filters.",
      );
    } catch (error) {
      console.error("Error in handleApplyFilters:", error);
      toast.error(`Error loading logs: ${error.message}`);
      setLogsByDay({});
    } finally {
      setLoading(false);
    }
  }, [employee?.id, filterStartDate, filterEndDate, filterProjectId, filterStatus]);

  const handleClearFilters = useCallback(async () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterProjectId("all");
    setFilterStatus("all");
    setLogsByDay({});
    setShowChangeDialog(false);
    setSelectedLogId(null);
    setLoading(true);

    try {
      await handleApplyFilters();
      toast.success("Filters cleared. Showing last 7 days of logs.");
    } catch (error) {
      console.error("Error in handleClearFilters:", error);
      toast.error(`Failed to fetch logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [handleApplyFilters]);

  const handleBackToToday = useCallback(() => {
    window.location.href = "/";
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <div className="flex flex-1">
        <Sidebar onBackToToday={handleBackToToday} />
        <main className="flex-1 ml-16 p-8 pt-24">
          <ToastContainer position="top-right" autoClose={3000}  />
          <div className="max-w-[1400px] mx-auto">
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-500 p-6">
                <h2 className="text-2xl font-bold text-white">Timesheet History</h2>
                <p className="mt-1 text-indigo-100 text-sm">View and filter your past timesheet entries</p>
              </div>
              <div className="p-6">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    Filter Timesheet Entries
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          id="start-date"
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          aria-label="Select start date"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          id="end-date"
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          aria-label="Select end date"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Project
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          id="project-filter"
                          value={filterProjectId}
                          onChange={(e) => setFilterProjectId(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                          aria-label="Select project"
                        >
                          <option value="all">All Projects</option>
                          {projects.map((proj) => (
                            <option key={proj.id} value={proj.id.toString()}>
                              {proj.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <div className="relative">
                        <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                          id="status-filter"
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                          aria-label="Select status"
                        >
                          <option value="all">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={handleClearFilters}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 hover:border-indigo-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Clear all filters"
                    >
                      {loading ? "Clearing..." : "Clear Filters"}
                    </button>
                    <button
                      onClick={handleApplyFilters}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-indigo-600 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Apply filters"
                    >
                      {loading ? "Applying..." : "Apply Filters"}
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.keys(logsByDay).length > 0 ? (
                      <>
                        {Object.entries(logsByDay)
                          .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
                          .map(([date, logs]) => (
                            <div key={date} className="bg-white rounded-lg shadow-sm p-6">
                              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-indigo-600" />
                                {date} ({getDayOfWeek(date)})
                              </h3>
                              <TimesheetTable
                                day={{ date, day: getDayOfWeek(date) }}
                                logs={logs}
                                projects={projects}
                                loading={loading}
                                onViewChanges={(logId) => {
                                  setSelectedLogId(logId);
                                  setShowChangeDialog(true);
                                }}
                              />
                            </div>
                          ))}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-indigo-600" />
                            Grand Total Hours
                          </h3>
                          <p className="text-gray-700 text-base">
                            Total Hours for{" "}
                            {filterStartDate && filterEndDate ? `${filterStartDate} to ${filterEndDate}` : "Last 7 Days"}:{" "}
                            <span className="font-semibold">{formatFloatToTime(grandTotalHours)}</span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-500 text-center py-8 bg-white rounded-lg shadow-sm text-sm">
                        No logs found for the selected filters. Try adjusting your filters or applying new ones.
                      </div>
                    )}
                    <DailyLogChangesDialog
                      open={showChangeDialog}
                      onOpenChange={setShowChangeDialog}
                      logId={selectedLogId}
                      projects={projects}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}