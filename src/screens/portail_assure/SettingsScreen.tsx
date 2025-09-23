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
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  const settingsSections = [
    {
      title: 'Préférences',
      items: [
        {
          icon: 'moon-outline',
          title: 'Mode sombre',
          subtitle: 'Activer le thème sombre',
          type: 'toggle',
          value: isDark,
          onToggle: toggleTheme,
        },
        {
          icon: 'notifications-outline',
          title: 'Notifications',
          subtitle: 'Recevoir des notifications',
          type: 'toggle',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          icon: 'finger-print-outline',
          title: 'Authentification biométrique',
          subtitle: 'Utiliser l\'empreinte digitale',
          type: 'toggle',
          value: biometricEnabled,
          onToggle: setBiometricEnabled,
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        {
          icon: 'person-outline',
          title: 'Informations personnelles',
          subtitle: 'Modifier vos informations',
          type: 'navigation',
          onPress: () => navigation.openDrawer?.(),
        },
        {
          icon: 'key-outline',
          title: 'Changer le mot de passe',
          subtitle: 'Modifier votre mot de passe',
          type: 'navigation',
          onPress: () => console.log('Changer mot de passe'),
        },
      ],
    },
    {
      title: 'Application',
      items: [
        {
          icon: 'help-circle-outline',
          title: 'Aide et support',
          subtitle: 'Obtenir de l\'aide',
          type: 'navigation',
          onPress: () => console.log('Aide'),
        },
        {
          icon: 'information-circle-outline',
          title: 'À propos',
          subtitle: 'Version 1.0.0',
          type: 'navigation',
          onPress: () => console.log('À propos'),
        },
        {
          icon: 'shield-checkmark-outline',
          title: 'Politique de confidentialité',
          subtitle: 'Lire notre politique',
          type: 'navigation',
          onPress: () => console.log('Politique'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    return (
      <TouchableOpacity
        key={item.title}
        style={[styles.settingItem, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingLeft}>
          <View style={[styles.settingIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.settingContent}>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
              {item.title}
            </Text>
            <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
              {item.subtitle}
            </Text>
          </View>
        </View>
        
        {item.type === 'toggle' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
            thumbColor={item.value ? theme.colors.primary : theme.colors.textSecondary}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" />
      
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
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              {section.title}
            </Text>
            <View style={[styles.sectionContent, { backgroundColor: theme.colors.surface }]}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex}>
                  {renderSettingItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  separator: {
    height: 1,
    marginLeft: 64,
  },
});

export default SettingsScreen;
