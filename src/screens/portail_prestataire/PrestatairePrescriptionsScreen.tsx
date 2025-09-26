import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';

interface PrestatairePrescriptionsScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

const PrestatairePrescriptionsScreen: React.FC<PrestatairePrescriptionsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();

  const prescriptionOptions = [
    {
      id: 'garantie',
      title: 'Par Garantie',
      subtitle: 'Voir par type de garantie',
      icon: 'shield-checkmark-outline',
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      route: 'PrescriptionByGarantie'
    },
    {
      id: 'famille',
      title: 'Par Famille',
      subtitle: 'Consulter par famille',
      icon: 'people-outline',
      color: '#2196F3',
      bgColor: '#E3F2FD',
      route: 'PrescriptionByFamille'
    },
    {
      id: 'attente',
      title: 'En Attente',
      subtitle: 'Consulter les ententes préalables',
      icon: 'time-outline',
      color: '#FF9800',
      bgColor: '#FFF3E0',
      route: 'PrescriptionEnAttente'
    }
  ];

  const handleOptionPress = (route: string) => {
    console.log('Navigation vers:', route);
    // navigation.navigate(route);
  };

  const renderOption = (option: typeof prescriptionOptions[0], index: number) => (
    <TouchableOpacity
      key={option.id}
      style={[
        styles.optionCard,
        { 
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          marginLeft: index % 2 === 0 ? 0 : 8,
          marginRight: index % 2 === 1 ? 0 : 8,
        }
      ]}
      onPress={() => handleOptionPress(option.route)}
      activeOpacity={0.7}
    >
      {/* Icon Container */}
      <View style={[styles.iconContainer, { backgroundColor: option.bgColor }]}>
        <Ionicons name={option.icon as any} size={24} color={option.color} />
      </View>

      {/* Content */}
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, { color: theme.colors.textPrimary }]}>
          {option.title}
        </Text>
        <Text style={[styles.optionSubtitle, { color: theme.colors.textSecondary }]}>
          {option.subtitle}
        </Text>
      </View>

      {/* Arrow */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Prescriptions</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: theme.colors.textPrimary }]}>
            Consulter les Prescriptions
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.colors.textSecondary }]}>
            Choisissez le type de prescription à consulter
          </Text>
        </View>

        {/* Options Grid */}
        <View style={styles.optionsContainer}>
          {prescriptionOptions.map((option, index) => renderOption(option, index))}
        </View>
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
    paddingHorizontal: 20,
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
  headerSpacer: {
    width: 40,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: 20,
  },
  optionCard: {
    width: (width - 56) / 2,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionContent: {
    flex: 1,
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    lineHeight: 20,
  },
  optionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  arrowContainer: {
    alignItems: 'flex-end',
  },
});

export default PrestatairePrescriptionsScreen;
