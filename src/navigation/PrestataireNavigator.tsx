import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrestataireTheme } from '../context/PrestataireThemeContext';

// Screens
import PrestataireLoginScreen from '../screens/portail_prestataire/PrestataireLoginScreen';
import PrestataireHomeScreen from '../screens/portail_prestataire/PrestataireHomeScreen';
import PrestataireDashboardScreen from '../screens/portail_prestataire/PrestataireDashboardScreen';
import PrestatairePrestationsScreen from '../screens/portail_prestataire/PrestatairePrestationsScreen';
import PrestataireReportsScreen from '../screens/portail_prestataire/PrestataireReportsScreen';
import PrestataireProfileScreen from '../screens/portail_prestataire/PrestataireProfileScreen';
import PrestataireSettingsScreen from '../screens/portail_prestataire/PrestataireSettingsScreen';
import PrestataireMedicamentsScreen from '../screens/portail_prestataire/PrestataireMedicamentsScreen';
import MedicamentDetailsScreen from '../screens/portail_assure/MedicamentDetailsScreen';
import PrestataireServeMedicamentsScreen from '../screens/portail_prestataire/PrestataireServeMedicamentsScreen';
import PrestataireQuantitySelectionScreen from '../screens/portail_prestataire/PrestataireQuantitySelectionScreen';
import PrestatairePrescriptionsScreen from '../screens/portail_prestataire/PrestatairePrescriptionsScreen';
import PrescriptionByGarantieScreen from '../screens/portail_prestataire/PrescriptionByGarantieScreen';
import PrescriptionByFamilleScreen from '../screens/portail_prestataire/PrescriptionByFamilleScreen';
import PrescriptionEnAttenteScreen from '../screens/portail_prestataire/PrescriptionEnAttenteScreen';
import PrestataireDrawerMenu from './PrestataireDrawerMenu';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Bottom Tab Navigator pour les prestataires
function PrestataireTabNavigator() {
  const { theme } = usePrestataireTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-outline';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Prestations') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Prescriptions') {
            iconName = focused ? 'document' : 'document-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Medicaments') {
            iconName = focused ? 'medical' : 'medical-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={PrestataireDashboardScreen}
        options={{
          title: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Prestations" 
        component={PrestatairePrestationsScreen}
        options={{
          title: 'Prestations',
        }}
      />
      <Tab.Screen 
        name="Prescriptions" 
        component={PrestatairePrescriptionsScreen}
        options={{
          title: 'Prescriptions',
        }}
      />
      <Tab.Screen 
        name="Reports" 
        component={PrestataireReportsScreen}
        options={{
          title: 'Rapports',
        }}
      />
      <Tab.Screen 
        name="Medicaments" 
        component={PrestataireMedicamentsScreen}
        options={{
          title: 'Médicaments',
        }}
      />
    </Tab.Navigator>
  );
}

// Drawer Navigator pour les prestataires
const PrestataireDrawerNavigator: React.FC = () => {
  const { theme } = usePrestataireTheme();
  
  return (
    <Drawer.Navigator
      drawerContent={(props) => <PrestataireDrawerMenu {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.colors.background,
          width: 280,
        },
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Drawer.Screen name="MainTabs" component={PrestataireTabNavigator} />
      <Drawer.Screen name="Profile" component={PrestataireProfileScreen} />
      <Drawer.Screen name="Settings" component={PrestataireSettingsScreen} />
    </Drawer.Navigator>
  );
};

// Main Prestataire Navigator avec Login
const PrestataireNavigator: React.FC = () => {
  console.log('🔵 PrestataireNavigator - Composant rendu');
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PrestataireLogin" component={PrestataireLoginScreen} />
      <Stack.Screen name="MainApp" component={PrestataireDrawerNavigator} />
      <Stack.Screen name="MedicamentDetails" component={MedicamentDetailsScreen} />
      <Stack.Screen name="ServeMedicaments" component={PrestataireServeMedicamentsScreen} />
      <Stack.Screen name="QuantitySelection" component={PrestataireQuantitySelectionScreen} />
      <Stack.Screen name="PrescriptionByGarantie" component={PrescriptionByGarantieScreen} />
      <Stack.Screen name="PrescriptionByFamille" component={PrescriptionByFamilleScreen} />
      <Stack.Screen name="PrescriptionEnAttente" component={PrescriptionEnAttenteScreen} />
    </Stack.Navigator>
  );
};

export default PrestataireNavigator;