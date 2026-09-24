import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Calendar,
  Building2,
  DollarSign,
  UserCheck,
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  TrendingUp,
  X,
  Flame,
  Snowflake,
  FileText,
  Copy,
  Zap
} from 'lucide-react';
import { apiRequest, getCurrentUser } from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import LeadJourney from '../components/LeadJourney';

// Full lifecycle stages in correct order
const ALL_STAGES = [
  'New',
  'Contact Attempted',
  'RNR 1',
  'RNR 2',
  'RNR 3',
  'Connected',
  'Interested',
  'Follow-up',
  'Site Visit Scheduled',
  'Site Visit Completed',
  'Negotiation',
  'Booking/Closed Won',
  'Not Interested',
  'Lost',
  'Invalid',
  'Duplicate',
];

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

export default function LeadDetail({ leadId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [activeModal, setActiveModal] = useState(null);
  // 'CALL_OUTCOME' | 'FOLLOWUP' | 'SITE_VISIT' | 'NEGOTIATION' | 'REASSIGN' | 'CHANGE_STAGE' | 'WHATSAPP_TEMPLATES'

  // Quick note form
  const [quickNote, setQuickNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Call outcome form
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [outcomeRemarks, setOutcomeRemarks] = useState('');
  const [nextFollowupDate, setNextFollowupDate] = useState('');

  // Follow-up form
  const [followupDate, setFollowupDate] = useState('');
  const [followupType, setFollowupType] = useState('Call');
  const [followupRemarks, setFollowupRemarks] = useState('');

  // Site visit form
  const [visitDate, setVisitDate] = useState('');
  const [pickupRequired, setPickupRequired] = useState(false);
  const [visitRemarks, setVisitRemarks] = useState('');

  // Negotiation form
  const [quotedAmount, setQuotedAmount] = useState('');
  const [latestOffer, setLatestOffer] = useState('');
  const [unitNumber, setUnitNumber] = useState('');

  // Reassign form
  const [selectedUser, setSelectedUser] = useState('');
  const [allUsers, setAllUsers] = useState([]);

  // Change stage form
  const [newStage, setNewStage] = useState('');
  const [stageRemark, setStageRemark] = useState('');
  const [stageSaving, setStageSaving] = useState(false);

  const { socket } = useSocket() || {};

  useEffect(() => {
    fetchDetail();
    fetchUsers();
  }, [leadId]);

  // Real-time listener for this lead
  useEffect(() => {
    if (!socket) return;
    const currentId = parseInt(leadId);

    const handleStage = (d) => {
      if (parseInt(d.leadId) === currentId) {
        toast(`Stage changed to: ${d.newStage}`, { icon: '🔄' });
        fetchDetail();
      }
    };
    const handleAct = (d) => {
      if (parseInt(d.leadId) === currentId) {
        fetchDetail();
      }
    };
    const handleAssigned = (d) => {
      if (parseInt(d.leadId) === currentId) {
        toast(`Assigned to ${d.assignedToName}`, { icon: '👤' });
        fetchDetail();
      }
    };

    socket.on('stage_changed', handleStage);
    socket.on('activity_added', handleAct);
    socket.on('lead_assigned', handleAssigned);

    return () => {
      socket.off('stage_changed', handleStage);
      socket.off('activity_added', handleAct);
      socket.off('lead_assigned', handleAssigned);
    };
  }, [socket, leadId]);

  const fetchDetail = async () => {
    try {
      const res = await apiRequest(`/leads/${leadId}`);
      setData(res);
    } catch (err) {
      toast.error('Failed to load lead details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiRequest('/auth/users');
      setAllUsers(res.users || []);
    } catch (e) {}
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Loading Lead 360° View...</p>
        </div>
      </div>
    );
  }

  const { lead, activities, followups, siteVisits, negotiations, stages, callOutcomes } = data;

  // ---- HANDLERS ----

  const handleLogCallOutcome = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/leads/${leadId}/call-outcome`, 'POST', {
        outcome: callOutcome,
        remarks: outcomeRemarks,
        nextFollowupDate: nextFollowupDate || null
      });
      toast.success(`Call outcome '${callOutcome}' logged!`);
      setActiveModal(null);
      setOutcomeRemarks('');
      setNextFollowupDate('');
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to log call outcome');
    }
  };

  const handleScheduleFollowup = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/followups', 'POST', {
        leadId,
        scheduledAt: followupDate,
        actionType: followupType,
        remarks: followupRemarks
      });
      toast.success('Follow-up scheduled!');
      setActiveModal(null);
      setFollowupDate('');
      setFollowupRemarks('');
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule follow-up');
    }
  };

  const handleScheduleVisit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/site-visits', 'POST', {
        leadId,
        projectId: lead.project_id,
        scheduledAt: visitDate,
        pickupRequired,
        remarks: visitRemarks
      });
      toast.success('Site visit scheduled!');
      setActiveModal(null);
      setVisitDate('');
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule visit');
    }
  };

  const handleLogNegotiation = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/negotiations', 'POST', {
        leadId,
        projectId: lead.project_id,
        unitNumber,
        quotedAmount: parseFloat(quotedAmount),
        latestOffer: parseFloat(latestOffer),
        expectedClosureValue: parseFloat(latestOffer)
      });
      toast.success('Negotiation offer logged!');
      setActiveModal(null);
      setQuotedAmount('');
      setLatestOffer('');
      setUnitNumber('');
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to log negotiation');
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/leads/${leadId}/reassign`, 'POST', {
        assignedUserId: parseInt(selectedUser)
      });
      toast.success('Lead reassigned successfully!');
      setActiveModal(null);
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to reassign lead');
    }
  };

  const handleChangeStage = async (e) => {
    e.preventDefault();
    if (!newStage) return;
    setStageSaving(true);
    try {
      await apiRequest(`/leads/${leadId}/stage`, 'PUT', {
        stage: newStage,
        remarks: stageRemark || `Stage manually changed to ${newStage}`
      });
      toast.success(`Stage moved to '${newStage}'!`);
      setActiveModal(null);
      setNewStage('');
      setStageRemark('');
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to update stage');
    } finally {
      setStageSaving(false);
    }
  };

  const handleQuickNote = async (e) => {
    e.preventDefault();
    if (!quickNote.trim()) return;
    setAddingNote(true);
    try {
      await apiRequest(`/leads/${leadId}/notes`, 'POST', { note: quickNote.trim() });
      toast.success('Note added to timeline!');
      setQuickNote('');
      fetchDetail();
    } catch (err) {
      toast.error(err.message || 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const sendWhatsAppTemplate = (templateText) => {
    const text = encodeURIComponent(templateText);
    window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(`Hello ${lead.name}, sharing project details for ${lead.project_name || 'our property'}.`);
    window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  const temp = getTemperature(lead);
  const TempIcon = temp.icon;

  return (
    <div className="p-8 space-y-6">

      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wide">{lead.name}</h1>
            <p className="text-xs text-slate-400">Lead ID #{lead.id} • Created {new Date(lead.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        {/* Current Stage Badge + Temperature Badge */}
        <div className="flex items-center space-x-2.5">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center space-x-1.5 ${temp.color}`}>
            <TempIcon className="w-3.5 h-3.5" />
            <span>{temp.label} Lead</span>
          </span>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${stageColor(lead.stage)}`}>
            {lead.stage}
          </span>
        </div>
      </div>

      {/* Lead Workflow Progress Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <p className="text-xs text-slate-400 font-semibold mb-3 uppercase tracking-wider">Sales Pipeline Progress</p>
        <div className="flex items-center overflow-x-auto gap-1 pb-2 scrollbar-none">
          {['New', 'Contact Attempted', 'Connected', 'Follow-up', 'Site Visit Scheduled', 'Site Visit Completed', 'Negotiation', 'Booking/Closed Won'].map((s, i, arr) => {
            const isActive = lead.stage === s;
            const isPast = arr.indexOf(lead.stage) > i;
            return (
              <React.Fragment key={s}>
                <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition ${
                  isActive
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/30'
                    : isPast
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}>
                  {isPast && <CheckCircle2 className="w-3 h-3" />}
                  <span>{s}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className={`text-slate-700 text-xs font-bold`}>›</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center gap-3">
        {/* Call */}
        <a
          href={`tel:${lead.phone}`}
          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
        >
          <Phone className="w-4 h-4" />
          <span>Call Lead</span>
        </a>

        {/* WhatsApp */}
        <button
          onClick={openWhatsApp}
          className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp</span>
        </button>

        {/* WhatsApp Templates */}
        <button
          onClick={() => setActiveModal('WHATSAPP_TEMPLATES')}
          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
        >
          <FileText className="w-4 h-4" />
          <span>Quick Templates</span>
        </button>

        {/* Log Call Outcome */}
        <button
          onClick={() => setActiveModal('CALL_OUTCOME')}
          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
        >
          <Phone className="w-4 h-4" />
          <span>Log Call Outcome</span>
        </button>

        {/* Schedule Follow-up */}
        <button
          onClick={() => setActiveModal('FOLLOWUP')}
          className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule Follow-up</span>
        </button>

        {/* Schedule Site Visit */}
        <button
          onClick={() => setActiveModal('SITE_VISIT')}
          className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
        >
          <Building2 className="w-4 h-4" />
          <span>Schedule Site Visit</span>
        </button>

        {/* Log Negotiation */}
        <button
          onClick={() => setActiveModal('NEGOTIATION')}
          disabled={getCurrentUser()?.role === 'Telecaller'}
          className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
        >
          <DollarSign className="w-4 h-4" />
          <span>Log Negotiation</span>
        </button>

        {/* Change Stage — KEY NEW BUTTON */}
        <button
          onClick={() => { setNewStage(lead.stage); setActiveModal('CHANGE_STAGE'); }}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
        >
          <TrendingUp className="w-4 h-4" />
          <span>Change Stage</span>
        </button>

        {/* Reassign Lead */}
        <button
          onClick={() => setActiveModal('REASSIGN')}
          disabled={!['Admin', 'Manager'].includes(getCurrentUser()?.role)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2 transition ml-auto"
        >
          <UserCheck className="w-4 h-4" />
          <span>Reassign Lead</span>
        </button>
      </div>

      {/* Main Grid */}
      <LeadJourney data={data} refresh={fetchDetail} open={setActiveModal} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Customer Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl h-fit">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Lead Profile</h2>

          <div className="space-y-4 text-sm">
            <ProfileField label="Phone Number" value={lead.phone} />
            <ProfileField label="Email Address" value={lead.email || 'N/A'} />
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Lifecycle Stage</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${stageColor(lead.stage)}`}>
                {lead.stage}
              </span>
            </div>
            <ProfileField label="Interested Project" value={lead.project_name || 'Unassigned'} valueClass="text-white" />
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Budget</p>
              <p className="font-semibold text-emerald-400 mt-0.5">₹{(lead.budget / 100000).toFixed(1)} Lakhs</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Lead Source</p>
              <p className="font-semibold text-blue-400 mt-0.5">{lead.source_name || 'Direct'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Assigned Representative</p>
              {lead.assigned_user_name ? (
                <p className="font-semibold text-slate-200 mt-0.5">{lead.assigned_user_name}</p>
              ) : (
                <p className="font-semibold text-rose-400 mt-0.5">⚠ Unassigned</p>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase font-semibold">Next Follow-up</p>
              <p className="font-semibold text-amber-400 mt-0.5">
                {lead.next_followup_at ? new Date(lead.next_followup_at).toLocaleString() : 'None Scheduled'}
              </p>
            </div>
          </div>

          {/* RNR Counter */}
          {(lead.rnr_count > 0) && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
              <p className="text-xs text-red-400 font-semibold">RNR Count: {lead.rnr_count}/3</p>
              <p className="text-[10px] text-slate-500 mt-1">Ringing No Response attempts</p>
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">
              Activity Timeline & Interactions
            </h2>
            <span className="text-xs text-slate-500">{activities.length} total events</span>
          </div>

          {/* Inline Quick Note Form */}
          <form onSubmit={handleQuickNote} className="mb-6 flex gap-2">
            <input
              type="text"
              placeholder="Write a quick call remark, meeting note, or customer preference..."
              value={quickNote}
              onChange={e => setQuickNote(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            <button
              type="submit"
              disabled={addingNote || !quickNote.trim()}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{addingNote ? 'Saving...' : 'Add Note'}</span>
            </button>
          </form>

          {activities.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No activities recorded yet. Log a call outcome to start tracking.
            </div>
          ) : (
            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {activities.map((act) => {
                const dotColor =
                  act.title?.includes('RNR') ? 'bg-orange-500' :
                  act.title?.includes('Connected') ? 'bg-cyan-500' :
                  act.title?.includes('Stage') ? 'bg-rose-500' :
                  act.title?.includes('Assigned') ? 'bg-amber-500' :
                  act.title?.includes('Visit') ? 'bg-indigo-500' :
                  act.title?.includes('Negotiation') ? 'bg-purple-500' :
                  act.title?.includes('Booked') || act.title?.includes('Closed') ? 'bg-emerald-500' :
                  'bg-cyan-500';
                return (
                  <div key={act.id} className="relative">
                    <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full ${dotColor} border-2 border-slate-900`} />
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-white">{act.title}</h4>
                        <span className="text-xs text-slate-500">{new Date(act.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-300">{act.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1">by {act.user_name || 'System'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== MODALS ===== */}

      {/* WHATSAPP TEMPLATES MODAL */}
      {activeModal === 'WHATSAPP_TEMPLATES' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <span>1-Click WhatsApp Quick Templates</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Send tailored real estate messages instantly to {lead.name}</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Template 1: Brochure */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">📄 1. Project Brochure & Floor Plans</span>
                  <button
                    onClick={() => {
                      sendWhatsAppTemplate(`Hello ${lead.name}, thank you for your interest in ${lead.project_name || 'Demo CRM'}! Please find attached our luxury residential brochure, floor layouts, and pricing sheets. When would be a good time to connect?`);
                      setActiveModal(null);
                    }}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 italic">
                  "Hello {lead.name}, thank you for your interest in {lead.project_name || 'Demo CRM'}! Please find attached our luxury residential brochure, floor layouts, and pricing sheets. When would be a good time to connect?"
                </p>
              </div>

              {/* Template 2: Site Visit */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">🚗 2. VIP Site Visit Invitation & Pin</span>
                  <button
                    onClick={() => {
                      sendWhatsAppTemplate(`Dear ${lead.name}, we would be delighted to host you for an exclusive walkthrough at ${lead.project_name || 'our flagship project'}. Complimentary pick-and-drop can be arranged. Location map: https://maps.google.com/?q=${encodeURIComponent(lead.project_name || 'Demo CRM')}. What day suits you best?`);
                      setActiveModal(null);
                    }}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 italic">
                  "Dear {lead.name}, we would be delighted to host you for an exclusive walkthrough at {lead.project_name || 'our flagship project'}. Complimentary pick-and-drop can be arranged..."
                </p>
              </div>

              {/* Template 3: Post-Visit */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">🤝 3. Post-Visit Follow-up & Cost Sheet</span>
                  <button
                    onClick={() => {
                      sendWhatsAppTemplate(`Hello ${lead.name}, thank you for visiting ${lead.project_name || 'our project'} with us today! Following up with your customized cost breakdown and builder incentives. Let us know if you'd like to reserve your preferred unit.`);
                      setActiveModal(null);
                    }}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 italic">
                  "Hello {lead.name}, thank you for visiting {lead.project_name || 'our project'} with us today! Following up with your customized cost breakdown and builder incentives..."
                </p>
              </div>

              {/* Template 4: Token Booking */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">🏆 4. Token Booking & Unit Lock</span>
                  <button
                    onClick={() => {
                      sendWhatsAppTemplate(`Hi ${lead.name}, we have kept your preferred unit on provisional hold at ${lead.project_name || 'our development'}. To secure this inventory and rate, please confirm booking token details.`);
                      setActiveModal(null);
                    }}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 italic">
                  "Hi {lead.name}, we have kept your preferred unit on provisional hold at {lead.project_name || 'our development'}. To secure this inventory and rate, please confirm booking token details."
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800 mt-4">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-slate-400 text-xs hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE STAGE MODAL */}
      {activeModal === 'CHANGE_STAGE' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-white">Change Lead Stage</h3>
                <p className="text-xs text-slate-400 mt-1">Manually move this lead to any stage in the lifecycle</p>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current stage */}
            <div className="flex items-center space-x-3 bg-slate-950 rounded-xl px-4 py-3 mb-4">
              <span className="text-xs text-slate-400">Current:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${stageColor(lead.stage)}`}>
                {lead.stage}
              </span>
            </div>

            <form onSubmit={handleChangeStage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Select New Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-rose-500 transition"
                  required
                >
                  <option value="">Choose stage...</option>
                  <optgroup label="Active Pipeline">
                    <option value="New">New</option>
                    <option value="Contact Attempted">Contact Attempted</option>
                    <option value="RNR 1">RNR 1 (Ringing No Response)</option>
                    <option value="RNR 2">RNR 2 (2nd Attempt)</option>
                    <option value="RNR 3">RNR 3 (3rd Attempt)</option>
                    <option value="Connected">Connected</option>
                    <option value="Interested">Interested</option>
                    <option value="Follow-up">Follow-up Scheduled</option>
                    <option value="Site Visit Scheduled">Site Visit Scheduled</option>
                    <option value="Site Visit Completed">Site Visit Completed</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Booking/Closed Won">Booking / Closed Won ✓</option>
                  </optgroup>
                  <optgroup label="Dead/Closed">
                    <option value="Not Interested">Not Interested</option>
                    <option value="Lost">Lost</option>
                    <option value="Invalid">Invalid Lead</option>
                    <option value="Duplicate">Duplicate</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Reason / Remarks</label>
                <textarea
                  value={stageRemark}
                  onChange={(e) => setStageRemark(e.target.value)}
                  placeholder="e.g. Client confirmed interest after 2nd follow-up call..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-rose-500 transition resize-none"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-slate-400 text-sm hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stageSaving || !newStage}
                  className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
                >
                  {stageSaving ? 'Saving...' : 'Update Stage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CALL OUTCOME MODAL */}
      {activeModal === 'CALL_OUTCOME' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Log Call Outcome</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-blue-400 font-semibold">
                💡 Selecting RNR will auto-advance stage to RNR 1 → RNR 2 → RNR 3. "Connected" moves to Connected stage.
              </p>
            </div>
            <form onSubmit={handleLogCallOutcome} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Call Outcome</label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                >
                  {(callOutcomes || ['Connected', 'RNR', 'Busy', 'Not Interested', 'Interested', 'Follow-up Scheduled']).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Call Remarks</label>
                <textarea
                  value={outcomeRemarks}
                  onChange={(e) => setOutcomeRemarks(e.target.value)}
                  placeholder="Enter notes discussed with client..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm resize-none"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Next Follow-up Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-400 text-sm hover:text-white transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-semibold transition">Save Outcome</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FOLLOWUP MODAL */}
      {activeModal === 'FOLLOWUP' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Schedule Follow-up</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleScheduleFollowup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Follow-up Type</label>
                <select
                  value={followupType}
                  onChange={(e) => setFollowupType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                >
                  {['Call', 'WhatsApp', 'Email', 'SMS', 'Video Call', 'In-Person'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Remarks</label>
                <input
                  type="text"
                  value={followupRemarks}
                  onChange={(e) => setFollowupRemarks(e.target.value)}
                  placeholder="e.g. Send floor plans on WhatsApp before calling"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-400 text-sm hover:text-white transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-sm font-semibold transition">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SITE VISIT MODAL */}
      {activeModal === 'SITE_VISIT' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Schedule Site Visit</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleScheduleVisit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Visit Date & Time</label>
                <input
                  type="datetime-local"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  required
                />
              </div>
              <div className="flex items-center space-x-3 bg-slate-950 rounded-xl px-4 py-3">
                <input
                  type="checkbox"
                  id="pickup"
                  checked={pickupRequired}
                  onChange={(e) => setPickupRequired(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 w-4 h-4"
                />
                <label htmlFor="pickup" className="text-sm font-medium text-slate-300 cursor-pointer">
                  Cab Pickup Required from Client Location
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Notes</label>
                <input
                  type="text"
                  value={visitRemarks}
                  onChange={(e) => setVisitRemarks(e.target.value)}
                  placeholder="e.g. Show Tower A 3BHK units..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-400 text-sm hover:text-white transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-semibold transition">Confirm Site Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEGOTIATION MODAL */}
      {activeModal === 'NEGOTIATION' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Log Deal Negotiation</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleLogNegotiation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Unit Number</label>
                <input
                  type="text"
                  placeholder="e.g. A-1402"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Quoted Amount (₹)</label>
                <input
                  type="number"
                  placeholder="25000000"
                  value={quotedAmount}
                  onChange={(e) => setQuotedAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Latest Customer Offer (₹)</label>
                <input
                  type="number"
                  placeholder="24000000"
                  value={latestOffer}
                  onChange={(e) => setLatestOffer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-400 text-sm hover:text-white transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-semibold transition">Log Negotiation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN MODAL */}
      {activeModal === 'REASSIGN' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Reassign Lead Representative</h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleReassign} className="space-y-4">
              <div className="flex items-center space-x-3 bg-slate-950 rounded-xl px-4 py-3">
                <span className="text-xs text-slate-400">Currently Assigned:</span>
                <span className="text-xs font-semibold text-slate-200">{lead.assigned_user_name || 'No One'}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Select New Representative</label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
                  required
                >
                  <option value="">Choose User...</option>
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-slate-400 text-sm hover:text-white transition">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-sm font-semibold transition">Reassign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for profile fields
function ProfileField({ label, value, valueClass = 'text-slate-200' }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase font-semibold">{label}</p>
      <p className={`font-semibold mt-0.5 ${valueClass}`}>{value}</p>
    </div>
  );
}
