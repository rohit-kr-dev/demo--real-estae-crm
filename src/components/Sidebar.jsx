import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PhoneCall, 
  Building2, 
  DollarSign, 
  BarChart3,
  Settings, 
  LogOut,
  ChevronRight,
  Building
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'sales_exec', 'telecaller'] },
    { id: 'leads', label: 'Lead Database', icon: Users, roles: ['admin', 'manager', 'sales_exec', 'telecaller'] },
    { id: 'followups', label: 'Follow-ups', icon: PhoneCall, roles: ['admin', 'manager', 'sales_exec', 'telecaller'] },
    { id: 'site-visits', label: 'Site Visits', icon: Building2, roles: ['admin', 'manager', 'sales_exec'] },
    { id: 'negotiations', label: 'Deals & Bookings', icon: DollarSign, roles: ['admin', 'manager', 'sales_exec'] },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'settings', label: 'Admin Settings', icon: Settings, roles: ['admin', 'manager'] },
  ];

  const userRole = (user?.role || 'sales_exec').toLowerCase();
  const allowedItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Company Brand Branding */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-white text-base tracking-wide truncate">
              {user?.company?.name || 'Demo CRM'}
            </h1>
            <p className="text-xs text-cyan-400 font-medium">Real Estate CRM</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {active && <ChevronRight className="w-4 h-4 text-cyan-400" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between mb-3">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-200 truncate">{user?.name}</p>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mt-1">
              {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
