import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Dashboard from './Dashboard';
import LocationPicker from './LocationPicker';
import { toast } from 'sonner';
import { TrendingUp, Briefcase, CheckCircle2 } from 'lucide-react';

// ---------- Auth flow state machine ----------
// 'login'   → user enters credentials
// 'picking' → user picks a login location (pre-segment token held temporarily)
// 'app'     → segment-scoped JWT issued, dashboard shown
type AuthStep = 'login' | 'picking' | 'app';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [authStep, setAuthStep] = useState<AuthStep>('login');
  const [setupRequired, setSetupRequired] = useState(false);
  // Pre-segment token (used only during the picker step)
  const [preSegmentToken, setPreSegmentToken] = useState('');
  // Final scoped token (used by dashboard and all API calls)
  const [accessToken, setAccessToken] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [activeSegmentName, setActiveSegmentName] = useState('');

  // ── Step 1: credentials → pre-segment token ──────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5168/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: email, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message || 'Invalid credentials');
        return;
      }
      // Store the pre-segment token — only used by the LocationPicker
      setPreSegmentToken(data.data.accessToken);
      setUserData(data.data.user);
      if (data.data.requiresPasswordReset) setSetupRequired(true);
      toast.success('Credentials verified — please select a location.');
      setAuthStep('picking');
    } catch {
      toast.error('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: location picked → scoped JWT ready ────────────────────────────
  const handleSegmentSelected = (segmentedToken: string, _refreshToken: string, user: any, locationName?: string) => {
    setAccessToken(segmentedToken);
    setPreSegmentToken('');        // discard pre-segment token
    setUserData(user);
    setActiveSegmentName(locationName || '');
    setAuthStep('app');
  };

  // ── Logout: full reset ────────────────────────────────────────────────────
  const handleLogout = () => {
    setAuthStep('login');
    setEmail('');
    setPassword('');
    setPreSegmentToken('');
    setAccessToken('');
    setUserData(null);
    setSetupRequired(false);
    setActiveSegmentName('');
  };

  // ── Switch Location: go back to picker with the pre-segment token ──────────
  const handleSwitchLocation = () => {
    // Re-use the current scoped token to call my-locations
    setPreSegmentToken(accessToken || preSegmentToken);
    setAccessToken('');
    setActiveSegmentName('');
    setAuthStep('picking');
  };

  // ── SuperAdmin: system-wide (no segment filter) ────────────────────────────
  const handleSystemWideSelected = () => {
    // Use the pre-segment token directly — it has no ActiveSegmentId claim,
    // so the EF Core global filter shows ALL data across segments.
    setAccessToken(preSegmentToken);
    setPreSegmentToken('');
    setActiveSegmentName('All Locations');
    setAuthStep('app');
  };

  const handleSetupBlockerSuccess = (newUsername?: string) => {
    setSetupRequired(false);
    if (newUsername) setUserData((prev: any) => ({ ...prev, email: newUsername }));
  };

  // ── Render: state-machine branches ───────────────────────────────────────
  if (authStep === 'picking') {
    return (
      <LocationPicker
        accessToken={preSegmentToken}
        userName={userData?.fullName ?? 'User'}
        userRoles={userData?.roles ?? []}
        onSegmentSelected={handleSegmentSelected}
        onSystemWideSelected={handleSystemWideSelected}
        onLogout={handleLogout}
      />
    );
  }

  if (authStep === 'app') {
    return (
      <Dashboard
        user={userData}
        accessToken={accessToken}
        setupRequired={setupRequired}
        onLogout={handleLogout}
        onSetupSuccess={handleSetupBlockerSuccess}
        activeSegmentName={activeSegmentName}
        onSwitchLocation={handleSwitchLocation}
      />
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-white font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      {/* Left Column: Form */}
      <div className="flex w-full flex-col justify-center px-4 sm:px-12 md:w-1/2 lg:px-24 xl:px-32 relative z-10">
        <div className="mx-auto w-full max-w-sm">

          <div className="mb-10 text-left animate-in fade-in slide-in-from-top-6 duration-700">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-600/30 text-3xl font-bold">
              N
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Sign in to Nexus HR
            </h1>
            <p className="mt-3 text-sm text-slate-500 font-medium tracking-wide">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700">Username or Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="admin@hrsystem.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-600 focus-visible:bg-white transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">Password</Label>
                <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 text-sm transition-colors">Forgot password?</a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-blue-600 focus-visible:bg-white transition-all shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="mt-10 text-center text-sm font-medium text-slate-500 animate-in fade-in duration-1000 delay-500">
            Don't have an account?{' '}
            <a href="#" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition-all">Contact IT Support</a>
          </p>
        </div>
      </div>

      {/* Right Column: Hero/Graphic */}
      <div className="hidden md:flex w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
        {/* The Office Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hr-bg.png"
            alt="Corporate Office Background"
            className="h-full w-full object-cover opacity-60 scale-105 animate-in fade-in duration-1000"
          />
          {/* Subtle overlay gradient to ensure text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
        </div>

        {/* Text Overlay */}
        <div className="relative z-10 w-full max-w-lg p-8 flex flex-col justify-end h-full pb-16">
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000">
            <div className="mb-5 flex space-x-2">
              <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 backdrop-blur-md border border-blue-400/20">
                v1.0 Platform
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md border border-white/20">
                Enterprise Edition
              </span>
            </div>

            <div className="relative inline-block mb-1">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 blur-2xl opacity-60 animate-pulse"></div>
              <h2 className="relative text-4xl font-black text-white tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
                Nexus Enterprise HR
              </h2>
            </div>
            
            <p className="mt-4 text-white/80 font-medium text-lg drop-shadow-md">
              Streamline your workforce, automate approvals, and scale operations with the all-in-one HR platform.
            </p>

            <div className="mt-8 space-y-3 pr-8">
              <div className="flex items-center space-x-4 bg-slate-900/40 backdrop-blur-md border border-white/10 p-3 rounded-xl transition-all hover:bg-slate-900/60 hover:-translate-y-0.5">
                <div className="bg-blue-500/20 p-2.5 rounded-lg text-blue-300">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm tracking-wide">Predictive Analytics</p>
                  <p className="text-slate-300 text-xs">Real-time workforce & attrition insights</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-slate-900/40 backdrop-blur-md border border-white/10 p-3 rounded-xl transition-all hover:bg-slate-900/60 hover:-translate-y-0.5">
                <div className="bg-indigo-500/20 p-2.5 rounded-lg text-indigo-300">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm tracking-wide">Automated Workflows</p>
                  <p className="text-slate-300 text-xs">Smart leave & payroll processing</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-slate-900/40 backdrop-blur-md border border-white/10 p-3 rounded-xl transition-all hover:bg-slate-900/60 hover:-translate-y-0.5">
                <div className="bg-emerald-500/20 p-2.5 rounded-lg text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm tracking-wide">Dynamic Role Security</p>
                  <p className="text-slate-300 text-xs">Enterprise granular access control</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
