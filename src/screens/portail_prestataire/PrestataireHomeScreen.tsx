import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';

interface PrestataireHomeScreenProps {
  navigation: any;
}

const PrestataireHomeScreen: React.FC<PrestataireHomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simuler le chargement des données
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const quickActions = [
    { 
      title: 'Statistiques KPI', 
      subtitle: 'Voir les performances',
      icon: 'analytics-outline', 
      color: theme.colors.primary,
      bgColor: theme.colors.primaryLight,
      action: 'kpi'
    },
    { 
      title: 'Résumé d\'activité', 
      subtitle: 'Synthèse des activités',
      icon: 'bar-chart-outline', 
      color: theme.colors.primary,
      bgColor: theme.colors.primaryLight,
      action: 'summary'
    },
    { 
      title: 'Gestion patients', 
      subtitle: 'Suivi des patients',
      icon: 'people-outline', 
      color: '#FF9800',
      bgColor: '#FFF3E0',
      action: 'patients'
    },
    { 
      title: 'Rapports', 
      subtitle: 'Générer des rapports',
      icon: 'document-text-outline', 
      color: '#7B1FA2',
      bgColor: '#F3E5F5',
      action: 'reports'
    },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'kpi':
        navigation.navigate('Reports', { screen: 'kpi' });
        break;
      case 'summary':
        console.log('Navigation vers Résumé d\'activité');
        break;
      case 'patients':
        navigation.navigate('Patients');
        break;
      case 'reports':
        navigation.navigate('Reports');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      <ScrollView 
        style={[styles.container, { backgroundColor: theme.colors.background }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => navigation.openDrawer?.()}
            >
              <Ionicons name="menu-outline" size={20} color="white" />
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>

          <View style={styles.welcomeContent}>
            <View style={styles.welcomeText}>
              <Text style={styles.greeting}>
                Bonjour,
              </Text>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {user ? `${user.prenom} ${user.nom}` : 'Prestataire'}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                {user ? `ID: ${user.id}` : ''}
              </Text>
              
              <View style={styles.statusContainer}>
                <View style={styles.statusItem}>
                  <Ionicons name="business-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.statusText}>
                    CLINIQUE LA PROVIDENCE
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="checkmark-circle-outline" size={14} color={'#3d8f9d'} />
                  <Text style={[styles.statusText, { color: '#3d8f9d' }]}>
                    Actif
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}> 
                <Ionicons name="medical" size={32} color={'#3d8f9d'} />
              </View>
              <View style={styles.onlineIndicator} />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Tableau de bord
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleQuickAction(action.action)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>{action.title}</Text>
                <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Statistics Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Aperçu des activités
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>10</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Consultations</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>14</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Ordonnances</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="flask-outline" size={24} color={'#FF9800'} />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>16</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Médicaments</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
              <Ionicons name="receipt-outline" size={24} color={'#2196F3'} />
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>30</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Factures</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeText: {
    flex: 1,
    minWidth: 0,
    maxWidth: '70%',
    flexShrink: 1,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statusContainer: {
    marginTop: 12,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.8)',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3d8f9d',
    borderWidth: 2,
    borderColor: 'white',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default PrestataireHomeScreen;
