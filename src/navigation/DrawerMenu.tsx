import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import LogoutModal from '../components/LogoutModal';

interface DrawerMenuProps {
  navigation: any;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const menuItems = [
    {
      title: 'Accueil',
      icon: 'home-outline',
      screen: 'MainTabs',
      params: { screen: 'Home' },
    },
    {
      title: 'Mon profil',
      icon: 'person-outline',
      screen: 'Profile',
    },
    {
      title: 'Paramètres',
      icon: 'settings-outline',
      screen: 'Settings',
    },
    {
      title: 'Famille',
      icon: 'people-outline',
      screen: 'MainTabs',
      params: { screen: 'Family' },
    },
    {
      title: 'Dépenses',
      icon: 'receipt-outline',
      screen: 'MainTabs',
      params: { screen: 'Expenses' },
    },
  ];

  const handleMenuPress = (item: any) => {
    if (item.params) {
      navigation.navigate(item.screen, item.params);
    } else {
      navigation.navigate(item.screen);
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
      navigation.closeDrawer();
      // Naviguer vers l'écran de sélection du portail après déconnexion
      navigation.navigate('PortalSelection');
    } catch (error) {
      console.error('Logout error:', error);
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
          <View style={[styles.avatar, { backgroundColor: theme.colors.textInverse }]}>
            {user && user.image_url ? (
              <Image source={{ uri: user.image_url }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Ionicons name="person" size={32} color={theme.colors.primary} />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: theme.colors.textInverse }]} numberOfLines={1}>
              {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
            </Text>
            <Text style={[styles.userMatricule, { color: theme.colors.primaryLight }]} numberOfLines={1}>
              {user ? `Matricule: ${user.beneficiaire_matricule}` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={() => handleMenuPress(item)}
          >
            <View style={styles.menuLeft}>
              <Ionicons 
                name={item.icon as any} 
                size={24} 
                color={theme.colors.textPrimary} 
              />
              <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>
                {item.title}
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
        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={[styles.logoutText, { color: theme.colors.error }]}>
            Se déconnecter
          </Text>
        </TouchableOpacity>
        
        <View style={[styles.footerSeparator, { borderTopColor: theme.colors.border }]}>
          <View style={styles.footerItem}>
            <Ionicons name="help-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Aide et support
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>
      </View>

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        loading={isLoggingOut}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 60,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userMatricule: {
    fontSize: 14,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  footerSeparator: {
    borderTopWidth: 1,
    paddingTop: 20,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 14,
    marginLeft: 12,
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

export default DrawerMenu;
