import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../components/AuthContext"; // <-- Add this

export default function PassportLogin() {
  const router = useRouter();
  const { login } = useAuth(); // <-- Add this
  const [name, setName] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const userName = name.trim() || `Traveler ${passportNumber.slice(-4)}`;
    await login({ userName, loginType: "passport" });
    router.replace({
      pathname: "/dashboard",
      params: { userName, loginType: "passport" }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Passport Login</Text>
      
      <TextInput 
        placeholder="Full Name" 
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      
      <TextInput 
        placeholder="Passport Number" 
        placeholderTextColor="#9ca3af"
        style={styles.input}
        value={passportNumber}
        onChangeText={setPassportNumber}
      />
      
      <TextInput 
        placeholder="Password" 
        placeholderTextColor="#9ca3af"
        style={styles.input} 
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 16,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#ffffff"
  },
  button: { backgroundColor: "#2563eb", padding: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
