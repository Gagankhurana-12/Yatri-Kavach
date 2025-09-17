import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, FlatList, BackHandler, Platform } from "react-native";
import { FileText, MapPin, Calendar, User, Phone, AlertCircle, History, Trash2 } from "lucide-react-native";
import { useTheme } from "../components/ThemeContext";
import { useAuth } from "../components/AuthContext";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";

export default function EFir() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDark = theme === "dark";
  
  const [formData, setFormData] = useState({
    incidentType: "",
    description: "",
    location: "",
    dateTime: "",
    reporterName: "",
    reporterPhone: "",
    reporterAddress: "",
    witnessDetails: "",
  });
  
  const [previousFIRs, setPreviousFIRs] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const incidentTypes = [
    "Theft/Robbery",
    "Assault",
    "Fraud",
    "Accident",
    "Missing Person",
    "Cybercrime",
    "Other"
  ];

  // Auto-populate form data on component mount
  useEffect(() => {
    const initializeForm = async () => {
      // Auto-fill user data
      if (user) {
        setFormData(prev => ({
          ...prev,
          reporterName: user.userName || user.name || "",
          reporterPhone: user.phone || "+91 9876543210", // From profile emergency contact
        }));
      }
      
      // Get current location
      await getCurrentLocation();
      
      // Set current date/time
      const now = new Date();
      const formattedDateTime = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, dateTime: formattedDateTime }));
      
      // Load previous FIRs
      loadPreviousFIRs();
    };
    
    initializeForm();
  }, [user]);

  // Handle Android hardware back to navigate instead of exiting app
  useEffect(() => {
    const onBackPress = () => {
      // Navigate back to previous screen (Emergency)
      router.back();
      return true; // prevent default behavior (exit app)
    };
    if (Platform.OS === 'android') {
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for auto-filling location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const locationString = `${address.street || ''} ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.trim();
        setFormData(prev => ({ ...prev, location: locationString }));
      }
    } catch (error) {
      console.log('Error getting location:', error);
      // Fallback to a default location
      setFormData(prev => ({ ...prev, location: "Current Location (Auto-detected)" }));
    } finally {
      setLocationLoading(false);
    }
  };

  const loadPreviousFIRs = async () => {
    try {
      const stored = await AsyncStorage.getItem('previousFIRs');
      if (stored) {
        setPreviousFIRs(JSON.parse(stored));
      }
    } catch (error) {
      console.log('Error loading previous FIRs:', error);
    }
  };

  const saveFIR = async (firData: any) => {
    try {
      const newFIR = {
        ...firData,
        id: Date.now().toString(),
        referenceId: 'FIR2024' + Math.floor(Math.random() * 10000),
        submittedAt: new Date().toISOString(),
      };
      
      const updatedFIRs = [newFIR, ...previousFIRs];
      await AsyncStorage.setItem('previousFIRs', JSON.stringify(updatedFIRs));
      setPreviousFIRs(updatedFIRs);
      return newFIR.referenceId;
    } catch (error) {
      console.log('Error saving FIR:', error);
      return 'FIR2024' + Math.floor(Math.random() * 10000);
    }
  };

  const deleteFIR = async (id: string) => {
    try {
      const updatedFIRs = previousFIRs.filter(fir => fir.id !== id);
      await AsyncStorage.setItem('previousFIRs', JSON.stringify(updatedFIRs));
      setPreviousFIRs(updatedFIRs);
    } catch (error) {
      console.log('Error deleting FIR:', error);
    }
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.incidentType || !formData.description || !formData.location || !formData.reporterName) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Save FIR and get reference ID
    const referenceId = await saveFIR(formData);
    
    Alert.alert(
      "E-FIR Submitted Successfully",
      `Your incident report has been filed. Reference ID: ${referenceId}`,
      [
        {
          text: "OK",
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? "#181c20" : "#f8f9fa" }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#2563eb" : "#3b82f6" }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <FileText size={32} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Electronic FIR System</Text>
            <Text style={styles.headerSubtitle}>File your incident report digitally</Text>
          </View>
        </View>
      </View>

      <View style={styles.formContainer}>
        {/* History Toggle */}
        <TouchableOpacity
          style={[styles.historyToggle, { backgroundColor: isDark ? "#374151" : "#f3f4f6" }]}
          onPress={() => setShowHistory(!showHistory)}
        >
          <History size={20} color={isDark ? "#fff" : "#374151"} />
          <Text style={[styles.historyToggleText, { color: isDark ? "#fff" : "#374151" }]}>
            {showHistory ? "Hide" : "Show"} Previous FIRs ({previousFIRs.length})
          </Text>
        </TouchableOpacity>

        {/* Previous FIRs List */}
        {showHistory && (
          <View style={[styles.historyContainer, { backgroundColor: isDark ? "#23272f" : "#f9fafb" }]}>
            {previousFIRs.length === 0 ? (
              <Text style={[styles.noHistoryText, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                No previous FIRs found
              </Text>
            ) : (
              <FlatList
                data={previousFIRs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.historyItem, { backgroundColor: isDark ? "#374151" : "#fff" }]}>
                    <View style={styles.historyItemHeader}>
                      <Text style={[styles.historyItemTitle, { color: isDark ? "#fff" : "#181c20" }]}>
                        {item.incidentType}
                      </Text>
                      <TouchableOpacity onPress={() => deleteFIR(item.id)}>
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.historyItemRef, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                      Ref: {item.referenceId}
                    </Text>
                    <Text style={[styles.historyItemDesc, { color: isDark ? "#d1d5db" : "#374151" }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <Text style={[styles.historyItemDate, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                      {new Date(item.submittedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </View>
        )}
        {/* Incident Type Selection */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>
          Incident Type *
        </Text>
        <View style={styles.typeGrid}>
          {incidentTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                {
                  backgroundColor: formData.incidentType === type 
                    ? (isDark ? "#2563eb" : "#3b82f6")
                    : (isDark ? "#23272f" : "#fff"),
                  borderColor: formData.incidentType === type 
                    ? (isDark ? "#2563eb" : "#3b82f6")
                    : (isDark ? "#374151" : "#e5e7eb")
                }
              ]}
              onPress={() => setFormData({...formData, incidentType: type})}
            >
              <Text style={[
                styles.typeButtonText,
                { 
                  color: formData.incidentType === type 
                    ? "#fff" 
                    : (isDark ? "#fff" : "#374151")
                }
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Incident Description */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>
          Incident Description *
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: isDark ? "#23272f" : "#fff",
              color: isDark ? "#fff" : "#181c20",
              borderColor: isDark ? "#374151" : "#e5e7eb"
            }
          ]}
          placeholder="Describe the incident in detail..."
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
          multiline
          numberOfLines={4}
          value={formData.description}
          onChangeText={(text) => setFormData({...formData, description: text})}
        />

        {/* Location */}
        <View style={styles.locationContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>
            <MapPin size={16} color={isDark ? "#fff" : "#181c20"} /> Location * {locationLoading && "(Auto-detecting...)"}
          </Text>
          <View style={styles.locationInputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? "#23272f" : "#fff",
                  color: isDark ? "#fff" : "#181c20",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  flex: 1
                }
              ]}
              placeholder="Enter incident location"
              placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
              value={formData.location}
              onChangeText={(text) => setFormData({...formData, location: text})}
            />
            <TouchableOpacity
              style={[styles.refreshLocationBtn, { backgroundColor: isDark ? "#2563eb" : "#3b82f6" }]}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              <MapPin size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date & Time */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>
          <Calendar size={16} color={isDark ? "#fff" : "#181c20"} /> Date & Time
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#23272f" : "#fff",
              color: isDark ? "#fff" : "#181c20",
              borderColor: isDark ? "#374151" : "#e5e7eb"
            }
          ]}
          placeholder="DD/MM/YYYY HH:MM"
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
          value={formData.dateTime}
          onChangeText={(text) => setFormData({...formData, dateTime: text})}
        />

        {/* Reporter Details */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>
          Reporter Information (Auto-filled)
        </Text>
        
        <TextInput
          style={[
            styles.input,
            styles.autoFilledInput,
            {
              backgroundColor: isDark ? "#1f2937" : "#f0f9ff",
              color: isDark ? "#fff" : "#181c20",
              borderColor: isDark ? "#2563eb" : "#3b82f6"
            }
          ]}
          placeholder="Full Name *"
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
          value={formData.reporterName}
          onChangeText={(text) => setFormData({...formData, reporterName: text})}
        />

        <TextInput
          style={[
            styles.input,
            styles.autoFilledInput,
            {
              backgroundColor: isDark ? "#1f2937" : "#f0f9ff",
              color: isDark ? "#fff" : "#181c20",
              borderColor: isDark ? "#2563eb" : "#3b82f6"
            }
          ]}
          placeholder="Phone Number"
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
          keyboardType="phone-pad"
          value={formData.reporterPhone}
          onChangeText={(text) => setFormData({...formData, reporterPhone: text})}
        />

        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: isDark ? "#23272f" : "#fff",
              color: isDark ? "#fff" : "#181c20",
              borderColor: isDark ? "#374151" : "#e5e7eb"
            }
          ]}
          placeholder="Address"
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
          multiline
          numberOfLines={3}
          value={formData.reporterAddress}
          onChangeText={(text) => setFormData({...formData, reporterAddress: text})}
        />

        {/* Witness Details */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>
          Witness Details (Optional)
        </Text>
        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: isDark ? "#23272f" : "#fff",
              color: isDark ? "#fff" : "#181c20",
              borderColor: isDark ? "#374151" : "#e5e7eb"
            }
          ]}
          placeholder="Names and contact details of witnesses..."
          placeholderTextColor={isDark ? "#9ca3af" : "#6b7280"}
          multiline
          numberOfLines={3}
          value={formData.witnessDetails}
          onChangeText={(text) => setFormData({...formData, witnessDetails: text})}
        />

        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: isDark ? "#fef3c7" : "#fef3c7" }]}>
          <AlertCircle size={20} color="#d97706" />
          <Text style={[styles.disclaimerText, { color: "#92400e" }]}>
            This is a demo E-FIR system. In a real implementation, this would be connected to official police databases.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: isDark ? "#2563eb" : "#3b82f6" }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>Submit E-FIR</Text>
        </TouchableOpacity>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? "#374151" : "#6b7280" }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Emergency</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    textAlignVertical: "top",
  },
  disclaimer: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  // New styles for auto-fill and history
  historyToggle: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  historyToggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  historyContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  noHistoryText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  historyItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  historyItemRef: {
    fontSize: 12,
    marginBottom: 4,
  },
  historyItemDesc: {
    fontSize: 14,
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 12,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshLocationBtn: {
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  autoFilledInput: {
    borderWidth: 2,
  },
});
