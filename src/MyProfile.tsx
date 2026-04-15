import React, { useState } from 'react';
import { toast } from 'sonner';
import { User, Mail, Shield, Key, Eye, EyeOff, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MyProfileProps {
  user: any;
  accessToken: string;
}

export default function MyProfile({ user, accessToken }: MyProfileProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changing, setChanging] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setChanging(true);
    try {
      const response = await fetch('http://localhost:5168/api/Auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error('Network error — could not connect to API.');
    } finally {
      setChanging(false);
    }
  };

  const roles: string[] = user?.roles || [];

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SuperAdmin': return 'bg-red-50 text-red-700 border-red-200';
      case 'Admin': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'HRManager': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Manager': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Employee': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="h-24 w-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{user?.fullName || 'Unknown User'}</h2>
              <div className="flex items-center mt-2 space-x-4">
                <span className="flex items-center text-sm text-slate-500 font-medium">
                  <Mail className="h-4 w-4 mr-1.5 text-slate-400" />
                  {user?.email || 'No email'}
                </span>
                {user?.employeeId && (
                  <span className="flex items-center text-sm text-slate-500 font-medium">
                    <User className="h-4 w-4 mr-1.5 text-slate-400" />
                    Linked Employee #{user.employeeId}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </span>
            </div>
          </div>

          {/* Roles */}
          <div className="mt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Assigned Roles</h4>
            <div className="flex flex-wrap gap-2">
              {roles.length > 0 ? roles.map(role => (
                <span key={role} className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${getRoleBadgeColor(role)}`}>
                  <Shield className="h-3 w-3 mr-1.5" />
                  {role}
                </span>
              )) : (
                <span className="text-sm text-slate-400 italic">No roles assigned</span>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Account ID</p>
              <p className="text-sm font-mono text-slate-700 truncate">{user?.id || 'N/A'}</p>
            </div>
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Session Status</p>
              <p className="text-sm font-semibold text-emerald-600 flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1" />
                Authenticated
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-8 py-5">
          <h3 className="font-bold text-slate-800 flex items-center">
            <Key className="h-5 w-5 mr-2 text-blue-600" />
            Change Password
          </h3>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Update your account password for security.</p>
        </div>
        <form onSubmit={handleChangePassword} className="p-8 space-y-5 max-w-lg">
          {/* Current Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Current Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full rounded-xl border-slate-200 h-11 px-4 pr-12 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">New Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl border-slate-200 h-11 px-4 pr-12 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Strength indicator */}
            {newPassword && (
              <div className="flex items-center space-x-2 mt-1">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)
                        ? 'w-full bg-emerald-500'
                        : newPassword.length >= 6
                        ? 'w-2/3 bg-amber-500'
                        : 'w-1/3 bg-red-500'
                    }`}
                  ></div>
                </div>
                <span className="text-xs font-medium text-slate-400">
                  {newPassword.length >= 8 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) ? 'Strong' : newPassword.length >= 6 ? 'Medium' : 'Weak'}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Confirm New Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 font-medium flex items-center mt-1">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Passwords do not match
              </p>
            )}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={changing || !currentPassword || !newPassword || newPassword !== confirmPassword}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changing ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
