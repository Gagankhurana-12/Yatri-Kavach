import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
  BackHandler,
  StatusBar,
  Pressable,
  SafeAreaView,
  Image,
} from "react-native";
import {
  MapPin,
  Users,
  Home,
  MessageCircle,
  User,
  Phone,
  AlertCircle,
  Map,
  AlertTriangle,
  Bell,
  ShieldOff,
  CreditCard,
  MapPinOff,
} from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Profile from "./profile";
import FreeMap from "../components/FreeMap";
import * as Location from "expo-location";
import { useTheme } from "../components/ThemeContext";
import Emergency from "./emergency";
import Messages from "./messages";
import { useAuth } from "../components/AuthContext";
import { useRiskScore } from "../components/RiskScoreContext";
import { LinearGradient } from "expo-linear-gradient";
// Using existing FreeMap component for mini preview below

const ALERTS = [
  {
    id: 1,
    icon: <MapPin size={24} color="#ef4444" />,
    title: "Unusual Location Change Detected",
    time: "2 min ago",
    description:
      "Your device moved a significant distance in a short time while the app was active.",
    priority: "Critical",
    priorityColor: "#fca5a5",
  },
  {
    id: 2,
    icon: <MapPinOff size={24} color="#ef4444" />,
    title: "Unsafe Zone Entered",
    time: "15 min ago",
    description:
      "Your current area has a high risk rating. Leave the area or use emergency options.",
    priority: "Critical",
    priorityColor: "#fca5a5",
  },
  {
    id: 3,
    icon: <MapPinOff size={24} color="#2563eb" />,
    title: "Device Location Disabled",
    time: "1 hour ago",
    description:
      "Location services are disabled. This may limit the effectiveness of safety features.",
    priority: "Informational",
    priorityColor: "#93c5fd",
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { user } = useAuth();
  const { riskScore, getRiskColor, getRiskLevel } = useRiskScore();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("Fetching...");
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();
  const isDark = theme === "dark";

  // Simulated values for demo
  const emergencyContacts = 3;
  const nearbyTourists = 4;

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const onBackPress = () => {
      if (activeTab === "home") {
        BackHandler.exitApp();
        return true;
      }
      setActiveTab("home");
      return true;
    };
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );
    return () => subscription.remove();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "home" || activeTab === "map") {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocation(null);
          setAddress("Permission denied");
          return;
        }
        let loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        let geocode = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          setAddress(
            [place.name, place.city, place.region, place.country]
              .filter(Boolean)
              .join(", ")
          );
        } else {
          setAddress("Unknown location");
        }
      })();
    }
  }, [activeTab]);

  // Colors
  const backgroundColor = isDark ? "#181c20" : "#f7f8fa";
  const cardColor = isDark ? "#23272f" : "#fff";
  const cardShadow = isDark
    ? {}
    : {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
      };
  const textColor = isDark ? "#fff" : "#181c20";
  const textSecondary = isDark ? "#aaa" : "#555";
  const riskCircle = getRiskColor(riskScore);
  const navbarColor = isDark ? "#181c20" : "#fff";
  const navbarBorder = isDark ? "#222" : "#e5e7eb";
  const iconInactive = isDark ? "#888" : "#b0b0b0";
  const iconActive = "#2563eb";

  const actionBtnColors = [
    isDark ? "#2d2323" : "#fff6f6",
    isDark ? "#23282d" : "#f6f8ff",
    isDark ? "#232d23" : "#f6fff6",
  ];

  const now = new Date();
  const todayLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeLabel = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? "#181c20" : "#f7f8fa"}
        translucent={false}
      />
      {/* HOME TAB */}
      {activeTab === "home" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={isDark ? ["#0b1220", "#111827"] : ["#e6f0ff", "#ffffff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.headerGradient, { ...cardShadow }]}
          >
            <View style={styles.headerContent}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerGreeting, { color: isDark ? "#ffffff" : "#0f172a" }]}>Welcome to Yatri Kavach</Text>
                <Text style={[styles.headerSubtitle, { color: isDark ? "#cbd5e1" : "#334155" }]}>Stay safe. We’re watching your surroundings.</Text>
              </View>
              <TouchableOpacity
                style={styles.avatar}
                onPress={() => setActiveTab("profile")}
                activeOpacity={0.7}
              >
                <Image 
                  source={{ uri: "https://randomuser.me/api/portraits/men/75.jpg" }}
                  style={styles.avatarImage}
                />
              </TouchableOpacity>
            </View>

            {/* Risk quick view */}
            <TouchableOpacity
              onPress={() => router.push("./risk-monitoring")}
              activeOpacity={0.85}
              style={styles.riskQuickWrapper}
            >
              <View style={[styles.ringOuter, { borderColor: riskCircle }]}> 
                <View style={styles.ringInner}>
                  <Text style={[styles.ringScore, { color: riskCircle }]}>{riskScore}</Text>
                  <Text style={styles.ringLabel}>Risk</Text>
                </View>
              </View>
              <View style={styles.ringMeta}>
                <Text style={[styles.ringMetaTitle, { color: textColor }]}>Risk Score</Text>
                <Text style={[styles.ringMetaSub, { color: textSecondary }]}>{getRiskLevel(riskScore).toUpperCase()} RISK, tap for details</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>

          {/* Quick Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: actionBtnColors[0], ...cardShadow }]}
              onPress={() => setActiveTab("emergency")}
            >
              <AlertCircle size={28} color="#e53935" />
              <Text style={[styles.actionBtnText, { color: textColor }]} numberOfLines={1}>
                Emergency
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: actionBtnColors[1], ...cardShadow }]}
              onPress={() => setActiveTab("map")}
            >
              <Map size={28} color={iconActive} />
              <Text style={[styles.actionBtnText, { color: textColor }]} numberOfLines={1}>
                Safety Map
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: actionBtnColors[2], ...cardShadow }]}
              onPress={() => setActiveTab("messages")}
            >
              <MessageCircle size={28} color="#b8c34a" />
              <Text style={[styles.actionBtnText, { color: textColor }]} numberOfLines={2}>
                Emergency Chat
              </Text>
            </TouchableOpacity>
          </View>

          {/* Safety Status */}
          <View style={[styles.locationCard, { backgroundColor: cardColor, ...cardShadow }]}>
            <Text style={[styles.statusTitle, { color: textColor }]}>Your Location</Text>
            <View style={styles.locationRow}>
              <View style={styles.miniMap}>
                <FreeMap style={{ flex: 1 }} compact />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Pressable style={styles.statusRow} onPress={() => setShowLocationModal(true)}>
                  <MapPin size={18} color={iconActive} />
                  <Text style={[styles.statusLabel, { color: textSecondary }]}>Current Location</Text>
                  <Text style={[styles.statusValue, { color: textColor, maxWidth: 150 }]} numberOfLines={1}>{address}</Text>
                </Pressable>
                <View style={styles.statusRow}>
                  <Users size={18} color="#22c55e" />
                  <Text style={[styles.statusLabel, { color: textSecondary }]}>Nearby Tourists</Text>
                  <Text style={[styles.statusValue, { color: textColor }]}>{nearbyTourists} online</Text>
                </View>
                <View style={styles.statusRow}>
                  <Phone size={18} color="#e53935" />
                  <Text style={[styles.statusLabel, { color: textSecondary }]}>Emergency Contacts</Text>
                  <Text style={[styles.statusValue, { color: textColor }]}>{emergencyContacts} active</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Critical Alert */}
          <TouchableOpacity style={[styles.criticalCard, { ...cardShadow }]} activeOpacity={0.85} onPress={() => setShowAlertsModal(true)}> 
            <Text style={styles.criticalTitle}>CRITICAL ALERT</Text>
            <Text style={styles.criticalHeadline}>UNSAFE ZONE ENTERED</Text>
            <Text style={styles.criticalBody}>Your current area has a high risk rating. Leave the area or use emergency options.</Text>
          </TouchableOpacity>

          {/* Recent Activity */}
          <View style={[styles.recentCard, { backgroundColor: cardColor, ...cardShadow }]}> 
            <TouchableOpacity style={styles.recentHeader} activeOpacity={0.85} onPress={() => setShowAlertsModal(true)}>
              <Bell size={20} color="#f59e42" />
              <Text style={[styles.recentTitle, { color: textColor }]}>Recent Activity</Text>
            </TouchableOpacity>
            <View style={styles.recentItem}>
              <View style={styles.recentDot} />
              <Text style={[styles.recentText, { color: textColor, flex: 1 }]}>Potential Network Issue</Text>
              <Text style={[styles.recentTime, { color: textSecondary }]}>1 min ago</Text>
            </View>
            <View style={styles.recentItem}>
              <View style={styles.recentDot} />
              <Text style={[styles.recentText, { color: textColor, flex: 1 }]}>Entered Safe Zone</Text>
              <Text style={[styles.recentTime, { color: textSecondary }]}>Yesterday</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ALERTS MODAL */}
      <Modal
        visible={showAlertsModal}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
      >
        <View style={[styles.fullModalContainer, { backgroundColor }]}>
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={backgroundColor} translucent={true} />
          
          {/* Header with back arrow */}
          <View style={[styles.fullModalHeader, { borderBottomColor: isDark ? "#333" : "#e5e7eb" }]}>
            <TouchableOpacity
              onPress={() => setShowAlertsModal(false)}
              style={styles.backButton}
            >
              <Text style={[styles.backArrow, { color: iconActive }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.fullModalTitle, { color: textColor }]}>All Alerts</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.fullAlertsList} showsVerticalScrollIndicator={false}>
            {/* Risk Level Card */}
            <View style={[styles.riskLevelCard, { backgroundColor: cardColor, ...cardShadow }]}>
              <Text style={[styles.riskLevelTitle, { color: textColor }]}>Current Risk Level</Text>
              <View style={styles.riskLevelContent}>
                <View style={[styles.riskCircleSmall, { borderColor: riskCircle }]}>
                  <Text style={[styles.riskScoreSmall, { color: riskCircle }]}>{riskScore}</Text>
                </View>
                <Text style={[styles.riskLevelText, { color: getRiskColor(riskScore) }]}>
                  {getRiskLevel(riskScore)} Risk
                </Text>
              </View>
            </View>

            {/* Alerts List */}
            {ALERTS.map((alert) => (
              <View key={alert.id} style={[styles.fullAlertItem, { backgroundColor: cardColor, ...cardShadow }]}>
                <View style={styles.fullAlertHeader}>
                  <View style={styles.alertIconContainer}>
                    {alert.icon}
                  </View>
                  <View style={styles.fullAlertContent}>
                    <View style={styles.alertTitleRow}>
                      <Text style={[styles.fullAlertTitle, { color: textColor }]}>{alert.title}</Text>
                      <View style={[styles.fullPriorityBadge, { backgroundColor: alert.priorityColor }]}>
                        <Text style={styles.fullPriorityText}>{alert.priority}</Text>
                      </View>
                    </View>
                    <Text style={[styles.fullAlertTime, { color: textSecondary }]}>{alert.time}</Text>
                    <Text style={[styles.fullAlertDescription, { color: textSecondary }]}>
                      {alert.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* LOCATION POPUP */}
      <Modal
        visible={showLocationModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.locationPopupOverlay}>
          <View style={[styles.locationPopup, { backgroundColor: cardColor, ...cardShadow }]}>
            <View style={styles.locationPopupHeader}>
              <MapPin size={20} color={iconActive} />
              <Text style={[styles.locationPopupTitle, { color: textColor }]}>Current Location</Text>
              <TouchableOpacity
                onPress={() => setShowLocationModal(false)}
                style={styles.locationCloseBtn}
              >
                <Text style={[styles.locationCloseText, { color: textSecondary }]}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.locationPopupContent}>
              <Text style={[styles.locationPopupAddress, { color: textColor }]}>{address}</Text>
              {location && (
                <View style={styles.locationCoordinates}>
                  <Text style={[styles.locationCoordText, { color: textSecondary }]}>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* MAP TAB */}
      {activeTab === "map" && (
        <FreeMap style={{ flex: 1, marginVertical: 12 }} />
      )}

      {/* MESSAGES TAB */}
      {activeTab === "messages" && <Messages />}

      {/* PROFILE TAB */}
      {activeTab === "profile" && <Profile />}

      {/* EMERGENCY TAB */}
      {activeTab === "emergency" && <Emergency />}

      {/* NAVBAR */}
      <View
        style={[
          styles.navbar,
          {
            backgroundColor: navbarColor,
            borderTopColor: navbarBorder,
            ...cardShadow,
          },
        ]}
      >
        <TouchableOpacity onPress={() => setActiveTab("home")}>
          <Home size={28} color={activeTab === "home" ? iconActive : iconInactive} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("emergency")}>
          <AlertTriangle size={28} color={activeTab === "emergency" ? "#e53935" : iconInactive} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("map")}>
          <MapPin size={28} color={activeTab === "map" ? iconActive : iconInactive} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("messages")}>
          <MessageCircle size={28} color={activeTab === "messages" ? iconActive : iconInactive} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("profile")}>
          <User size={28} color={activeTab === "profile" ? iconActive : iconInactive} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 20 },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: "bold" },
  avatar: {
    backgroundColor: "#eaf0ff",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  riskCard: {
    borderRadius: 18,
    alignItems: "center",
    padding: 24,
    marginBottom: 18,
  },
  riskCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  riskScore: { fontSize: 38, fontWeight: "bold" },
  riskLabel: { fontSize: 18, fontWeight: "600" },
  riskUpdate: { fontSize: 12, marginTop: 4 },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 4,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 16,
    marginHorizontal: 6,
    minHeight: 85,
    justifyContent: "center",
  },
  actionBtnText: { 
    marginTop: 8, 
    fontWeight: "600", 
    fontSize: 13,
    textAlign: "center",
    lineHeight: 16,
    flexWrap: "wrap",
  },
  headerGradient: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  dateText: { fontSize: 12 },
  headerGreeting: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  riskQuickWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ringOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  ringInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  ringScore: {
    fontSize: 18,
    fontWeight: "800",
  },
  ringLabel: {
    fontSize: 10,
    color: "#64748b",
    marginTop: 2,
  },
  ringMeta: {
    marginLeft: 12,
    flex: 1,
  },
  ringMetaTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  ringMetaSub: {
    fontSize: 12,
  },
  statusCard: {
    borderRadius: 18,
    padding: 18,
    marginVertical: 12,
  },
  locationCard: {
    borderRadius: 18,
    padding: 14,
    marginVertical: 12,
  },
  miniMap: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  statusLabel: { marginLeft: 8, flex: 1 },
  statusValue: { fontWeight: "600", flex: 1, textAlign: "right" },
  alertsCard: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },
  criticalCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
    marginBottom: 16,
  },
  criticalTitle: {
    color: "#b91c1c",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  criticalHeadline: {
    color: "#7f1d1d",
    fontWeight: "800",
    fontSize: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  criticalBody: {
    color: "#7f1d1d",
    fontSize: 12,
  },
  recentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  recentTitle: {
    fontWeight: "700",
    marginLeft: 8,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  recentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#f59e0b",
    marginRight: 10,
  },
  recentText: {
    fontSize: 14,
    fontWeight: "500",
  },
  recentTime: {
    fontSize: 12,
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  alertsTitle: { fontWeight: "bold", fontSize: 16, marginLeft: 8, flex: 1 },
  alertsBadge: {
    backgroundColor: "#fbbf24",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  alertsBadgeText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  alertItemTitle: { fontWeight: "bold", fontSize: 15 },
  alertItemDesc: { fontSize: 13, marginTop: 2 },
  alertItemTime: { fontSize: 12, marginLeft: 8 },
  screenText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 50,
  },
  fullModalContainer: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    width: "100%",
  },
  backButton: {
    width: 60,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingLeft: 20,
  },
  backArrow: {
    fontSize: 24,
    fontWeight: "bold",
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  headerSpacer: {
    width: 60,
  },
  fullAlertsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  riskLevelCard: {
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  riskLevelTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  riskLevelContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskCircleSmall: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  riskScoreSmall: {
    fontSize: 20,
    fontWeight: "bold",
  },
  riskLevelText: {
    fontSize: 18,
    fontWeight: "600",
  },
  fullAlertItem: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  fullAlertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  alertIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  fullAlertContent: {
    flex: 1,
  },
  alertTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  fullAlertTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  fullAlertTime: {
    fontSize: 14,
    marginBottom: 8,
  },
  fullPriorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  fullPriorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  fullAlertDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  // Location Popup Styles
  locationPopupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  locationPopup: {
    width: "90%",
    maxWidth: 350,
    borderRadius: 16,
    padding: 20,
  },
  locationPopupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationPopupTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginLeft: 8,
  },
  locationCloseBtn: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  locationCloseText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  locationPopupContent: {
    alignItems: "flex-start",
  },
  locationPopupAddress: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    lineHeight: 20,
  },
  locationCoordinates: {
    marginTop: 4,
  },
  locationCoordText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    marginBottom: 8,
  },
});