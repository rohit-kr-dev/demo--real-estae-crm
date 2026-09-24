import React, { useState } from 'react';
import { apiRequest } from '../services/api';

export default function LeadModal({ isOpen, onClose, onRefresh }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [budget, setBudget] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDuplicateMessage('');

    try {
      const res = await apiRequest('/leads', 'POST', {
        name,
        phone,
        email,
        budget: budget ? parseFloat(budget) : null,
        preferredLocation
      });

      if (res.isDuplicate) {
        setDuplicateMessage(`Existing Customer Detected! Enquiry logged under activity timeline.`);
      } else {
        onRefresh();
        onClose();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-1">Add New Buyer Lead</h3>
        <p className="text-xs text-slate-400 mb-4">Manual ingestion triggers duplicate detection and round-robin assignment.</p>

        {duplicateMessage && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs">
            {duplicateMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Customer Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number *</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876543210"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Estimated Budget (₹)</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="15000000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Preferred Location</label>
            <input
              type="text"
              value={preferredLocation}
              onChange={(e) => setPreferredLocation(e.target.value)}
              placeholder="e.g. Worli, Mumbai"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-400 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-sm font-semibold">
              {loading ? 'Ingesting...' : 'Save & Assign Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
