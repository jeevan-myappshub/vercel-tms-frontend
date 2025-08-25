"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminSidebar from "../../components/adminsidebar";
import { Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


// Constants
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:5000";
const PROJECT_PAGE_SIZE = 5;
const toastConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: true,
};

// Environment variable check
if (!process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NODE_ENV === "production") {
  console.warn("NEXT_PUBLIC_BACKEND_URL is not set. Using default localhost URL.");
}

// Search Form Component
function SearchForm({
  searchQuery,
  setSearchQuery,
  loading,
  handleSearch,
  handleClearSearch,
}) {
  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm p-6">
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label htmlFor="project-name" className="text-sm font-medium text-gray-700">
            Project Name
          </Label>
          <Input
            id="project-name"
            value={searchQuery.project_name || ""}
            onChange={(e) => setSearchQuery({ ...searchQuery, project_name: e.target.value })}
            placeholder="Search by project name"
            className="mt-1 border-gray-300 focus:ring-blue-500 text-sm"
            aria-label="Search by project name"
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="manager-name" className="text-sm font-medium text-gray-700">
            Manager Name
          </Label>
          <Input
            id="manager-name"
            value={searchQuery.manager_name || ""}
            onChange={(e) => setSearchQuery({ ...searchQuery, manager_name: e.target.value })}
            placeholder="Search by manager name"
            className="mt-1 border-gray-300 focus:ring-blue-500 text-sm"
            aria-label="Search by manager name"
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="team-member-name" className="text-sm font-medium text-gray-700">
            Team Member Name
          </Label>
          <Input
            id="team-member-name"
            value={searchQuery.team_member_name || ""}
            onChange={(e) => setSearchQuery({ ...searchQuery, team_member_name: e.target.value })}
            placeholder="Search by team member name"
            className="mt-1 border-gray-300 focus:ring-blue-500 text-sm"
            aria-label="Search by team member name"
            disabled={loading}
          />
        </div>
        <div className="md:col-span-3 flex justify-end gap-3">
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
            aria-label="Search projects"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Searching...
              </span>
            ) : (
              "Search"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearSearch}
            disabled={loading}
            aria-label="Clear search filters"
            className="text-gray-700 hover:bg-gray-100 px-6"
          >
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}

// Update Manager Modal Component
function UpdateManagerModal({
  project,
  employees,
  loading,
  handleUpdateManager,
}) {
  const [newManagerId, setNewManagerId] = useState("");
  const currentManager = project.managers.length > 0 ? project.managers[0] : null;
  const currentManagerId = currentManager ? currentManager.id.toString() : "";
  const currentManagerName = currentManager ? currentManager.name : "None";

  // Filter out current manager from employees
  const availableEmployees = useMemo(() => {
    const currentManagerIds = project.managers.map((m) => m.id.toString());
    return employees.filter((emp) => !currentManagerIds.includes(emp.id.toString()));
  }, [employees, project.managers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newManagerId) {
      toast.error("Please select a new manager", toastConfig);
      return;
    }
    if (newManagerId === currentManagerId) {
      toast.error("New manager cannot be the same as the current manager", toastConfig);
      return;
    }
    handleUpdateManager({
      project_id: project.project_id.toString(),
      old_manager_id: currentManagerId,
      new_manager_id: newManagerId,
    });
  };

  return (
    <DialogContent className="sm:max-w-md p-6">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">Update Manager for {project.project_name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="current-manager" className="text-sm font-medium text-gray-700">
            Current Manager
          </Label>
          <Input
            id="current-manager"
            value={currentManagerName}
            readOnly
            className="mt-1 border-gray-300 bg-gray-100 text-sm cursor-not-allowed"
            aria-label="Current manager (read-only)"
          />
        </div>
        <div>
          <Label htmlFor="new-manager" className="text-sm font-medium text-gray-700">
            New Manager
          </Label>
          <Select
            value={newManagerId}
            onValueChange={setNewManagerId}
            disabled={loading || availableEmployees.length === 0}
          >
            <SelectTrigger id="new-manager" className="mt-1 text-sm">
              <SelectValue placeholder={availableEmployees.length === 0 ? "No other employees available" : "Select new manager"} />
            </SelectTrigger>
            <SelectContent>
              {availableEmployees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id.toString()}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex justify-end gap-3">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              className="text-gray-700 hover:bg-gray-100 px-6"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            variant="default"
            size="sm"
            disabled={loading || availableEmployees.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
            aria-label="Update project manager"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Updating...
              </span>
            ) : (
              "Update Manager"
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

// Delete Project Modal Component
function DeleteProjectModal({ project, loading, handleDeleteProject }) {
  return (
    <DialogContent className="sm:max-w-md p-6">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">Delete Project</DialogTitle>
        <DialogDescription className="text-sm text-gray-600">
          Are you sure you want to delete the project <strong>{project.project_name}</strong>? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-3">
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            className="text-gray-700 hover:bg-gray-100 px-6"
          >
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={loading}
          onClick={() => handleDeleteProject(project.project_id)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6"
          aria-label={`Delete project ${project.project_name}`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              Deleting...
            </span>
          ) : (
            "Delete"
          )}
        </Button>
      </div>
    </DialogContent>
  );
}

// Project Table Component
function ProjectTable({
  projects,
  currentPage,
  handlePageChange,
  totalPages,
  employees,
  loading,
  handleUpdateManager,
  handleDeleteProject,
}) {
  const paginatedProjects = useMemo(() => {
    return projects.slice(
      (currentPage - 1) * PROJECT_PAGE_SIZE,
      currentPage * PROJECT_PAGE_SIZE
    );
  }, [projects, currentPage]);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-sm font-semibold text-gray-700 py-4">Name</TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4">Description</TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4">Managers</TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4">Team Members</TableHead>
            <TableHead className="text-sm font-semibold text-gray-700 py-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProjects.map((proj, index) => (
            <TableRow
              key={proj.project_id}
              className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-gray-100" : "bg-white"}`}
            >
              <TableCell className="py-4 text-gray-800 text-sm">{proj.project_name}</TableCell>
              <TableCell className="py-4 text-gray-800 text-sm">{proj.description || "N/A"}</TableCell>
              <TableCell className="py-4 text-gray-800 text-sm">
                {proj.managers.length > 0
                  ? proj.managers.map((m) => m.name).join(", ")
                  : "None"}
              </TableCell>
              <TableCell className="py-4 text-gray-800 text-sm">
                {proj.team_members.length > 0
                  ? proj.team_members.map((m) => m.name).join(", ")
                  : "None"}
              </TableCell>
              <TableCell className="py-4 text-gray-800 text-sm">
                <div className="flex items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-700 hover:bg-gray-100 px-4"
                        aria-label={`Update manager for ${proj.project_name}`}
                      >
                        Update Manager
                      </Button>
                    </DialogTrigger>
                    <UpdateManagerModal
                      project={proj}
                      employees={employees}
                      loading={loading}
                      handleUpdateManager={handleUpdateManager}
                    />
                  </Dialog>
                  <Dialog>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={loading}
                              aria-label={`Delete project ${proj.project_name}`}
                            >
                              <Trash className="h-4 w-4 text-red-500 hover:text-red-700" />
                            </Button>
                          </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Project</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DeleteProjectModal
                      project={proj}
                      loading={loading}
                      handleDeleteProject={handleDeleteProject}
                    />
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            aria-label="Previous page of projects"
            className="text-gray-700 hover:bg-gray-100 px-6"
          >
            Previous
          </Button>
          <span className="text-xs text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            aria-label="Next page of projects"
            className="text-gray-700 hover:bg-gray-100 px-6"
          >
            Next
          </Button>
        </div>
      )}
    </>
  );
}

// Main ProjectsPage Component
export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState({
    project_name: "",
    manager_name: "",
    team_member_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const abortControllerRef = useRef(null);

  // Fetch projects and employees data
  useEffect(() => {
    const fetchProjectsData = async () => {
      setLoading(true);
      abortControllerRef.current = new AbortController();
      try {
        const res = await fetch(`${BASE_URL}/api/projects/all`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal: abortControllerRef.current.signal,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Failed to fetch projects: ${res.statusText}`);
        }
        const data = await res.json();
        const sortedProjects = Array.isArray(data.projects)
          ? data.projects.sort((a, b) => a.project_id - b.project_id)
          : [];
        setProjects(sortedProjects);
        setAllProjects(sortedProjects);
        setEmployees(data.all_employees || []);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error("Error fetching projects:", error);
        toast.error(error.message || "Failed to fetch projects", toastConfig);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectsData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Search handler
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.project_name.trim()) {
        params.append("project_name", searchQuery.project_name.trim());
      }
      if (searchQuery.manager_name.trim()) {
        params.append("manager_name", searchQuery.manager_name.trim());
      }
      if (searchQuery.team_member_name.trim()) {
        params.append("team_member_name", searchQuery.team_member_name.trim());
      }

      abortControllerRef.current = new AbortController();
      const res = await fetch(`${BASE_URL}/api/projects/all?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch projects: ${res.statusText}`);
      }
      const data = await res.json();
      const sortedProjects = Array.isArray(data.projects)
        ? data.projects.sort((a, b) => a.project_id - b.project_id)
        : [];
      setProjects(sortedProjects);
      setCurrentPage(1);
      setEmployees(data.all_employees || []);
      toast.success(
        `Found ${sortedProjects.length} project${sortedProjects.length === 1 ? "" : "s"}`,
        toastConfig
      );
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Error in search:", error);
      toast.error(error.message || "Failed to filter projects", toastConfig);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchQuery({
      project_name: "",
      manager_name: "",
      team_member_name: "",
    });
    setProjects(allProjects);
    setCurrentPage(1);
    toast.success("Filters cleared, showing all projects", toastConfig);
  }, [allProjects]);

  // Update manager handler
  const handleUpdateManager = useCallback(async (formData) => {
    setLoading(true);
    try {
      const payload = {
        project_id: parseInt(formData.project_id),
        old_manager_id: formData.old_manager_id ? parseInt(formData.old_manager_id) : null,
        new_manager_id: parseInt(formData.new_manager_id),
      };

      const res = await fetch(`${BASE_URL}/api/projects/update-manager`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to update manager: ${res.statusText}`);
      }

      // Refresh projects data
      const projectsRes = await fetch(`${BASE_URL}/api/projects/all`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!projectsRes.ok) {
        const err = await projectsRes.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch projects: ${projectsRes.statusText}`);
      }
      const data = await projectsRes.json();
      const sortedProjects = Array.isArray(data.projects)
        ? data.projects.sort((a, b) => a.project_id - b.project_id)
        : [];
      setProjects(sortedProjects);
      setAllProjects(sortedProjects);
      setEmployees(data.all_employees || []);

      toast.success("Project manager updated successfully", toastConfig);
    } catch (error) {
      console.error("Error updating manager:", error);
      toast.error(error.message || "Failed to update manager", toastConfig);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete project handler
  const handleDeleteProject = useCallback(async (projectId) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/projects/delete/${projectId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to delete project: ${res.statusText}`);
      }

      // Refresh projects data
      const projectsRes = await fetch(`${BASE_URL}/api/projects/all`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!projectsRes.ok) {
        const err = await projectsRes.json().catch(() => ({}));
        throw new Error(err.error || `Failed to fetch projects: ${projectsRes.statusText}`);
      }
      const data = await projectsRes.json();
      const sortedProjects = Array.isArray(data.projects)
        ? data.projects.sort((a, b) => a.project_id - b.project_id)
        : [];
      setProjects(sortedProjects);
      setAllProjects(sortedProjects);
      setEmployees(data.all_employees || []);
      setCurrentPage(1);

      toast.success("Project deleted successfully", toastConfig);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(error.message || "Failed to delete project", toastConfig);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pagination
  const totalPages = Math.ceil(projects.length / PROJECT_PAGE_SIZE);
  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }, [totalPages]);

  // Sidebar dialog handlers
  const [showAddEmployeeDialog, setShowAddEmployeeDialog] = useState(false);
  const [showAddDepartmentDialog, setShowAddDepartmentDialog] = useState(false);
  const [showAddDesignationDialog, setShowAddDesignationDialog] = useState(false);
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);

  // Handle sidebar toggle
  const handleToggleSidebar = () => {
    setIsSidebarExpanded(!isSidebarExpanded);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        setShowAddEmployeeDialog={setShowAddEmployeeDialog}
        setShowAddDepartmentDialog={setShowAddDepartmentDialog}
        setShowAddDesignationDialog={setShowAddDesignationDialog}
        setShowAddProjectDialog={setShowAddProjectDialog}
        onToggleSidebar={handleToggleSidebar}
      />
      <div
        className={`flex-1 p-6 transition-all duration-300 ${
          isSidebarExpanded ? "ml-64" : "ml-16"
        }`}
      >
        <ToastContainer {...toastConfig} />
        <Card className="w-full shadow-md rounded-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6">
            <CardTitle className="text-xl font-bold">Projects Dashboard</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <SearchForm
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              loading={loading}
              handleSearch={handleSearch}
              handleClearSearch={handleClearSearch}
            />
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">All Projects</h2>
              {projects.length > 0 && (
                <span className="text-xs text-gray-600">
                  Showing {projects.length} project{projects.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-gray-500 text-center py-8 text-sm">
                No projects found.
              </div>
            ) : (
              <ProjectTable
                projects={projects}
                currentPage={currentPage}
                handlePageChange={handlePageChange}
                totalPages={totalPages}
                employees={employees}
                loading={loading}
                handleUpdateManager={handleUpdateManager}
                handleDeleteProject={handleDeleteProject}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}