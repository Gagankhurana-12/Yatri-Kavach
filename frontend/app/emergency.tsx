import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Animated,
  ScrollView,
  Pressable,
  Dimensions,
  Linking,
} from "react-native";
import {
  Phone,
  Shield,
  AlertTriangle,
  X,
  Heart,
  Car,
  Zap,
  Mountain,
  HelpCircle,
  FileText,
  MapPin,
  CheckCircle,
} from "lucide-react-native";
import { useTheme } from "../components/ThemeContext";
import { useMessaging } from "../components/MessagingContext";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

interface EmergencyProps {
  onNavigateToMessages?: () => void;
}

export default function Emergency({ onNavigateToMessages }: EmergencyProps = {}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { sendSOSMessages } = useMessaging();
  const [showOverlay, setShowOverlay] = useState(false);
  const [escalate, setEscalate] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const timerRef = useRef<number | null>(null);
  const sosTimerRef = useRef<number | null>(null);

  // Handle long press for SOS
  const handleSOSLongPress = () => {
    setSosCountdown(3);
    let i = 3;
    sosTimerRef.current = setInterval(() => {
      i = i - 1;
      setSosCountdown(i);
      if (i === 0) {
        clearInterval(sosTimerRef.current!);
        setSosCountdown(null);
        setShowOverlay(true);
        setEscalate(true);
        setCountdown(10);
        // Start escalation countdown
        let j = 10;
        timerRef.current = setInterval(() => {
          j = j - 1;
          setCountdown(j);
          if (j === 0) {
            clearInterval(timerRef.current!);
            // Auto-send emergency messages to all channels
            sendEmergencyMessages();
          }
        }, 1000) as unknown as number;
      }
    }, 1000) as unknown as number;
  };

  const handleSOSRelease = () => {
    if (!showOverlay && sosTimerRef.current) {
      clearInterval(sosTimerRef.current);
      setSosCountdown(null);
    }
  };

  // Function to send emergency messages to all channels
  const sendEmergencyMessages = async () => {
    try {
      // Send SOS messages to all chat channels
      sendSOSMessages();
      
      // Close the escalation overlay
      setShowOverlay(false);
      setEscalate(false);
      
      // Show tracking modal
      setShowTrackingModal(true);
      
      // Auto-close tracking modal and navigate to messages
      setTimeout(() => {
        setShowTrackingModal(false);
        // Navigate to messages tab to show the sent emergency messages
        if (onNavigateToMessages) {
          onNavigateToMessages();
        }
      }, 3000);
      
    } catch (error) {
      console.error("Failed to send emergency messages:", error);
    }
  };

  // Final escalation overlay
  const EscalationOverlay = () => (
    <Modal visible={showOverlay} animationType="fade" transparent>
      <ScrollView contentContainerStyle={styles.overlayContainer}>
        <View style={styles.finalContainer}>
          <Text style={styles.finalTitle}>Are you safe?</Text>
          <Text style={styles.finalCountdown}>{countdown}</Text>
          <Text style={styles.finalSubtitle}>{countdown} seconds until escalation</Text>
          <TouchableOpacity
            style={styles.safeButton}
            onPress={() => {
              setShowOverlay(false);
              setEscalate(false);
              if (timerRef.current) clearInterval(timerRef.current);
              setCountdown(10);
            }}
          >
            <Text style={styles.safeButtonText}>✔ I'm Safe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => {
              // Trigger immediate SOS action
              if (timerRef.current) clearInterval(timerRef.current);
              sendEmergencyMessages();
            }}
          >
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDark ? "#181c20" : "#fff" }]}>
      <Text style={[styles.title, { color: isDark ? "#fff" : "#181c20" }]} numberOfLines={1}>Emergency</Text>
      <Text style={[styles.subtitle, { color: isDark ? "#ccc" : "#555" }]}>
        Press and hold SOS for emergency
      </Text>
      <Pressable
        onPressIn={handleSOSLongPress}
        onPressOut={handleSOSRelease}
        style={styles.sosCircle}
      >
        <AlertTriangle size={56} color="#fff" />
        <Text style={styles.sosText}>SOS</Text>
        {/* Animated 3-2-1 countdown */}
        {sosCountdown !== null && sosCountdown > 0 && (
          <View style={styles.countdownOverlay}>
            <Text style={styles.countdownText}>{sosCountdown}</Text>
          </View>
        )}
      </Pressable>
      <Text style={[styles.sosHoldText, { color: isDark ? "#ccc" : "#555" }]}>
        Press and hold for 3 seconds to trigger emergency alert
      </Text>
      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>Emergency Types</Text>
      <View style={styles.typeRow}>
        <View style={[styles.typeCard, { backgroundColor: isDark ? "#23272f" : "#fff6f6" }]}>
          <Heart size={24} color="#e53935" />
          <Text style={[styles.typeText, { color: isDark ? "#fff" : "#181c20" }]} numberOfLines={1}>Medical</Text>
        </View>
        <View style={[styles.typeCard, { backgroundColor: isDark ? "#23272f" : "#f6f8ff" }]}>
          <Car size={24} color="#f59e42" />
          <Text style={[styles.typeText, { color: isDark ? "#fff" : "#181c20" }]} numberOfLines={1}>Accident</Text>
        </View>
        <View style={[styles.typeCard, { backgroundColor: isDark ? "#23272f" : "#f6fff6" }]}>
          <Shield size={24} color="#2563eb" />
          <Text style={[styles.typeText, { color: isDark ? "#fff" : "#181c20" }]} numberOfLines={2}>Theft/Crime</Text>
        </View>
      </View>
      <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>Emergency Contacts</Text>
      <View style={[styles.contactCard, { backgroundColor: isDark ? "#23272f" : "#fff" }]}>
        <TouchableOpacity
          onPress={() => Linking.openURL("tel:+15550123")}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}
          activeOpacity={0.7}
        >
          <Phone size={20} color="#2563eb" />
          <Text style={{ marginLeft: 8, color: isDark ? "#fff" : "#181c20", fontWeight: "bold" }}>Mom</Text>
        </TouchableOpacity>
        <Text style={{ color: "#aaa", marginBottom: 6 }}>Mother • +1-555-0123</Text>

        <TouchableOpacity
          onPress={() => Linking.openURL("tel:100")}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}
          activeOpacity={0.7}
        >
          <Phone size={20} color="#2563eb" />
          <Text style={{ marginLeft: 8, color: isDark ? "#fff" : "#181c20", fontWeight: "bold" }}>Police</Text>
        </TouchableOpacity>
        <Text style={{ color: "#aaa", marginBottom: 6 }}>100</Text>

        <TouchableOpacity
          onPress={() => Linking.openURL("tel:102")}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}
          activeOpacity={0.7}
        >
          <Phone size={20} color="#2563eb" />
          <Text style={{ marginLeft: 8, color: isDark ? "#fff" : "#181c20", fontWeight: "bold" }}>Ambulance</Text>
        </TouchableOpacity>
        <Text style={{ color: "#aaa", marginBottom: 6 }}>102</Text>

        <TouchableOpacity
          onPress={() => Linking.openURL("tel:101")}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}
          activeOpacity={0.7}
        >
          <Phone size={20} color="#2563eb" />
          <Text style={{ marginLeft: 8, color: isDark ? "#fff" : "#181c20", fontWeight: "bold" }}>Fire</Text>
        </TouchableOpacity>
        <Text style={{ color: "#aaa" }}>101</Text>
      </View>
      
      {/* E-FIR Button */}
      <TouchableOpacity 
        style={[styles.efirButton, { backgroundColor: isDark ? "#2563eb" : "#3b82f6" }]}
        onPress={() => {
          router.push("./efir");
        }}
        activeOpacity={0.8}
      >
        <View style={styles.efirButtonContent}>
          <View style={styles.efirIconContainer}>
            <FileText size={24} color="#fff" />
          </View>
          <View style={styles.efirTextContainer}>
            <Text style={styles.efirTitle}>Electronic FIR System</Text>
            <Text style={styles.efirSubtitle}>File incident report digitally</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {showOverlay && <EscalationOverlay />}
      
      {/* Tracking Modal */}
      <Modal
        visible={showTrackingModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTrackingModal(false)}
      >
        <View style={styles.trackingOverlay}>
          <View style={[styles.trackingContainer, { backgroundColor: isDark ? "#1a1a1a" : "#ffffff" }]}>
            <View style={styles.trackingHeader}>
              <MapPin size={32} color="#22c55e" />
              <Text style={[styles.trackingTitle, { color: isDark ? "#fff" : "#181c20" }]}>Emergency Alert Sent!</Text>
            </View>
            
            <View style={styles.trackingContent}>
              <Text style={[styles.trackingMessage, { color: isDark ? "#ccc" : "#555" }]}>
                🚨 Your location is being tracked
              </Text>
              <Text style={[styles.trackingMessage, { color: isDark ? "#ccc" : "#555" }]}>
                🚑 Help is coming to you
              </Text>
              <Text style={[styles.trackingMessage, { color: isDark ? "#ccc" : "#555" }]}>
                📱 Emergency messages sent to all contacts
              </Text>
            </View>
            
            <View style={styles.trackingActions}>
              <CheckCircle size={20} color="#22c55e" />
              <Text style={[styles.trackingStatus, { color: "#22c55e" }]}>Stay Safe - Help is on the way!</Text>
            </View>
            
            <TouchableOpacity
              style={styles.trackingCloseButton}
              onPress={() => setShowTrackingModal(false)}
            >
              <Text style={styles.trackingCloseText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, alignItems: "stretch" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 12, textAlign: "center", letterSpacing: 0.5 },
  subtitle: { fontSize: 15, marginBottom: 24, textAlign: "center", opacity: 0.8, lineHeight: 20 },
  sosCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#e53935",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 16,
    elevation: 12,
    shadowColor: "#e53935",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  sosText: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 6, letterSpacing: 1 },
  sosHoldText: { textAlign: "center", fontSize: 12, marginBottom: 20, opacity: 0.7, lineHeight: 16 },
  countdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  countdownText: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "bold",
  },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 20, marginBottom: 14, textAlign: "left", letterSpacing: 0.3 },
  typeRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, gap: 10 },
  typeCard: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    elevation: 3,
    minHeight: 95,
    justifyContent: "center",
    marginHorizontal: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typeText: { 
    marginTop: 10, 
    fontWeight: "600", 
    fontSize: 11,
    textAlign: "center",
    lineHeight: 13,
    letterSpacing: 0.2,
  },
  contactCard: {
    marginTop: 10,
    padding: 18,
    borderRadius: 18,
    elevation: 3,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  // Final escalation overlay styles
  overlayContainer: {
    flexGrow: 1,
    backgroundColor: "#e53935",
    width: width,
    minHeight: height,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  finalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: width,
    minHeight: height,
    padding: 20,
  },
  finalTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  finalCountdown: {
    color: "#fff",
    fontSize: 80,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  finalSubtitle: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 32,
    textAlign: "center",
  },
  safeButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
  },
  safeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
  },
  sosButton: {
    backgroundColor: "#f87171",
    paddingVertical: 16,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  sosButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 20,
    letterSpacing: 2,
  },
  // E-FIR Button Styles
  efirButton: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  efirButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  efirIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  efirTextContainer: {
    flex: 1,
  },
  efirTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  efirSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  // Tracking Modal Styles
  trackingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  trackingContainer: {
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  trackingHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  trackingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 8,
    textAlign: "center",
  },
  trackingContent: {
    marginBottom: 20,
    alignItems: "center",
  },
  trackingMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  trackingActions: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  trackingStatus: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  trackingCloseButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  trackingCloseText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});