"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getActiveSessions,
  type UserConsoleProfile,
  type UserRole,
} from "@/lib/user-store";
import { RAILWAY_ZONES, MASTER_DEVICES } from "@/lib/railway-metadata";
import {
  Users,
  UserPlus,
  Shield,
  Monitor,
  Thermometer,
  Search,
  Key,
  MapPin,
  Building2,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Check,
  X,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES: UserRole[] = [
  "Administrator",
  "Divisional Engineer",
  "Station Supervisor",
  "Section Inspector",
  "Maintenance Staff",
];

export default function UserConsolePage() {
  const { user: currentUser, impersonateUser } = useAuth();
  const [usersList, setUsersList] = useState<UserConsoleProfile[]>(() => getUsers());
  const [activeTab, setActiveTab] = useState<"users" | "sessions">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("All");
  const [filterZone, setFilterZone] = useState<string>("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<UserRole>("Station Supervisor");
  const [formZone, setFormZone] = useState("Eastern Railway");
  const [formDivision, setFormDivision] = useState("Howrah");
  const [enableBrakeBinding, setEnableBrakeBinding] = useState(true);
  const [enableHotAxle, setEnableHotAxle] = useState(false);
  const [selectedBrakeDevices, setSelectedBrakeDevices] = useState<string[]>([]);
  const [selectedAxleDevices, setSelectedAxleDevices] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState("");

  const refreshData = () => {
    setUsersList(getUsers());
  };

  // Brake & Axle devices from master
  const brakeDevices = useMemo(
    () => MASTER_DEVICES.filter((d) => d.category === "brake-binding"),
    []
  );
  const axleDevices = useMemo(
    () => MASTER_DEVICES.filter((d) => d.category === "hot-axle"),
    []
  );

  // Filter divisions when zone changes in form
  const currentZoneObj = useMemo(
    () => RAILWAY_ZONES.find((z) => z.name === formZone),
    [formZone]
  );

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.division.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.zone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filterRole === "All" || u.role === filterRole;
      const matchesZone = filterZone === "All" || u.zone.includes(filterZone);

      return matchesSearch && matchesRole && matchesZone;
    });
  }, [usersList, searchQuery, filterRole, filterZone]);

  // Active Sessions
  const activeSessions = useMemo(() => getActiveSessions(), [usersList]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("Rail@123");
    setFormRole("Station Supervisor");
    setFormZone("Eastern Railway");
    setFormDivision("Howrah");
    setEnableBrakeBinding(true);
    setEnableHotAxle(false);
    setSelectedBrakeDevices(["SCBB-HWH-26-001", "SCBB-HWH-26-002", "SCBB-HWH-26-003"]);
    setSelectedAxleDevices([]);
    setFormIsActive(true);
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: UserConsoleProfile) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPassword(user.password || "");
    setFormRole(user.role);
    setFormZone(user.zone);
    setFormDivision(user.division);
    setEnableBrakeBinding(user.allowedModules.includes("brake-binding"));
    setEnableHotAxle(user.allowedModules.includes("hot-axle"));

    const bbDevices = user.allowedDevices["brake-binding"] || [];
    if (bbDevices.includes("ALL")) {
      setSelectedBrakeDevices(brakeDevices.map((d) => d.deviceId));
    } else {
      setSelectedBrakeDevices(bbDevices);
    }

    const haDevices = user.allowedDevices["hot-axle"] || [];
    if (haDevices.includes("ALL")) {
      setSelectedAxleDevices(axleDevices.map((d) => d.deviceId));
    } else {
      setSelectedAxleDevices(haDevices);
    }

    setFormIsActive(user.isActive);
    setFormError("");
    setIsModalOpen(true);
  };

  // Save Modal Form
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formName.trim() || !formEmail.trim()) {
      setFormError("Name and Username/Email are required.");
      return;
    }

    const allowedModules: ("brake-binding" | "hot-axle")[] = [];
    if (enableBrakeBinding) allowedModules.push("brake-binding");
    if (enableHotAxle) allowedModules.push("hot-axle");

    if (allowedModules.length === 0) {
      setFormError("Select at least one module (Brake Binding or Hot Axle).");
      return;
    }

    // Check if all devices are selected
    const allBrakeSelected =
      selectedBrakeDevices.length === brakeDevices.length || formRole === "Administrator";
    const allAxleSelected =
      selectedAxleDevices.length === axleDevices.length || formRole === "Administrator";

    const allowedDevices: { "brake-binding"?: string[]; "hot-axle"?: string[] } = {};
    if (enableBrakeBinding) {
      allowedDevices["brake-binding"] = allBrakeSelected ? ["ALL"] : selectedBrakeDevices;
    }
    if (enableHotAxle) {
      allowedDevices["hot-axle"] = allAxleSelected ? ["ALL"] : selectedAxleDevices;
    }

    try {
      if (editingUserId) {
        updateUser(editingUserId, {
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword.trim() || "Rail@123",
          role: formRole,
          zone: formZone,
          division: formDivision,
          allowedModules,
          allowedDevices,
          isActive: formIsActive,
        });
      } else {
        createUser({
          name: formName.trim(),
          email: formEmail.trim().toLowerCase(),
          password: formPassword.trim() || "Rail@123",
          role: formRole,
          zone: formZone,
          division: formDivision,
          allowedModules,
          allowedDevices,
          isActive: formIsActive,
          status: "offline",
        });
      }

      refreshData();
      setIsModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save user.");
    }
  };

  // Delete User
  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove user "${name}"?`)) {
      try {
        deleteUser(id);
        refreshData();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Failed to delete user.");
      }
    }
  };

  // Quick select helpers
  const handleSelectAllBrake = () => {
    setSelectedBrakeDevices(brakeDevices.map((d) => d.deviceId));
  };
  const handleClearAllBrake = () => {
    setSelectedBrakeDevices([]);
  };
  const handleSelectDivisionBrake = () => {
    const divisionDevices = brakeDevices
      .filter((d) => d.divisionCode.toLowerCase() === formDivision.toLowerCase() || d.zoneCode.toLowerCase().includes(formZone.toLowerCase()))
      .map((d) => d.deviceId);
    setSelectedBrakeDevices(divisionDevices.length > 0 ? divisionDevices : brakeDevices.map((d) => d.deviceId));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-700/50">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Indian Railways Security & RBAC
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                Admin Console
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Dynamic User Console Maker
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1.5">
              Provision railway personnel credentials, assign Indian Railways Zone & Division boundaries, customize visibility of systems (Brake Binding, Hot Axle), and configure granular device-level access.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create Railway User</span>
            </button>
            <button
              onClick={refreshData}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-700/60">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Users</span>
            <span className="text-xl font-black text-white">{usersList.length}</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Active Sessions</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-emerald-400">{activeSessions.length}</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            </div>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Brake Devices</span>
            <span className="text-xl font-black text-blue-400">{brakeDevices.length} Monitored</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Axle Units</span>
            <span className="text-xl font-black text-amber-400">{axleDevices.length} Connected</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("users")}
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all",
            activeTab === "users"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Users className="h-4 w-4" />
          <span>User Profiles & Device Permissions</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
            {filteredUsers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("sessions")}
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all",
            activeTab === "sessions"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
          <span>Active Users & Live Sessions</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
            {activeSessions.length}
          </span>
        </button>
      </div>

      {/* TAB 1: User Profiles & Device Permissions */}
      {activeTab === "users" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, division..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Role:</span>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="All">All Roles</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Zone:</span>
                <select
                  value={filterZone}
                  onChange={(e) => setFilterZone(e.target.value)}
                  className="rounded-xl border border-slate-200 py-2 px-3 text-xs font-medium bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="All">All Zones</option>
                  {RAILWAY_ZONES.map((z) => (
                    <option key={z.code} value={z.name}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Railway Personnel</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Zone & Division</th>
                    <th className="px-5 py-3.5">Module Access</th>
                    <th className="px-5 py-3.5">Permitted Devices</th>
                    <th className="px-5 py-3.5">Last Login</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No railway users found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isMasterAdmin = u.email.toLowerCase() === "admin@vasp.com";
                      const brakeCount = u.allowedDevices["brake-binding"]?.includes("ALL")
                        ? "All Brake Devices"
                        : `${u.allowedDevices["brake-binding"]?.length || 0} Brake`;
                      const axleCount = u.allowedDevices["hot-axle"]?.includes("ALL")
                        ? "All Axles"
                        : `${u.allowedDevices["hot-axle"]?.length || 0} Axles`;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                                {u.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  {u.name}
                                  {isMasterAdmin && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                                      Super Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "px-2.5 py-1 rounded-lg font-bold text-[11px]",
                                u.role === "Administrator"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : u.role === "Divisional Engineer"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : u.role === "Station Supervisor"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                              )}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-slate-800 flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>{u.zone}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>Division: <strong className="text-slate-700">{u.division}</strong></span>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {u.allowedModules.includes("brake-binding") && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
                                  <Monitor className="h-3 w-3" />
                                  Brake Binding
                                </span>
                              )}
                              {u.allowedModules.includes("hot-axle") && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                                  <Thermometer className="h-3 w-3" />
                                  Hot Axle
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="text-[11px] space-y-0.5">
                              {u.allowedModules.includes("brake-binding") && (
                                <div className="text-slate-700 font-medium truncate max-w-[180px]" title={u.allowedDevices["brake-binding"]?.join(", ")}>
                                  {brakeCount}
                                </div>
                              )}
                              {u.allowedModules.includes("hot-axle") && (
                                <div className="text-slate-500 font-medium truncate max-w-[180px]" title={u.allowedDevices["hot-axle"]?.join(", ")}>
                                  {axleCount}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-slate-500">
                            {u.lastLoginAt ? (
                              <div>
                                <div className="font-medium text-slate-700">
                                  {new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {new Date(u.lastLoginAt).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Never logged in</span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Impersonate button to test user view */}
                              <button
                                onClick={() => impersonateUser(u)}
                                title="Impersonate / Preview this User's view"
                                className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] border border-blue-200 flex items-center gap-1 transition-colors"
                              >
                                <Eye className="h-3 w-3" />
                                <span className="hidden sm:inline">Preview</span>
                              </button>

                              <button
                                onClick={() => handleOpenEdit(u)}
                                title="Edit permissions"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>

                              {!isMasterAdmin && (
                                <button
                                  onClick={() => handleDelete(u.id, u.name)}
                                  title="Delete user"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Active Users & Live Sessions */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Online & Active Users</h3>
              <p className="text-xs text-slate-500">Live monitoring of users logged into the Smart Coach system</p>
            </div>
            <button
              onClick={refreshData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Sessions</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSessions.map((session, i: number) => (
              <div
                key={session.email + i}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                      {session.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{session.name}</h4>
                      <p className="text-xs font-mono text-slate-400">{session.email}</p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Now
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Role</span>
                    <p className="font-semibold text-slate-700">{session.role}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Division</span>
                    <p className="font-semibold text-slate-700">{session.division}</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    Last Activity:
                  </span>
                  <span className="font-medium text-slate-700">
                    {session.lastLoginAt ? new Date(session.lastLoginAt).toLocaleTimeString() : "Just now"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  {editingUserId ? "Edit Railway User & Device Scope" : "Create Railway Personnel Profile"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set user credentials, Railway Zone/Division, and select visible monitoring devices
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-5 mt-5">
              {/* Row 1: Name and Username/Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Personnel Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. SSE C&W Howrah Yard"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username / Login Email *
                  </label>
                  <input
                    type="text"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. sse.howrah@railnet.gov.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Password and Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Zone and Division */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Railway Zone
                  </label>
                  <select
                    value={formZone}
                    onChange={(e) => {
                      const newZone = e.target.value;
                      setFormZone(newZone);
                      const z = RAILWAY_ZONES.find((x) => x.name === newZone);
                      if (z && z.divisions.length > 0) {
                        setFormDivision(z.divisions[0].name);
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {RAILWAY_ZONES.map((z) => (
                      <option key={z.code} value={z.name}>
                        {z.name} ({z.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Railway Division
                  </label>
                  {currentZoneObj && currentZoneObj.divisions.length > 0 ? (
                    <select
                      value={formDivision}
                      onChange={(e) => setFormDivision(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {currentZoneObj.divisions.map((div) => (
                        <option key={div.code} value={div.name}>
                          {div.name} ({div.code})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formDivision}
                      onChange={(e) => setFormDivision(e.target.value)}
                      placeholder="e.g. Howrah"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Row 4: Device & System Visibility Controls */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    System & Device Visibility Scope
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Select which devices will appear in this user&apos;s console
                  </span>
                </div>

                {/* Module 1: Brake Binding */}
                <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableBrakeBinding}
                        onChange={(e) => setEnableBrakeBinding(e.target.checked)}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900">Brake Binding System</span>
                      </div>
                    </label>

                    {enableBrakeBinding && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={handleSelectAllBrake}
                          className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold hover:bg-blue-100"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={handleSelectDivisionBrake}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                        >
                          Select {formDivision}
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllBrake}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {enableBrakeBinding && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-2">
                        Visible Brake Binding Devices ({selectedBrakeDevices.length} of {brakeDevices.length} selected):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200/60">
                        {brakeDevices.map((dev) => {
                          const isSelected = selectedBrakeDevices.includes(dev.deviceId);
                          return (
                            <label
                              key={dev.deviceId}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all",
                                isSelected
                                  ? "bg-blue-50/80 border-blue-200 text-blue-900 font-bold"
                                  : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedBrakeDevices([...selectedBrakeDevices, dev.deviceId]);
                                  } else {
                                    setSelectedBrakeDevices(
                                      selectedBrakeDevices.filter((id) => id !== dev.deviceId)
                                    );
                                  }
                                }}
                                className="h-3.5 w-3.5 rounded text-blue-600"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-[11px]">{dev.name}</p>
                                <p className="text-[9px] text-slate-400 font-normal">
                                  {dev.divisionCode} • {dev.trainNo || "Freight/Express"}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Module 2: Hot Axle */}
                <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableHotAxle}
                        onChange={(e) => setEnableHotAxle(e.target.checked)}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-900">Hot Axle 3D Twin & Telemetry</span>
                      </div>
                    </label>

                    {enableHotAxle && (
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedAxleDevices(axleDevices.map((d) => d.deviceId))}
                          className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold hover:bg-amber-100"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAxleDevices([])}
                          className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {enableHotAxle && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-semibold text-slate-400 block mb-2">
                        Visible Axle Units ({selectedAxleDevices.length} of {axleDevices.length} selected):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200/60">
                        {axleDevices.map((dev) => {
                          const isSelected = selectedAxleDevices.includes(dev.deviceId);
                          return (
                            <label
                              key={dev.deviceId}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all",
                                isSelected
                                  ? "bg-amber-50/80 border-amber-200 text-amber-900 font-bold"
                                  : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAxleDevices([...selectedAxleDevices, dev.deviceId]);
                                  } else {
                                    setSelectedAxleDevices(
                                      selectedAxleDevices.filter((id) => id !== dev.deviceId)
                                    );
                                  }
                                }}
                                className="h-3.5 w-3.5 rounded text-amber-600"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-[11px]">{dev.name}</p>
                                <p className="text-[9px] text-slate-400 font-normal">
                                  {dev.divisionCode} • {dev.trainNo || "Train 1207069"}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Account Status</span>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-colors",
                    formIsActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {formIsActive ? "Active Account" : "Suspended"}
                </button>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
                >
                  {editingUserId ? "Update Railway User" : "Save & Provision User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
