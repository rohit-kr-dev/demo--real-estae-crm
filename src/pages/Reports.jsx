import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, Download, ArrowUpRight, Award, Target, Calendar } from 'lucide-react';
import { apiRequest, downloadCsv } from '../services/api';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/dashboard/summary');
      setData(res);
    } catch (err) {
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const m = data?.metrics || {};
  const totalLeads = m.totalLeads || 1;
  const wonLeads = m.wonLeads || 0;
  const conversionRate = ((wonLeads / totalLeads) * 100).toFixed(1);
  const totalRevenue = m.totalRevenue || 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <span>Reports & Business Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track pipeline velocity, conversion funnels, and executive sales metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
            {['all records'].map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
                  timeRange === r
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            onClick={() => downloadCsv('/leads', 'crm-pipeline.csv').catch(e => toast.error(e.message))}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Conversion Rate</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold text-white">{conversionRate}%</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> Overall
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{wonLeads} deals won of {totalLeads} leads</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Closed Revenue</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold text-white">₹{((totalRevenue)/10000000).toFixed(2)} Cr</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Booked deal value to date</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Site Visits Ratio</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold text-white">
              {Math.round(((m.siteVisits || 0) / totalLeads) * 100)}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{m.siteVisits || 0} visits completed</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pipeline Efficiency</p>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-bold text-cyan-400">{m.activeLeads || 0}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Active leads in the pipeline</p>
        </div>
      </div>

      {/* Conversion Funnel & Pipeline Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Full Stage Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-5 flex items-center space-x-2">
            <Target className="w-5 h-5 text-cyan-400" />
            <span>Pipeline Stages Volume</span>
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {(data?.byStage || []).map((st) => {
              const pct = Math.round((st.count / totalLeads) * 100);
              return (
                <div key={st.stage} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{st.stage}</span>
                    <span className="text-slate-400">{st.count} leads ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Source Efficiency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="font-bold text-white mb-5 flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>Channel Performance & Volume</span>
          </h3>
          <div className="space-y-4">
            {(data?.bySource || []).map((src) => {
              const pct = Math.round((src.count / totalLeads) * 100);
              return (
                <div key={src.source_name} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-slate-800/60">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{src.source_name}</p>
                    <p className="text-xs text-slate-500">{pct}% of inbound lead volume</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-cyan-400">{src.count}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Leads</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sales Rep Productivity Scorecard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 flex items-center space-x-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <span>Sales Executive Performance & Conversion Scorecard</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Sales Representative</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Assigned Leads</th>
                <th className="py-3 px-4 text-center">Site Visits</th>
                <th className="py-3 px-4 text-center">Negotiations</th>
                <th className="py-3 px-4 text-center">Won Bookings</th>
                <th className="py-3 px-4 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(data?.employeePerformance || []).map((emp) => {
                const repTotal = emp.total_assigned || 0;
                const repWon = emp.closures || 0;
                const repRate = repTotal > 0 ? ((repWon / repTotal) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={emp.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-semibold text-white">{emp.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{emp.role}</td>
                    <td className="py-3.5 px-4 text-center font-medium">{repTotal}</td>
                    <td className="py-3.5 px-4 text-center text-indigo-400 font-medium">{emp.site_visits}</td>
                    <td className="py-3.5 px-4 text-center text-purple-400 font-medium">{emp.negotiations || 0}</td>
                    <td className="py-3.5 px-4 text-center text-emerald-400 font-bold">{repWon}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {repRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
