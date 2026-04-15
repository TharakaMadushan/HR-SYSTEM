import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ShieldAlert, Plus, Edit, Trash2, Users, X, Shield, Lock } from 'lucide-react';

interface RoleDto {
  id: string;
  name: string;
  userCount: number;
}

interface AccessControlProps {
  accessToken: string;
}

const SYSTEM_ROLES = ['SuperAdmin', 'Admin', 'HRManager', 'Manager', 'Employee'];

export default function AccessControl({ accessToken }: AccessControlProps) {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [editName, setEditName] = useState('');
  const [editing, setEditing] = useState(false);

  // Delete modal
  const [deletingRole, setDeletingRole] = useState<RoleDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5168/api/Roles', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRoles(data.data);
      } else {
        toast.error(data.message || 'Failed to load roles');
      }
    } catch (err) {
      toast.error('Network error — could not load roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, [accessToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setCreating(true);
    try {
      const response = await fetch('http://localhost:5168/api/Roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ name: newRoleName.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Role created successfully');
        setIsCreateOpen(false);
        setNewRoleName('');
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to create role');
      }
    } catch (err) {
      toast.error('Network error.');
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editName.trim()) return;
    setEditing(true);
    try {
      const response = await fetch(`http://localhost:5168/api/Roles/${editingRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ name: editName.trim() })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Role renamed successfully');
        setEditingRole(null);
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to rename role');
      }
    } catch (err) {
      toast.error('Network error.');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5168/api/Roles/${deletingRole.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success('Role deleted successfully');
        setDeletingRole(null);
        fetchRoles();
      } else {
        toast.error(data.message || 'Failed to delete role');
      }
    } catch (err) {
      toast.error('Network error.');
    } finally {
      setDeleting(false);
    }
  };

  const isSystemRole = (name: string) => SYSTEM_ROLES.includes(name);

  const getRoleColor = (name: string): string => {
    switch (name) {
      case 'SuperAdmin': return 'from-red-500 to-rose-600';
      case 'Admin': return 'from-orange-500 to-amber-600';
      case 'HRManager': return 'from-blue-500 to-indigo-600';
      case 'Manager': return 'from-purple-500 to-violet-600';
      case 'Employee': return 'from-emerald-500 to-teal-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getRoleBorderColor = (name: string): string => {
    switch (name) {
      case 'SuperAdmin': return 'border-red-200 hover:border-red-300';
      case 'Admin': return 'border-orange-200 hover:border-orange-300';
      case 'HRManager': return 'border-blue-200 hover:border-blue-300';
      case 'Manager': return 'border-purple-200 hover:border-purple-300';
      case 'Employee': return 'border-emerald-200 hover:border-emerald-300';
      default: return 'border-slate-200 hover:border-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-20 shadow-sm flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mb-4"></div>
        <p className="text-sm font-medium text-slate-400">Loading access control...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2 text-blue-600" />
            Access Control
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage system roles and user access levels.</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Custom Role
        </button>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex items-start space-x-3">
        <Lock className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">System Roles Are Protected</p>
          <p className="text-xs text-blue-600 mt-0.5">The 5 default roles (SuperAdmin, Admin, HRManager, Manager, Employee) cannot be renamed or deleted. You can create custom roles for specialized access.</p>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map(role => (
          <div
            key={role.id}
            className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all hover:shadow-md ${getRoleBorderColor(role.name)}`}
          >
            {/* Gradient badge header */}
            <div className={`h-2 bg-gradient-to-r ${getRoleColor(role.name)}`}></div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getRoleColor(role.name)} flex items-center justify-center shadow-sm`}>
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{role.name}</h4>
                    {isSystemRole(role.name) && (
                      <span className="inline-flex items-center text-xs font-medium text-slate-400">
                        <Lock className="h-3 w-3 mr-1" />
                        System
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center text-sm text-slate-500">
                  <Users className="h-4 w-4 mr-1.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{role.userCount}</span>
                  <span className="ml-1">user{role.userCount !== 1 ? 's' : ''}</span>
                </div>
                
                {!isSystemRole(role.name) && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => { setEditingRole(role); setEditName(role.name); }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Rename role"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingRole(role)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════ Create Role Modal ═══════════════ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !creating && setIsCreateOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Create Custom Role</h3>
                <p className="text-sm text-slate-500 font-medium">Define a new access role for the system.</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Role Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  value={newRoleName} 
                  onChange={e => setNewRoleName(e.target.value)} 
                  placeholder="e.g. TeamLead, Accountant, Reviewer" 
                  className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
                <p className="text-xs text-slate-400">Use PascalCase convention (e.g. "TeamLead" not "team lead").</p>
              </div>
              <div className="flex justify-end space-x-4 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-70">
                  {creating ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ Edit Role Modal ═══════════════ */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !editing && setEditingRole(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Rename Role</h3>
                <p className="text-sm text-slate-500 font-medium">Current: <strong>{editingRole.name}</strong></p>
              </div>
              <button onClick={() => setEditingRole(null)} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleEdit} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">New Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
              <div className="flex justify-end space-x-4 pt-2">
                <button type="button" onClick={() => setEditingRole(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" disabled={editing} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-70">
                  {editing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════ Delete Role Modal ═══════════════ */}
      {deletingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleting && setDeletingRole(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-5 border border-red-100">
                <Trash2 className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Role</h3>
              <p className="text-sm text-slate-500 mb-1">Are you sure you want to delete</p>
              <p className="text-sm font-bold text-slate-800 mb-4">"{deletingRole.name}"?</p>
              {deletingRole.userCount > 0 && (
                <p className="text-xs text-amber-600 font-medium bg-amber-50 px-4 py-2 rounded-lg mb-2">
                  Warning: {deletingRole.userCount} user(s) currently assigned to this role.
                </p>
              )}
              <p className="text-xs text-red-500 font-medium bg-red-50 px-4 py-2 rounded-lg">
                This action cannot be undone.
              </p>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
              <button type="button" onClick={() => setDeletingRole(null)} disabled={deleting} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-70 shadow-md">
                {deleting ? 'Deleting...' : 'Delete Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
