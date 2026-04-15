import React, { useEffect, useState } from 'react';
import { Building2, GitBranch, Users2, LogOut, Loader2, MapPin, Globe, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface LoginLocation {
  id: number;
  name: string;
  code: string | null;
  level: number; // 0=Company, 1=Branch, 2=Department
  isActive: boolean;
  companyId: number | null;
  branchId: number | null;
  departmentId: number | null;
}

const LEVEL_LABEL: Record<number, string> = {
  0: 'Company',
  1: 'Branch',
  2: 'Department',
};

const LEVEL_GRADIENT: Record<number, string> = {
  0: 'from-blue-500 to-indigo-600',
  1: 'from-violet-500 to-purple-600',
  2: 'from-emerald-500 to-teal-600',
};

const LEVEL_RING: Record<number, string> = {
  0: 'ring-blue-200 hover:ring-blue-400',
  1: 'ring-violet-200 hover:ring-violet-400',
  2: 'ring-emerald-200 hover:ring-emerald-400',
};

const LEVEL_BADGE_BG: Record<number, string> = {
  0: 'bg-blue-100 text-blue-700',
  1: 'bg-violet-100 text-violet-700',
  2: 'bg-emerald-100 text-emerald-700',
};

const LEVEL_ICON = (level: number, className: string) => {
  switch (level) {
    case 0: return <Building2 className={className} />;
    case 1: return <GitBranch className={className} />;
    case 2: return <Layers className={className} />;
    default: return <MapPin className={className} />;
  }
};

interface LocationPickerProps {
  accessToken: string;
  onSegmentSelected: (segmentedToken: string, refreshToken: string, userData: any, locationName?: string) => void;
  onSystemWideSelected?: () => void;
  onLogout: () => void;
  userName: string;
  userRoles?: string[];
}

export default function LocationPicker({ accessToken, onSegmentSelected, onSystemWideSelected, onLogout, userName, userRoles = [] }: LocationPickerProps) {
  const isSuperAdmin = userRoles.includes('SuperAdmin');
  const [locations, setLocations] = useState<LoginLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [systemWideLoading, setSystemWideLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch('http://localhost:5168/api/LoginLocations/my-locations', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        setLocations(data);

        // Auto-select if only one location and not SuperAdmin
        if (data.length === 1 && !isSuperAdmin) {
          handleSelect(data[0].id);
        }
      } catch {
        toast.error('Could not load your login locations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  const handleSelect = async (locationId: number) => {
    setSelecting(locationId);
    try {
      const res = await fetch('http://localhost:5168/api/Auth/select-segment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ loginLocationId: locationId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || 'Failed to select location.');
        return;
      }
      toast.success(`Logged in as: ${data.message?.replace("Segment set to '", "").replace("'.", "") ?? 'Selected'}`);
      const selectedLoc = locations.find(l => l.id === locationId);
      onSegmentSelected(data.data.accessToken, data.data.refreshToken, data.data.user, selectedLoc?.name);
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setSelecting(null);
    }
  };

  const handleSystemWide = () => {
    if (onSystemWideSelected) {
      setSystemWideLoading(true);
      onSystemWideSelected();
    }
  };

  // Group by level
  const grouped: Record<number, LoginLocation[]> = {};
  locations.forEach(loc => {
    if (!grouped[loc.level]) grouped[loc.level] = [];
    grouped[loc.level].push(loc);
  });

  const totalTiles = locations.length + (isSuperAdmin ? 1 : 0);
  const gridCols = totalTiles <= 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
      {/* Top bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200/80 bg-white/70 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/30">
            N
          </div>
          <span className="font-bold text-slate-800 text-lg">Nexus Enterprise HR</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold tracking-widest uppercase mb-5 border border-blue-200/60">
              <MapPin className="h-3.5 w-3.5" />
              Login Location
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {userName.split(' ')[0]}!
            </h1>
            <p className="mt-3 text-slate-500 text-base font-medium">
              Select the location you want to work in for this session.
            </p>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-16 animate-in fade-in duration-500">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              <p className="text-slate-500 font-medium">Loading your locations…</p>
            </div>
          ) : locations.length === 0 && !isSuperAdmin ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <MapPin className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-600 font-semibold">No locations assigned</p>
              <p className="text-slate-400 text-sm mt-1">Contact your administrator to be assigned to a login location.</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              {/* Tile Grid */}
              <div className={`grid grid-cols-1 ${gridCols} gap-5`}>

                {/* SuperAdmin: System-wide tile */}
                {isSuperAdmin && onSystemWideSelected && (
                  <button
                    onClick={handleSystemWide}
                    disabled={systemWideLoading}
                    className="
                      relative overflow-hidden rounded-2xl border-2 border-amber-200 bg-white
                      p-6 text-left transition-all duration-300 group cursor-pointer
                      hover:border-amber-400 hover:shadow-xl hover:shadow-amber-100/50 hover:-translate-y-1
                      active:translate-y-0 active:shadow-md
                      ring-0 hover:ring-4 ring-amber-100
                    "
                  >
                    {/* Decorative gradient corner */}
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 opacity-60 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 mb-4 group-hover:scale-110 transition-transform duration-300">
                        {systemWideLoading
                          ? <Loader2 className="h-7 w-7 animate-spin" />
                          : <Globe className="h-7 w-7" />
                        }
                      </div>
                      <h3 className="font-bold text-lg text-slate-800 mb-1">All Locations</h3>
                      <p className="text-sm text-amber-600 font-semibold">System-wide access</p>
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                          <Globe className="h-3 w-3" />
                          SuperAdmin
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {/* Location tiles */}
                {[0, 1, 2].map(level =>
                  grouped[level]?.map((loc, idx) => (
                    <button
                      key={loc.id}
                      onClick={() => handleSelect(loc.id)}
                      disabled={selecting === loc.id}
                      className={`
                        relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white
                        p-6 text-left transition-all duration-300 group cursor-pointer
                        hover:shadow-xl hover:-translate-y-1
                        active:translate-y-0 active:shadow-md
                        ring-0 hover:ring-4 ${LEVEL_RING[level]}
                        ${selecting === loc.id ? 'opacity-70 cursor-wait scale-95' : ''}
                      `}
                      style={{ animationDelay: `${(idx + (isSuperAdmin ? 1 : 0)) * 80}ms` }}
                    >
                      {/* Decorative gradient corner */}
                      <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br ${
                        level === 0 ? 'from-blue-50 to-indigo-100' :
                        level === 1 ? 'from-violet-50 to-purple-100' :
                        'from-emerald-50 to-teal-100'
                      } opacity-50 group-hover:opacity-100 transition-opacity`} />

                      <div className="relative">
                        {/* Icon */}
                        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${LEVEL_GRADIENT[level]} text-white flex items-center justify-center shadow-lg ${
                          level === 0 ? 'shadow-blue-500/30' :
                          level === 1 ? 'shadow-violet-500/30' :
                          'shadow-emerald-500/30'
                        } mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          {selecting === loc.id
                            ? <Loader2 className="h-7 w-7 animate-spin" />
                            : LEVEL_ICON(level, 'h-7 w-7')
                          }
                        </div>

                        {/* Name */}
                        <h3 className="font-bold text-lg text-slate-800 mb-1 truncate">{loc.name}</h3>

                        {/* Code */}
                        {loc.code && (
                          <p className="text-sm font-mono text-slate-400 font-semibold">{loc.code}</p>
                        )}

                        {/* Level badge */}
                        <div className="mt-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold ${LEVEL_BADGE_BG[level]} px-2.5 py-1 rounded-full`}>
                            {LEVEL_ICON(level, 'h-3 w-3')}
                            {LEVEL_LABEL[level]}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Location count footer */}
              <div className="mt-8 text-center">
                <p className="text-xs text-slate-400 font-medium">
                  {locations.length} location{locations.length !== 1 ? 's' : ''} available
                  {isSuperAdmin && ' · SuperAdmin system-wide access enabled'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400 font-medium">
        © {new Date().getFullYear()} Nexus Enterprise HR · Multi-Tenant Secure Access
      </footer>
    </div>
  );
}
