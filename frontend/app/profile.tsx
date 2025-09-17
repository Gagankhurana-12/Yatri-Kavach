import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  FlatList
} from "react-native";
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Globe, 
  Sun, 
  Moon, 
  LogOut,
  ChevronRight,
  Phone,
  Check,
  X
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../components/ThemeContext";
import { useAuth } from "../components/AuthContext";
import { useLanguage } from "../components/LanguageContext";

const Profile = () => {
  const [familyTracking, setFamilyTracking] = useState(true);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();
  const isDark = theme === "dark";

  const backgroundColor = isDark ? "#181c20" : "#f8f9fa";
  const cardBackground = isDark ? "#23272f" : "#ffffff";
  const textPrimary = isDark ? "#ffffff" : "#1f2937";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const borderColor = isDark ? "#374151" : "#e5e7eb";

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={backgroundColor} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.replace("/dashboard")}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            Profile & Settings
          </Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: cardBackground }]}>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: textPrimary }]}>
              {user?.userName || "Shu"}
            </Text>
            <Text style={[styles.userId, { color: textSecondary }]}>
              ID: 1234567890
            </Text>
            <View style={styles.emergencyRow}>
              <Phone size={16} color="#dc2626" />
              <Text style={styles.emergencyText}>
                Emergency Contact: +91 9876543210
              </Text>
            </View>
          </View>
          <View style={[styles.avatarContainer, { backgroundColor: isDark ? "#374151" : "#f3f4f6" }]}>
            <User size={32} color={textSecondary} />
          </View>
        </View>

        {/* Settings Sections */}
        <View style={[styles.settingsContainer, { backgroundColor: cardBackground }]}>
          {/* Family Tracking */}
          <View style={[styles.settingItem, { borderBottomColor: borderColor }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: textPrimary }]}>
                Enable Family Tracking
              </Text>
              <Text style={[styles.settingSubtitle, { color: textSecondary }]}>
                Allow family members to track your location
              </Text>
            </View>
            <Switch
              value={familyTracking}
              onValueChange={setFamilyTracking}
              trackColor={{ false: "#d1d5db", true: "#10b981" }}
              thumbColor="#ffffff"
              ios_backgroundColor="#d1d5db"
            />
          </View>

          {/* Real-time Monitoring */}
          <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: textPrimary }]}>
                Allow Real-time Monitoring
              </Text>
              <Text style={[styles.settingSubtitle, { color: textSecondary }]}>
                Enable continuous safety monitoring
              </Text>
            </View>
            <Switch
              value={realTimeMonitoring}
              onValueChange={setRealTimeMonitoring}
              trackColor={{ false: "#d1d5db", true: "#10b981" }}
              thumbColor="#ffffff"
              ios_backgroundColor="#d1d5db"
            />
          </View>
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionHeader, { color: textSecondary }]}>
          Preferences
        </Text>

        <View style={[styles.settingsContainer, { backgroundColor: cardBackground }]}>
          {/* Language */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: borderColor }]}
            onPress={() => setShowLanguageModal(true)}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: textPrimary }]}>
                Language
              </Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: textSecondary }]}>
                {supportedLanguages[currentLanguage as keyof typeof supportedLanguages]}
              </Text>
              <ChevronRight size={20} color={textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Dark/Light Mode */}
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomWidth: 0 }]}
            onPress={toggleTheme}
          >
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: textPrimary }]}>
                Dark/Light Mode
              </Text>
            </View>
            <View style={styles.themeToggle}>
              {isDark ? (
                <Moon size={24} color="#fbbf24" />
              ) : (
                <Sun size={24} color="#f59e0b" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            await logout();
            router.replace("/");
          }}
        >
          <LogOut size={20} color="#ffffff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>
                Select Language
              </Text>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.closeButton}
              >
                <X size={24} color={textSecondary} />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={Object.entries(supportedLanguages)}
              keyExtractor={([code]) => code}
              renderItem={({ item: [code, name] }) => (
                <TouchableOpacity
                  style={[styles.languageItem, { borderBottomColor: borderColor }]}
                  onPress={async () => {
                    await setLanguage(code);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={[styles.languageName, { color: textPrimary }]}>
                    {name}
                  </Text>
                  {currentLanguage === code && (
                    <Check size={20} color="#10b981" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  profileCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    marginBottom: 12,
  },
  emergencyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  emergencyText: {
    fontSize: 14,
    color: "#dc2626",
    marginLeft: 6,
    fontWeight: "500",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  settingsContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    fontSize: 16,
    marginRight: 8,
  },
  themeToggle: {
    padding: 4,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 40,
    paddingVertical: 16,
    backgroundColor: "#dc2626",
    borderRadius: 16,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
  },
});
