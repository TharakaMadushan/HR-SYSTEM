import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, UserPlus, Search, Edit, Trash2, Briefcase, ArrowRight, X, MoreVertical, ArrowLeft, Mail, Phone, MapPin, Building2, Calendar, DollarSign, CreditCard } from 'lucide-react';

interface EmployeeListDto {
  id: number;
  employeeNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail?: string;
  designation?: string;
  departmentName?: string;
  branchName?: string;
  status: number;
  profilePictureUrl?: string;
  joinedDate: string;
  employmentType: number;
}

interface EmployeeDetailDto extends EmployeeListDto {
  middleName?: string;
  nic?: string;
  passportNo?: string;
  dateOfBirth?: string;
  gender: number;
  maritalStatus: number;
  nationality?: string;
  religion?: string;
  personalEmail?: string;
  mobileNo?: string;
  phoneNo?: string;
  address?: string;
  confirmedDate?: string;
  basicSalary: number;
  bankName?: string;
  bankAccountNo?: string;
  bankBranch?: string;
  companyId: number;
  companyName?: string;
  branchId?: number;
  departmentId?: number;
  teamId?: number;
  teamName?: string;
  reportingManagerId?: number;
  reportingManagerName?: string;
}

interface OrgItem {
  id: number;
  name: string;
}

interface EmployeeManagementProps {
  accessToken: string;
  readOnly?: boolean;
}

const EMPLOYMENT_TYPES: Record<number, { label: string; color: string }> = {
  1: { label: 'Full Time', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  2: { label: 'Part Time', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  3: { label: 'Contract', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  4: { label: 'Intern', color: 'bg-teal-50 text-teal-700 border-teal-200' },
};

const EMPLOYEE_STATUSES: Record<number, { label: string; color: string }> = {
  1: { label: 'Active', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  2: { label: 'Inactive', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  3: { label: 'On Leave', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  4: { label: 'Terminated', color: 'bg-red-50 text-red-700 border-red-200' },
  5: { label: 'Resigned', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  6: { label: 'Probation', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

const PAGE_SIZE = 10;

export default function EmployeeManagement({ accessToken, readOnly = false }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<EmployeeListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Detail view
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit mode
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeListDto | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Action menu
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Org dropdowns
  const [companies, setCompanies] = useState<OrgItem[]>([]);
  const [branches, setBranches] = useState<OrgItem[]>([]);
  const [departments, setDepartments] = useState<OrgItem[]>([]);
  const [teams, setTeams] = useState<OrgItem[]>([]);

  // Form State (Create)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    mobileNo: '',
    joinedDate: new Date().toISOString().split('T')[0],
    designation: '',
    employmentType: 1,
    gender: 1,
    maritalStatus: 1,
    basicSalary: 0,
    companyId: 0,
    branchId: '',
    departmentId: '',
    teamId: '',
  });
  
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5168/api/Employees?pageSize=100', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const items = data.data.items ? data.data.items : data.data; 
        setEmployees(items || []);
      } else {
        toast.error('Failed to load employees');
      }
    } catch (err) {
      toast.error('Network error. Could not connect to API.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgData = async () => {
    try {
      const [compRes, brRes, deptRes, teamRes] = await Promise.all([
        fetch('http://localhost:5168/api/Organization/companies', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        fetch('http://localhost:5168/api/Organization/branches', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        fetch('http://localhost:5168/api/Organization/departments', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
        fetch('http://localhost:5168/api/Organization/teams', { headers: { 'Authorization': `Bearer ${accessToken}` } }),
      ]);
      const [compData, brData, deptData, teamData] = await Promise.all([compRes.json(), brRes.json(), deptRes.json(), teamRes.json()]);
      if (compData.success) setCompanies(compData.data);
      if (brData.success) setBranches(brData.data);
      if (deptData.success) setDepartments(deptData.data);
      if (teamData.success) setTeams(teamData.data);
      // Auto-select first company if available
      if (compData.success && compData.data.length > 0 && !formData.companyId) {
        setFormData(prev => ({ ...prev, companyId: compData.data[0].id }));
      }
    } catch (err) {}
  };

  const fetchEmployeeDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`http://localhost:5168/api/Employees/${id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSelectedEmployee(data.data);
      } else {
        toast.error('Failed to load employee details');
      }
    } catch (err) {
      toast.error('Network error.');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchOrgData();
  }, [accessToken]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
         ...formData,
         basicSalary: Number(formData.basicSalary),
         employmentType: Number(formData.employmentType),
         gender: Number(formData.gender),
         maritalStatus: Number(formData.maritalStatus),
         companyId: Number(formData.companyId),
         branchId: formData.branchId ? Number(formData.branchId) : null,
         departmentId: formData.departmentId ? Number(formData.departmentId) : null,
         teamId: formData.teamId ? Number(formData.teamId) : null,
      };

      const response = await fetch('http://localhost:5168/api/Employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(data.message || 'Employee onboarded successfully');
        setIsModalOpen(false);
        setFormData({
          firstName: '', lastName: '', workEmail: '', mobileNo: '',
          joinedDate: new Date().toISOString().split('T')[0],
          designation: '', employmentType: 1, gender: 1, maritalStatus: 1, basicSalary: 0, 
          companyId: companies.length > 0 ? companies[0].id : 0,
          branchId: '', departmentId: '', teamId: '',
        });
        fetchEmployees();
      } else {
        toast.error(data.message || 'Failed to onboard employee');
      }
    } catch (err) {
      toast.error('Failed to connect to the API.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    setEditSubmitting(true);
    try {
      const payload = {
        id: editFormData.id,
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        workEmail: editFormData.workEmail,
        mobileNo: editFormData.mobileNo,
        joinedDate: editFormData.joinedDate,
        designation: editFormData.designation,
        employmentType: Number(editFormData.employmentType),
        gender: Number(editFormData.gender),
        maritalStatus: Number(editFormData.maritalStatus),
        basicSalary: Number(editFormData.basicSalary),
        companyId: Number(editFormData.companyId),
        branchId: editFormData.branchId ? Number(editFormData.branchId) : null,
        departmentId: editFormData.departmentId ? Number(editFormData.departmentId) : null,
        teamId: editFormData.teamId ? Number(editFormData.teamId) : null,
        status: Number(editFormData.status),
      };

      const response = await fetch(`http://localhost:5168/api/Employees/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Employee updated successfully');
        setIsEditModalOpen(false);
        setEditFormData(null);
        fetchEmployees();
        // Refresh detail view if it was open
        if (selectedEmployee && selectedEmployee.id === editFormData.id) {
          fetchEmployeeDetail(editFormData.id);
        }
      } else {
        toast.error(data.message || 'Failed to update employee');
      }
    } catch (err) {
      toast.error('Failed to connect to the API.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5168/api/Employees/${deletingEmployee.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Employee deleted successfully');
        setIsDeleteModalOpen(false);
        setDeletingEmployee(null);
        if (selectedEmployee?.id === deletingEmployee.id) setSelectedEmployee(null);
        fetchEmployees();
      } else {
        toast.error(data.message || 'Failed to delete employee');
      }
    } catch (err) {
      toast.error('Failed to connect to the API.');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (emp: EmployeeListDto | EmployeeDetailDto) => {
    // If we have detail data, use it. Otherwise fetch it first.
    const detail = selectedEmployee?.id === emp.id ? selectedEmployee : null;
    setEditFormData({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      workEmail: emp.workEmail || '',
      mobileNo: (detail as EmployeeDetailDto)?.mobileNo || '',
      joinedDate: emp.joinedDate?.split('T')[0] || '',
      designation: emp.designation || '',
      employmentType: emp.employmentType || 1,
      gender: (detail as EmployeeDetailDto)?.gender || 1,
      maritalStatus: (detail as EmployeeDetailDto)?.maritalStatus || 1,
      basicSalary: (detail as EmployeeDetailDto)?.basicSalary || 0,
      companyId: (detail as EmployeeDetailDto)?.companyId || (companies.length > 0 ? companies[0].id : 1),
      branchId: (detail as EmployeeDetailDto)?.branchId || '',
      departmentId: (detail as EmployeeDetailDto)?.departmentId || '',
      teamId: (detail as EmployeeDetailDto)?.teamId || '',
      status: emp.status || 1,
    });
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const openDeleteModal = (emp: EmployeeListDto) => {
    setDeletingEmployee(emp);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const getEmploymentTypeBadge = (type: number) => {
    const t = EMPLOYMENT_TYPES[type];
    if (!t) return null;
    return <span className={`${t.color} border px-2.5 py-0.5 rounded-full text-xs font-semibold`}>{t.label}</span>;
  };

  const getStatusBadge = (status: number) => {
    const s = EMPLOYEE_STATUSES[status];
    if (!s) return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">Unknown</span>;
    return <span className={`${s.color} border px-2.5 py-0.5 rounded-full text-xs font-semibold`}>{s.label}</span>;
  };

  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (emp.workEmail && emp.workEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.employeeNo && emp.employeeNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (emp.designation && emp.designation.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredEmployees.length / PAGE_SIZE);
  const paginatedEmployees = filteredEmployees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  // ═══════════════ DETAIL VIEW ═══════════════
  if (selectedEmployee) {
    const emp = selectedEmployee;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
        {/* Back Button + Actions */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedEmployee(null)}
            className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Directory
          </button>
          <div className="flex space-x-3">
            {!readOnly && (
              <button 
                onClick={() => openEditModal(emp)}
                className="flex items-center px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <Edit className="h-4 w-4 mr-2 text-slate-400" />
                Edit
              </button>
            )}
            {!readOnly && (
              <button 
                onClick={() => openDeleteModal(emp)}
                className="flex items-center px-4 py-2 rounded-lg border border-red-200 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors shadow-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-24"></div>
          <div className="px-8 pb-6 -mt-10">
            <div className="flex items-end space-x-5">
              <div className="h-20 w-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-blue-700 bg-blue-50">
                {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
              </div>
              <div className="mb-1">
                <h2 className="text-2xl font-bold text-slate-800">{emp.fullName}</h2>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-slate-500 font-mono font-medium">{emp.employeeNo}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm font-medium text-slate-600">{emp.designation || 'Staff'}</span>
                  <span className="text-slate-300">•</span>
                  {getStatusBadge(emp.status)}
                  {getEmploymentTypeBadge(emp.employmentType)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Contact & Personal</h3>
            <div className="space-y-4">
              <DetailRow icon={<Mail className="h-4 w-4" />} label="Work Email" value={emp.workEmail} />
              <DetailRow icon={<Mail className="h-4 w-4" />} label="Personal Email" value={emp.personalEmail} />
              <DetailRow icon={<Phone className="h-4 w-4" />} label="Mobile" value={emp.mobileNo} />
              <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={emp.address} />
              <DetailRow label="Gender" value={emp.gender === 1 ? 'Male' : emp.gender === 2 ? 'Female' : 'Other'} />
              <DetailRow label="Marital Status" value={['','Single','Married','Divorced','Widowed'][emp.maritalStatus] || 'N/A'} />
              <DetailRow label="NIC" value={emp.nic} />
              <DetailRow label="Nationality" value={emp.nationality} />
              <DetailRow label="Date of Birth" value={emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString() : undefined} />
            </div>
          </div>

          {/* Employment Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Employment & Organization</h3>
            <div className="space-y-4">
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Joined Date" value={emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString() : undefined} />
              <DetailRow icon={<Building2 className="h-4 w-4" />} label="Company" value={emp.companyName} />
              <DetailRow label="Branch" value={emp.branchName} />
              <DetailRow label="Department" value={emp.departmentName} />
              <DetailRow label="Team" value={emp.teamName} />
              <DetailRow label="Reporting To" value={emp.reportingManagerName} />
              <DetailRow icon={<DollarSign className="h-4 w-4" />} label="Basic Salary" value={emp.basicSalary ? `$${emp.basicSalary.toLocaleString()}` : undefined} />
              <DetailRow icon={<CreditCard className="h-4 w-4" />} label="Bank" value={emp.bankName ? `${emp.bankName} - ${emp.bankAccountNo || 'N/A'}` : undefined} />
            </div>
          </div>
        </div>

        {/* Render Edit/Delete modals even in detail view */}
        {renderEditModal()}
        {renderDeleteModal()}
      </div>
    );
  }

  // ═══════════════ EDIT MODAL (reusable function) ═══════════════
  function renderEditModal() {
    if (!isEditModalOpen || !editFormData) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !editSubmitting && setIsEditModalOpen(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Edit Employee</h3>
              <p className="text-sm text-slate-500 font-medium">Update record for {editFormData.firstName} {editFormData.lastName}</p>
            </div>
            <button onClick={() => setIsEditModalOpen(false)} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="overflow-y-auto flex-1">
            <form id="edit-emp-form" onSubmit={handleEditEmployee} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">First Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={editFormData.firstName} onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Last Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={editFormData.lastName} onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Work Email</label>
                  <input type="email" value={editFormData.workEmail} onChange={e => setEditFormData({...editFormData, workEmail: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Mobile</label>
                  <input type="tel" value={editFormData.mobileNo} onChange={e => setEditFormData({...editFormData, mobileNo: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Designation</label>
                <input type="text" value={editFormData.designation} onChange={e => setEditFormData({...editFormData, designation: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Status</label>
                  <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                    {Object.entries(EMPLOYEE_STATUSES).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Employment Type</label>
                  <select value={editFormData.employmentType} onChange={e => setEditFormData({...editFormData, employmentType: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                    {Object.entries(EMPLOYMENT_TYPES).map(([val, { label }]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Gender</label>
                  <select value={editFormData.gender} onChange={e => setEditFormData({...editFormData, gender: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                    <option value={1}>Male</option>
                    <option value={2}>Female</option>
                    <option value={3}>Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Company</label>
                  <select value={editFormData.companyId} onChange={e => setEditFormData({...editFormData, companyId: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Branch</label>
                  <select value={editFormData.branchId || ''} onChange={e => setEditFormData({...editFormData, branchId: e.target.value ? Number(e.target.value) : ''})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                    <option value="">-- None --</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Department</label>
                  <select value={editFormData.departmentId || ''} onChange={e => setEditFormData({...editFormData, departmentId: e.target.value ? Number(e.target.value) : ''})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                    <option value="">-- None --</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Team</label>
                  <select value={editFormData.teamId || ''} onChange={e => setEditFormData({...editFormData, teamId: e.target.value ? Number(e.target.value) : ''})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                    <option value="">-- None --</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Basic Salary</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input type="number" min="0" step="100" value={editFormData.basicSalary || ''} onChange={e => setEditFormData({...editFormData, basicSalary: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 pl-8 pr-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                </div>
              </div>
            </form>
          </div>
          <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end space-x-4 shrink-0">
            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
            <button form="edit-emp-form" type="submit" disabled={editSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 flex items-center">
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════ DELETE MODAL (reusable function) ═══════════════
  function renderDeleteModal() {
    if (!isDeleteModalOpen || !deletingEmployee) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleting && setIsDeleteModalOpen(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-5 border border-red-100">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Employee Record</h3>
            <p className="text-sm text-slate-500 mb-1">Are you sure you want to permanently delete</p>
            <p className="text-sm font-bold text-slate-800 mb-4">{deletingEmployee.fullName} ({deletingEmployee.employeeNo})?</p>
            <p className="text-xs text-red-500 font-medium bg-red-50 px-4 py-2 rounded-lg">
              This will permanently remove the employee record and cannot be undone.
            </p>
          </div>
          <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
            <button type="button" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
            <button onClick={handleDeleteEmployee} disabled={deleting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-70 flex items-center shadow-md">
              {deleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════ LIST VIEW ═══════════════
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header and Actions */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-8 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h3 className="font-bold text-slate-800 text-xl flex items-center">
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            HR Directory
          </h3>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage all organizational employee records and payroll data.</p>
        </div>
        <div className="flex space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, ID, title..." 
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
            Onboard Employee
          </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="overflow-x-auto min-h-[400px]">
        {loading ? (
           <div className="flex flex-col items-center justify-center p-20 text-slate-400">
             <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mb-4"></div>
             <p className="text-sm font-medium">Loading HR Directory...</p>
           </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center text-slate-500 animate-in fade-in">
             <Briefcase className="h-12 w-12 text-slate-300 mb-4" />
             <h4 className="text-lg font-medium text-slate-700">No employees found</h4>
             <p className="text-sm mt-1">Try adjusting your search query or onboard a new employee.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th className="px-8 py-4">Employee</th>
                <th className="px-8 py-4">Job Title</th>
                <th className="px-8 py-4">Contact</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-bold shrink-0">
                         {emp.firstName?.charAt(0) || '?'}{emp.lastName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{emp.fullName}</p>
                        <p className="text-xs text-slate-500 font-mono font-medium">{emp.employeeNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-semibold text-slate-700">{emp.designation || 'Staff'}</p>
                    <div className="mt-1">
                      {getEmploymentTypeBadge(emp.employmentType)}
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-medium text-slate-600">{emp.workEmail || 'N/A'}</p>
                  </td>
                  <td className="px-8 py-4">
                    {getStatusBadge(emp.status)}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      
                      {openMenuId === emp.id && (
                        <div 
                          className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => { fetchEmployeeDetail(emp.id); setOpenMenuId(null); }}
                            className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <ArrowRight className="h-4 w-4 mr-3 text-slate-400" />
                            View Details
                          </button>
                          {!readOnly && (
                            <>
                              <button
                                onClick={() => openEditModal(emp)}
                                className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Edit className="h-4 w-4 mr-3 text-slate-400" />
                                Edit Employee
                              </button>
                              <div className="border-t border-slate-100 my-1"></div>
                              <button
                                onClick={() => openDeleteModal(emp)}
                                className="flex w-full items-center px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-3" />
                                Delete Employee
                              </button>
                            </>
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
      {!loading && filteredEmployees.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-8 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-700">{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredEmployees.length)}</span> of <span className="font-bold text-slate-700">{filteredEmployees.length}</span> employees
          </p>
          <div className="flex items-center space-x-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)} className={`h-8 w-8 rounded-lg text-sm font-bold transition-colors ${currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
          </div>
        </div>
      )}

      {/* ═══════════════ Create Employee Modal ═══════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity opacity-100" onClick={() => !submitting && setIsModalOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Onboard New Employee</h3>
                <p className="text-sm text-slate-500 font-medium">Add a new official record to the HR directory.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <form id="onboard-form" onSubmit={handleCreateEmployee} className="p-8 space-y-6">
              
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">First Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Last Name <span className="text-red-500">*</span></label>
                    <input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Work Email</label>
                    <input type="email" placeholder="john.d@company.com" value={formData.workEmail} onChange={e => setFormData({...formData, workEmail: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Mobile Number</label>
                    <input type="tel" placeholder="+94 7X XXX XXXX" value={formData.mobileNo} onChange={e => setFormData({...formData, mobileNo: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Designation / Job Title <span className="text-red-500">*</span></label>
                  <input type="text" required placeholder="e.g. Senior Software Engineer" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Joining Date <span className="text-red-500">*</span></label>
                    <input type="date" required value={formData.joinedDate} onChange={e => setFormData({...formData, joinedDate: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Employment Type <span className="text-red-500">*</span></label>
                    <select required value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                       {Object.entries(EMPLOYMENT_TYPES).map(([val, { label }]) => (
                         <option key={val} value={val}>{label}</option>
                       ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Gender</label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                      <option value={1}>Male</option>
                      <option value={2}>Female</option>
                      <option value={3}>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Marital Status</label>
                    <select value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                      <option value={1}>Single</option>
                      <option value={2}>Married</option>
                      <option value={3}>Divorced</option>
                      <option value={4}>Widowed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Company <span className="text-red-500">*</span></label>
                    <select required value={formData.companyId} onChange={e => setFormData({...formData, companyId: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                      {companies.length === 0 && <option value="">No companies found</option>}
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Branch</label>
                    <select value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                      <option value="">-- None --</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Department</label>
                    <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                      <option value="">-- None --</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Team</label>
                    <select value={formData.teamId} onChange={e => setFormData({...formData, teamId: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm">
                      <option value="">-- None --</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Basic Salary <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input type="number" min="0" step="100" required value={formData.basicSalary || ''} onChange={e => setFormData({...formData, basicSalary: Number(e.target.value)})} className="w-full rounded-xl border-slate-200 h-11 pl-8 pr-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                  </div>
                  <p className="text-xs font-medium text-slate-400">Monthly gross salary before deductions.</p>
                </div>

              </form>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end space-x-4 shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button form="onboard-form" type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 flex items-center">
                {submitting ? 'Processing...' : 'Complete Onboarding'}
              </button>
            </div>
          </div>
        </div>
      )}

      {renderEditModal()}
      {renderDeleteModal()}
    </div>
  );
}

// Helper component for detail view rows
function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center text-sm text-slate-500">
        {icon && <span className="mr-2 text-slate-400">{icon}</span>}
        {label}
      </div>
      <span className="text-sm font-medium text-slate-800">{value || <span className="text-slate-300 italic">N/A</span>}</span>
    </div>
  );
}
