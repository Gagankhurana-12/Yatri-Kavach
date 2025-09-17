import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { MapPin, RotateCcw, Navigation, Zap } from 'lucide-react-native';
import { useTheme } from './ThemeContext';
import { useLocationContext } from './LocationContext';
import { SERVER_URL } from '@/constants/config';
import { usePush } from './PushContext';

interface FreeMapProps {
  style?: any;
  compact?: boolean; // hide overlay controls for small embeds
}

export default function FreeMap({ style, compact = false }: FreeMapProps) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("Getting location...");
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [heading, setHeading] = useState(0);
  const [altitude, setAltitude] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [currentZone, setCurrentZone] = useState<string>('Unknown');
  const [zoneColor, setZoneColor] = useState('#22c55e');
  const webViewRef = useRef<WebView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const previousLocation = useRef<{ latitude: number; longitude: number; timestamp: number } | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { setCoords } = useLocationContext();
  const { pushToken } = usePush();

  const startRealTimeTracking = async () => {
    try {
      setIsLoading(true);
      
      // Request both foreground and background permissions for better accuracy
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for live tracking');
        return;
      }

      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert('Location Services Disabled', 'Please enable location services in your device settings for accurate tracking');
        return;
      }

      // Get current position first to ensure GPS is working
      console.log('Getting initial GPS position...');
      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      console.log('Initial GPS coordinates:', initialLocation.coords.latitude, initialLocation.coords.longitude);
      
      // Set initial location immediately
      const initialPos = {
        latitude: initialLocation.coords.latitude,
        longitude: initialLocation.coords.longitude,
      };
      setLocation(initialPos);
      setSpeed(initialLocation.coords.speed || 0);
      setAccuracy(initialLocation.coords.accuracy || 0);
      setHeading(initialLocation.coords.heading || 0);
      setAltitude(initialLocation.coords.altitude || 0);

      // Stop existing subscription
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }

      // Start ultra-high precision real-time location tracking
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 2000, // Update every 2 seconds for ultra-fast tracking
          distanceInterval: 5, // Update every 5 meters for maximum precision
          mayShowUserSettingsDialog: true,
        },
        (loc) => {
          console.log('Live GPS update:', loc.coords.latitude, loc.coords.longitude);
          
          const newLocation = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          
          // Update location data without speed calculations
          setLocation(newLocation);
          setCoords({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            accuracy: loc.coords.accuracy || 0,
            heading: loc.coords.heading || 0,
            altitude: loc.coords.altitude || 0,
            timestamp: Date.now(),
          });
          // Update server with latest location (best-effort)
          try {
            if (pushToken) {
              fetch(`${SERVER_URL}/updateLocation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: pushToken, lat: newLocation.latitude, lng: newLocation.longitude }),
              }).catch(() => {});
            }
          } catch {}
          setAccuracy(loc.coords.accuracy || 0);
          setHeading(loc.coords.heading || 0);
          setAltitude(loc.coords.altitude || 0);
          setLastUpdateTime(Date.now());
          
          // Check current safety zone
          const currentZoneData = checkCurrentZone(loc.coords.latitude, loc.coords.longitude);
          if (currentZoneData && currentZoneData.type === 'restricted') {
            Alert.alert('⚠️ Safety Alert', `You are entering: ${currentZoneData.name}\nPlease exercise caution!`);
          }
          
          // Update address periodically with real coordinates
          if (Date.now() % 10000 < 500) { // Update address every 10 seconds
            Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            }).then(geocode => {
              if (geocode && geocode.length > 0) {
                const place = geocode[0];
                const realAddress = [place.name, place.city, place.region, place.country]
                  .filter(Boolean)
                  .join(", ");
                console.log('Updated address:', realAddress);
                setAddress(realAddress || `Live: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
              }
            }).catch(() => {
              setAddress(`Live GPS: ${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
            });
          }
          
          // Send location update to WebView with precise data
          if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify({
              type: 'updateLocation',
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: loc.coords.heading || 0,
              altitude: loc.coords.altitude || 0,
              accuracy: loc.coords.accuracy || 0,
              timestamp: Date.now(),
              zone: currentZone,
              zoneColor: zoneColor
            }));
          }
        }
      );

      setIsTracking(true);
      setIsLoading(false);

      // Get real address from actual GPS coordinates
      try {
        console.log('Getting address for coordinates:', initialPos.latitude, initialPos.longitude);
        let geocode = await Location.reverseGeocodeAsync({
          latitude: initialPos.latitude,
          longitude: initialPos.longitude,
        });
        console.log('Geocode result:', geocode);
        if (geocode && geocode.length > 0) {
          const place = geocode[0];
          const realAddress = [place.name, place.city, place.region, place.country]
            .filter(Boolean)
            .join(", ");
          console.log('Real address:', realAddress);
          setAddress(realAddress || "Live tracking active");
        } else {
          setAddress(`Live tracking: ${initialPos.latitude.toFixed(4)}, ${initialPos.longitude.toFixed(4)}`);
        }
      } catch (error) {
        console.log('Address lookup error:', error);
        setAddress(`Live GPS: ${initialPos.latitude.toFixed(4)}, ${initialPos.longitude.toFixed(4)}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not start live tracking');
      setIsLoading(false);
    }
  };

  // Safety zones data with coordinates, radius, and type (Updated for Solan area)
  const safetyZones = [
    // Green Zones (Safe Areas)
    { lat: 30.8780, lng: 76.8740, radius: 300, type: 'safe', name: 'Solan City Center', color: '#22c55e' },
    { lat: 30.8750, lng: 76.8720, radius: 200, type: 'safe', name: 'Tourist Information Center', color: '#22c55e' },
    { lat: 30.8800, lng: 76.8760, radius: 250, type: 'safe', name: 'Main Market Area', color: '#22c55e' },
    
    // Caution Zones (Medium Risk)
    { lat: 30.8760, lng: 76.8700, radius: 150, type: 'caution', name: 'Crowded Bus Stand', color: '#f59e0b' },
    { lat: 30.8790, lng: 76.8780, radius: 100, type: 'caution', name: 'Night Market Area', color: '#f59e0b' },
    { lat: 30.8740, lng: 76.8750, radius: 120, type: 'caution', name: 'Construction Zone', color: '#f59e0b' },
    
    // Restricted Zones (High Risk)
    { lat: 30.8720, lng: 76.8680, radius: 80, type: 'restricted', name: 'Industrial Area', color: '#ef4444' },
    { lat: 30.8810, lng: 76.8800, radius: 60, type: 'restricted', name: 'Unsafe After Dark', color: '#ef4444' },
    
    // Special Zones
    { lat: 30.8770, lng: 76.8730, radius: 200, type: 'hospital', name: 'Civil Hospital Solan', color: '#3b82f6' },
    { lat: 30.8785, lng: 76.8745, radius: 150, type: 'police', name: 'Police Station', color: '#8b5cf6' },
  ];

  // Calculate distance between two GPS coordinates (Haversine formula)
  const getDistanceBetweenPoints = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
  };

  // Check which safety zone the user is in
  const checkCurrentZone = (lat: number, lng: number) => {
    for (const zone of safetyZones) {
      const distance = getDistanceBetweenPoints(lat, lng, zone.lat, zone.lng);
      if (distance <= zone.radius) {
        setCurrentZone(zone.name);
        setZoneColor(zone.color);
        return zone;
      }
    }
    setCurrentZone('Safe Area');
    setZoneColor('#22c55e');
    return null;
  };

  const stopTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    previousLocation.current = null;
    setIsTracking(false);
  };

  useEffect(() => {
    startRealTimeTracking();
    
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  const generateMapHTML = () => {
    if (!location) return '';
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Live Tracking Map</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <style>
            body { margin: 0; padding: 0; }
            #map { height: 100vh; width: 100%; }
            .live-info {
                position: absolute;
                top: 10px;
                left: 10px;
                right: 10px;
                background: ${isDark ? 'rgba(35, 39, 47, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
                color: ${isDark ? '#fff' : '#000'};
                padding: 12px;
                border-radius: 8px;
                font-family: Arial, sans-serif;
                font-size: 12px;
                z-index: 1000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            .live-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #22c55e;
                border-radius: 50%;
                animation: pulse 1s infinite;
                margin-right: 6px;
            }
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
            .speed-info {
                color: #2563eb;
                font-weight: bold;
                margin-top: 4px;
            }
            .heading-info {
                color: #16a34a;
                font-weight: bold;
                margin-top: 2px;
                font-size: 11px;
            }
        </style>
    </head>
    <body>
        <div class="live-info" id="locationInfo">
            <div><span class="live-indicator"></span><strong>🚀 ULTRA-PRECISE LIVE TRACKING</strong></div>
            <div id="address">${address}</div>
            <div class="zone-info" id="zoneInfo" style="color: ${zoneColor}; font-weight: bold; margin-top: 4px;">Zone: ${currentZone}</div>
            <div class="heading-info" id="headingInfo">Heading: ${heading.toFixed(0)}°</div>
            <small id="coords">Lat: ${location.latitude.toFixed(7)}, Lng: ${location.longitude.toFixed(7)}</small><br>
            <small id="accuracy">Accuracy: ±${accuracy.toFixed(1)}m | Alt: ${altitude.toFixed(0)}m</small>
        </div>
        <div id="map"></div>
        
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script>
            var map = L.map('map').setView([${location.latitude}, ${location.longitude}], 18);
            var marker, circle, trail = [];
            
            // High-resolution OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19,
            }).addTo(map);
            
            // Add safety zones to map (Updated for Solan area)
            var safetyZones = [
                // Green Zones (Safe Areas)
                { lat: 30.8780, lng: 76.8740, radius: 300, type: 'safe', name: 'Solan City Center', color: '#22c55e' },
                { lat: 30.8750, lng: 76.8720, radius: 200, type: 'safe', name: 'Tourist Information Center', color: '#22c55e' },
                { lat: 30.8800, lng: 76.8760, radius: 250, type: 'safe', name: 'Main Market Area', color: '#22c55e' },
                
                // Caution Zones (Medium Risk)
                { lat: 30.8760, lng: 76.8700, radius: 150, type: 'caution', name: 'Crowded Bus Stand', color: '#f59e0b' },
                { lat: 30.8790, lng: 76.8780, radius: 100, type: 'caution', name: 'Night Market Area', color: '#f59e0b' },
                { lat: 30.8740, lng: 76.8750, radius: 120, type: 'caution', name: 'Construction Zone', color: '#f59e0b' },
                
                // Restricted Zones (High Risk)
                { lat: 30.8720, lng: 76.8680, radius: 80, type: 'restricted', name: 'Industrial Area', color: '#ef4444' },
                { lat: 30.8810, lng: 76.8800, radius: 60, type: 'restricted', name: 'Unsafe After Dark', color: '#ef4444' },
                
                // Special Zones
                { lat: 30.8770, lng: 76.8730, radius: 200, type: 'hospital', name: 'Civil Hospital Solan', color: '#3b82f6' },
                { lat: 30.8785, lng: 76.8745, radius: 150, type: 'police', name: 'Police Station', color: '#8b5cf6' },
            ];
            
            // Draw safety zones on map
            safetyZones.forEach(function(zone) {
                var zoneCircle = L.circle([zone.lat, zone.lng], {
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.2,
                    radius: zone.radius,
                    weight: 2
                }).addTo(map);
                
                // Add zone markers with icons
                var zoneIcon = getZoneIcon(zone.type);
                var zoneMarker = L.marker([zone.lat, zone.lng], {icon: zoneIcon})
                    .addTo(map)
                    .bindPopup('<b>' + getZoneEmoji(zone.type) + ' ' + zone.name + '</b><br>' + 
                              'Type: ' + zone.type.toUpperCase() + '<br>' +
                              'Radius: ' + zone.radius + 'm<br>' +
                              getZoneDescription(zone.type));
            });
            
            function getZoneIcon(type) {
                var iconHtml = '';
                var bgColor = '';
                switch(type) {
                    case 'safe': iconHtml = '✅'; bgColor = '#22c55e'; break;
                    case 'caution': iconHtml = '⚠️'; bgColor = '#f59e0b'; break;
                    case 'restricted': iconHtml = '🚫'; bgColor = '#ef4444'; break;
                    case 'hospital': iconHtml = '🏥'; bgColor = '#3b82f6'; break;
                    case 'police': iconHtml = '👮'; bgColor = '#8b5cf6'; break;
                    default: iconHtml = '📍'; bgColor = '#6b7280';
                }
                return L.divIcon({
                    html: '<div style="background: ' + bgColor + '; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">' + iconHtml + '</div>',
                    iconSize: [30, 30],
                    className: 'zone-marker'
                });
            }
            
            function getZoneEmoji(type) {
                switch(type) {
                    case 'safe': return '🟢';
                    case 'caution': return '🟡';
                    case 'restricted': return '🔴';
                    case 'hospital': return '🏥';
                    case 'police': return '👮';
                    default: return '📍';
                }
            }
            
            function getZoneDescription(type) {
                switch(type) {
                    case 'safe': return 'Safe area for tourists. Well-patrolled and secure.';
                    case 'caution': return 'Exercise caution. Watch for pickpockets and scams.';
                    case 'restricted': return 'High-risk area. Avoid if possible, especially at night.';
                    case 'hospital': return 'Medical facilities available. Emergency services nearby.';
                    case 'police': return 'Police station area. Safe zone with law enforcement.';
                    default: return 'General area.';
                }
            }
            
            // Create animated user location marker
            var userIcon = L.divIcon({
                html: '<div style="background: #22c55e; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 15px rgba(34,197,94,0.8); animation: pulse 1s infinite;"></div>',
                iconSize: [16, 16],
                className: 'live-user-marker'
            });
            
            marker = L.marker([${location.latitude}, ${location.longitude}], {icon: userIcon})
                .addTo(map)
                .bindPopup('<b>🚀 Live Location</b><br>Accurate GPS Tracking')
                .openPopup();
            
            // Add accuracy circle
            circle = L.circle([${location.latitude}, ${location.longitude}], {
                color: '#22c55e',
                fillColor: '#22c55e',
                fillOpacity: 0.1,
                radius: Math.max(${accuracy}, 10)
            }).addTo(map);
            
            // Trail polyline
            var trailLine = L.polyline([], {
                color: '#2563eb',
                weight: 3,
                opacity: 0.7
            }).addTo(map);
            
            // Listen for location updates
            window.addEventListener('message', function(event) {
                try {
                    var data = JSON.parse(event.data);
                    if (data.type === 'updateLocation') {
                        // Update marker position
                        marker.setLatLng([data.latitude, data.longitude]);
                        
                        // Update accuracy circle
                        circle.setLatLng([data.latitude, data.longitude]);
                        circle.setRadius(Math.max(data.accuracy, 10));
                        
                        // Add to trail
                        trail.push([data.latitude, data.longitude]);
                        if (trail.length > 50) trail.shift(); // Keep last 50 points
                        trailLine.setLatLngs(trail);
                        
                        // Update info panel with ultra-precise data
                        document.getElementById('coords').textContent = 
                            'Lat: ' + data.latitude.toFixed(7) + ', Lng: ' + data.longitude.toFixed(7);
                        document.getElementById('headingInfo').textContent = 
                            'Heading: ' + (data.heading || 0).toFixed(0) + '°';
                        document.getElementById('accuracy').textContent = 
                            'Accuracy: ±' + data.accuracy.toFixed(1) + 'm | Alt: ' + (data.altitude || 0).toFixed(0) + 'm';
                        
                        // Update zone info if available
                        if (data.zone && data.zoneColor) {
                            var zoneElement = document.getElementById('zoneInfo');
                            if (zoneElement) {
                                zoneElement.textContent = 'Zone: ' + data.zone;
                                zoneElement.style.color = data.zoneColor;
                            }
                        }
                        
                        // Center map on new location
                        map.setView([data.latitude, data.longitude], map.getZoom());
                        
                        // Update popup with live data
                        marker.setPopupContent('<b>🚀 Ultra-Precise Live Location</b><br>' +
                            'Heading: ' + (data.heading || 0).toFixed(0) + '°<br>' +
                            'Altitude: ' + (data.altitude || 0).toFixed(0) + 'm<br>' +
                            'Accuracy: ±' + data.accuracy.toFixed(1) + 'm');
                    }
                } catch (e) {
                    console.error('Error parsing message:', e);
                }
            });
            
            // Enable all map interactions
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
        </script>
    </body>
    </html>
    `;
  };

  const cardColor = isDark ? "#23272f" : "#fff";
  const textColor = isDark ? "#fff" : "#181c20";
  const textSecondary = isDark ? "#aaa" : "#555";

  if (isLoading) {
    return (
      <View style={[styles.container, style, { backgroundColor: cardColor }]}>
        <View style={styles.loadingContainer}>
          <Zap size={32} color="#22c55e" />
          <Text style={[styles.loadingText, { color: textColor }]}>Starting live tracking...</Text>
        </View>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={[styles.container, style, { backgroundColor: cardColor }]}>
        <View style={styles.errorContainer}>
          <MapPin size={32} color="#ef4444" />
          <Text style={[styles.errorText, { color: textColor }]}>Unable to start tracking</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={startRealTimeTracking}
          >
            <Navigation size={16} color="#fff" />
            <Text style={styles.retryText}>Start Tracking</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: generateMapHTML() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={false}
      />

      {!compact && (
        <View style={styles.controlsContainer}>
          <View style={[styles.statusIndicator, { backgroundColor: cardColor }]}> 
            <View style={[styles.liveIndicator, { backgroundColor: isTracking ? '#22c55e' : '#ef4444' }]} />
            <Text style={[styles.statusText, { color: textColor }]}> 
              {isTracking ? 'LIVE' : 'OFFLINE'}
            </Text>
            <Text style={[styles.speedText, { color: textSecondary }]}> 
              {(speed * 3.6).toFixed(1)} km/h | {heading.toFixed(0)}°
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.trackingButton, { backgroundColor: isTracking ? '#ef4444' : '#22c55e' }]} 
            onPress={isTracking ? stopTracking : startRealTimeTracking}
          >
            {isTracking ? <MapPin size={20} color="#fff" /> : <Navigation size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  speedText: {
    fontSize: 11,
    fontWeight: '500',
  },
  trackingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
