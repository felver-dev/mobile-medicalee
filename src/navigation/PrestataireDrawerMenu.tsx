import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { usePrestataireTheme } from '../context/PrestataireThemeContext';
import LogoutModal from '../components/LogoutModal';
import { useModal } from '../hooks/useModal';
import CustomModal from '../components/CustomModal';

interface PrestataireDrawerMenuProps {
  navigation: any;
}

const PrestataireDrawerMenu: React.FC<PrestataireDrawerMenuProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme } = usePrestataireTheme();
  const { modalState, showAlert } = useModal();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    { icon: 'analytics-outline', label: 'Tableau de bord', screen: 'MainTabs' },
    { icon: 'medical-outline', label: 'Médicaments', screen: 'Medicaments' },
    { icon: 'document-text-outline', label: 'Rapports', screen: 'Reports' },
    { icon: 'person-outline', label: 'Mon Profil', screen: 'Profile' },
    { icon: 'settings-outline', label: 'Paramètres', screen: 'Settings' },
  ];

  const handleMenuPress = (screen: string) => {
    if (screen === 'MainTabs') {
      navigation.navigate('MainTabs');
    } else if (screen === 'Medicaments') {
      // Naviguer vers l'onglet Médicaments dans le TabNavigator
      navigation.navigate('MainTabs', { screen: 'Medicaments' });
    } else if (screen === 'Reports') {
      // Naviguer vers l'onglet Reports dans le TabNavigator
      navigation.navigate('MainTabs', { screen: 'Reports' });
    } else {
      navigation.navigate(screen);
    }
    navigation.closeDrawer();
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // Navigation vers PortalSelection au niveau du MainNavigator
      navigation.getParent()?.navigate('PortalSelection');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="medical" size={32} color={'#FFFFFF'} />
            </View>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {user ? `${user.prenom} ${user.nom}` : 'Prestataire'}
            </Text>
            <Text style={styles.userRole} numberOfLines={1}>
              {user?.prestataire_libelle || 'Prestataire'}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              { borderBottomColor: theme.colors.border }
            ]}
            onPress={() => handleMenuPress(item.screen)}
          >
            <View style={styles.menuItemContent}>
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={theme.colors.textPrimary} 
              />
              <Text style={[styles.menuItemText, { color: theme.colors.textPrimary }]}>
                {item.label}
              </Text>
            </View>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={theme.colors.textSecondary} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.footerSeparator, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={styles.footerItem}
            onPress={() => showAlert('Aide', 'Fonctionnalité à venir', 'info')}
          >
            <Ionicons name="help-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Aide et support
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.footerItem}
            onPress={() => showAlert('Version', 'Version 1.0.0', 'info')}
          >
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Version 1.0.0
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={'#F44336'} />
          <Text style={[styles.logoutText, { color: '#F44336' }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        loading={isLoggingOut}
      />

      {/* Custom Modal */}
      <CustomModal {...modalState} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  footerSeparator: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 15,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});

export default PrestataireDrawerMenu;
