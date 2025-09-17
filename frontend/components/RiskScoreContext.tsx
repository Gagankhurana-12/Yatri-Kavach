import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface RiskFactor {
  id: string;
  name: string;
  value: number;
  weight: number;
  status: 'low' | 'medium' | 'high';
  description: string;
  trend: 'up' | 'down' | 'stable';
}

interface RiskScoreContextType {
  riskScore: number;
  riskFactors: RiskFactor[];
  updateRiskFactors: (factors: RiskFactor[]) => void;
  refreshRiskScore: () => Promise<void>;
  getRiskLevel: (score: number) => string;
  getRiskColor: (score: number) => string;
}

const RiskScoreContext = createContext<RiskScoreContextType>({
  riskScore: 25,
  riskFactors: [],
  updateRiskFactors: () => {},
  refreshRiskScore: async () => {},
  getRiskLevel: () => "Low Risk",
  getRiskColor: () => "#22c55e",
});

export const RiskScoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [riskScore, setRiskScore] = useState(25);
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([
    {
      id: 'location',
      name: 'Location Safety',
      value: 85,
      weight: 25,
      status: 'low',
      description: 'Current area safety rating based on crime statistics and tourist reports',
      trend: 'stable'
    },
    {
      id: 'time',
      name: 'Time of Day',
      value: 70,
      weight: 15,
      status: 'medium',
      description: 'Risk varies by time - higher during late night hours',
      trend: 'up'
    },
    {
      id: 'crowd',
      name: 'Crowd Density',
      value: 40,
      weight: 20,
      status: 'medium',
      description: 'Number of people in vicinity - affects pickpocket and scam risks',
      trend: 'down'
    },
    {
      id: 'connectivity',
      name: 'Network Status',
      value: 90,
      weight: 10,
      status: 'low',
      description: 'Mobile network and internet connectivity for emergency communication',
      trend: 'stable'
    },
    {
      id: 'device',
      name: 'Device Security',
      value: 45,
      weight: 15,
      status: 'high',
      description: 'Battery level, location services, and security settings status',
      trend: 'down'
    },
    {
      id: 'alerts',
      name: 'Recent Alerts',
      value: 30,
      weight: 15,
      status: 'high',
      description: 'Recent security incidents and warnings in your area',
      trend: 'up'
    }
  ]);

  // Calculate risk score based on factors
  const calculateRiskScore = (factors: RiskFactor[]) => {
    let totalScore = 0;
    let totalWeight = 0;
    
    factors.forEach(factor => {
      // Convert safety score to risk score (inverse relationship)
      const riskValue = 100 - factor.value;
      totalScore += riskValue * (factor.weight / 100);
      totalWeight += factor.weight;
    });
    
    return Math.round(totalScore);
  };

  // Load risk data from storage
  useEffect(() => {
    const loadRiskData = async () => {
      try {
        const storedFactors = await AsyncStorage.getItem('riskFactors');
        if (storedFactors) {
          const factors = JSON.parse(storedFactors);
          setRiskFactors(factors);
          setRiskScore(calculateRiskScore(factors));
        } else {
          // Calculate initial score
          setRiskScore(calculateRiskScore(riskFactors));
        }
      } catch (error) {
        console.log('Error loading risk data:', error);
        setRiskScore(calculateRiskScore(riskFactors));
      }
    };
    
    loadRiskData();
  }, []);

  // Update risk factors and recalculate score
  const updateRiskFactors = async (factors: RiskFactor[]) => {
    try {
      setRiskFactors(factors);
      const newScore = calculateRiskScore(factors);
      setRiskScore(newScore);
      
      // Save to storage
      await AsyncStorage.setItem('riskFactors', JSON.stringify(factors));
      await AsyncStorage.setItem('riskScore', newScore.toString());
    } catch (error) {
      console.log('Error updating risk factors:', error);
    }
  };

  // Refresh risk score with simulated updates
  const refreshRiskScore = async () => {
    const updatedFactors = riskFactors.map(factor => {
      // Simulate some random variations
      const variation = (Math.random() - 0.5) * 10;
      const newValue = Math.max(0, Math.min(100, factor.value + variation));
      
      return {
        ...factor,
        value: Math.round(newValue),
        status: (newValue > 70 ? 'low' : newValue > 40 ? 'medium' : 'high') as 'low' | 'medium' | 'high',
        trend: (variation > 2 ? 'up' : variation < -2 ? 'down' : 'stable') as 'up' | 'down' | 'stable'
      };
    });
    
    await updateRiskFactors(updatedFactors);
  };

  const getRiskColor = (score: number) => {
    if (score <= 30) return '#22c55e'; // Green - Low risk
    if (score <= 60) return '#f59e0b'; // Yellow - Medium risk
    return '#ef4444'; // Red - High risk
  };

  const getRiskLevel = (score: number) => {
    if (score <= 30) return 'Low Risk';
    if (score <= 60) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <RiskScoreContext.Provider value={{
      riskScore,
      riskFactors,
      updateRiskFactors,
      refreshRiskScore,
      getRiskLevel,
      getRiskColor
    }}>
      {children}
    </RiskScoreContext.Provider>
  );
};

export const useRiskScore = () => useContext(RiskScoreContext);
