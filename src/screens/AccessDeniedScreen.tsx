import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const AccessDeniedScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleRetry = () => {
    navigation.navigate('PortalSelection' as never);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? "light" : "dark"} backgroundColor={theme.colors.background} />
      
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '20' }]}>
          <Ionicons name="lock-closed" size={64} color={theme.colors.error} />
        </View>
        
        <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
          Accès Refusé
        </Text>
        
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          Vous n'avez pas les autorisations nécessaires pour accéder à ce portail.
        </Text>
        
        <Text style={[styles.subMessage, { color: theme.colors.textSecondary }]}>
          Veuillez vous connecter avec les identifiants appropriés.
        </Text>
        
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleRetry}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default AccessDeniedScreen;
