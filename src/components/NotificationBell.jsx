import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, UserCheck, Calendar } from 'lucide-react';
import { apiRequest } from '../services/api';
import { useSocket } from '../context/SocketContext';

const ICON_MAP = {
  LEAD_ASSIGNED: <UserCheck className="w-4 h-4 text-amber-400" />,
  FOLLOWUP_DUE: <Calendar className="w-4 h-4 text-blue-400" />,
  DEAL_CLOSED: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  DEFAULT: <Bell className="w-4 h-4 text-slate-400" />,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const { socket } = useSocket() || {};

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setNotifications(prev => [{ ...notif, id: Date.now(), is_read: 0, created_at: new Date().toISOString() }, ...prev.slice(0, 49)]);
      setUnreadCount(c => c + 1);
    };
    socket.on('notification', handler);
    socket.on('lead_assigned_to_me', handler);
    return () => { socket.off('notification', handler); socket.off('lead_assigned_to_me', handler); };
  }, [socket]);

  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest('/notifications');
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', 'PUT');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (e) {}
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
      >
        <Bell className="w-5 h-5 text-slate-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-slate-950/80 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h4 className="font-bold text-sm text-white">Notifications</h4>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-cyan-400 hover:text-cyan-300 transition">Mark all read</button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/40 transition cursor-pointer ${!n.is_read ? 'bg-cyan-500/5' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {ICON_MAP[n.type] || ICON_MAP.DEFAULT}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${n.is_read ? 'text-slate-300' : 'text-white'}`}>{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1 flex-shrink-0" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
