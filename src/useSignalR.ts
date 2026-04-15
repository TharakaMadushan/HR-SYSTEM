import { useEffect, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

/**
 * Custom hook to manage a SignalR connection to the backend DashboardHub.
 * 
 * Usage:
 *   useSignalR(accessToken, {
 *     MetricsUpdated: () => refetchMetrics(),
 *     OrgStructureChanged: (level) => refetchOrg(),
 *   });
 */
export function useSignalR(
  accessToken: string,
  handlers: Record<string, (...args: any[]) => void>,
  enabled: boolean = true
) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const connect = useCallback(async () => {
    if (!enabled || !accessToken) return;

    // Build connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5168/hubs/dashboard', {
        accessTokenFactory: () => accessToken,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // retry intervals
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Register all event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      connection.on(event, handler);
    });

    // Connection lifecycle logging
    connection.onreconnecting(() => {
      console.log('[SignalR] Reconnecting...');
    });

    connection.onreconnected(() => {
      console.log('[SignalR] Reconnected ✓');
    });

    connection.onclose(() => {
      console.log('[SignalR] Connection closed');
    });

    try {
      await connection.start();
      console.log('[SignalR] Connected to DashboardHub ✓');
      connectionRef.current = connection;
    } catch (err) {
      console.warn('[SignalR] Connection failed — will retry automatically', err);
    }
  }, [accessToken, enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
  }, [connect]);

  return connectionRef;
}
