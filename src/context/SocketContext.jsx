import React, { createContext, useContext } from 'react';
const SocketContext = createContext({ socket: null, connected: false });
export function SocketProvider({ children }) {
  return <SocketContext.Provider value={{ socket: null, connected: false }}>{children}</SocketContext.Provider>;
}
export const useSocket = () => useContext(SocketContext);
