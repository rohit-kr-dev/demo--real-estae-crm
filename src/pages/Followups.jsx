import React, { useEffect, useState, useCallback } from 'react';
import { PhoneCall, CheckCircle2, Clock, AlertTriangle, Phone, RefreshCw } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

export default function Followups({ onSelectLead }) {
  const [activeTab, setActiveTab] = useState('today');
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket() || {};

  const fetchFollowups = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await apiRequest(`/followups?category=${activeTab}`);
      setFollowups(res.followups || []);
    } catch (err) {
      toast.error('Failed to load follow-ups');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchFollowups();
  }, [fetchFollowups]);

  // Real-time updates
  useEffect(() => {
    if (!socket) return;
    const handleUpdate = () => fetchFollowups(true);
    socket.on('followup_scheduled', handleUpdate);
    socket.on('followup_completed', handleUpdate);
    return () => {
      socket.off('followup_scheduled', handleUpdate);
      socket.off('followup_completed', handleUpdate);
    };
  }, [socket, fetchFollowups]);

  const markComplete = async (id) => {
    // Optimistic UI update
    setFollowups(prev => prev.filter(f => f.id !== id));
    try {
      await apiRequest(`/followups/${id}/complete`, 'PUT', { remarks: 'Follow-up call completed' });
      toast.success('Follow-up marked as completed!');
    } catch (err) {
      toast.error(err.message || 'Failed to complete follow-up');
      fetchFollowups(true);
    }
  };

  const tabs = [
    { id: 'today', label: "Today's Follow-ups", icon: Clock, color: 'text-amber-400' },
    { id: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-rose-400' },
    { id: 'upcoming', label: 'Upcoming', icon: PhoneCall, color: 'text-blue-400' },
    { id: 'completed', label: 'Completed History', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Follow-ups Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Track scheduled calls, tasks, and overdue customer contacts.</p>
        </div>
        <button
          onClick={() => fetchFollowups()}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 transition ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Scheduled Date & Time</th>
              <th className="py-3.5 px-4">Customer Lead</th>
              <th className="py-3.5 px-4">Type & Remarks</th>
              <th className="py-3.5 px-4">Assigned Agent</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500">Loading follow-ups...</td>
              </tr>
            ) : followups.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-slate-500">No follow-ups found in this category.</td>
              </tr>
            ) : (
              followups.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-medium text-amber-400">
                    {new Date(f.scheduled_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => onSelectLead(f.lead_id)}
                      className="font-semibold text-white hover:text-cyan-400 transition text-left"
                    >
                      {f.lead_name}
                    </button>
                    <div className="text-xs text-slate-400">{f.lead_phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {f.action_type || 'Call'}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{f.remarks || 'No remarks provided'}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{f.user_name}</td>
                  <td className="py-3.5 px-4 text-right">
                    {f.status?.toLowerCase() === 'pending' && (
                      <button
                        onClick={() => markComplete(f.id)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-semibold transition"
                      >
                        Mark Completed
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
