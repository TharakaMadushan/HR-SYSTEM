import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Building2, GitBranch, Layers, Users2, Plus, ChevronRight, ChevronDown, X, RefreshCw, Edit, Trash2, MapPin } from 'lucide-react';

interface CompanyDto {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  registrationNumber?: string;
  isActive: boolean;
  isLoginLocation: boolean;
  branchCount: number;
  employeeCount: number;
}

interface BranchDto {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  companyId: number;
  companyName: string;
  isActive: boolean;
  isLoginLocation: boolean;
  departmentCount: number;
  employeeCount: number;
}

interface DepartmentDto {
  id: number;
  name: string;
  code: string;
  description?: string;
  branchId: number;
  branchName: string;
  managerId?: number;
  isActive: boolean;
  isLoginLocation: boolean;
  teamCount: number;
  employeeCount: number;
}

interface TeamDto {
  id: number;
  name: string;
  description?: string;
  departmentId: number;
  departmentName: string;
  leadId?: number;
  isActive: boolean;
  employeeCount: number;
}

interface OrganizationStructureProps {
  accessToken: string;
  readOnly?: boolean;
}

type OrgLevel = 'companies' | 'branches' | 'departments' | 'teams';

export default function OrganizationStructure({ accessToken, readOnly = false }: OrganizationStructureProps) {
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedCompanies, setExpandedCompanies] = useState<Set<number>>(new Set());
  const [expandedBranches, setExpandedBranches] = useState<Set<number>>(new Set());
  const [expandedDepartments, setExpandedDepartments] = useState<Set<number>>(new Set());

  // Create/Edit shared modal
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [modalType, setModalType] = useState<OrgLevel | null>(null);
  const [modalParentId, setModalParentId] = useState<number | null>(null);
  const [modalEditId, setModalEditId] = useState<number | null>(null);
  const [modalForm, setModalForm] = useState({ name: '', code: '', address: '', phone: '', description: '', email: '', website: '', registrationNumber: '' });
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: OrgLevel; id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
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
    } catch (err) {
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [accessToken]);

  const toggle = (set: Set<number>, id: number, setter: React.Dispatch<React.SetStateAction<Set<number>>>) => {
    setter(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const openCreateModal = (type: OrgLevel, parentId?: number) => {
    setModalMode('create');
    setModalType(type);
    setModalParentId(parentId || null);
    setModalEditId(null);
    setModalForm({ name: '', code: '', address: '', phone: '', description: '', email: '', website: '', registrationNumber: '' });
  };

  const openEditModal = (type: OrgLevel, item: any) => {
    setModalMode('edit');
    setModalType(type);
    setModalEditId(item.id);
    setModalParentId(item.companyId || item.branchId || item.departmentId || null);
    setModalForm({
      name: item.name || '',
      code: item.code || '',
      address: item.address || '',
      phone: item.phone || '',
      description: item.description || '',
      email: item.email || '',
      website: item.website || '',
      registrationNumber: item.registrationNumber || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;
    setModalSubmitting(true);

    try {
      let url = '';
      let payload: any = {};
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      switch (modalType) {
        case 'companies':
          url = modalMode === 'edit'
            ? `http://localhost:5168/api/Organization/companies/${modalEditId}`
            : 'http://localhost:5168/api/Organization/companies';
          payload = { name: modalForm.name, code: modalForm.code, address: modalForm.address, phone: modalForm.phone, email: modalForm.email, website: modalForm.website, registrationNumber: modalForm.registrationNumber };
          break;
        case 'branches':
          url = modalMode === 'edit'
            ? `http://localhost:5168/api/Organization/branches/${modalEditId}`
            : 'http://localhost:5168/api/Organization/branches';
          payload = { name: modalForm.name, code: modalForm.code, address: modalForm.address, phone: modalForm.phone, companyId: modalParentId };
          break;
        case 'departments':
          url = modalMode === 'edit'
            ? `http://localhost:5168/api/Organization/departments/${modalEditId}`
            : 'http://localhost:5168/api/Organization/departments';
          payload = { name: modalForm.name, code: modalForm.code, description: modalForm.description, branchId: modalParentId };
          break;
        case 'teams':
          url = modalMode === 'edit'
            ? `http://localhost:5168/api/Organization/teams/${modalEditId}`
            : 'http://localhost:5168/api/Organization/teams';
          payload = { name: modalForm.name, description: modalForm.description, departmentId: modalParentId };
          break;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || `${getLevelLabel(modalType)} ${modalMode === 'edit' ? 'updated' : 'created'} successfully`);
        setModalMode(null);
        fetchAll();
      } else {
        toast.error(data.message || 'Operation failed');
      }
    } catch (err) {
      toast.error('Failed to connect to the API.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5168/api/Organization/${deleteTarget.type}/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(`${deleteTarget.name} deleted successfully`);
        setDeleteTarget(null);
        fetchAll();
      } else {
        toast.error(data.message || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Failed to connect to the API.');
    } finally {
      setDeleting(false);
    }
  };

  const getLevelLabel = (type: OrgLevel) => {
    switch (type) { case 'companies': return 'Company'; case 'branches': return 'Branch'; case 'departments': return 'Department'; case 'teams': return 'Team'; }
  };

  const getLevelIcon = (type: OrgLevel) => {
    switch (type) { case 'companies': return <Building2 className="h-5 w-5" />; case 'branches': return <GitBranch className="h-5 w-5" />; case 'departments': return <Layers className="h-5 w-5" />; case 'teams': return <Users2 className="h-5 w-5" />; }
  };

  const toggleLoginLocation = async (level: 'company' | 'branch' | 'department', entityId: number, currentState: boolean) => {
    try {
      const res = await fetch('http://localhost:5168/api/Organization/toggle-login-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ level, entityId, enable: !currentState }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || 'Login location updated');
        fetchAll();
      } else {
        toast.error(data.message || 'Failed to toggle login location');
      }
    } catch {
      toast.error('Failed to connect to the API.');
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-20 shadow-sm flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 mb-4"></div>
        <p className="text-sm font-medium text-slate-400">Loading organization structure...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            Organization Structure
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage your company hierarchy: Companies → Branches → Departments → Teams</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={fetchAll} className="flex items-center text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </button>
          <button onClick={() => openCreateModal('companies')} disabled={readOnly} className="flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="h-4 w-4 mr-2" /> Add Company
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <SummaryCard icon={<Building2 className="h-5 w-5 text-blue-600" />} label="Companies" count={companies.length} color="blue" />
        <SummaryCard icon={<GitBranch className="h-5 w-5 text-indigo-600" />} label="Branches" count={branches.length} color="indigo" />
        <SummaryCard icon={<Layers className="h-5 w-5 text-purple-600" />} label="Departments" count={departments.length} color="purple" />
        <SummaryCard icon={<Users2 className="h-5 w-5 text-teal-600" />} label="Teams" count={teams.length} color="teal" />
      </div>

      {/* Tree View */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {companies.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-700 mb-2">No companies yet</h4>
            <p className="text-sm mb-4">Create your first company to build out the org structure.</p>
            <button onClick={() => openCreateModal('companies')} className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-all">
              <Plus className="h-4 w-4 mr-2" /> Add Company
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {companies.map(company => {
              const isExpanded = expandedCompanies.has(company.id);
              const companyBranches = branches.filter(b => b.companyId === company.id);
              return (
                <div key={company.id}>
                  {/* Company Row */}
                  <div className="flex items-center px-6 py-4 hover:bg-slate-50/50 transition-colors group">
                    <button onClick={() => toggle(expandedCompanies, company.id, setExpandedCompanies)} className="mr-3 p-1 rounded hover:bg-slate-100 transition-colors">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    </button>
                    <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mr-3">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-800">{company.name}</h4>
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{company.code}</span>
                        {company.isActive && <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>}
                        {company.isLoginLocation && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center"><MapPin className="h-3 w-3 mr-0.5" />Login Location</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{companyBranches.length} branch{companyBranches.length !== 1 ? 'es' : ''} • {company.employeeCount} employee{company.employeeCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!readOnly && (
                        <>
                          <button onClick={() => toggleLoginLocation('company', company.id, company.isLoginLocation)} className={`p-1.5 rounded-lg transition-colors ${company.isLoginLocation ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} title={company.isLoginLocation ? 'Remove as Login Location' : 'Set as Login Location'}>
                            <MapPin className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openEditModal('companies', company)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget({ type: 'companies', id: company.id, name: company.name })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                    {!readOnly && (
                      <button onClick={() => openCreateModal('branches', company.id)} className="flex items-center text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors ml-2">
                        <Plus className="h-3 w-3 mr-1" /> Branch
                      </button>
                    )}
                  </div>

                  {/* Branches */}
                  {isExpanded && (
                    <div className="bg-slate-50/30">
                      {companyBranches.length === 0 ? (
                        <div className="pl-20 pr-6 py-3 text-xs text-slate-400 italic">No branches yet</div>
                      ) : (
                        companyBranches.map(branch => {
                          const branchExpanded = expandedBranches.has(branch.id);
                          const branchDepts = departments.filter(d => d.branchId === branch.id);
                          return (
                            <div key={branch.id}>
                              <div className="flex items-center pl-14 pr-6 py-3 hover:bg-slate-50 transition-colors group">
                                <button onClick={() => toggle(expandedBranches, branch.id, setExpandedBranches)} className="mr-3 p-1 rounded hover:bg-slate-100 transition-colors">
                                  {branchExpanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                                </button>
                                <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mr-3">
                                  <GitBranch className="h-3.5 w-3.5 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-sm text-slate-700">{branch.name}</span>
                                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{branch.code}</span>
                                    {branch.isLoginLocation && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 flex items-center"><MapPin className="h-2.5 w-2.5 mr-0.5" />Login</span>}
                                  </div>
                                  <p className="text-xs text-slate-400">{branchDepts.length} dept{branchDepts.length !== 1 ? 's' : ''} • {branch.employeeCount} emp</p>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {!readOnly && (
                                    <>
                                      <button onClick={() => toggleLoginLocation('branch', branch.id, branch.isLoginLocation)} className={`p-1.5 rounded-lg transition-colors ${branch.isLoginLocation ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} title={branch.isLoginLocation ? 'Remove as Login Location' : 'Set as Login Location'}>
                                        <MapPin className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => openEditModal('branches', branch)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                        <Edit className="h-3 w-3" />
                                      </button>
                                      <button onClick={() => setDeleteTarget({ type: 'branches', id: branch.id, name: branch.name })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                                {!readOnly && (
                                  <button onClick={() => openCreateModal('departments', branch.id)} className="flex items-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors ml-2">
                                    <Plus className="h-3 w-3 mr-1" /> Dept
                                  </button>
                                )}
                              </div>

                              {/* Departments */}
                              {branchExpanded && (
                                <div>
                                  {branchDepts.length === 0 ? (
                                    <div className="pl-28 pr-6 py-2 text-xs text-slate-400 italic">No departments yet</div>
                                  ) : (
                                    branchDepts.map(dept => {
                                      const deptExpanded = expandedDepartments.has(dept.id);
                                      const deptTeams = teams.filter(t => t.departmentId === dept.id);
                                      return (
                                        <div key={dept.id}>
                                          <div className="flex items-center pl-24 pr-6 py-2.5 hover:bg-slate-50 transition-colors group">
                                            <button onClick={() => toggle(expandedDepartments, dept.id, setExpandedDepartments)} className="mr-3 p-1 rounded hover:bg-slate-100 transition-colors">
                                              {deptExpanded ? <ChevronDown className="h-3 w-3 text-slate-400" /> : <ChevronRight className="h-3 w-3 text-slate-400" />}
                                            </button>
                                            <div className="h-7 w-7 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center mr-3">
                                              <Layers className="h-3 w-3 text-purple-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center space-x-2">
                                                <span className="font-medium text-sm text-slate-700">{dept.name}</span>
                                                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{dept.code}</span>
                                                {dept.isLoginLocation && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 flex items-center"><MapPin className="h-2.5 w-2.5 mr-0.5" />Login</span>}
                                              </div>
                                              <p className="text-xs text-slate-400">{deptTeams.length} team{deptTeams.length !== 1 ? 's' : ''} • {dept.employeeCount} emp</p>
                                            </div>
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              {!readOnly && (
                                                <>
                                                  <button onClick={() => toggleLoginLocation('department', dept.id, dept.isLoginLocation)} className={`p-1.5 rounded-lg transition-colors ${dept.isLoginLocation ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} title={dept.isLoginLocation ? 'Remove as Login Location' : 'Set as Login Location'}>
                                                    <MapPin className="h-3 w-3" />
                                                  </button>
                                                  <button onClick={() => openEditModal('departments', dept)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                    <Edit className="h-3 w-3" />
                                                  </button>
                                                  <button onClick={() => setDeleteTarget({ type: 'departments', id: dept.id, name: dept.name })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 className="h-3 w-3" />
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                            {!readOnly && (
                                              <button onClick={() => openCreateModal('teams', dept.id)} className="flex items-center text-xs font-semibold text-purple-600 hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-colors ml-2">
                                                <Plus className="h-3 w-3 mr-1" /> Team
                                              </button>
                                            )}
                                          </div>

                                          {/* Teams */}
                                          {deptExpanded && (
                                            <div>
                                              {deptTeams.length === 0 ? (
                                                <div className="pl-40 pr-6 py-2 text-xs text-slate-400 italic">No teams yet</div>
                                              ) : (
                                                deptTeams.map(team => (
                                                  <div key={team.id} className="flex items-center pl-36 pr-6 py-2 hover:bg-slate-50 transition-colors group">
                                                    <div className="h-6 w-6 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center mr-3">
                                                      <Users2 className="h-3 w-3 text-teal-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                      <span className="font-medium text-sm text-slate-600">{team.name}</span>
                                                      <p className="text-xs text-slate-400">{team.employeeCount} member{team.employeeCount !== 1 ? 's' : ''}</p>
                                                    </div>
                                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      {!readOnly && (
                                                        <>
                                                          <button onClick={() => openEditModal('teams', team)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                            <Edit className="h-3 w-3" />
                                                          </button>
                                                          <button onClick={() => setDeleteTarget({ type: 'teams', id: team.id, name: team.name })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                            <Trash2 className="h-3 w-3" />
                                                          </button>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════ Create / Edit Modal ═══════════════ */}
      {modalMode && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !modalSubmitting && setModalMode(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-h-[85vh] flex flex-col">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <span className="mr-2">{getLevelIcon(modalType)}</span>
                  {modalMode === 'edit' ? `Edit ${getLevelLabel(modalType)}` : `Create ${getLevelLabel(modalType)}`}
                </h3>
              </div>
              <button onClick={() => setModalMode(null)} className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200 hover:bg-slate-300 transition-colors text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <form id="org-form" onSubmit={handleSubmit} className="p-8 space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={modalForm.name} onChange={e => setModalForm({...modalForm, name: e.target.value})} placeholder={`e.g. ${getLevelLabel(modalType)} Name`} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                </div>

                {(modalType === 'companies' || modalType === 'branches' || modalType === 'departments') && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Code <span className="text-red-500">*</span></label>
                    <input type="text" required value={modalForm.code} onChange={e => setModalForm({...modalForm, code: e.target.value})} placeholder="e.g. HQ, BR-01, D-ENG" className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm font-mono" />
                  </div>
                )}

                {(modalType === 'companies' || modalType === 'branches') && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Address</label>
                      <input type="text" value={modalForm.address} onChange={e => setModalForm({...modalForm, address: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Phone</label>
                      <input type="tel" value={modalForm.phone} onChange={e => setModalForm({...modalForm, phone: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                    </div>
                  </>
                )}

                {modalType === 'companies' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Email</label>
                        <input type="email" value={modalForm.email} onChange={e => setModalForm({...modalForm, email: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Website</label>
                        <input type="url" value={modalForm.website} onChange={e => setModalForm({...modalForm, website: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Registration Number</label>
                      <input type="text" value={modalForm.registrationNumber} onChange={e => setModalForm({...modalForm, registrationNumber: e.target.value})} className="w-full rounded-xl border-slate-200 h-11 px-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm" />
                    </div>
                  </>
                )}

                {(modalType === 'departments' || modalType === 'teams') && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Description</label>
                    <textarea value={modalForm.description} onChange={e => setModalForm({...modalForm, description: e.target.value})} rows={3} className="w-full rounded-xl border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none" />
                  </div>
                )}
              </form>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 bg-white flex justify-end space-x-4 shrink-0">
              <button type="button" onClick={() => setModalMode(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
              <button form="org-form" type="submit" disabled={modalSubmitting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-70 flex items-center">
                {modalSubmitting ? 'Saving...' : modalMode === 'edit' ? 'Save Changes' : `Create ${getLevelLabel(modalType)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ Delete Modal ═══════════════ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-5 border border-red-100">
                <Trash2 className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Delete {getLevelLabel(deleteTarget.type)}</h3>
              <p className="text-sm text-slate-500 mb-1">Are you sure you want to delete</p>
              <p className="text-sm font-bold text-slate-800 mb-4">"{deleteTarget.name}"?</p>
              <p className="text-xs text-red-500 font-medium bg-red-50 px-4 py-2 rounded-lg">
                This will fail if there are employees or child items assigned.
              </p>
            </div>
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-70 shadow-md">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, count, color }: { icon: React.ReactNode; label: string; count: number; color: string }) {
  const bgMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100', indigo: 'bg-indigo-50 border-indigo-100',
    purple: 'bg-purple-50 border-purple-100', teal: 'bg-teal-50 border-teal-100',
  };
  return (
    <div className={`rounded-xl border p-4 flex items-center space-x-3 ${bgMap[color]} hover:shadow-sm transition-shadow`}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{count}</p>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
