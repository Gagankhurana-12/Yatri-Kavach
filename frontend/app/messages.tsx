import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import {
  AlertTriangle,
  Users,
  MapPin,
  Send,
  Shield,
  CheckCircle,
} from "lucide-react-native";
import { useTheme } from "../components/ThemeContext";
import { useAuth } from "../components/AuthContext";
import { useMessaging } from "../components/MessagingContext";
import * as Location from "expo-location";

type Message = {
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

type NearbyPerson = {
  id: string;
  name: string;
  distance: string;
  status: string;
  avatar: string;
};

type ChatTab = "emergency" | "family" | "nearby";


const MOCK_NEARBY_PEOPLE = [
  { id: "1", name: "Sarah Chen", distance: "0.2 km", status: "online", avatar: "👩" },
  { id: "2", name: "Mike Rodriguez", distance: "0.5 km", status: "online", avatar: "👨" },
  { id: "3", name: "Priya Sharma", distance: "0.8 km", status: "online", avatar: "👩" },
  { id: "4", name: "David Kim", distance: "1.2 km", status: "online", avatar: "👨" },
];

const DANGER_ALERTS: Message[] = [
  {
    id: "danger_1",
    sender: "Tourist in Distress",
    userName: "Emma Watson",
    content: "🚨 EMERGENCY: I'm lost and feeling unsafe near the market area. Please help!",
    location: "Chandni Chowk Market, Delhi",
    distance: "0.3 km from you",
    timestamp: "21:02",
    type: "danger_alert" as const,
    isActive: true,
  },
];

export default function Messages() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { 
    emergencyMessages, 
    familyMessages, 
    nearbyMessages, 
    addEmergencyMessage, 
    addFamilyMessage, 
    addNearbyMessage 
  } = useMessaging();
  const isDark = theme === "dark";
  const [activeTab, setActiveTab] = useState<ChatTab>("emergency");
  const [inputText, setInputText] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [nearbyPeople, setNearbyPeople] = useState<NearbyPerson[]>(MOCK_NEARBY_PEOPLE);
  const [dangerAlerts, setDangerAlerts] = useState<Message[]>(DANGER_ALERTS);
  const [isInDanger, setIsInDanger] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const backgroundColor = isDark ? "#0f0f0f" : "#ffffff";
  const cardColor = isDark ? "#1a1a1a" : "#f8f9fa";
  const textColor = isDark ? "#ffffff" : "#1f2937";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const inputBg = isDark ? "#262626" : "#f3f4f6";
  const borderColor = isDark ? "#374151" : "#e5e7eb";
  const emergencyColor = "#dc2626";
  const safeColor = "#059669";
  const activeTabColor = isDark ? "#374151" : "#3b82f6";

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [emergencyMessages, familyMessages, nearbyMessages]);

  const sendMessage = () => {
    if (inputText.trim() === "") return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: user?.userName || "You",
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      type: "user",
    };

    // Add message to current tab only
    if (activeTab === "emergency") {
      addEmergencyMessage(newMessage);
    } else if (activeTab === "family") {
      addFamilyMessage(newMessage);
    } else if (activeTab === "nearby") {
      addNearbyMessage(newMessage);
    }
    
    setInputText("");
  };

  // Remove automatic emergency responses - they will only come when needed

  const shareLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required to share your location.");
        return;
      }

      // Show loading state
      const loadingMessage: Message = {
        id: Date.now().toString(),
        sender: user?.userName || "You",
        content: "📍 Sharing my live location...",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        type: "system",
      };
      
      // Add loading message to current tab only
      if (activeTab === "emergency") {
        addEmergencyMessage(loadingMessage);
      } else if (activeTab === "family") {
        addFamilyMessage(loadingMessage);
      } else if (activeTab === "nearby") {
        addNearbyMessage(loadingMessage);
      }

      // Get current location with high accuracy
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const locationMessage: Message = {
        id: Date.now().toString(),
        sender: user?.userName || "You",
        content: `📍 Live Location Shared\n📌 Coordinates: ${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}\n🎯 Accuracy: ±${Math.round(location.coords.accuracy || 0)}m\n🕐 Updated: ${new Date().toLocaleTimeString()}`,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        type: "user",
        location: `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`,
      };

      // Add location message to current tab only (loading message will be replaced by context)
      if (activeTab === "emergency") {
        addEmergencyMessage(locationMessage);
      } else if (activeTab === "family") {
        addFamilyMessage(locationMessage);
      } else if (activeTab === "nearby") {
        addNearbyMessage(locationMessage);
      }

      // Show success feedback
      Alert.alert("Location Shared", "Your live location has been shared successfully!");
      
      // Add monitoring response after location is shared (only for Emergency and Family tabs)
      if (activeTab !== "nearby") {
        setTimeout(() => {
          const monitoringResponse: Message = {
            id: (Date.now() + 2).toString(),
            sender: "Emergency Services",
            content: "📍 Location received. We are now monitoring your position and will track your safety status.",
            timestamp: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            type: "emergency",
          };
          
          if (activeTab === "emergency") {
            addEmergencyMessage(monitoringResponse);
          } else if (activeTab === "family") {
            addFamilyMessage(monitoringResponse);
          }
        }, 1000);
      } else {
        // Nearby people responses when location is shared in Nearby tab
        setTimeout(() => {
          const locationResponse1: Message = {
            id: (Date.now() + 6).toString(),
            sender: "David Kim",
            content: "📍 Got your location! I can see you're near the market. I'm heading there now.",
            timestamp: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            type: "help_response",
          };
          addNearbyMessage(locationResponse1);
        }, 1500);

        setTimeout(() => {
          const locationResponse2: Message = {
            id: (Date.now() + 7).toString(),
            sender: "Sarah Chen",
            content: "🔄 Location received! I'm sharing my live location too so you can track me coming to help.",
            timestamp: new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            type: "help_response",
          };
          addNearbyMessage(locationResponse2);
        }, 3000);
      }
      
    } catch (error) {
      // Error handling - the context will manage message state
      Alert.alert("Error", "Failed to get location. Please check your GPS and try again.");
    }
  };

  const sendSafeStatus = () => {
    const safeMessage: Message = {
      id: Date.now().toString(),
      sender: user?.userName || "You",
      content: "✅ I'm safe and secure at my current location.",
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      type: "user",
    };
    
    // Add safe message to current tab only
    if (activeTab === "emergency") {
      addEmergencyMessage(safeMessage);
    } else if (activeTab === "family") {
      addFamilyMessage(safeMessage);
    } else if (activeTab === "nearby") {
      addNearbyMessage(safeMessage);
    }
    setIsInDanger(false);
  };

  const broadcastDangerAlert = async () => {
    // Immediate feedback - set danger state first
    setIsInDanger(true);
    
    // Show immediate emergency message - no delay
    const dangerMessage: Message = {
      id: Date.now().toString(),
      sender: user?.userName || "You",
      userName: user?.userName || "Tourist in Distress",
      content: "🚨 EMERGENCY: I need immediate help! I'm in danger and require assistance.",
      location: "Getting location...",
      distance: "Broadcasting to nearby people",
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      type: "danger_alert",
      isActive: true,
    };
    
    // Add message immediately to current tab
    if (activeTab === "emergency") {
      addEmergencyMessage(dangerMessage);
      // Also add to nearby tab so nearby people can see the emergency
      addNearbyMessage(dangerMessage);
      
      // Emergency Services response for help request
      setTimeout(() => {
        const emergencyResponse: Message = {
          id: (Date.now() + 3).toString(),
          sender: "Emergency Services",
          content: "🚨 Emergency alert received! We are dispatching help to your location immediately. Stay calm and follow these steps:\n\n1. Stay where you are if safe\n2. Keep your phone charged\n3. Answer our call when we contact you\n4. Help is on the way!",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          type: "emergency",
        };
        addEmergencyMessage(emergencyResponse);
      }, 2000);

      // Nearby people responses
      setTimeout(() => {
        const nearbyResponse1: Message = {
          id: (Date.now() + 4).toString(),
          sender: "Sarah Chen",
          content: "🤝 I'm nearby and coming to help! I'll be there in 2 minutes. Stay safe!",
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
          id: (Date.now() + 5).toString(),
          sender: "Mike Rodriguez",
          content: "🚨 I see your alert! I'm 0.5km away and heading your way. Hold on!",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          type: "help_response",
        };
        addNearbyMessage(nearbyResponse2);
      }, 5000);
      
    } else if (activeTab === "family") {
      addFamilyMessage(dangerMessage);
    } else if (activeTab === "nearby") {
      addNearbyMessage(dangerMessage);
      
      // Nearby people responses when help is requested directly in Nearby tab
      setTimeout(() => {
        const nearbyResponse1: Message = {
          id: (Date.now() + 4).toString(),
          sender: "Sarah Chen",
          content: "🏃‍♀️ I'm on my way! Just saw your emergency alert. Stay where you are!",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          type: "help_response",
        };
        addNearbyMessage(nearbyResponse1);
      }, 2500);

      setTimeout(() => {
        const nearbyResponse2: Message = {
          id: (Date.now() + 5).toString(),
          sender: "Priya Sharma",
          content: "🚑 Emergency alert received! I'm calling local authorities and coming to help. Hold tight!",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          type: "help_response",
        };
        addNearbyMessage(nearbyResponse2);
      }, 4000);
    }
    
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required to send danger alerts.");
        setIsInDanger(false);
        return;
      }

      // Get location in background and update the message
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Update the message with actual location
      const updatedMessage: Message = {
        ...dangerMessage,
        id: (Date.now() + 1).toString(),
        location: `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`,
        content: "🚨 EMERGENCY: I need immediate help! I'm in danger and require assistance.",
      };
      
      // Add updated message with location (context will handle the update)
      if (activeTab === "emergency") {
        addEmergencyMessage(updatedMessage);
        addNearbyMessage(updatedMessage);
      } else if (activeTab === "family") {
        addFamilyMessage(updatedMessage);
      } else if (activeTab === "nearby") {
        addNearbyMessage(updatedMessage);
      }
      
    } catch (error) {
      Alert.alert("Error", "Failed to get location. Please try again.");
      setIsInDanger(false);
    }
  };

  const respondToHelp = (alertId: string) => {
    const responseMessage: Message = {
      id: Date.now().toString(),
      sender: user?.userName || "You",
      content: "🤝 I'm on my way to help! Sharing my live location with you.",
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      type: "help_response",
    };
    
    // Add help response to nearby tab only
    addNearbyMessage(responseMessage);
  };

  const renderMessage = (message: Message) => {
    const isOwnMessage = message.sender === (user?.userName || "You");
    const isEmergency = message.type === "emergency";
    const isDangerAlert = message.type === "danger_alert";
    const isHelpResponse = message.type === "help_response";

    if (isDangerAlert && !isOwnMessage) {
      return (
        <View key={message.id} style={[styles.dangerAlertContainer, { borderColor: emergencyColor }]}>
          <View style={styles.dangerAlertHeader}>
            <Text style={[styles.dangerAlertTitle, { color: emergencyColor }]}>🚨 EMERGENCY ALERT</Text>
            <Text style={[styles.dangerAlertDistance, { color: textSecondary }]}>{message.distance}</Text>
          </View>
          <Text style={[styles.dangerAlertUser, { color: textColor }]}>{message.userName}</Text>
          <Text style={[styles.dangerAlertContent, { color: textColor }]}>{message.content}</Text>
          {message.location && (
            <Text style={[styles.dangerAlertLocation, { color: textSecondary }]}>📍 {message.location}</Text>
          )}
          <View style={styles.dangerAlertActions}>
            <TouchableOpacity 
              style={[styles.helpButton, { backgroundColor: safeColor }]}
              onPress={() => respondToHelp(message.id)}
            >
              <Text style={styles.helpButtonText}>🤝 I'll Help</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.shareLocationButton, { backgroundColor: "#3b82f6" }]}
              onPress={shareLocation}
            >
              <Text style={styles.helpButtonText}>📍 Share Location</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.timestamp, { color: textSecondary, textAlign: "center" }]}>
            {message.timestamp}
          </Text>
        </View>
      );
    }

    return (
      <View key={message.id} style={styles.messageContainer}>
        {!isOwnMessage && (
          <Text style={[styles.senderName, { color: textSecondary }]}>
            {message.sender}
          </Text>
        )}
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isEmergency
                ? emergencyColor
                : isDangerAlert
                ? "#fbbf24"
                : isHelpResponse
                ? safeColor
                : isOwnMessage
                ? (isDark ? "#374151" : "#3b82f6")
                : (isDark ? "#262626" : "#f3f4f6"),
              alignSelf: isOwnMessage ? "flex-end" : "flex-start",
              maxWidth: "80%",
              borderColor: isOwnMessage ? "transparent" : borderColor,
            },
          ]}
        >
          <Text style={[styles.messageText, { 
            color: (isEmergency || isDangerAlert || isHelpResponse || (isOwnMessage && !isDark)) ? "#ffffff" : textColor 
          }]}>
            {message.content}
          </Text>
        </View>
        <Text
          style={[
            styles.timestamp,
            { color: textSecondary, textAlign: isOwnMessage ? "right" : "left" },
          ]}
        >
          {message.timestamp}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>
          Emergency Chat
        </Text>
      </View>

      {/* Chat Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            {
              backgroundColor: activeTab === "emergency" ? emergencyColor : cardColor,
              borderColor: activeTab === "emergency" ? emergencyColor : borderColor,
            },
          ]}
          onPress={() => setActiveTab("emergency")}
        >
          <AlertTriangle size={16} color={activeTab === "emergency" ? "#ffffff" : textColor} />
          <Text style={[styles.tabText, { color: activeTab === "emergency" ? "#ffffff" : textColor }]} numberOfLines={1}>Emergency</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            {
              backgroundColor: activeTab === "family" ? activeTabColor : cardColor,
              borderColor: activeTab === "family" ? activeTabColor : borderColor,
            },
          ]}
          onPress={() => setActiveTab("family")}
        >
          <Users size={16} color={activeTab === "family" ? "#ffffff" : textColor} />
          <Text style={[styles.tabText, { color: activeTab === "family" ? "#ffffff" : textColor }]} numberOfLines={1}>Family</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            {
              backgroundColor: activeTab === "nearby" ? activeTabColor : cardColor,
              borderColor: activeTab === "nearby" ? activeTabColor : borderColor,
            },
          ]}
          onPress={() => setActiveTab("nearby")}
        >
          <MapPin size={16} color={activeTab === "nearby" ? "#ffffff" : textColor} />
          <Text style={[styles.tabText, { color: activeTab === "nearby" ? "#ffffff" : textColor }]} numberOfLines={1}>Nearby</Text>
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={[styles.connectionStatus, { backgroundColor: cardColor, borderBottomColor: borderColor }]}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? safeColor : emergencyColor }]} />
        <Text style={[styles.statusText, { color: textSecondary }]}>
          {isConnected ? "Connected • Real-time updates" : "Disconnected"}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "emergency" && (
          <View>
            <View style={{ marginBottom: 10 }}>
              <Text style={[styles.sectionTitle, { color: textSecondary }]}>
                Emergency Services
              </Text>
            </View>
            {emergencyMessages.map(renderMessage)}
          </View>
        )}
        {activeTab === "family" && (
          <View>
            {familyMessages.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Users size={48} color={textSecondary} />
                <Text style={[styles.sectionTitle, { color: textSecondary, textAlign: "center", marginTop: 10 }]}>
                  No family members online
                </Text>
              </View>
            ) : (
              familyMessages.map(renderMessage)
            )}
          </View>
        )}
        {activeTab === "nearby" && (
          <View>
            <Text style={[styles.sectionTitle, { color: textSecondary }]}>
              Nearby People ({nearbyPeople.length} online)
            </Text>
            {nearbyPeople.map((person) => (
              <View key={person.id} style={[styles.nearbyPersonCard, { backgroundColor: cardColor, borderColor: borderColor }]}>
                <Text style={styles.personAvatar}>{person.avatar}</Text>
                <View style={styles.personInfo}>
                  <Text style={[styles.personName, { color: textColor }]}>{person.name}</Text>
                  <Text style={[styles.personDistance, { color: textSecondary }]}>{person.distance} away</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: safeColor }]} />
              </View>
            ))}
            {dangerAlerts.map(renderMessage)}
            {nearbyMessages.map(renderMessage)}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { 
              backgroundColor: isInDanger ? emergencyColor : (isDark ? "#374151" : "#6b7280"),
              borderColor: borderColor
            }
          ]}
          onPress={isInDanger ? shareLocation : broadcastDangerAlert}
          activeOpacity={0.6}
          disabled={false}
        >
          <MapPin size={16} color="#ffffff" />
          <Text style={[styles.actionButtonText, { color: "#ffffff" }]}>
            {isInDanger ? "Share Live Location" : "🚨 I Need Help"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton, 
            { 
              backgroundColor: safeColor,
              borderColor: safeColor
            }
          ]}
          onPress={sendSafeStatus}
        >
          <CheckCircle size={16} color="#ffffff" />
          <Text style={[styles.actionButtonText, { color: "#ffffff" }]}>
            I'm Safe
          </Text>
        </TouchableOpacity>
      </View>

      {/* Message Input */}
      <View style={[styles.inputContainer, { backgroundColor: cardColor, borderTopColor: borderColor }]}>
        <TextInput
          style={[
            styles.textInput, 
            { 
              backgroundColor: inputBg, 
              color: textColor,
              borderColor: borderColor
            }
          ]}
          placeholder="Type a message..."
          placeholderTextColor={textSecondary}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { 
              backgroundColor: inputText.trim() ? "#3b82f6" : (isDark ? "#374151" : "#d1d5db"),
              opacity: inputText.trim() ? 1 : 0.6
            },
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Send size={18} color={inputText.trim() ? "#ffffff" : textSecondary} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: 36,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 10,
  },
  messageContainer: {
    marginVertical: 4,
  },
  senderName: {
    fontSize: 12,
    marginBottom: 4,
    marginLeft: 8,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    fontSize: 14,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Danger Alert Styles
  dangerAlertContainer: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderLeftWidth: 6,
  },
  dangerAlertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  dangerAlertTitle: {
    fontSize: 14,
    fontWeight: "bold",
  },
  dangerAlertDistance: {
    fontSize: 12,
    fontWeight: "500",
  },
  dangerAlertUser: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  dangerAlertContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  dangerAlertLocation: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: "italic",
  },
  dangerAlertActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  helpButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  shareLocationButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  helpButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Nearby People Styles
  nearbyPersonCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  personAvatar: {
    fontSize: 24,
    marginRight: 12,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 14,
    fontWeight: "600",
  },
  personDistance: {
    fontSize: 12,
    marginTop: 2,
  },
});
