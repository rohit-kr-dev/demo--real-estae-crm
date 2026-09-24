import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  Eye,
  UserCheck,
  ChevronDown,
  X,
  Download,
  CheckSquare,
  Square,
  ArrowRight,
  Filter,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  List,
  Flame,
  Zap,
  Snowflake,
  Building,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { apiRequest, downloadCsv } from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

// Stage color helper
const stageColor = (stage) => {
  const map = {
    'New': 'bg-slate-700/60 text-slate-300 border-slate-600',
    'Contact Attempted': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'RNR': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'RNR 1': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'RNR 2': 'bg-orange-600/10 text-orange-500 border-orange-600/20',
    'RNR 3': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Connected': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    'Interested': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Follow-up': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Site Visit Scheduled': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'Site Visit Completed': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'Negotiation': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'Booking/Closed Won': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Not Interested': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'Lost': 'bg-red-700/10 text-red-500 border-red-700/20',
    'Invalid': 'bg-slate-600/10 text-slate-500 border-slate-600/20',
    'Duplicate': 'bg-slate-600/10 text-slate-500 border-slate-600/20',
  };
  return map[stage] || 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
};

// Lead Temperature Score
const getTemperature = (lead) => {
  const hotStages = ['Negotiation', 'Booking/Closed Won', 'Site Visit Completed', 'Site Visit Scheduled'];
  const warmStages = ['Interested', 'Connected', 'Follow-up'];
  if (hotStages.includes(lead.stage) || (lead.budget && lead.budget >= 25000000)) {
    return { label: 'Hot', icon: Flame, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
  }
  if (warmStages.includes(lead.stage) || lead.stage === 'New') {
    return { label: 'Warm', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  }
  return { label: 'Cold', icon: Snowflake, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
};

const KANBAN_STAGES = [
  'New',
  'Contact Attempted',
  'Connected',
  'Interested',
  'Follow-up',
  'Site Visit Scheduled',
  'Site Visit Completed',
  'Negotiation',
  'Booking/Closed Won',
];

export default function LeadDatabase({ onSelectLead, onOpenNewLeadModal }) {
  const [leads, setLeads] = useState([]);
  const [stages, setStages] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // View Mode: 'table' or 'kanban'
  const [viewMode, setViewMode] = useState('table');

  // Filter dropdown data
  const [projectsList, setProjectsList] = useState([]);
  const [sourcesList, setSourcesList] = useState([]);

  // Bulk Actions
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [bulkAssignModal, setBulkAssignModal] = useState(false);
  const [bulkStageModal, setBulkStageModal] = useState(false);
  const [bulkTargetUserId, setBulkTargetUserId] = useState('');
  const [bulkTargetStage, setBulkTargetStage] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Single Assign modal state
  const [assignModal, setAssignModal] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [assignUserId, setAssignUserId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Real-time unread badge
  const [newLeadsPushed, setNewLeadsPushed] = useState(0);

  const userInfo = JSON.parse(localStorage.getItem('crm_user') || '{}');
  const canAssign = ['Admin', 'Manager'].includes(userInfo.role);
  const { socket } = useSocket() || {};

  const fetchLeads = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      let query = `/leads?`;
      if (search) query += `search=${encodeURIComponent(search)}&`;
      if (selectedStage) query += `stage=${encodeURIComponent(selectedStage)}&`;
      if (selectedProject) query += `project_id=${encodeURIComponent(selectedProject)}&`;
      if (selectedSource) query += `source_id=${encodeURIComponent(selectedSource)}&`;
      if (onlyUnassigned) query += `unassigned=true&`;

      const res = await apiRequest(query);
      setLeads(res.leads || []);
      if (res.stages) setStages(res.stages);
    } catch (err) {
      toast.error('Failed to fetch leads');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [search, selectedStage, selectedProject, selectedSource, onlyUnassigned]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  const fetchAuxiliaryData = async () => {
    try {
      if (canAssign) {
        const uRes = await apiRequest('/auth/users');
        setAllUsers((uRes.users || []).filter(u => ['Sales_Exec', 'Telecaller'].includes(u.role)));
      }
      const pRes = await apiRequest('/settings/projects');
      setProjectsList(pRes.projects || []);
      const sRes = await apiRequest('/settings/lead-sources');
      setSourcesList(sRes.sources || []);
    } catch (e) {}
  };

  // Real-time listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewLead = () => {
      setNewLeadsPushed(prev => prev + 1);
      fetchLeads(true);
    };
    const handleStageChanged = (d) => {
      setLeads(prev => prev.map(l => l.id === d.leadId ? { ...l, stage: d.newStage } : l));
    };
    const handleLeadAssigned = (d) => {
      setLeads(prev => prev.map(l => l.id === d.leadId ? { ...l, assigned_user_name: d.assignedToName } : l));
    };
    const handleBulkAssigned = () => fetchLeads(true);
    const handleBulkStage = () => fetchLeads(true);

    socket.on('new_lead', handleNewLead);
    socket.on('stage_changed', handleStageChanged);
    socket.on('lead_assigned', handleLeadAssigned);
    socket.on('bulk_assigned', handleBulkAssigned);
    socket.on('bulk_stage_changed', handleBulkStage);

    return () => {
      socket.off('new_lead', handleNewLead);
      socket.off('stage_changed', handleStageChanged);
      socket.off('lead_assigned', handleLeadAssigned);
      socket.off('bulk_assigned', handleBulkAssigned);
      socket.off('bulk_stage_changed', handleBulkStage);
    };
  }, [socket, fetchLeads]);

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map(l => l.id));
    }
  };

  // Export CSV
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      let query = `/leads/export/csv?`;
      if (selectedStage) query += `stage=${encodeURIComponent(selectedStage)}&`;
      if (selectedProject) query += `project_id=${encodeURIComponent(selectedProject)}&`;
      if (selectedSource) query += `source_id=${encodeURIComponent(selectedSource)}&`;
      await downloadCsv(query, `Demo_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success('Leads exported successfully!');
    } catch (err) {
      toast.error('Failed to export CSV');
    } finally {
      setExporting(false);
    }
  };

  // Single Assign
  const openAssignModal = (lead) => {
    setAssignModal(lead);
    setAssignUserId(lead.assigned_user_id ? String(lead.assigned_user_id) : '');
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignUserId) return;
    setAssigning(true);
    try {
      await apiRequest(`/leads/${assignModal.id}/reassign`, 'POST', {
        assignedUserId: parseInt(assignUserId)
      });
      toast.success('Lead assigned successfully!');
      setAssignModal(null);
      fetchLeads(true);
    } catch (err) {
      toast.error(err.message || 'Failed to assign lead');
    } finally {
      setAssigning(false);
    }
  };

  // Bulk Assign
  const handleBulkAssignSubmit = async (e) => {
    e.preventDefault();
    if (!bulkTargetUserId || selectedLeadIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const res = await apiRequest('/leads/bulk-assign', 'POST', {
        leadIds: selectedLeadIds,
        assignedUserId: parseInt(bulkTargetUserId)
      });
      toast.success(res.message || 'Bulk assignment completed');
      setBulkAssignModal(false);
      setSelectedLeadIds([]);
      setBulkTargetUserId('');
      fetchLeads(true);
    } catch (err) {
      toast.error(err.message || 'Bulk assignment failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Bulk Stage
  const handleBulkStageSubmit = async (e) => {
    e.preventDefault();
    if (!bulkTargetStage || selectedLeadIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const res = await apiRequest('/leads/bulk-stage', 'POST', {
        leadIds: selectedLeadIds,
        stage: bulkTargetStage
      });
      toast.success(res.message || 'Bulk stage updated');
      setBulkStageModal(false);
      setSelectedLeadIds([]);
      setBulkTargetStage('');
      fetchLeads(true);
    } catch (err) {
      toast.error(err.message || 'Bulk stage update failed');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Move stage directly in Kanban
  const handleQuickMoveStage = async (leadId, nextStage) => {
    try {
      await apiRequest(`/leads/${leadId}/stage`, 'PUT', {
        stage: nextStage,
        remarks: `Moved to ${nextStage} via Kanban Board`
      });
      toast.success(`Moved to ${nextStage}`);
      fetchLeads(true);
    } catch (err) {
      toast.error(err.message || 'Failed to advance stage');
    }
  };

  const openWhatsApp = (phone, name, project) => {
    const text = encodeURIComponent(`Hello ${name}, regarding your real estate inquiry for ${project || 'our luxury residences'} with Demo CRM.`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-wide">Lead Database & Pipeline</h1>
            {newLeadsPushed > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>{newLeadsPushed} new</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Centralized pipeline with visual Kanban drag &amp; drop, advanced filters, and bulk sales actions.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View Mode Toggle: Table / Kanban */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'table' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'kanban' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
          </div>

          {canAssign && (
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl flex items-center space-x-2 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          )}

          <button
            onClick={onOpenNewLeadModal}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Projects</option>
            {projectsList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Lead Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Lead Sources</option>
            {sourcesList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Unassigned Checkbox & Clear */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl">
            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyUnassigned}
                onChange={(e) => setOnlyUnassigned(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span>Unassigned Only</span>
            </label>
            {(search || selectedStage || selectedProject || selectedSource || onlyUnassigned) && (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedStage('');
                  setSelectedProject('');
                  setSelectedSource('');
                  setOnlyUnassigned(false);
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Stage Filter Chips (for table view) */}
        {viewMode === 'table' && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-slate-800/60 pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedStage('')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedStage === ''
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All ({leads.length})
            </button>
            {stages.map((stg) => (
              <button
                key={stg}
                onClick={() => setSelectedStage(stg)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedStage === stg
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {stg}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Action Bar (when rows are selected) */}
      {viewMode === 'table' && selectedLeadIds.length > 0 && (
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center space-x-3">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">
              {selectedLeadIds.length}
            </span>
            <span className="text-sm font-semibold text-white">Leads selected</span>
          </div>

          <div className="flex items-center space-x-3">
            {canAssign && (
              <>
                <button
                  onClick={() => setBulkAssignModal(true)}
                  className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Bulk Assign</span>
                </button>

                <button
                  onClick={() => setBulkStageModal(true)}
                  className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Change Stage</span>
                </button>
              </>
            )}

            <button
              onClick={() => setSelectedLeadIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── KANBAN PIPELINE BOARD VIEW ── */}
      {viewMode === 'kanban' && (
        <div className="overflow-x-auto pb-6">
          <div className="flex space-x-4 min-w-[1400px]">
            {KANBAN_STAGES.map((stageName, colIdx) => {
              const stageLeads = leads.filter(l => l.stage === stageName);
              const nextStageName = KANBAN_STAGES[colIdx + 1];
              return (
                <div key={stageName} className="w-72 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col max-h-[750px] shadow-lg">
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${stageColor(stageName).split(' ')[0]}`} />
                      <h4 className="font-bold text-xs text-white uppercase tracking-wider">{stageName}</h4>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                      {stageLeads.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="p-2 space-y-2.5 overflow-y-auto flex-1 scrollbar-thin">
                    {stageLeads.map((lead) => {
                      const temp = getTemperature(lead);
                      const TempIcon = temp.icon;
                      return (
                        <div
                          key={lead.id}
                          className="bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 rounded-xl p-3 space-y-2.5 transition group shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <button
                                onClick={() => onSelectLead(lead.id)}
                                className="font-bold text-sm text-white hover:text-cyan-400 transition text-left truncate block"
                              >
                                {lead.name}
                              </button>
                              <p className="text-[11px] text-slate-400">{lead.phone}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 shrink-0 ${temp.color}`}>
                              <TempIcon className="w-2.5 h-2.5" />
                              <span>{temp.label}</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 text-slate-400">
                            <span className="truncate">{lead.project_name || 'Project TBD'}</span>
                            <span className="font-semibold text-slate-200">
                              ₹{(lead.budget / 100000).toFixed(1)}L
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-500 truncate max-w-[120px]">
                              {lead.assigned_user_name || '⚠ Unassigned'}
                            </span>

                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => openWhatsApp(lead.phone, lead.name, lead.project_name)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-green-400 border border-slate-800"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                              <a
                                href={`tel:${lead.phone}`}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800"
                                title="Call"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                              {nextStageName && (
                                <button
                                  onClick={() => handleQuickMoveStage(lead.id, nextStageName)}
                                  className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"
                                  title={`Advance to ${nextStageName}`}
                                >
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {stageLeads.length === 0 && (
                      <div className="py-8 text-center text-slate-600 text-xs italic">
                        No leads in {stageName}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-white">
                      {selectedLeadIds.length > 0 && selectedLeadIds.length === leads.length ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Temp</th>
                  <th className="py-3.5 px-4">Project & Budget</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="w-4 h-4 bg-slate-800 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-36 mb-1" /><div className="h-3 bg-slate-800/60 rounded w-24" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-12" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-28 mb-1" /><div className="h-3 bg-slate-800/60 rounded w-16" /></td>
                      <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded-full w-20" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                      <td className="py-4 px-4"><div className="h-6 bg-slate-800 rounded-full w-24" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-800 rounded w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">
                      No leads found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);
                    const temp = getTemperature(lead);
                    const TempIcon = temp.icon;
                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-slate-800/30 transition group ${
                          isSelected ? 'bg-cyan-500/5' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleSelect(lead.id)}
                            className="text-slate-400 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-cyan-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{lead.name}</div>
                          <div className="text-xs text-slate-400">
                            {lead.phone}{lead.email ? ` • ${lead.email}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center space-x-1 w-fit ${temp.color}`}>
                            <TempIcon className="w-3 h-3" />
                            <span>{temp.label}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-200">{lead.project_name || 'Unspecified'}</div>
                          <div className="text-xs text-slate-400">₹{(lead.budget / 100000).toFixed(1)} Lakhs</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {lead.source_name || 'Direct'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {lead.assigned_user_name ? (
                            <span className="font-medium text-slate-200">{lead.assigned_user_name}</span>
                          ) : (
                            <span className="text-xs text-rose-400 font-semibold">⚠ Unassigned</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${stageColor(lead.stage)}`}>
                            {lead.stage}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <a
                              href={`tel:${lead.phone}`}
                              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 transition"
                              title="Call Lead"
                            >
                              <Phone className="w-4 h-4 text-emerald-400" />
                            </a>

                            <button
                              onClick={() => openWhatsApp(lead.phone, lead.name, lead.project_name)}
                              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 transition"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4 text-green-400" />
                            </button>

                            {canAssign && (
                              <button
                                onClick={() => openAssignModal(lead)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold flex items-center space-x-1 transition"
                                title="Assign to Sales Team"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{lead.assigned_user_name ? 'Reassign' : 'Assign'}</span>
                              </button>
                            )}

                            <button
                              onClick={() => onSelectLead(lead.id)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-xs font-semibold flex items-center space-x-1 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Open</span>
                            </button>
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
      )}

      {/* SINGLE ASSIGN MODAL */}
      {assignModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Assign Lead to Sales Team</h3>
                <p className="text-xs text-slate-400 mt-1">{assignModal.name} • {assignModal.phone}</p>
              </div>
              <button onClick={() => setAssignModal(null)} className="p-2 text-slate-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3 bg-slate-950 rounded-xl px-4 py-3 mb-4">
              <span className="text-xs text-slate-400">Current Stage:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${stageColor(assignModal.stage)}`}>
                {assignModal.stage}
              </span>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Select Sales Executive / Telecaller</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                  required
                >
                  <option value="">Choose team member...</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="px-4 py-2 text-slate-400 text-sm hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                >
                  {assigning ? 'Assigning...' : 'Assign Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ASSIGN MODAL */}
      {bulkAssignModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Bulk Assign Leads</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Assigning {selectedLeadIds.length} leads in one click
                </p>
              </div>
              <button onClick={() => setBulkAssignModal(false)} className="p-2 text-slate-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Assign to Sales Executive</label>
                <select
                  value={bulkTargetUserId}
                  onChange={(e) => setBulkTargetUserId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500 transition"
                  required
                >
                  <option value="">Select sales rep...</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkAssignModal(false)}
                  className="px-4 py-2 text-slate-400 text-sm hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkProcessing}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                >
                  {bulkProcessing ? 'Assigning...' : `Assign ${selectedLeadIds.length} Leads`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK STAGE MODAL */}
      {bulkStageModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Bulk Change Stage</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Moving {selectedLeadIds.length} leads to a new stage
                </p>
              </div>
              <button onClick={() => setBulkStageModal(false)} className="p-2 text-slate-500 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkStageSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Target Stage</label>
                <select
                  value={bulkTargetStage}
                  onChange={(e) => setBulkTargetStage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition"
                  required
                >
                  <option value="">Select target stage...</option>
                  {stages.map((stg) => (
                    <option key={stg} value={stg}>{stg}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkStageModal(false)}
                  className="px-4 py-2 text-slate-400 text-sm hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkProcessing}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-semibold transition disabled:opacity-60"
                >
                  {bulkProcessing ? 'Updating...' : `Move ${selectedLeadIds.length} Leads`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
