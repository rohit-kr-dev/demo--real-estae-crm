import React, { useEffect, useState } from 'react';
import { Users, Building, ShieldCheck, History, Plus, Building2, Sliders, CheckCircle2, Save, Power } from 'lucide-react';
import { apiRequest } from '../services/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('company');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sources, setSources] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [company, setCompany] = useState({
    name: 'Demo CRM',
    email: 'admin@democrm.com',
    phone: '+91-9876543210',
    address: 'Tower A, Bandra Kurla Complex, Mumbai',
    primary_color: '#06b6d4',
  });

  // Modal state
  const [modalType, setModalType] = useState(null); // 'USER', 'PROJECT', 'SOURCE'
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('Sales_Exec');
  const [userPhone, setUserPhone] = useState('');

  const [projName, setProjName] = useState('');
  const [projLocation, setProjLocation] = useState('');
  const [projPrice, setProjPrice] = useState('');
  const [projUnits, setProjUnits] = useState('');

  const [sourceName, setSourceName] = useState('');
  const [sourceType, setSourceType] = useState('Digital');

  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    if (activeTab === 'company') fetchCompany();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'projects') fetchProjects();
    if (activeTab === 'sources') fetchSources();
    if (activeTab === 'audit') fetchAudit();
  }, [activeTab]);

  const fetchCompany = async () => {
    try {
      const res = await apiRequest('/settings/company');
      if (res.company) setCompany(res.company);
    } catch (e) {}
  };

  const fetchUsers = async () => {
    try {
      const res = await apiRequest('/auth/users');
      setUsers(res.users || []);
    } catch (e) {}
  };

  const fetchProjects = async () => {
    try {
      const res = await apiRequest('/settings/projects');
      setProjects(res.projects || []);
    } catch (e) {}
  };

  const fetchSources = async () => {
    try {
      const res = await apiRequest('/settings/lead-sources');
      setSources(res.sources || []);
    } catch (e) {}
  };

  const fetchAudit = async () => {
    try {
      const res = await apiRequest('/settings/audit-logs');
      setAuditLogs(res.auditLogs || []);
    } catch (e) {}
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await apiRequest('/settings/company', 'PUT', company);
      toast.success('Company settings saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setSavingCompany(false);
    }
  };

  const handleToggleUser = async (user) => {
    try {
      const res = await apiRequest(`/auth/users/${user.id}/toggle-active`, 'PUT');
      toast.success(res.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/users', 'POST', {
        name: userName,
        email: userEmail,
        phone: userPhone,
        role: userRole,
        password: 'Password123!'
      });
      toast.success(`User '${userName}' added with default password 'Password123!'`);
      setModalType(null);
      setUserName('');
      setUserEmail('');
      setUserPhone('');
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/settings/projects', 'POST', {
        name: projName,
        location: projLocation,
        priceRange: projPrice,
        totalUnits: parseInt(projUnits) || 0
      });
      toast.success(`Project '${projName}' created successfully!`);
      setModalType(null);
      setProjName('');
      setProjLocation('');
      setProjPrice('');
      setProjUnits('');
      fetchProjects();
    } catch (err) {
      toast.error(err.message || 'Failed to create project');
    }
  };

  const handleCreateSource = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/settings/lead-sources', 'POST', {
        name: sourceName,
        type: sourceType
      });
      toast.success(`Lead source '${sourceName}' created!`);
      setModalType(null);
      setSourceName('');
      fetchSources();
    } catch (err) {
      toast.error(err.message || 'Failed to create lead source');
    }
  };

  const pipelineStages = [
    { name: 'New', desc: 'Fresh enquiry ingested into CRM', color: 'bg-slate-500' },
    { name: 'Contact Attempted', desc: 'First outgoing call or outreach', color: 'bg-yellow-500' },
    { name: 'RNR 1/2/3', desc: 'Ringing No Response (3 auto attempts)', color: 'bg-orange-500' },
    { name: 'Connected', desc: 'Customer answered and spoken to', color: 'bg-cyan-500' },
    { name: 'Interested', desc: 'Customer expressed intent to buy', color: 'bg-blue-500' },
    { name: 'Follow-up', desc: 'Scheduled follow-up callback or meeting', color: 'bg-amber-500' },
    { name: 'Site Visit Scheduled', desc: 'Physical project inspection planned', color: 'bg-indigo-500' },
    { name: 'Site Visit Completed', desc: 'Customer attended site visit', color: 'bg-violet-500' },
    { name: 'Negotiation', desc: 'Price quotation and commercial offer stage', color: 'bg-purple-500' },
    { name: 'Booking/Closed Won', desc: 'Token amount paid & unit booked', color: 'bg-emerald-500' },
    { name: 'Not Interested / Lost', desc: 'Disqualified or deal lost to competitor', color: 'bg-rose-500' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Workspace Settings & Customization</h1>
        <p className="text-sm text-slate-400 mt-1">Configure company branding, users, projects, pipeline stages, and security audit trail.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('company')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 transition ${
            activeTab === 'company' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Branding</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 transition ${
            activeTab === 'users' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Team</span>
        </button>

        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 transition ${
            activeTab === 'pipeline' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pipeline Stages</span>
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 transition ${
            activeTab === 'projects' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Projects</span>
        </button>

        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 transition ${
            activeTab === 'sources' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Lead Sources</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 transition ${
            activeTab === 'audit' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Logs</span>
        </button>
      </div>

      {/* ── COMPANY TAB ── */}
      {activeTab === 'company' && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h3 className="font-bold text-white text-base mb-4 flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>Organization Details & Branding</span>
          </h3>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Company Name</label>
              <input
                type="text"
                value={company.name || ''}
                onChange={e => setCompany({ ...company, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Official Email</label>
                <input
                  type="email"
                  value={company.email || ''}
                  onChange={e => setCompany({ ...company, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  value={company.phone || ''}
                  onChange={e => setCompany({ ...company, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Headquarters Address</label>
              <input
                type="text"
                value={company.address || ''}
                onChange={e => setCompany({ ...company, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Brand Accent Color</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={company.primary_color || '#06b6d4'}
                  onChange={e => setCompany({ ...company, primary_color: e.target.value })}
                  className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-700"
                />
                <span className="text-sm text-slate-300 font-mono">{company.primary_color || '#06b6d4'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={savingCompany}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-cyan-500/20 transition disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{savingCompany ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── PIPELINE STAGES TAB ── */}
      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-white text-base mb-2">Standard Real Estate Sales Funnel</h3>
            <p className="text-xs text-slate-400 mb-6">
              Standardized stages applied to all incoming leads from digital sources and manual walk-ins.
            </p>

            <div className="space-y-3">
              {pipelineStages.map((st, idx) => (
                <div key={st.name} className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{st.name}</p>
                      <p className="text-xs text-slate-500">{st.desc}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    Active Stage
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModalType('USER')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3.5 px-4 text-slate-300">{u.email}</td>
                    <td className="py-3.5 px-4 text-slate-400">{u.phone || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        u.is_active !== 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.is_active !== 0 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleUser(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                          u.is_active !== 0
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {u.is_active !== 0 ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModalType('PROJECT')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <h3 className="font-bold text-white text-base">{p.name}</h3>
                <p className="text-xs text-slate-400">{p.location || 'Location TBD'}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800 flex justify-between">
                  <span>Units: {p.total_units || 0}</span>
                  <span className="text-cyan-400 font-semibold">{p.status || 'Active'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SOURCES TAB ── */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModalType('SOURCE')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-md shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead Source</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sources.map((s) => (
              <div key={s.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-200 text-sm">{s.name}</h4>
                  <p className="text-xs text-slate-500">{s.type}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Active Webhook
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AUDIT LOGS TAB ── */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {auditLogs.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">{a.user_name || 'System'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-slate-800 text-cyan-400 border border-slate-700">
                      {a.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-400">{a.entity_type} #{a.entity_id}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-8 text-center text-slate-500">No audit logs recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD USER MODAL */}
      {modalType === 'USER' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Sales Representative</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone</label>
                <input
                  type="text"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">System Role</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Sales_Exec">Sales Executive</option>
                  <option value="Telecaller">Telecaller</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-slate-400 text-sm hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-semibold transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {modalType === 'PROJECT' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Real Estate Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Location</label>
                <input
                  type="text"
                  value={projLocation}
                  onChange={(e) => setProjLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Total Units</label>
                <input
                  type="number"
                  value={projUnits}
                  onChange={(e) => setProjUnits(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-slate-400 text-sm hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-semibold transition"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SOURCE MODAL */}
      {modalType === 'SOURCE' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">Add Inbound Lead Source</h3>
            <form onSubmit={handleCreateSource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Source Name</label>
                <input
                  type="text"
                  placeholder="e.g. MagicBricks, Meta Ads, Housing.com"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Category</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="Digital">Digital / Portal</option>
                  <option value="Social">Social Media Ads</option>
                  <option value="Walk-in">Walk-in / Offline</option>
                  <option value="Referral">Channel Partner / Referral</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 text-slate-400 text-sm hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-semibold transition"
                >
                  Save Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
