import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

interface PortalSelectionScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const PortalSelectionScreen: React.FC<PortalSelectionScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;
  const float4 = useRef(new Animated.Value(0)).current;
  const float5 = useRef(new Animated.Value(0)).current;
  const float6 = useRef(new Animated.Value(0)).current;
  const float7 = useRef(new Animated.Value(0)).current;
  const float8 = useRef(new Animated.Value(0)).current;
  const float9 = useRef(new Animated.Value(0)).current;
  const float10 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createFloat = (val: Animated.Value, delay: number, distance: number, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, delay, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, delay: 0, useNativeDriver: true }),
        ])
      ).start();

    // Slightly faster and varied durations
    createFloat(float1, 0, 10, 2400);
    createFloat(float2, 300, 12, 2200);
    createFloat(float3, 600, 8, 2300);
    createFloat(float4, 900, 14, 2100);
    createFloat(float5, 1200, 9, 2350);
    createFloat(float6, 1500, 11, 2250);
    createFloat(float7, 1800, 7, 2000);
    createFloat(float8, 2100, 13, 2150);
    createFloat(float9, 2400, 6, 2050);
    createFloat(float10, 2700, 15, 1950);
  }, [float1, float2, float3, float4, float5, float6, float7, float8, float9, float10]);

  const handlePortalSelection = (portalType: 'assure' | 'prestataire') => {
    console.log('🔵 PortalSelection - Sélection du portail:', portalType);
    
    if (portalType === 'assure') {
      console.log('🔵 Navigation vers AssureApp -> Login');
      navigation.navigate('AssureApp', { screen: 'Login' });
    } else {
      console.log('🔵 Navigation vers PrestataireApp -> PrestataireLogin');
      navigation.navigate('PrestataireApp', { screen: 'PrestataireLogin' });
    }
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Bulles d'arrière-plan statiques */}
        <View style={styles.bubblesContainer}>
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble1,
              { backgroundColor: theme.colors.primary + '20' },
              {
                transform: [
                  {
                    translateY: float1.interpolate({ inputRange: [0, 1], outputRange: [0, -10] }),
                  },
                  { scale: float1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble2,
              { backgroundColor: theme.colors.primary + '25' },
              {
                transform: [
                  { translateY: float2.interpolate({ inputRange: [0, 1], outputRange: [0, -12] }) },
                  { scale: float2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble3,
              { backgroundColor: theme.colors.primary + '15' },
              {
                transform: [
                  { translateY: float3.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
                  { scale: float3.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble4,
              { backgroundColor: theme.colors.primary + '22' },
              {
                transform: [
                  { translateY: float4.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }) },
                  { scale: float4.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble5,
              { backgroundColor: theme.colors.primary + '18' },
              {
                transform: [
                  { translateY: float5.interpolate({ inputRange: [0, 1], outputRange: [0, -9] }) },
                  { scale: float5.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble6,
              { backgroundColor: theme.colors.primary + '20' },
              {
                transform: [
                  { translateY: float6.interpolate({ inputRange: [0, 1], outputRange: [0, -11] }) },
                  { scale: float6.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble7,
              { backgroundColor: theme.colors.primary + '14' },
              {
                transform: [
                  { translateY: float7.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
                  { scale: float7.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble8,
              { backgroundColor: theme.colors.primary + '1F' },
              {
                transform: [
                  { translateY: float8.interpolate({ inputRange: [0, 1], outputRange: [0, -13] }) },
                  { scale: float8.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble9,
              { backgroundColor: theme.colors.primary + '12' },
              {
                transform: [
                  { translateY: float9.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
                  { scale: float9.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) },
                ],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bubble,
              styles.bubble10,
              { backgroundColor: theme.colors.primary + '26' },
              {
                transform: [
                  { translateY: float10.interpolate({ inputRange: [0, 1], outputRange: [0, -15] }) },
                  { scale: float10.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
                ],
              },
            ]}
          />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="medical-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Medicalee
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Choisissez votre portail d'accès
          </Text>
        </View>

        {/* Portal Selection Cards */}
        <View style={styles.cardsContainer}>
          {/* Assuré Portal Card */}
          <TouchableOpacity
            style={[styles.portalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => handlePortalSelection('assure')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="person-outline" size={30} color={theme.colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Portail Assuré
            </Text>
            <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              Accédez à vos informations personnelles, ordonnances et historique médical
            </Text>
            <View style={styles.cardFooter}>
              <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>

          {/* Prestataire Portal Card */}
          <TouchableOpacity
            style={[styles.portalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={() => handlePortalSelection('prestataire')}
            activeOpacity={0.8}
          >
            <View style={[styles.cardIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="business-outline" size={30} color={theme.colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Portail Prestataire
            </Text>
            <Text style={[styles.cardDescription, { color: theme.colors.textSecondary }]}>
              Gérez vos prestations, patients et rapports médicaux
            </Text>
            <View style={styles.cardFooter}>
              <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Version 1.0.0
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(61, 143, 157, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  cardsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 16,
    paddingTop: 20,
  },
  portalCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 160,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
    flex: 1,
  },
  cardFooter: {
    alignSelf: 'flex-end',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  footerText: {
    fontSize: 11,
  },
  // Styles pour les bulles d'arrière-plan
  bubblesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 50,
  },
  bubble1: {
    width: 80,
    height: 80,
    top: '15%',
    left: '10%',
  },
  bubble2: {
    width: 120,
    height: 120,
    top: '25%',
    right: '15%',
  },
  bubble3: {
    width: 60,
    height: 60,
    top: '45%',
    left: '5%',
  },
  bubble4: {
    width: 100,
    height: 100,
    top: '60%',
    right: '8%',
  },
  bubble5: {
    width: 70,
    height: 70,
    top: '75%',
    left: '20%',
  },
  bubble6: {
    width: 90,
    height: 90,
    top: '80%',
    right: '25%',
  },
  bubble7: {
    width: 50,
    height: 50,
    top: '20%',
    right: '40%',
  },
  bubble8: {
    width: 130,
    height: 130,
    top: '35%',
    left: '35%',
  },
  bubble9: {
    width: 45,
    height: 45,
    top: '68%',
    right: '12%',
  },
  bubble10: {
    width: 110,
    height: 110,
    top: '10%',
    left: '70%',
  },
});

export default PortalSelectionScreen;