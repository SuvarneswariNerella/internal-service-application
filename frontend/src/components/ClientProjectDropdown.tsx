import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Building2, FolderGit2, Globe, Check } from "lucide-react";
import type { Client } from "@/api/clients";
import type { Project } from "@/api/projects";
import { cn } from "@/utils/cn";

interface ClientProjectDropdownProps {
  clients: Client[];
  projects: Project[];
  selectedClientId: string;
  selectedProjectId: string;
  onSelectClient: (clientId: string) => void;
  onSelectProject: (projectId: string, clientId: string) => void;
  onSelectAll: () => void;
}

export default function ClientProjectDropdown({
  clients,
  projects,
  selectedClientId,
  selectedProjectId,
  onSelectClient,
  onSelectProject,
  onSelectAll,
}: ClientProjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredClientId, setHoveredClientId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHoveredClientId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Label text for button
  const getButtonLabel = () => {
    if (selectedProject) {
      return (
        <span className="flex items-center gap-1.5 truncate">
          <FolderGit2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="truncate font-semibold text-gray-900">{selectedProject.name}</span>
          {selectedClient && (
            <span className="text-xs text-gray-500 font-normal truncate">({selectedClient.name})</span>
          )}
        </span>
      );
    }
    if (selectedClient) {
      return (
        <span className="flex items-center gap-1.5 truncate">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="truncate font-semibold text-gray-900">{selectedClient.name}</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 truncate">
        <Globe className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="truncate">All Clients (Full Application)</span>
      </span>
    );
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setHoveredClientId(null);
        }}
        className={cn(
          "h-10 px-3.5 rounded-lg border text-sm font-medium transition-all duration-150 flex items-center justify-between gap-3 min-w-[240px] max-w-[320px] bg-white shadow-2xs",
          isOpen
            ? "border-indigo-500 ring-2 ring-indigo-500/20 text-gray-900"
            : "border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50/50"
        )}
      >
        <div className="truncate min-w-0 flex-1 text-left">{getButtonLabel()}</div>
        <ChevronDown
          className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180 text-indigo-600")}
        />
      </button>

      {/* Main Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-gray-200/80 py-2 animate-in fade-in-50 zoom-in-95 duration-150"
          onMouseLeave={() => setHoveredClientId(null)}
        >
          {/* Header */}
          <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Filter by Client / Project
          </div>

          {/* Option: All Clients */}
          <button
            type="button"
            onClick={() => {
              onSelectAll();
              setIsOpen(false);
              setHoveredClientId(null);
            }}
            onMouseEnter={() => setHoveredClientId(null)}
            className={cn(
              "w-full px-3.5 py-2 text-left text-sm flex items-center justify-between transition-colors",
              !selectedClientId && !selectedProjectId
                ? "bg-indigo-50/80 text-indigo-700 font-semibold"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  !selectedClientId && !selectedProjectId ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"
                )}
              >
                <Globe className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="leading-tight font-medium">All Clients</p>
                <p className="text-[11px] text-gray-400">Show all servers in application</p>
              </div>
            </div>
            {!selectedClientId && !selectedProjectId && <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
          </button>

          <div className="my-1.5 h-px bg-gray-100" />

          {/* Clients List Header */}
          <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Clients ({clients.length})
          </div>

          {/* Clients List */}
          <div className="max-h-[320px] overflow-y-auto space-y-0.5">
            {clients.map((client) => {
              const clientProjects = projects.filter((p) => p.clientId === client.id);
              const isSelected = selectedClientId === client.id && !selectedProjectId;
              const isHovered = hoveredClientId === client.id;
              const hasSelectedProject = selectedClientId === client.id && selectedProjectId;

              return (
                <div
                  key={client.id}
                  className="relative"
                  onMouseEnter={() => setHoveredClientId(client.id)}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectClient(client.id);
                      setIsOpen(false);
                      setHoveredClientId(null);
                    }}
                    className={cn(
                      "w-full px-3.5 py-2 text-left text-sm flex items-center justify-between transition-colors group",
                      isSelected
                        ? "bg-indigo-50/90 text-indigo-700 font-semibold"
                        : isHovered || hasSelectedProject
                        ? "bg-gray-100/80 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "bg-indigo-100 text-indigo-600"
                            : isHovered
                            ? "bg-indigo-50 text-indigo-600"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="truncate min-w-0 flex-1">
                        <p className="truncate leading-tight font-medium group-hover:text-indigo-600 transition-colors">
                          {client.name}
                        </p>
                        {client.company && (
                          <p className="truncate text-[11px] text-gray-400 font-normal">{client.company}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {clientProjects.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium group-hover:bg-indigo-100 group-hover:text-indigo-700">
                          {clientProjects.length} {clientProjects.length === 1 ? "proj" : "projs"}
                        </span>
                      )}
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-transform",
                          isHovered && "translate-x-0.5 text-indigo-600"
                        )}
                      />
                    </div>
                  </button>

                  {/* FLYOUT / SUBMENU FOR HOVERED CLIENT (Right Side) */}
                  {isHovered && (
                    <div
                      className="absolute left-full top-0 ml-1.5 w-64 bg-white rounded-xl shadow-2xl border border-gray-200/90 py-2 z-50 animate-in fade-in-50 slide-in-from-left-2 duration-150"
                      onMouseEnter={() => setHoveredClientId(client.id)}
                    >
                      {/* Submenu Title */}
                      <div className="px-3.5 py-1.5 mb-1 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900 truncate">{client.name}</span>
                        <span className="text-[10px] text-indigo-600 font-semibold uppercase bg-indigo-50 px-1.5 py-0.5 rounded">
                          Projects
                        </span>
                      </div>

                      {/* Submenu Option: All Client Servers */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectClient(client.id);
                          setIsOpen(false);
                          setHoveredClientId(null);
                        }}
                        className={cn(
                          "w-full px-3.5 py-1.5 text-left text-xs font-medium flex items-center justify-between transition-colors",
                          selectedClientId === client.id && !selectedProjectId
                            ? "bg-indigo-50 text-indigo-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>All {client.name} Servers</span>
                        </div>
                        {selectedClientId === client.id && !selectedProjectId && (
                          <Check className="w-3.5 h-3.5 text-indigo-600" />
                        )}
                      </button>

                      <div className="my-1 h-px bg-gray-100" />

                      {/* Submenu Projects List */}
                      {clientProjects.length === 0 ? (
                        <div className="px-3.5 py-3 text-center text-xs text-gray-400 italic">
                          No projects for this client
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {clientProjects.map((project) => {
                            const isProjectSelected = selectedProjectId === project.id;
                            return (
                              <button
                                key={project.id}
                                type="button"
                                onClick={() => {
                                  onSelectProject(project.id, client.id);
                                  setIsOpen(false);
                                  setHoveredClientId(null);
                                }}
                                className={cn(
                                  "w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors group/proj",
                                  isProjectSelected
                                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                                    : "text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-900"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <FolderGit2
                                    className={cn(
                                      "w-3.5 h-3.5 shrink-0",
                                      isProjectSelected
                                        ? "text-indigo-600"
                                        : "text-gray-400 group-hover/proj:text-indigo-500"
                                    )}
                                  />
                                  <span className="truncate">{project.name}</span>
                                </div>
                                {isProjectSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0 ml-1" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
