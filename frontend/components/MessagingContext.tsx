import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Message = {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: "user" | "emergency" | "system" | "danger_alert" | "help_response";
  userName?: string;
  location?: string;
  distance?: string;
  isActive?: boolean;
};

type MessagingContextType = {
  emergencyMessages: Message[];
  familyMessages: Message[];
  nearbyMessages: Message[];
  addEmergencyMessage: (message: Message) => void;
  addFamilyMessage: (message: Message) => void;
  addNearbyMessage: (message: Message) => void;
  sendSOSMessages: () => void;
};

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};

const INITIAL_EMERGENCY_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "Emergency Services",
    content: "Emergency Services connected. How can we assist you today?",
    timestamp: "21:04",
    type: "emergency",
  },
];

export const MessagingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [emergencyMessages, setEmergencyMessages] = useState<Message[]>(INITIAL_EMERGENCY_MESSAGES);
  const [familyMessages, setFamilyMessages] = useState<Message[]>([]);
  const [nearbyMessages, setNearbyMessages] = useState<Message[]>([]);

  const addEmergencyMessage = (message: Message) => {
    setEmergencyMessages(prev => [...prev, message]);
  };

  const addFamilyMessage = (message: Message) => {
    setFamilyMessages(prev => [...prev, message]);
  };

  const addNearbyMessage = (message: Message) => {
    setNearbyMessages(prev => [...prev, message]);
  };

  const sendSOSMessages = () => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    // Emergency Services Message
    const emergencySOSMessage: Message = {
      id: Date.now().toString(),
      sender: "You",
      content: "🚨 EMERGENCY SOS ACTIVATED! I need immediate help! This is an automated emergency alert triggered by the SOS system.",
      timestamp,
      type: "danger_alert",
      isActive: true,
    };

    // Family Message
    const familySOSMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: "You",
      content: "🚨 FAMILY EMERGENCY ALERT: I have triggered an SOS emergency alert. My location is being tracked and I need immediate assistance. Please contact me or emergency services.",
      timestamp,
      type: "danger_alert",
      isActive: true,
    };

    // Nearby People Message
    const nearbySOSMessage: Message = {
      id: (Date.now() + 2).toString(),
      sender: "You",
      userName: "Tourist in Distress",
      content: "🚨 EMERGENCY: I have activated SOS and need immediate help! Please assist if you are nearby.",
      location: "Getting location...",
      distance: "Broadcasting to nearby people",
      timestamp,
      type: "danger_alert",
      isActive: true,
    };

    // Add messages to all channels
    addEmergencyMessage(emergencySOSMessage);
    addFamilyMessage(familySOSMessage);
    addNearbyMessage(nearbySOSMessage);

    // Add emergency services response after a delay
    setTimeout(() => {
      const emergencyResponse: Message = {
        id: (Date.now() + 10).toString(),
        sender: "Emergency Services",
        content: "🚨 SOS ALERT RECEIVED! Emergency units have been dispatched to your location. Stay calm and remain where you are. Help is on the way. We will contact you shortly.",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        type: "emergency",
      };
      addEmergencyMessage(emergencyResponse);
    }, 2000);

    // Add nearby people responses
    setTimeout(() => {
      const nearbyResponse1: Message = {
        id: (Date.now() + 11).toString(),
        sender: "Sarah Chen",
        content: "🏃‍♀️ I saw your SOS alert! I'm heading to your location now. Stay safe!",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        type: "help_response",
      };
      addNearbyMessage(nearbyResponse1);
    }, 3000);

    setTimeout(() => {
      const nearbyResponse2: Message = {
        id: (Date.now() + 12).toString(),
        sender: "Mike Rodriguez",
        content: "🚑 SOS received! I'm calling local authorities and coming to help. Hold on!",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        type: "help_response",
      };
      addNearbyMessage(nearbyResponse2);
    }, 5000);
  };

  return (
    <MessagingContext.Provider
      value={{
        emergencyMessages,
        familyMessages,
        nearbyMessages,
        addEmergencyMessage,
        addFamilyMessage,
        addNearbyMessage,
        sendSOSMessages,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};
