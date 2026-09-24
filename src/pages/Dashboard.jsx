import React, { useState, useEffect, useCallback } from 'react';
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Calendar, Building2, DollarSign, Clock, ArrowUpRight, Phone, RefreshCw, Star, Zap } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useSocket } from '../context/SocketContext';

const STAGE_COLORS = {
  'New': 'bg-slate-700/40 text-slate-300', 'Contact Attempted': 'bg-yellow-500/10 text-yellow-400',
  'RNR 1': 'bg-orange-500/10 text-orange-400', 'RNR 2': 'bg-orange-600/10 text-orange-500', 'RNR 3': 'bg-red-500/10 text-red-400',
  'Connected': 'bg-cyan-500/10 text-cyan-400', 'Interested': 'bg-blue-500/10 text-blue-400',
  'Follow-up': 'bg-amber-500/10 text-amber-400', 'Site Visit Scheduled': 'bg-indigo-500/10 text-indigo-400',
  'Site Visit Completed': 'bg-violet-500/10 text-violet-400', 'Negotiation': 'bg-purple-500/10 text-purple-400',
  'Booking/Closed Won': 'bg-emerald-500/10 text-emerald-400', 'Not Interested': 'bg-rose-500/10 text-rose-400',
};

function KpiCard({ label, value, sub, icon: Icon, gradient, trend, loading }) {
  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition`}>
      <div className={`absolute inset-0 opacity-5 group-hover:opacity-8 transition ${gradient}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{label}</p>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${gradient} opacity-80`}>
            <Icon className="w-4.5 h-4.5 text-white" />
          </div>
        </div>
        {loading ? (
          <div className="h-8 w-16 bg-slate-800 rounded-lg animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-white">{value?.toLocaleString() ?? '—'}</p>
        )}
        {sub && <p className="text-xs text-slate-500 mt-1.5">{sub}</p>}
        {trend !== undefined && !loading && (
          <div className={`flex items-center space-x-1 mt-2 text-xs font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <ArrowUpRight className={`w-3.5 h-3.5 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(trend)}% this month</span>
          </div>
        )}
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="text-slate-200 font-bold">{value} <span className="text-slate-500 font-normal">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard({ onSelectLead }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { socket } = useSocket() || {};

  const fetchData = useCallback(async () => {
    try {
      const res = await apiRequest('/dashboard/summary');
      setData(res);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Real-time refresh on key events
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchData();
    socket.on('new_lead', refresh);
    socket.on('stage_changed', refresh);
    socket.on('deal_closed', refresh);
    return () => { socket.off('new_lead', refresh); socket.off('stage_changed', refresh); socket.off('deal_closed', refresh); };
  }, [socket, fetchData]);

  const m = data?.metrics || {};

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Command Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time overview · {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
          </p>
        </div>
        <button onClick={fetchData} className="shrink-0 flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Leads" value={m.totalLeads} sub={`${m.activeLeads || 0} active`} icon={Users} gradient="bg-gradient-to-br from-cyan-500 to-blue-600" loading={loading} />
        <KpiCard label="New Leads" value={m.newLeads} sub="Awaiting assignment" icon={Zap} gradient="bg-gradient-to-br from-amber-500 to-orange-600" loading={loading} />
        <KpiCard label="Closed Won" value={m.wonLeads} sub={`₹${((m.totalRevenue || 0)/10000000).toFixed(2)} Cr revenue`} icon={CheckCircle2} gradient="bg-gradient-to-br from-emerald-500 to-green-600" loading={loading} />
        <KpiCard label="Overdue Follow-ups" value={m.overdueFU} sub={`${m.todayFU || 0} due today`} icon={AlertTriangle} gradient="bg-gradient-to-br from-red-500 to-rose-600" loading={loading} />
        <KpiCard label="Today's Site Visits" value={m.todayVisits} sub={`${m.siteVisits || 0} total visits`} icon={Building2} gradient="bg-gradient-to-br from-indigo-500 to-violet-600" loading={loading} />
        <KpiCard label="Active Negotiations" value={m.activeNegs} sub="In pricing discussion" icon={DollarSign} gradient="bg-gradient-to-br from-purple-500 to-pink-600" loading={loading} />
        <KpiCard label="Lost Leads" value={m.lostLeads} sub="Not interested / Lost" icon={TrendingUp} gradient="bg-gradient-to-br from-slate-500 to-slate-700" loading={loading} />
        <KpiCard label="Unassigned" value={m.unassigned} sub="Needs immediate action" icon={Clock} gradient="bg-gradient-to-br from-rose-500 to-red-600" loading={loading} />
      </div>

      {/* Middle Row: Funnel + Source Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Funnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <h3 className="font-bold text-white mb-5 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>Sales Funnel</span>
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Total Leads', value: data?.funnel?.total || 0, color: 'bg-slate-500' },
              { label: 'Contacted', value: data?.funnel?.contacted || 0, color: 'bg-blue-500' },
              { label: 'Interested', value: data?.funnel?.interested || 0, color: 'bg-cyan-500' },
              { label: 'Site Visits', value: data?.funnel?.siteVisits || 0, color: 'bg-indigo-500' },
              { label: 'Negotiations', value: data?.funnel?.negotiations || 0, color: 'bg-purple-500' },
              { label: 'Closed Won 🏆', value: data?.funnel?.closures || 0, color: 'bg-emerald-500' },
            ].map(item => (
              <FunnelBar key={item.label} {...item} max={data?.funnel?.total || 1} />
            ))}
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <h3 className="font-bold text-white mb-5 flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span>Lead Sources</span>
          </h3>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-slate-800 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {(data?.bySource || []).filter(s => s.count > 0).map(s => (
                <div key={s.source_name} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300 font-medium">{s.source_name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, (s.count / (m.totalLeads || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-200 w-8 text-right">{s.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Employee Performance + Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Scoreboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <h3 className="font-bold text-white mb-5 flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>Team Scoreboard</span>
          </h3>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {(data?.employeePerformance || []).slice(0, 6).map((emp, i) => (
                <div key={emp.id} className="flex items-center space-x-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 hover:border-slate-700 transition">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-slate-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-500">{emp.role}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-right">
                    <div>
                      <p className="font-bold text-slate-200">{emp.total_assigned}</p>
                      <p className="text-slate-500">leads</p>
                    </div>
                    <div>
                      <p className="font-bold text-indigo-400">{emp.site_visits}</p>
                      <p className="text-slate-500">visits</p>
                    </div>
                    <div>
                      <p className="font-bold text-emerald-400">{emp.closures}</p>
                      <p className="text-slate-500">closed</p>
                    </div>
                  </div>
                </div>
              ))}
              {(data?.employeePerformance || []).length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No sales team data yet</p>
              )}
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6">
          <h3 className="font-bold text-white mb-5 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>Live Activity Feed</span>
          </h3>
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {(data?.recentActivity || []).map((act, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 bg-slate-950/50 rounded-xl border border-slate-800/50">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{act.title} — <span className="text-cyan-400">{act.lead_name}</span></p>
                    <p className="text-[11px] text-slate-400 truncate">{act.description}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">by {act.user_name || 'System'} · {new Date(act.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {(data?.recentActivity || []).length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No activity yet</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Today's Follow-ups */}
      {(data?.todayFollowupsList || []).length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-5 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <span>Today's Follow-up Schedule</span>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-full border border-amber-500/20">{data.todayFollowupsList.length}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.todayFollowupsList.map(fu => (
              <div key={fu.id} className="flex items-center space-x-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl hover:border-amber-500/20 transition cursor-pointer" onClick={() => onSelectLead?.(fu.lead_id)}>
                <div className="w-8 h-8 bg-amber-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{fu.lead_name}</p>
                  <p className="text-[10px] text-amber-400">{new Date(fu.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {fu.action_type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
