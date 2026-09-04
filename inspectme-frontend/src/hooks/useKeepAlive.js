import { useEffect } from 'react';
import { apiClient } from '../services/apiClient';

/**
 * A custom hook to ping the backend server at a regular interval to prevent it from sleeping (e.g., on Render).
 * Pings the /api/health endpoint every 10 minutes by default.
 */
export default function useKeepAlive(intervalMs = 10 * 60 * 1000) {
  useEffect(() => {
    let isMounted = true;

    const pingServer = async () => {
      try {
        await apiClient.get('/health');
      } catch (error) {
        // Silently ignore network errors to prevent console spam
      }
    };

    // Immediate ping on mount
    pingServer();

    // Set up the interval for subsequent pings
    const intervalId = setInterval(() => {
      if (isMounted) pingServer();
    }, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [intervalMs]);
}
