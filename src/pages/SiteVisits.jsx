import React, { useEffect, useState } from 'react';
import { Building2, CheckCircle2, XCircle, Clock, MapPin, Car, Phone, Calendar, RefreshCw } from 'lucide-react';
import { apiRequest } from '../services/api';
import toast from 'react-hot-toast';

export default function SiteVisits({ onSelectLead }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState('Completed');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/site-visits');
      setVisits(res.siteVisits || []);
    } catch (err) {
      toast.error('Failed to load site visits');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedVisit) return;
    setUpdating(true);

    try {
      await apiRequest(`/site-visits/${selectedVisit.id}`, 'PUT', { status, feedback });
      toast.success(`Site visit updated to '${status}'!`);
      setSelectedVisit(null);
      setFeedback('');
      fetchVisits();
    } catch (err) {
      toast.error(err.message || 'Failed to update visit');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Site Visits Module</h1>
          <p className="text-sm text-slate-400 mt-1">Manage scheduled property tours, cab pickups, and post-visit buyer feedback.</p>
        </div>
        <button
          onClick={fetchVisits}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Visit Date & Time</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Project</th>
              <th className="py-3.5 px-4">Pickup</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">Loading site visits...</td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">No site visits scheduled yet.</td>
              </tr>
            ) : (
              visits.map((v) => {
                const isCompleted = v.status?.toLowerCase() === 'completed';
                return (
                  <tr key={v.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-indigo-400">
                      {new Date(v.scheduled_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <button onClick={() => onSelectLead(v.lead_id)} className="hover:text-cyan-400 text-left">
                        {v.lead_name}
                      </button>
                      <div className="text-xs text-slate-400">{v.lead_phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200">{v.project_name || 'Unassigned'}</td>
                    <td className="py-3.5 px-4">
                      {v.pickup_required ? (
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center space-x-1 w-fit">
                          <Car className="w-3.5 h-3.5" />
                          <span>Pickup</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">Self</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        isCompleted
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isCompleted && (
                        <button
                          onClick={() => {
                            setSelectedVisit(v);
                            setFeedback(v.feedback || '');
                            setStatus('Completed');
                          }}
                          className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold transition"
                        >
                          Update Status
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* UPDATE MODAL */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Update Site Visit Status</h3>
            <p className="text-xs text-slate-400 mb-4">{selectedVisit.lead_name} • {selectedVisit.project_name}</p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Outcome Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Completed">Completed (Attended & Satisfied)</option>
                  <option value="Cancelled">Cancelled / No Show</option>
                  <option value="Rescheduled">Rescheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Customer Feedback & Observations</label>
                <textarea
                  rows="3"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Liked 3BHK east-facing unit, requested price revision"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedVisit(null)}
                  className="px-4 py-2 text-slate-400 text-sm hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60"
                >
                  {updating ? 'Saving...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
