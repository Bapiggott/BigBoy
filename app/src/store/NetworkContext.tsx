import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkContextValue {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  connectionType: string | null;
  checkConnection: () => Promise<boolean>;
  setOfflineOverride: (offline: boolean | null) => void;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [offlineOverride, setOfflineOverride] = useState<boolean | null>(null);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);
    });

    // Check initial state
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable);
      setConnectionType(state.type);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected ?? true);
    setIsInternetReachable(state.isInternetReachable);
    setConnectionType(state.type);
    return state.isConnected ?? false;
  }, []);

  // isOffline is true if override is set, or we know we're disconnected or internet is not reachable
  const isOffline = offlineOverride !== null 
    ? offlineOverride 
    : (!isConnected || isInternetReachable === false);

  return (
    <NetworkContext.Provider value={{
      isConnected,
      isInternetReachable,
      isOffline,
      connectionType,
      checkConnection,
      setOfflineOverride,
    }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
