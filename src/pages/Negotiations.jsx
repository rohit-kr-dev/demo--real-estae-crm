import React, { useEffect, useState } from 'react';
import { DollarSign, CheckCircle2, Building, ShieldCheck, Tag, RefreshCw, Trophy } from 'lucide-react';
import { apiRequest } from '../services/api';
import toast from 'react-hot-toast';

export default function Negotiations({ onSelectLead }) {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState(null);

  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [finalPrice, setFinalPrice] = useState('');
  const [bookingAmount, setBookingAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const fetchNegotiations = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/negotiations');
      setNegotiations(res.negotiations || []);
    } catch (err) {
      toast.error('Failed to load negotiations');
    } finally {
      setLoading(false);
    }
  };

  const handleBookDeal = async (e) => {
    e.preventDefault();
    if (!bookingModal) return;
    setClosing(true);

    try {
      const res = await apiRequest(`/negotiations/${bookingModal.id}/book`, 'POST', {
        bookingDate,
        finalAmount: parseFloat(finalPrice || bookingModal.latest_offer),
        bookingAmount: parseFloat(bookingAmount || 0),
        remarks
      });
      toast.success('🎉 Congratulations! Deal closed and booking logged!');
      setBookingModal(null);
      setFinalPrice('');
      setBookingAmount('');
      setRemarks('');
      fetchNegotiations();
    } catch (err) {
      toast.error(err.message || 'Failed to close deal');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Negotiations & Deal Closures</h1>
          <p className="text-sm text-slate-400 mt-1">Track high-intent active pricing negotiations and finalize property bookings.</p>
        </div>
        <button
          onClick={fetchNegotiations}
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
              <th className="py-3.5 px-4">Customer Lead</th>
              <th className="py-3.5 px-4">Project & Unit</th>
              <th className="py-3.5 px-4">Quoted Amount</th>
              <th className="py-3.5 px-4">Customer Offer</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">Loading negotiations...</td>
              </tr>
            ) : negotiations.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-500">No active negotiations logged.</td>
              </tr>
            ) : (
              negotiations.map((n) => {
                const isClosed = n.status?.toLowerCase() === 'closed';
                return (
                  <tr key={n.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <button onClick={() => onSelectLead(n.lead_id)} className="hover:text-cyan-400 text-left">
                        {n.lead_name}
                      </button>
                      <div className="text-xs text-slate-400">{n.lead_phone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{n.project_name || 'Project TBD'}</div>
                      <div className="text-xs text-slate-400">Unit: {n.unit_number || 'TBD'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      ₹{(n.quoted_amount / 100000).toFixed(1)} L
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">
                      ₹{(n.latest_offer / 100000).toFixed(1)} L
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        isClosed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isClosed && (
                        <button
                          onClick={() => {
                            setBookingModal(n);
                            setFinalPrice(String(n.latest_offer || n.quoted_amount));
                          }}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center space-x-1 ml-auto shadow-md shadow-emerald-500/20"
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Close Deal</span>
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

      {/* BOOKING MODAL */}
      {bookingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">🎉 Close Deal & Finalize Booking</h3>
            <p className="text-xs text-slate-400 mb-4">{bookingModal.lead_name} • Unit {bookingModal.unit_number || 'TBD'}</p>

            <form onSubmit={handleBookDeal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Agreed Final Deal Price (₹)</label>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Token / Booking Amount Received (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={bookingAmount}
                  onChange={(e) => setBookingAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Booking Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Closing Notes & Payment Reference</label>
                <textarea
                  rows="2"
                  placeholder="Cheque / RTGS details, unit allocation notes"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setBookingModal(null)}
                  className="px-4 py-2 text-slate-400 text-sm hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closing}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                >
                  {closing ? 'Confirming...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
