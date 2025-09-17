import { Stack } from "expo-router";
import { ThemeProvider } from "../components/ThemeContext";
import { AuthProvider } from "../components/AuthContext";
import { RiskScoreProvider } from "../components/RiskScoreContext";
import { MessagingProvider } from "../components/MessagingContext";
import { LanguageProvider } from "../components/LanguageContext";
import { LocationProvider } from "../components/LocationContext";
import { PushProvider } from "../components/PushContext";

export default function Layout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <RiskScoreProvider>
            <MessagingProvider>
              <LocationProvider>
                <PushProvider>
                  <Stack screenOptions={{ headerShown: false }} />
                </PushProvider>
              </LocationProvider>
            </MessagingProvider>
          </RiskScoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
