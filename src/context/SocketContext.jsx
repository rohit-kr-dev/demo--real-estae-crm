import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const configuredBackendUrl = import.meta.env.VITE_SOCKET_URL?.trim().replace(/\/$/, '');
const BACKEND_URL = configuredBackendUrl || (import.meta.env.DEV ? 'http://localhost:5000' : '');

export function SocketProvider({ children, user }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    // The REST API can work without sockets, so avoid a perpetual reconnect loop
    // when a production deployment has not configured its Socket.IO endpoint.
    if (!BACKEND_URL) return undefined;

    const socket = io(BACKEND_URL, {
      auth: {
        companyId: user.company_id,
        userId: user.id,
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('🔌 Real-time connected');
    });
    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id]);

  const value = {
    socket: socketRef.current,
    connected,
    on: (event, handler) => socketRef.current?.on(event, handler),
    off: (event, handler) => socketRef.current?.off(event, handler),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
