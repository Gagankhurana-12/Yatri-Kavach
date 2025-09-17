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
  updateEmergencyMessage: (id: string, updates: Partial<Message>) => void;
  updateFamilyMessage: (id: string, updates: Partial<Message>) => void;
  updateNearbyMessage: (id: string, updates: Partial<Message>) => void;
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

const INITIAL_FAMILY_MESSAGES: Message[] = [
  {
    id: "fam_1",
    sender: "Mom",
    content: "Hi beta, share your live location if you need anything.",
    timestamp: "20:55",
    type: "system",
  },
  {
    id: "fam_2",
    sender: "Brother",
    content: "I'm online. Ping me here anytime.",
    timestamp: "20:56",
    type: "system",
  },
];

export const MessagingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [emergencyMessages, setEmergencyMessages] = useState<Message[]>(INITIAL_EMERGENCY_MESSAGES);
  const [familyMessages, setFamilyMessages] = useState<Message[]>(INITIAL_FAMILY_MESSAGES);
  const [nearbyMessages, setNearbyMessages] = useState<Message[]>([]);

  const addEmergencyMessage = (message: Message) => {
    setEmergencyMessages(prev => [...prev, message]);
  };

  const addFamilyMessage = (message: Message) => {
    setFamilyMessages(prev => [...prev, message]);

    // Simulate auto-joining/replies from family members for non-system user messages only
    if (message.sender === "You" && message.type !== "system") {
      const makeTimestamp = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

      const isDanger = message.type === 'danger_alert' || /need\s*help|emergency|sos/i.test(message.content);
      const isSafe = /i'?m\s*safe|i am safe|all good|safe now/i.test(message.content);
      const isLocationShare = /live location|coordinates|📍/i.test(message.content);

      if (isDanger) {
        // Urgent responses for "I Need Help"
        setTimeout(() => {
          setFamilyMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}_mom_danger`,
              sender: "Mom",
              content: "I'm here. Stay calm — I'm calling you now and alerting neighbors.",
              timestamp: makeTimestamp(),
              type: "system",
            },
          ]);
        }, 1000);
        setTimeout(() => {
          setFamilyMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}_bro_danger`,
              sender: "Brother",
              content: "I'm on my way. Sharing my live location. Keep your phone on.",
              timestamp: makeTimestamp(),
              type: "help_response",
            },
          ]);
        }, 1600);
      } else if (isLocationShare) {
        // Acknowledge shared location
        setTimeout(() => {
          setFamilyMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}_mom_loc`,
              sender: "Mom",
              content: "Got your location. Keeping an eye on you.",
              timestamp: makeTimestamp(),
              type: "system",
            },
          ]);
        }, 1000);
        setTimeout(() => {
          setFamilyMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}_bro_loc`,
              sender: "Brother",
              content: "Location received. I'm close by — texting you updates.",
              timestamp: makeTimestamp(),
              type: "help_response",
            },
          ]);
        }, 1600);
      } else if (isSafe) {
        // Relief responses for "I'm Safe"
        setTimeout(() => {
          setFamilyMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}_mom_safe`,
              sender: "Mom",
              content: "Thank God! Stay where you are — call me.",
              timestamp: makeTimestamp(),
              type: "system",
            },
          ]);
        }, 1000);
        setTimeout(() => {
          setFamilyMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}_bro_safe`,
              sender: "Brother",
              content: "Glad you're safe. Message if you need anything.",
              timestamp: makeTimestamp(),
              type: "system",
            },
          ]);
        }, 1400);
      } else {
        // Generic text fallback
        setTimeout(() => {
          setFamilyMessages(prev => [
            ...prev,
            {
              id: `${Date.now()}_mom_generic`,
              sender: "Mom",
              content: "I'm here. Stay calm, I'm calling you now.",
              timestamp: makeTimestamp(),
              type: "system",
            },
          ]);
        }, 900);
      }
    }
  };

  const addNearbyMessage = (message: Message) => {
    setNearbyMessages(prev => [...prev, message]);
  };

  const updateEmergencyMessage = (id: string, updates: Partial<Message>) => {
    setEmergencyMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const updateFamilyMessage = (id: string, updates: Partial<Message>) => {
    setFamilyMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const updateNearbyMessage = (id: string, updates: Partial<Message>) => {
    setNearbyMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
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
        updateEmergencyMessage,
        updateFamilyMessage,
        updateNearbyMessage,
        sendSOSMessages,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
};
