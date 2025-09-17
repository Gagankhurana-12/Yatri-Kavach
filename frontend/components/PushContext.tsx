import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { SERVER_URL } from '@/constants/config';
import { Platform } from 'react-native';

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
  }),
});

export const PushProvider = ({ children }: { children: React.ReactNode }) => {
  const [pushToken, setPushToken] = useState<string | null>(null);

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


