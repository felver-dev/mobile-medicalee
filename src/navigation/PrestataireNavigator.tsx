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
import PrestatairePrestationsScreen from '../screens/portail_prestataire/PrestatairePrestationsScreen';
import PrestataireReportsScreen from '../screens/portail_prestataire/PrestataireReportsScreen';
import PrestataireProfileScreen from '../screens/portail_prestataire/PrestataireProfileScreen';
import PrestataireSettingsScreen from '../screens/portail_prestataire/PrestataireSettingsScreen';
import PrestataireMedicamentsScreen from '../screens/portail_prestataire/PrestataireMedicamentsScreen';
import MedicamentDetailsScreen from '../screens/portail_assure/MedicamentDetailsScreen';
import PrestataireServeMedicamentsScreen from '../screens/portail_prestataire/PrestataireServeMedicamentsScreen';
import PrestataireQuantitySelectionScreen from '../screens/portail_prestataire/PrestataireQuantitySelectionScreen';
import PrestatairePrescriptionsScreen from '../screens/portail_prestataire/PrestatairePrescriptionsScreen';
import PrestataireOrdonnancesScreen from '../screens/portail_prestataire/PrestataireOrdonnancesScreen';
import OrdonnanceByGarantieScreen from '../screens/portail_prestataire/OrdonnanceByGarantieScreen';
import OrdonnanceByAssureScreen from '../screens/portail_prestataire/OrdonnanceByAssureScreen';
import PrescriptionByGarantieScreen from '../screens/portail_prestataire/PrescriptionByGarantieScreen';
import PrescriptionEnAttenteScreen from '../screens/portail_prestataire/PrescriptionEnAttenteScreen';
import PrescriptionEntentePrealableScreen from '../screens/portail_prestataire/PrescriptionEntentePrealableScreen';
import PrestationsByGarantieScreen from '../screens/portail_prestataire/PrestationsByGarantieScreen';
import PrestationsByFamilleScreen from '../screens/portail_prestataire/PrestationsByFamilleScreen';
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

          if (route.name === 'Prestations') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Prescriptions') {
            iconName = focused ? 'document' : 'document-outline';
          } else if (route.name === 'Ordonnances') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
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
        name="Ordonnances" 
        component={PrestataireOrdonnancesScreen}
        options={{
          title: 'Ordonnances',
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
        <Stack.Screen name="PrescriptionEnAttente" component={PrescriptionEnAttenteScreen} />
        <Stack.Screen name="PrescriptionEntentePrealable" component={PrescriptionEntentePrealableScreen} />
        <Stack.Screen name="PrestationsByGarantie" component={PrestationsByGarantieScreen} />
        <Stack.Screen name="PrestationsByFamille" component={PrestationsByFamilleScreen} />
        <Stack.Screen name="OrdonnanceByGarantie" component={OrdonnanceByGarantieScreen} />
        <Stack.Screen name="OrdonnanceByAssure" component={OrdonnanceByAssureScreen} />
    </Stack.Navigator>
  );
};

export default PrestataireNavigator;