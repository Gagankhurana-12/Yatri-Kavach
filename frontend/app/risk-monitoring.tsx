import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { 
  Shield, 
  MapPin, 
  Clock, 
  Users, 
  AlertTriangle, 
  Wifi, 
  Battery, 
  Signal,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ArrowLeft
} from "lucide-react-native";
import { useTheme } from "../components/ThemeContext";
import { useAuth } from "../components/AuthContext";
import { useRiskScore } from "../components/RiskScoreContext";
import { router } from "expo-router";
import * as Location from "expo-location";

interface RiskFactor {
  id: string;
  name: string;
  value: number;
  weight: number;
  status: 'low' | 'medium' | 'high';
  description: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
}

export default function RiskMonitoring() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { riskScore, riskFactors, refreshRiskScore, getRiskColor, getRiskLevel } = useRiskScore();
  const isDark = theme === "dark";
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const refreshRiskData = async () => {
    setIsRefreshing(true);
    
    // Use the shared context refresh function
    await refreshRiskScore();
    
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };


  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} color="#ef4444" />;
      case 'down': return <TrendingDown size={16} color="#22c55e" />;
      default: return <Minus size={16} color="#6b7280" />;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? "#181c20" : "#f8f9fa" }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? "#2563eb" : "#3b82f6" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Shield size={32} color="#fff" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Risk Score Monitoring</Text>
            <Text style={styles.headerSubtitle}>Real-time safety assessment</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={refreshRiskData} 
          style={[styles.refreshButton, { opacity: isRefreshing ? 0.6 : 1 }]}
          disabled={isRefreshing}
        >
          <RefreshCw size={20} color="#fff" style={{ transform: [{ rotate: isRefreshing ? '180deg' : '0deg' }] }} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Current Risk Score */}
        <View style={[styles.riskScoreCard, { backgroundColor: isDark ? "#23272f" : "#fff" }]}>
          <Text style={[styles.cardTitle, { color: isDark ? "#fff" : "#181c20" }]}>
            Current Risk Assessment
          </Text>
          <View style={styles.riskScoreContainer}>
            <View style={[styles.riskCircle, { borderColor: getRiskColor(riskScore) }]}>
              <Text style={[styles.riskScoreText, { color: getRiskColor(riskScore) }]}>
                {riskScore}
              </Text>
            </View>
            <View style={styles.riskInfo}>
              <Text style={[styles.riskLevel, { color: getRiskColor(riskScore) }]}>
                {getRiskLevel(riskScore)}
              </Text>
              <Text style={[styles.lastUpdated, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Risk Factors */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>
          Risk Calculation Factors
        </Text>
        
        {riskFactors.map((factor) => {
          const getFactorIcon = (id: string) => {
            const iconColor = factor.value > 70 ? '#22c55e' : factor.value > 40 ? '#f59e0b' : '#ef4444';
            switch (id) {
              case 'location': return <MapPin size={20} color={iconColor} />;
              case 'time': return <Clock size={20} color={iconColor} />;
              case 'crowd': return <Users size={20} color={iconColor} />;
              case 'connectivity': return <Signal size={20} color={iconColor} />;
              case 'device': return <Battery size={20} color={iconColor} />;
              case 'alerts': return <AlertTriangle size={20} color={iconColor} />;
              default: return <Shield size={20} color={iconColor} />;
            }
          };
          
          return (
          <View key={factor.id} style={[styles.factorCard, { backgroundColor: isDark ? "#23272f" : "#fff" }]}>
            <View style={styles.factorHeader}>
              <View style={styles.factorTitleRow}>
                {getFactorIcon(factor.id)}
                <Text style={[styles.factorName, { color: isDark ? "#fff" : "#181c20" }]}>
                  {factor.name}
                </Text>
                <View style={styles.factorTrend}>
                  {getTrendIcon(factor.trend)}
                </View>
              </View>
              <Text style={[styles.factorWeight, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                Weight: {factor.weight}%
              </Text>
            </View>
            
            <Text style={[styles.factorDescription, { color: isDark ? "#d1d5db" : "#374151" }]}>
              {factor.description}
            </Text>
            
            <View style={styles.factorMetrics}>
              <View style={styles.factorScoreContainer}>
                <Text style={[styles.factorScoreLabel, { color: isDark ? "#9ca3af" : "#6b7280" }]}>
                  Safety Score
                </Text>
                <Text style={[styles.factorScore, { 
                  color: factor.value > 70 ? '#22c55e' : factor.value > 40 ? '#f59e0b' : '#ef4444' 
                }]}>
                  {factor.value}/100
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { backgroundColor: isDark ? "#374151" : "#e5e7eb" }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${factor.value}%`,
                        backgroundColor: factor.value > 70 ? '#22c55e' : factor.value > 40 ? '#f59e0b' : '#ef4444'
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </View>
        );
        })}

        {/* Monitoring Info */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? "#1e3a8a" : "#dbeafe" }]}>
          <Eye size={20} color={isDark ? "#60a5fa" : "#2563eb"} />
          <Text style={[styles.infoText, { color: isDark ? "#e0e7ff" : "#1e40af" }]}>
            Risk score is calculated in real-time using multiple factors including location safety, 
            time of day, crowd density, device status, and recent security alerts in your area.
          </Text>
        </View>

        {/* Action Recommendations */}
        <Text style={[styles.sectionTitle, { color: isDark ? "#fff" : "#181c20" }]}>
          Safety Recommendations
        </Text>
        
        <View style={[styles.recommendationCard, { backgroundColor: isDark ? "#23272f" : "#fff" }]}>
          {riskScore > 60 ? (
            <>
              <AlertTriangle size={20} color="#ef4444" />
              <Text style={[styles.recommendationTitle, { color: "#ef4444" }]}>
                High Risk Detected
              </Text>
              <Text style={[styles.recommendationText, { color: isDark ? "#d1d5db" : "#374151" }]}>
                • Stay in well-lit, populated areas{'\n'}
                • Keep emergency contacts readily available{'\n'}
                • Consider moving to a safer location{'\n'}
                • Enable location sharing with trusted contacts
              </Text>
            </>
          ) : riskScore > 30 ? (
            <>
              <Eye size={20} color="#f59e0b" />
              <Text style={[styles.recommendationTitle, { color: "#f59e0b" }]}>
                Stay Alert
              </Text>
              <Text style={[styles.recommendationText, { color: isDark ? "#d1d5db" : "#374151" }]}>
                • Remain aware of your surroundings{'\n'}
                • Keep valuables secure{'\n'}
                • Stay connected with others{'\n'}
                • Monitor local safety updates
              </Text>
            </>
          ) : (
            <>
              <Shield size={20} color="#22c55e" />
              <Text style={[styles.recommendationTitle, { color: "#22c55e" }]}>
                Safe Environment
              </Text>
              <Text style={[styles.recommendationText, { color: isDark ? "#d1d5db" : "#374151" }]}>
                • Current conditions are favorable{'\n'}
                • Continue following basic safety practices{'\n'}
                • Enjoy your travel experience{'\n'}
                • Stay updated on changing conditions
              </Text>
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  riskScoreCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  riskScoreContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 20,
  },
  riskScoreText: {
    fontSize: 28,
    fontWeight: "bold",
  },
  riskInfo: {
    flex: 1,
  },
  riskLevel: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  factorCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  factorHeader: {
    marginBottom: 8,
  },
  factorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  factorName: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  factorTrend: {
    marginLeft: 8,
  },
  factorWeight: {
    fontSize: 12,
  },
  factorDescription: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  factorMetrics: {
    flexDirection: "row",
    alignItems: "center",
  },
  factorScoreContainer: {
    marginRight: 16,
  },
  factorScoreLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  factorScore: {
    fontSize: 16,
    fontWeight: "bold",
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 4,
  },
  recommendationText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
