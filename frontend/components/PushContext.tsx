import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { SERVER_URL } from '@/constants/config';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useLocationContext } from './LocationContext';
import { useMessaging } from './MessagingContext';
import { io, Socket } from 'socket.io-client';

type PushContextType = {
  pushToken: string | null;
  requestPermissions: () => Promise<void>;
  presentLocal: (title: string, body: string) => Promise<void>;
};

const PushContext = createContext<PushContextType>({
  pushToken: null,
  requestPermissions: async () => {},
  presentLocal: async () => {},
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // iOS specific newer fields for type safety
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const PushProvider = ({ children }: { children: React.ReactNode }) => {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const { coords, setCoords } = useLocationContext();
  const { addNearbyMessage } = useMessaging();
  const [socket, setSocket] = useState<Socket | null>(null);

  const requestPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    setPushToken(tokenData.data);
    // Attempt initial registration with server (without location yet)
    try {
      await fetch(`${SERVER_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenData.data }),
      });
    } catch {}

    // Best-effort: capture a one-time precise location and send to server so this device
    // becomes eligible for nearby SOS broadcasts even if user hasn't opened the map screen.
    try {
      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus === 'granted') {
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = current.coords.latitude;
        const lng = current.coords.longitude;
        // Update local context too so other parts of app know we have a location
        setCoords({ latitude: lat, longitude: lng, accuracy: current.coords.accuracy ?? 0, timestamp: Date.now() });
        await fetch(`${SERVER_URL}/updateLocation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenData.data, lat, lng }),
        }).catch(() => {});
      }
    } catch {}
  };

  useEffect(() => {
    requestPermissions();

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }, []);

  // Listen for incoming push notifications and reflect SOS in Nearby chat UI
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      try {
        const data: any = notification.request?.content?.data ?? {};
        if (data?.type === 'sos') {
          const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          addNearbyMessage({
            id: `${Date.now()}_sos_rx`,
            sender: 'Nearby SOS',
            userName: 'Citizen Alert',
            content: '🚨 Nearby SOS received! Someone close to you needs help. Tap for details.',
            timestamp: ts,
            type: 'danger_alert',
            location: data.lat && data.lng ? `Lat ${Number(data.lat).toFixed(4)}, Lng ${Number(data.lng).toFixed(4)}` : undefined,
            distance: 'Within alert radius',
            isActive: true,
          });
        }
      } catch {}
    });
    return () => {
      sub.remove();
    };
  }, [addNearbyMessage]);

  // Also handle when user taps a notification (background/terminated)
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      try {
        const data: any = response?.notification?.request?.content?.data ?? {};
        if (data?.type === 'sos') {
          const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
          addNearbyMessage({
            id: `${Date.now()}_sos_rx_tap`,
            sender: 'Nearby SOS',
            userName: 'Citizen Alert',
            content: '🚨 Nearby SOS alert opened. Someone close to you needs help.',
            timestamp: ts,
            type: 'danger_alert',
            location: data.lat && data.lng ? `Lat ${Number(data.lat).toFixed(4)}, Lng ${Number(data.lng).toFixed(4)}` : undefined,
            distance: 'Within alert radius',
            isActive: true,
          });
        }
      } catch {}
    });
    return () => {
      sub.remove();
    };
  }, [addNearbyMessage]);

  const presentLocal = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  };

  // Helper to compute distance in meters between two coords (Haversine)
  const distanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Connect to Socket.IO to receive real-time SOS broadcasts and show an immediate local notification
  useEffect(() => {
    // Avoid multiple connections
    if (socket) return;
    const s = io(SERVER_URL, { transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => {
      // console.log('Socket connected', s.id);
    });

    s.on('sos', (payload: { lat: number; lng: number; radius: number; title?: string; body?: string; ts?: number }) => {
      try {
        if (coords?.latitude && coords?.longitude && typeof payload?.lat === 'number' && typeof payload?.lng === 'number') {
          const d = distanceMeters(coords.latitude, coords.longitude, payload.lat, payload.lng);
          if (!payload?.radius || d <= payload.radius) {
            // Show a local notification immediately
            presentLocal(payload?.title || '🚨 Nearby SOS', payload?.body || 'Someone near you needs help.');
            // Reflect in Nearby chat UI
            const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            addNearbyMessage({
              id: `${Date.now()}_sos_socket`,
              sender: 'Nearby SOS',
              userName: 'Citizen Alert',
              content: '🚨 Nearby SOS received (real-time). Someone close to you needs help.',
              timestamp: ts,
              type: 'danger_alert',
              location: `Lat ${Number(payload.lat).toFixed(4)}, Lng ${Number(payload.lng).toFixed(4)}`,
              distance: `${Math.round(d)} m away`,
              isActive: true,
            });
          }
        }
      } catch {}
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
    // Only initialize once; listeners use latest coords from state when firing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // Periodically update location to keep this device eligible on the server side
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = async () => {
      try {
        const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus !== 'granted' || !pushToken) return;
        // Immediately send one update
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = current.coords.latitude;
        const lng = current.coords.longitude;
        setCoords({ latitude: lat, longitude: lng, accuracy: current.coords.accuracy ?? 0, timestamp: Date.now() });
        await fetch(`${SERVER_URL}/updateLocation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: pushToken, lat, lng }),
        }).catch(() => {});

        // Continue updating every 60 seconds
        timer = setInterval(async () => {
          try {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const lat2 = pos.coords.latitude;
            const lng2 = pos.coords.longitude;
            setCoords({ latitude: lat2, longitude: lng2, accuracy: pos.coords.accuracy ?? 0, timestamp: Date.now() });
            await fetch(`${SERVER_URL}/updateLocation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: pushToken, lat: lat2, lng: lng2 }),
            }).catch(() => {});
          } catch {}
        }, 60000);
      } catch {}
    };
    start();
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [pushToken, setCoords]);

  return (
    <PushContext.Provider value={{ pushToken, requestPermissions, presentLocal }}>
      {children}
    </PushContext.Provider>
  );
};

export const usePush = () => useContext(PushContext);


