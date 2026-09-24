import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadDatabase from './pages/LeadDatabase';
import LeadDetail from './pages/LeadDetail';
import Followups from './pages/Followups';
import SiteVisits from './pages/SiteVisits';
import Negotiations from './pages/Negotiations';
import AdminSettings from './pages/AdminSettings';
import Reports from './pages/Reports';
import Sidebar from './components/Sidebar';
import LeadModal from './components/LeadModal';
import NotificationBell from './components/NotificationBell';
import CommandPalette from './components/CommandPalette';
import ErrorBoundary from './components/ErrorBoundary';
import { SocketProvider, useSocket } from './context/SocketContext';
import { getCurrentUser, setAuthToken, setCurrentUser } from './services/api';

// ── Inner App (has socket context) ────────────────────────────────────────
function CRMApp({ user, onLogout }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const { socket, connected } = useSocket() || {};

  // Listen for real-time events and show toasts
  useEffect(() => {
    if (!socket) return;

    const handlers = {
      new_lead: (d) => toast.success(`🆕 New lead: ${d.lead?.name}`, { duration: 4000 }),
      stage_changed: (d) => toast(`📊 ${d.leadName}: ${d.oldStage} → ${d.newStage}`, { icon: '🔄', duration: 3500 }),
      lead_assigned: (d) => toast(`👤 ${d.leadName} assigned to ${d.assignedToName}`, { icon: '📋', duration: 3000 }),
      deal_closed: (d) => toast.success(`🎉 Deal closed! ${d.leadName}`, { duration: 6000 }),
      followup_completed: () => toast.success('✅ Follow-up completed', { duration: 2500 }),
      bulk_assigned: (d) => toast.success(`✅ ${d.count} leads assigned to ${d.assignedToName}`),
    };

    Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn));
    return () => Object.entries(handlers).forEach(([ev, fn]) => socket.off(ev, fn));
  }, [socket]);

  const navigateTo = (tab) => {
    setSelectedLeadId(null);
    setCurrentTab(tab);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <Sidebar currentTab={currentTab} setCurrentTab={navigateTo} user={user} onLogout={onLogout} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            {/* Connection status dot */}
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} title={connected ? 'Real-time connected' : 'Reconnecting...'} />
            <span className="text-xs text-slate-500">{connected ? 'Live' : 'Reconnecting...'}</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Ctrl+K hint */}
            <button
              onClick={() => {/* CommandPalette opens via keyboard */}}
              className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs hover:text-slate-300 transition"
              title="Press Ctrl+K"
            >
              <span>Search leads...</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] font-mono">Ctrl K</kbd>
            </button>

            <NotificationBell />

            {/* User avatar */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                {user.name?.[0]?.toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-slate-200 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-500">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {selectedLeadId ? (
            <ErrorBoundary>
              <LeadDetail leadId={selectedLeadId} onBack={() => setSelectedLeadId(null)} />
            </ErrorBoundary>
          ) : (
            <>
              {currentTab === 'dashboard' && <ErrorBoundary><Dashboard onSelectLead={id => setSelectedLeadId(id)} /></ErrorBoundary>}
              {currentTab === 'leads' && (
                <ErrorBoundary>
                  <LeadDatabase
                    onSelectLead={id => setSelectedLeadId(id)}
                    onOpenNewLeadModal={() => setIsLeadModalOpen(true)}
                  />
                </ErrorBoundary>
              )}
              {currentTab === 'followups' && <ErrorBoundary><Followups onSelectLead={id => setSelectedLeadId(id)} /></ErrorBoundary>}
              {currentTab === 'site-visits' && <ErrorBoundary><SiteVisits onSelectLead={id => setSelectedLeadId(id)} /></ErrorBoundary>}
              {currentTab === 'negotiations' && <ErrorBoundary><Negotiations onSelectLead={id => setSelectedLeadId(id)} /></ErrorBoundary>}
              {currentTab === 'reports' && <ErrorBoundary><Reports /></ErrorBoundary>}
              {currentTab === 'settings' && <ErrorBoundary><AdminSettings /></ErrorBoundary>}
            </>
          )}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette
        onNavigate={navigateTo}
        onSelectLead={id => setSelectedLeadId(id)}
      />

      {/* New Lead Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onRefresh={() => {}}
      />
    </div>
  );
}

// ── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = getCurrentUser();
    if (saved) setUser(saved);
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setUser(null);
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#e2e8f0',
            border: '1px solid #334155',
            borderRadius: '12px',
            fontSize: '13px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {!user ? (
        <Login onLoginSuccess={setUser} />
      ) : (
        <SocketProvider user={user}>
          <CRMApp user={user} onLogout={handleLogout} />
        </SocketProvider>
      )}
    </>
  );
}
