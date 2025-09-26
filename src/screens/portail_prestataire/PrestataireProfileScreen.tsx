import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';

interface PrestataireProfileScreenProps {
  navigation: any;
}

const PrestataireProfileScreen: React.FC<PrestataireProfileScreenProps> = ({ navigation }) => {
  const { theme } = usePrestataireTheme();
  const { user, logout } = useAuth();

  // Données mockées supplémentaires pour la démonstration
  const mockProfileData = {
    phone: '+225 07 12 34 56 78',
    address: 'Abidjan, Côte d\'Ivoire',
    speciality: 'Médecine générale',
    experience: '15 ans d\'expérience',
    licenseNumber: 'MED-2024-001',
    lastLogin: '2024-01-15 14:30',
    totalPatients: 89,
    totalConsultations: 156
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation vers PortalSelection au niveau du MainNavigator
      navigation.getParent()?.navigate('PortalSelection');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleMenuPress = (menuType: string) => {
    switch (menuType) {
      case 'personal':
        console.log('Navigation vers informations personnelles');
        break;
      case 'prestataire':
        console.log('Navigation vers informations prestataire');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'help':
        console.log('Navigation vers aide et support');
        break;
      default:
        break;
    }
  };

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }]}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.openDrawer?.()}
          >
            <Ionicons name="menu-outline" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              {user && user.image_url ? (
                <Image source={{ uri: user.image_url }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarText}>
                  {user?.prenom?.charAt(0) || ''}{user?.nom?.charAt(0) || ''}
                </Text>
              )}
            </View>
          </View>
          <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
            {user?.prenom} {user?.nom}
          </Text>
          <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
            {user?.email}
          </Text>
          <Text style={[styles.userPrestataire, { color: theme.colors.textSecondary }]}>
            {user?.prestataire_libelle}
          </Text>
          <Text style={[styles.userId, { color: theme.colors.textSecondary }]}>
            ID: {user?.prestataire_id}
          </Text>
        </View>

        {/* Additional Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
            Informations complémentaires
          </Text>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {mockProfileData.phone}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {mockProfileData.address}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="medical-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {mockProfileData.speciality}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
              {mockProfileData.experience}
            </Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
            Statistiques
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {mockProfileData.totalPatients}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Patients
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {mockProfileData.totalConsultations}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Consultations
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleMenuPress('personal')}
          >
            <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Informations personnelles</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleMenuPress('prestataire')}
          >
            <Ionicons name="business-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Informations prestataire</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleMenuPress('settings')}
          >
            <Ionicons name="settings-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Paramètres</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleMenuPress('help')}
          >
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Aide et support</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: theme.colors.surface }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#F44336" />
            <Text style={[styles.menuText, { color: '#F44336' }]}>Déconnexion</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8F4F8',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  userPrestataire: {
    fontSize: 14,
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F4F8',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F4F8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F4F8',
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
});

export default PrestataireProfileScreen;
