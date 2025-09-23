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
  Switch,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';

interface PrestataireSettingsScreenProps {
  navigation: any;
}

const PrestataireSettingsScreen: React.FC<PrestataireSettingsScreenProps> = ({ navigation }) => {
  const { theme, toggleTheme, isDark } = usePrestataireTheme();
  const { user } = useAuth();
  
  // États pour les paramètres
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [language, setLanguage] = useState('Français');

  const handleSettingPress = (settingType: string) => {
    switch (settingType) {
      case 'pushNotifications':
        setPushNotifications(!pushNotifications);
        break;
      case 'emailNotifications':
        setEmailNotifications(!emailNotifications);
        break;
      case 'changePassword':
        Alert.alert('Changer le mot de passe', 'Fonctionnalité à implémenter');
        break;
      case 'biometricAuth':
        setBiometricAuth(!biometricAuth);
        break;
      case 'language':
        Alert.alert('Langue', 'Fonctionnalité à implémenter');
        break;
      case 'darkMode':
        toggleTheme();
        break;
      case 'help':
        Alert.alert('Aide et support', 'Fonctionnalité à implémenter');
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
          <Text style={styles.headerTitle}>Paramètres</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Settings Sections */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Notifications
          </Text>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSettingPress('pushNotifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Notifications push
            </Text>
            <Switch
              value={pushNotifications}
              onValueChange={() => handleSettingPress('pushNotifications')}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={pushNotifications ? '#FFFFFF' : '#f4f3f4'}
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSettingPress('emailNotifications')}
          >
            <Ionicons name="mail-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Notifications email
            </Text>
            <Switch
              value={emailNotifications}
              onValueChange={() => handleSettingPress('emailNotifications')}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={emailNotifications ? '#FFFFFF' : '#f4f3f4'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Sécurité
          </Text>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSettingPress('changePassword')}
          >
            <Ionicons name="lock-closed-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Changer le mot de passe
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSettingPress('biometricAuth')}
          >
            <Ionicons name="finger-print-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Authentification biométrique
            </Text>
            <Switch
              value={biometricAuth}
              onValueChange={() => handleSettingPress('biometricAuth')}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={biometricAuth ? '#FFFFFF' : '#f4f3f4'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Application
          </Text>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSettingPress('language')}
          >
            <Ionicons name="language-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Langue
            </Text>
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
              {language}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSettingPress('darkMode')}
          >
            <Ionicons name={isDark ? "moon" : "moon-outline"} size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Mode sombre
            </Text>
            <Switch
              value={isDark}
              onValueChange={() => handleSettingPress('darkMode')}
              trackColor={{ false: '#767577', true: theme.colors.primary }}
              thumbColor={isDark ? '#FFFFFF' : '#f4f3f4'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            À propos
          </Text>
          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Version de l'application
            </Text>
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
              1.0.0
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
            onPress={() => handleSettingPress('help')}
          >
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Aide et support
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Informations utilisateur
          </Text>
          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Nom d'utilisateur
            </Text>
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
              {user?.prenom} {user?.nom}
            </Text>
          </View>
          <View style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name="business-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>
              Prestataire
            </Text>
            <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
              {user?.prestataire_libelle}
            </Text>
          </View>
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F4F8',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
});

export default PrestataireSettingsScreen;
