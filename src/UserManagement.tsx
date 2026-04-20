import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, UserPlus, Search, Edit, Trash2, Shield, MoreVertical, Briefcase, X, Check, Ban, Power } from 'lucide-react';

interface UserDto {
  id: string;
  userName: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  requiresPasswordReset: boolean;
  roles: string[];
}

interface EmployeeDto {
  id: number;
  fullName: string;
  employeeNo: string;
  workEmail: string;
  departmentName?: string;
  designation?: string;
  firstName: string;
  lastName: string;
}

interface UserManagementProps {
  accessToken: string;
  readOnly?: boolean;
}

const USER_PAGE_SIZE = 10;

export default function UserManagement({ accessToken, readOnly = false }: UserManagementProps) {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Edit mode
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Delete confirmation
  const [deletingUser, setDeletingUser] = useState<UserDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form State (Create)
  const [formData, setFormData] = useState({
    employeeId: '' as string | number,
    userName: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roles: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    employeeId: null as number | null,
    isActive: true,
    roles: [] as string[]
  });
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5168/api/users', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      toast.error('Network error. Could not connect to API.');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5168/api/users/roles', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setRoles(data.data);
      }
    } catch (err) {}
  };

  const fetchEmployees = async () => {
    try {
      // Fetching up to 1000 employees to populate the select dropdown
      const response = await fetch('http://localhost:5168/api/Employees?pageSize=1000', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Support either paged result or straight array based on API
        const items = data.data.items ? data.data.items : data.data; 
        setEmployees(items || []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchRoles(), fetchEmployees()]).finally(() => setLoading(false));
  }, [accessToken]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      toast.error("Please select an employee to link.");
      return;
    }
    if (formData.roles.length === 0) {
      toast.error("Please select at least one role.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
         employeeId: Number(formData.employeeId),
         userName: formData.userName,
         email: formData.email,
         password: formData.password,
         firstName: formData.firstName,
         lastName: formData.lastName,
         roles: formData.roles,
         requirePasswordReset: true
      };

      const response = await fetch('http://localhost:5168/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message || 'User created successfully');
        setIsModalOpen(false);
        setFormData({ employeeId: '', userName: '', email: '', password: '', firstName: '', lastName: '', roles: [] });
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to create user');
      }
    } catch (err) {
      toast.error('Failed to connect to the API.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editFormData.roles.length === 0) {
      toast.error("Please select at least one role.");
      return;
    }
    setEditSubmitting(true);
    try {
      const payload = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        employeeId: editFormData.employeeId,
        isActive: editFormData.isActive,
        roles: editFormData.roles,
      };

      const response = await fetch(`http://localhost:5168/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'User updated successfully');
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch (err) {
      toast.error('Failed to connect to the API.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5168/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('User deleted successfully');
        setIsDeleteModalOpen(false);
        setDeletingUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (err) {
      toast.error('Failed to connect to the API.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (user: UserDto) => {
    try {
      const currentRoles = user.roles;
      const payload = {
        firstName: user.firstName,
        lastName: user.lastName,
        employeeId: null,
        isActive: !user.isActive,
        roles: currentRoles,
      };
      
      const response = await fetch(`http://localhost:5168/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update user status');
      }
    } catch (err) {
      toast.error('Failed to connect to the API.');
    }
  };

  const openEditModal = (user: UserDto) => {
    setEditingUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      employeeId: null,
      isActive: user.isActive,
      roles: [...user.roles],
    });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const openDeleteModal = (user: UserDto) => {
    setDeletingUser(user);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const toggleRoleSelection = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role) 
        : [...prev.roles, role]
    }));
  };

  const toggleEditRoleSelection = (role: string) => {
    setEditFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role) 
        : [...prev.roles, role]
    }));
  };

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     const empId = e.target.value;
     if (!empId) {
       setFormData(prev => ({...prev, employeeId: '', firstName: '', lastName: '', email: ''}));
       return;
     }

     const selectedEmp = employees.find(emp => emp.id === Number(empId));
     if (selectedEmp) {
       // Safely parse name from FullName if raw pieces aren't exposed directly
       let fName = selectedEmp.firstName;
       let lName = selectedEmp.lastName;
       if (!fName || !lName) {
           const parts = selectedEmp.fullName ? selectedEmp.fullName.split(' ') : ['User'];
           fName = parts[0];
           lName = parts.slice(1).join(' ') || 'Unknown';
       }

       setFormData(prev => ({
         ...prev,
         employeeId: selectedEmp.id,
         firstName: fName,
         lastName: lName,
         email: selectedEmp.workEmail || ''
       }));
     }
  };

  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userTotalPages = Math.ceil(filteredUsers.length / USER_PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * USER_PAGE_SIZE, currentPage * USER_PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header and Header Actions */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            System Users
          </h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage all employee accounts and role assignments.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            disabled={readOnly}
            className="shrink-0 flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Enroll User
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
           <div className="flex flex-col items-center justify-center p-20 text-slate-400">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mb-4"></div>
             <p className="text-sm font-medium">Loading users...</p>
           </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center text-slate-500 animate-in fade-in">
             <Users className="h-12 w-12 text-slate-300 mb-4" />
             <h4 className="text-lg font-medium text-slate-700">No users found</h4>
             <p className="text-sm mt-1">Try adjusting your search query.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-8 py-4">Employee</th>
                <th className="px-8 py-4">Contact</th>
                <th className="px-8 py-4">Roles</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold shrink-0">
                        {user.firstName?.charAt(0) || '?'}{user.lastName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500 font-mono">@{user.userName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-medium text-slate-700">{user.email}</p>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-wrap gap-2">
                       {user.roles.map(role => (
                         <span key={role} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700">
                           <Shield className="h-3 w-3 mr-1" />
                           {role}
                         </span>
                       ))}
                       {user.roles.length === 0 && <span className="text-slate-400 italic">No role</span>}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    {user.isActive ? (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                         Active
                       </span>
                    ) : (
                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                         Inactive
                       </span>
                    )}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === user.id ? null : user.id);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openMenuId === user.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!readOnly && (
                            <>
                              <button
                                onClick={() => openEditModal(user)}
                                className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Edit className="h-4 w-4 mr-3 text-slate-400" />
                                Edit User
                              </button>
                              <button
                                onClick={() => { handleToggleActive(user); setOpenMenuId(null); }}
                                className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Power className={`h-4 w-4 mr-3 ${user.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
                                {user.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <div className="border-t border-slate-100 my-1"></div>
                              <button
                                onClick={() => openDeleteModal(user)}
                                className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-3" />
                                Delete User
                              </button>
                            </>
                          )}
                          {readOnly && (
                            <div className="px-4 py-3 text-xs text-slate-400 italic">No actions in system-wide mode</div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredUsers.length > USER_PAGE_SIZE && (
        <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{(currentPage - 1) * USER_PAGE_SIZE + 1}–{Math.min(currentPage * USER_PAGE_SIZE, filteredUsers.length)}</span> of <span className="font-bold text-slate-700">{filteredUsers.length}</span> users
          </p>
          <div className="flex items-center space-x-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Prev</button>
            {Array.from({ length: userTotalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`h-8 w-8 rounded-lg text-sm font-bold transition-colors ${currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(userTotalPages, p + 1))} disabled={currentPage === userTotalPages} className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* ═══════════════ Create User Modal ═══════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity opacity-100" onClick={() => !submitting && setIsModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Enroll New Login Account</h3>
                <p className="text-sm text-slate-500 font-medium">Link a system credential to an active Employee record.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <form id="enroll-form" onSubmit={handleCreateUser} className="p-8 space-y-6">
              
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-700">Link to Employee Record <span className="text-red-500">*</span></label>
                   <select 
                     required
                     value={formData.employeeId} 
                     onChange={handleEmployeeChange} 
                     className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium text-slate-800"
                   >
                     <option value="">-- Select an Employee --</option>
                     {employees.map(emp => (
                       <option key={emp.id} value={emp.id}>
                         [{emp.employeeNo || 'EMP'}] {emp.fullName} - {emp.departmentName || emp.designation || 'Staff'}
                       </option>
                     ))}
                   </select>
                   {employees.length === 0 && <p className="text-xs text-orange-600 font-medium mt-1">Warning: No employees available to link. You must create an Employee record first.</p>}
                </div>

                {/* Dynamic Readonly Badge for the Selected Employee */}
                {formData.employeeId && (
                  <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3 mb-2 animate-in fade-in slide-in-from-top-2">
                    <Briefcase className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Linked Profile Data</p>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Name:</strong> {formData.firstName} {formData.lastName}<br />
                        <strong>Email:</strong> {formData.email || '<No Work Email Found>'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Username <span className="text-red-500">*</span></label>
                    <input type="text" required placeholder="e.g. jdoe" value={formData.userName} onChange={e => setFormData({...formData, userName: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Temporary Password <span className="text-red-500">*</span></label>
                    <input type="password" required placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"/>
                  </div>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-[-10px]">User will automatically be forced to reset this password upon first login.</p>

                <div className="pt-2">
                  <label className="text-sm font-bold text-slate-700 mb-3 block">Access Roles <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-3">
                    {roles.map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRoleSelection(role)}
                        className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          formData.roles.includes(role) 
                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20 shadow-sm' 
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <Shield className={`h-4 w-4 mr-2 ${formData.roles.includes(role) ? 'text-blue-600' : 'text-slate-400'}`} />
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

              </form>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end space-x-4 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button form="enroll-form" type="submit" disabled={submitting || !formData.employeeId} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 flex items-center">
                {submitting ? 'Creating...' : 'Enroll Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ Edit User Modal ═══════════════ */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !editSubmitting && setIsEditModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Edit User</h3>
                <p className="text-sm text-slate-500 font-medium">Update details for @{editingUser.userName}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <form id="edit-user-form" onSubmit={handleEditUser} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">First Name</label>
                    <input type="text" required value={editFormData.firstName} onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                    <input type="text" required value={editFormData.lastName} onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm"/>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Account Status</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditFormData({...editFormData, isActive: true})}
                      className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        editFormData.isActive
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-600/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Check className={`h-4 w-4 mr-2 ${editFormData.isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditFormData({...editFormData, isActive: false})}
                      className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        !editFormData.isActive
                          ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-600/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Ban className={`h-4 w-4 mr-2 ${!editFormData.isActive ? 'text-red-600' : 'text-slate-400'}`} />
                      Inactive
                    </button>
                  </div>
                </div>

                {/* Roles */}
                <div className="pt-2">
                  <label className="text-sm font-bold text-slate-700 mb-3 block">Access Roles <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-3">
                    {roles.map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleEditRoleSelection(role)}
                        className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                          editFormData.roles.includes(role) 
                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20 shadow-sm' 
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                        }`}
                      >
                        <Shield className={`h-4 w-4 mr-2 ${editFormData.roles.includes(role) ? 'text-blue-600' : 'text-slate-400'}`} />
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end space-x-4 shrink-0">
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button form="edit-user-form" type="submit" disabled={editSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 flex items-center">
                {editSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ Delete Confirmation Modal ═══════════════ */}
      {isDeleteModalOpen && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleting && setIsDeleteModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-5 border border-red-100">
                <Trash2 className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete User Account</h3>
              <p className="text-sm text-slate-500 mb-1">Are you sure you want to permanently delete</p>
              <p className="text-sm font-bold text-slate-800 mb-4">
                {deletingUser.firstName} {deletingUser.lastName} (@{deletingUser.userName})?
              </p>
              <p className="text-xs text-red-500 font-medium bg-red-50 px-4 py-2 rounded-lg">
                This action cannot be undone. The user will lose all access immediately.
              </p>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(false)} 
                disabled={deleting}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteUser} 
                disabled={deleting} 
                className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-70 flex items-center shadow-md"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
