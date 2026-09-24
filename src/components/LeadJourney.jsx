import React, { useState } from 'react';
import { apiRequest, getCurrentUser } from '../services/api';
import toast from 'react-hot-toast';

export default function LeadJourney({ data, refresh, open }) {
  const [feedback, setFeedback] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const { lead, followups, siteVisits, negotiations, bookings = [] } = data;
  const role = getCurrentUser()?.role;
  const manager = ['Admin', 'Manager'].includes(role);
  const sales = manager || role === 'Sales_Exec';
  const visit = siteVisits.find(v => v.status === 'Scheduled' || v.status === 'Rescheduled');
  const deal = negotiations.find(n => n.status === 'Active');
  const next = !lead.assigned_user_id ? 'Assign a representative to start qualification.' : lead.status === 'Won' ? 'Booking confirmed. This customer journey is complete.' : deal ? 'Agree the final amount and confirm the booking.' : visit ? 'Record the visit outcome and customer feedback.' : siteVisits.some(v => v.status === 'Completed') ? 'Open a negotiation for the preferred unit.' : lead.last_outcome === 'Visit declined' ? 'Schedule a follow-up and record the customer’s concerns.' : 'Call the customer, record feedback, and confirm whether they agree to visit.';
  async function act(endpoint, method, body) {
    setBusy(true);
    try { await apiRequest(endpoint, method, body); setFeedback(''); await refresh(); toast.success('Lead journey updated'); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  }
  return <section className="rounded-2xl border border-cyan-500/30 bg-slate-900 p-4 sm:p-6 space-y-4">
    <div><p className="text-xs uppercase tracking-widest text-cyan-400">Customer journey • #{lead.id}</p><h2 className="text-lg font-bold mt-1">{next}</h2><p className="text-sm text-slate-400 mt-2">Owner: {lead.assigned_user_name || 'Unassigned'} • {lead.stage}</p></div>
    <div className="flex flex-wrap gap-2 text-xs">{['Assignment', 'Call feedback', 'Visit', 'Negotiation', 'Booking'].map((s, i) => <span key={s} className="px-3 py-2 bg-slate-800 rounded-lg">{i + 1}. {s}</span>)}</div>
    {lead.last_outcome && <p className="text-sm text-slate-300">Latest feedback: <strong>{lead.last_outcome}</strong> — {lead.last_feedback || 'No remarks'}</p>}
    <div className="flex flex-wrap gap-2">
      {manager && <button className="journey-button" onClick={() => open('REASSIGN')}>Assign / hand over</button>}
      <button className="journey-button" onClick={() => open('CALL_OUTCOME')}>Record call & visit decision</button>
      <button className="journey-button" onClick={() => open('FOLLOWUP')}>Schedule follow-up</button>
      <button className="journey-button" onClick={() => open('SITE_VISIT')}>Schedule agreed visit</button>
      {sales && !deal && <button className="journey-button" onClick={() => open('NEGOTIATION')}>Open negotiation</button>}
    </div>
    {followups.filter(f => f.status === 'Pending').map(f => <div key={f.id} className="flex flex-wrap justify-between gap-2 p-3 bg-slate-950 rounded-xl text-sm"><span>{f.action_type} • {new Date(f.scheduled_at).toLocaleString()}<br />{f.remarks}</span><button disabled={busy} className="journey-button" onClick={() => act(`/followups/${f.id}/complete`, 'PUT', { remarks: 'Completed from lead journey' })}>Mark completed</button></div>)}
    {visit && <div className="space-y-3 border-t border-slate-800 pt-4"><p className="text-sm">Visit: {new Date(visit.scheduled_at).toLocaleString()} • {visit.status}</p>{sales ? <><label className="block text-sm">Customer visit feedback<textarea aria-label="Customer visit feedback" className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-700" value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="What did the customer like? Any concerns?" /></label><div className="flex flex-wrap gap-2">{['Completed', 'Cancelled', 'Rescheduled'].map(status => <button disabled={busy || !feedback.trim()} className="journey-button" key={status} onClick={() => act(`/site-visits/${visit.id}`, 'PUT', { status, feedback })}>{status === 'Completed' ? 'Complete visit' : status}</button>)}</div></> : <p className="text-xs text-slate-400">Your manager can hand this lead to a sales agent for visit feedback and closure.</p>}</div>}
    {deal && sales && <form className="space-y-3 border-t border-slate-800 pt-4" onSubmit={e => { e.preventDefault(); act(`/negotiations/${deal.id}/book`, 'POST', { finalAmount: Number(amount || deal.latest_offer), bookingDate: new Date().toISOString(), remarks: 'Customer confirmed booking' }); }}><p>Unit {deal.unit_number || 'TBD'} • Quote ₹{Number(deal.quoted_amount).toLocaleString()} • Offer ₹{Number(deal.latest_offer).toLocaleString()}</p><label className="block text-sm">Final agreed amount<input aria-label="Final agreed amount" type="number" min="1" className="w-full mt-2 p-3 rounded-xl bg-slate-950 border border-slate-700" value={amount} placeholder={String(deal.latest_offer)} onChange={e => setAmount(e.target.value)} /></label><button disabled={busy} className="journey-button">Confirm booking</button></form>}
    {bookings.map(b => <div key={b.id} className="p-4 rounded-xl bg-emerald-500/10 text-emerald-300">Booked • Unit {b.unit_number || 'TBD'} • ₹{Number(b.final_amount).toLocaleString()}<p className="text-xs mt-1">Ref #{b.id} • Included in dashboard revenue</p></div>)}
  </section>;
}
