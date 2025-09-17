import { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Shield, Fingerprint, IdCard, MapPin, Users, Compass } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../components/AuthContext";

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace({
        pathname: "/dashboard",
        params: { userName: user.userName, loginType: user.loginType },
      });
    }
  }, [user, loading]);

  if (loading) return null; // or a splash/loading screen

  const LogoComponent = () => (
    <View style={styles.logoContainer}>
      <View style={styles.logoBackground}>
        <Shield size={48} color="#ffffff" style={styles.mainShield} />
        <MapPin size={20} color="#fbbf24" style={styles.mapPin} />
        <Compass size={16} color="#10b981" style={styles.compass} />
      </View>
      <View style={styles.logoAccents}>
        <Users size={14} color="#2563eb" style={styles.usersIcon} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LogoComponent />

      <Text style={styles.title}>YATRI KAVACH</Text>
      <Text style={styles.subtitle}>Your safety companion in India</Text>

      <TouchableOpacity
        style={styles.aadhaarButton}
        onPress={() => router.push("/aadhaar")}
      >
        <Fingerprint size={20} color="white" />
        <Text style={styles.aadhaarText}>Login with Aadhaar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.passportButton}
        onPress={() => router.push("/passport")}
      >
        <IdCard size={20} color="black" />
        <Text style={styles.passportText}>Login with Passport</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  mainShield: {
    position: "absolute",
  },
  mapPin: {
    position: "absolute",
    top: 15,
    right: 20,
  },
  compass: {
    position: "absolute",
    bottom: 18,
    left: 22,
  },
  logoAccents: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  usersIcon: {
    // No additional styles needed
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#1f2937",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 40,
    textAlign: "center",
  },
  aadhaarButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    width: "90%",
    justifyContent: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  aadhaarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  passportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 14,
    borderRadius: 12,
    marginBottom: 40,
    width: "90%",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  passportText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
