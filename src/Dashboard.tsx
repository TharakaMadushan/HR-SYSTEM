import React, { useState, useEffect, useMemo } from 'react';
import ResetPasswordModal from './ResetPasswordModal';
import UserManagement from './UserManagement';
import EmployeeManagement from './EmployeeManagement';
import OrganizationStructure from './OrganizationStructure';
import AccessControl from './AccessControl';
import MyProfile from './MyProfile';
import { useSignalR } from './useSignalR';
import { Users, Settings, UserPlus, LogOut, ShieldAlert, LayoutDashboard, ChevronRight, Building2, UserCheck, GitBranch, CalendarPlus, RefreshCw, User, MapPin, ArrowLeftRight, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  user: any;
  accessToken: string;
  setupRequired: boolean;
  onLogout: () => void;
  onSetupSuccess: (newUsername?: string) => void;
  activeSegmentName?: string;
  onSwitchLocation?: () => void;
}

interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  totalBranches: number;
  newHiresThisMonth: number;
}

// Role-based menu visibility
const MENU_ITEMS = [
  { key: 'Overview', label: 'Overview', icon: LayoutDashboard, roles: null }, // visible to all
  { key: 'Employees', label: 'HR Directory', icon: Users, roles: ['SuperAdmin', 'Admin', 'HRManager', 'Manager'] },
  { key: 'User Management', label: 'App Users', icon: UserPlus, roles: ['SuperAdmin'] },
  { key: 'Organization', label: 'Organization', icon: Building2, roles: ['SuperAdmin', 'Admin', 'HRManager'] },
  { key: 'Roles & Permissions', label: 'Access Control', icon: ShieldAlert, roles: ['SuperAdmin'] },
];

export default function Dashboard({ user, accessToken, setupRequired, onLogout, onSetupSuccess, activeSegmentName, onSwitchLocation }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const userRoles: string[] = user?.roles || [];

  const canAccess = (allowedRoles: string[] | null) => {
    if (!allowedRoles) return true; // null = everyone
    return userRoles.some(r => allowedRoles.includes(r));
  };

  const visibleMenuItems = MENU_ITEMS.filter(item => canAccess(item.roles));

  // System-wide mode: SuperAdmin chose "All Locations" — read-only for mutations
  const isSystemWide = activeSegmentName === 'All Locations';

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const response = await fetch('http://localhost:5168/api/Organization/metrics', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMetrics(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch metrics', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [accessToken]);

  // SignalR: auto-refresh metrics on real-time backend events
  const signalRHandlers = useMemo(() => ({
    MetricsUpdated: () => fetchMetrics(),
    OrgStructureChanged: () => fetchMetrics(),
    EmployeeChanged: () => fetchMetrics(),
  }), []);
  useSignalR(accessToken, signalRHandlers);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans">
      
      {setupRequired && (
        <ResetPasswordModal 
          accessToken={accessToken} 
          onSuccess={onSetupSuccess} 
        />
      )}

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white shadow-sm z-10 flex flex-col">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xl mr-3 shadow-sm">N</div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Nexus HR</span>
        </div>
        
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Main Menu</p>
          <nav className="space-y-1">
            {visibleMenuItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === item.key ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  <div className="flex items-center">
                    <Icon className={`mr-3 h-5 w-5 ${activeTab === item.key ? 'text-blue-600' : 'text-slate-400'}`} />
                    {item.label}
                  </div>
                  {activeTab === item.key && <ChevronRight className="h-4 w-4" />}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-200 space-y-1">
          <button 
            onClick={() => setActiveTab('MyProfile')}
            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'MyProfile' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <User className="mr-3 h-5 w-5 text-slate-400" />
            My Profile
          </button>
          <button 
            onClick={() => setActiveTab('Settings')}
            className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === 'Settings' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Settings className="mr-3 h-5 w-5 text-slate-400" />
            Settings
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8 shadow-sm relative z-0">
          <h1 className="text-xl font-semibold text-slate-800">{activeTab === 'MyProfile' ? 'My Profile' : activeTab}</h1>
          
          <div className="flex items-center space-x-5">
            {/* Active Segment Badge */}
            {activeSegmentName && (
              <button
                onClick={onSwitchLocation}
                title="Switch login location"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 hover:border-blue-300 transition-all group"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span className="max-w-[140px] truncate">{activeSegmentName}</span>
                <ArrowLeftRight className="h-3 w-3 text-blue-400 group-hover:text-blue-600 transition-colors" />
              </button>
            )}
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="text-sm text-right">
              <p className="font-medium text-slate-800">{user?.fullName || 'User'}</p>
              <p className="text-xs text-slate-500 font-medium">{user?.roles?.[0] || 'Employee'}</p>
            </div>
            <button 
              onClick={() => setActiveTab('MyProfile')}
              className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-sm hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer"
              title="My Profile"
            >
              {user?.fullName?.charAt(0) || 'U'}
            </button>
            <div className="h-6 w-px bg-slate-200 mx-2"></div>
            <button onClick={onLogout} title="Sign Out" className="flex items-center justify-center h-10 w-10 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-5xl">

            {/* System-Wide Read-Only Banner */}
            {isSystemWide && (
              <div className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold">System-Wide View (Read-Only)</p>
                  <p className="text-xs text-amber-600 mt-0.5">You are viewing data across all locations. To create, edit, or delete records, please switch to a specific login location.</p>
                </div>
                <button
                  onClick={onSwitchLocation}
                  className="shrink-0 px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Switch Location
                </button>
              </div>
            )}

            {activeTab === 'Overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold text-slate-800">Dashboard Metrics</h2>
                  <button 
                    onClick={fetchMetrics} 
                    disabled={metricsLoading}
                    className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1.5 ${metricsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {metricsLoading && !metrics ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse">
                        <div className="h-4 w-24 bg-slate-200 rounded mb-4"></div>
                        <div className="h-8 w-16 bg-slate-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard label="Total Employees" value={metrics?.totalEmployees ?? 0} icon={<Users className="h-5 w-5 text-blue-600" />} bgColor="bg-blue-50" hoverColor="group-hover:bg-blue-100" />
                    <MetricCard label="Active" value={metrics?.activeEmployees ?? 0} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} bgColor="bg-emerald-50" hoverColor="group-hover:bg-emerald-100" textColor="text-emerald-600" />
                    <MetricCard label="Departments" value={metrics?.totalDepartments ?? 0} icon={<GitBranch className="h-5 w-5 text-indigo-600" />} bgColor="bg-indigo-50" hoverColor="group-hover:bg-indigo-100" />
                    <MetricCard label="New This Month" value={metrics?.newHiresThisMonth ?? 0} icon={<CalendarPlus className="h-5 w-5 text-amber-600" />} bgColor="bg-amber-50" hoverColor="group-hover:bg-amber-100" />
                  </div>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-4 text-lg">Organization Summary</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-600">Total Branches</span>
                        <span className="text-sm font-bold text-slate-900">{metrics?.totalBranches ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-600">Departments</span>
                        <span className="text-sm font-bold text-slate-900">{metrics?.totalDepartments ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm font-medium text-slate-600">Active Employees</span>
                        <span className="text-sm font-bold text-emerald-600">{metrics?.activeEmployees ?? 0} / {metrics?.totalEmployees ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                    <h3 className="font-semibold text-slate-800 mb-4 text-lg">Quick Actions</h3>
                    <div className="space-y-3">
                      {canAccess(['SuperAdmin', 'Admin', 'HRManager', 'Manager']) && (
                        <QuickAction label="Manage HR Directory" desc="View and onboard employees" icon={<Users className="h-4 w-4 text-blue-600" />} color="blue" onClick={() => setActiveTab('Employees')} />
                      )}
                      {canAccess(['SuperAdmin', 'Admin', 'HRManager']) && (
                        <QuickAction label="Organization Structure" desc="Companies, branches, departments & teams" icon={<Building2 className="h-4 w-4 text-indigo-600" />} color="indigo" onClick={() => setActiveTab('Organization')} />
                      )}
                      {canAccess(['SuperAdmin']) && (
                        <QuickAction label="Manage App Users" desc="Enroll user accounts and assign roles" icon={<UserPlus className="h-4 w-4 text-slate-600" />} color="slate" onClick={() => setActiveTab('User Management')} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Employees' && canAccess(['SuperAdmin', 'Admin', 'HRManager', 'Manager']) && (
              <EmployeeManagement accessToken={accessToken} readOnly={isSystemWide} />
            )}
            
            {activeTab === 'User Management' && canAccess(['SuperAdmin']) && (
              <UserManagement accessToken={accessToken} readOnly={isSystemWide} />
            )}

            {activeTab === 'Organization' && canAccess(['SuperAdmin', 'Admin', 'HRManager']) && (
              <OrganizationStructure accessToken={accessToken} readOnly={isSystemWide} />
            )}

            {activeTab === 'Roles & Permissions' && canAccess(['SuperAdmin']) && (
              <AccessControl accessToken={accessToken} />
            )}

            {activeTab === 'MyProfile' && (
              <MyProfile user={user} accessToken={accessToken} />
            )}

            {activeTab === 'Settings' && (
              <SettingsPage />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Small sub-components ──────────────────────────────────────────────────

function MetricCard({ label, value, icon, bgColor, hoverColor, textColor }: { label: string; value: number; icon: React.ReactNode; bgColor: string; hoverColor: string; textColor?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
        <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center ${hoverColor} transition-colors`}>
          {icon}
        </div>
      </div>
      <div className={`mt-3 text-3xl font-bold ${textColor || 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function QuickAction({ label, desc, icon, color, onClick }: { label: string; desc: string; icon: React.ReactNode; color: string; onClick: () => void }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50/50 border-blue-100 hover:bg-blue-50',
    indigo: 'bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50',
    slate: 'bg-slate-50 border-slate-100 hover:bg-slate-100',
  };
  const iconBgMap: Record<string, string> = {
    blue: 'bg-blue-100 group-hover:bg-blue-200',
    indigo: 'bg-indigo-100 group-hover:bg-indigo-200',
    slate: 'bg-slate-200 group-hover:bg-slate-300',
  };
  return (
    <button onClick={onClick} className={`w-full flex items-center p-4 rounded-lg border ${colorMap[color]} transition-colors text-left group`}>
      <div className={`h-8 w-8 rounded-lg ${iconBgMap[color]} flex items-center justify-center mr-3 transition-colors`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-800 font-semibold">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
    </button>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-8 py-6">
          <h3 className="font-bold text-slate-800 text-xl flex items-center">
            <Settings className="h-5 w-5 mr-2 text-blue-600" />
            Platform Settings
          </h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">Configure system-wide preferences and integration options.</p>
        </div>
        <div className="p-8 space-y-6">
          {/* General Settings */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">General</h4>
            <div className="space-y-4">
              <SettingRow label="Company Name" value="HR System Demo Company" description="The primary company name displayed across the platform." />
              <SettingRow label="Timezone" value="Asia/Colombo (UTC+5:30)" description="Default timezone used for date/time displays." />
              <SettingRow label="Date Format" value="DD/MM/YYYY" description="Format used for all date fields in the system." />
              <SettingRow label="Currency" value="USD ($)" description="Default currency for salary and financial displays." />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Security</h4>
            <div className="space-y-4">
              <SettingRow label="Session Timeout" value="60 minutes" description="JWT access token expiration time." />
              <SettingRow label="Password Policy" value="Minimum 6 characters, 1 uppercase, 1 digit, 1 special" description="Enforced by ASP.NET Identity." />
              <SettingRow label="Refresh Token Validity" value="7 days" description="How long a refresh token stays valid before re-login is required." />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">System Info</h4>
            <div className="space-y-4">
              <SettingRow label="Backend" value=".NET 8 (ASP.NET Core)" description="Running on http://localhost:5168" />
              <SettingRow label="Frontend" value="React + Vite + TypeScript" description="Running on http://localhost:5173" />
              <SettingRow label="Database" value="SQL Server (LocalDB)" description="Entity Framework Core with Code-First migrations." />
              <SettingRow label="Real-time" value="SignalR (WebSocket)" description="Connected to DashboardHub for live metric updates." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="flex items-start justify-between p-4 bg-slate-50/70 rounded-xl border border-slate-100">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <span className="text-sm font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-lg ml-4 shrink-0">{value}</span>
    </div>
  );
}
