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

  return (
    <PushContext.Provider value={{ pushToken, requestPermissions, presentLocal }}>
      {children}
    </PushContext.Provider>
  );
};

export const usePush = () => useContext(PushContext);


