import { Stack } from "expo-router";
import { ThemeProvider } from "../components/ThemeContext";
import { AuthProvider } from "../components/AuthContext";
import { RiskScoreProvider } from "../components/RiskScoreContext";
import { MessagingProvider } from "../components/MessagingContext";
import { LanguageProvider } from "../components/LanguageContext";

export default function Layout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <RiskScoreProvider>
            <MessagingProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </MessagingProvider>
          </RiskScoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
