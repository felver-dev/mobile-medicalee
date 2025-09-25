import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Screens
import LoginScreen from '../screens/portail_assure/LoginScreen';
import HomeScreen from '../screens/portail_assure/HomeScreen';
import FamilyScreen from '../screens/portail_assure/FamilyScreen';
import ExpensesScreen from '../screens/portail_assure/ExpensesScreen';
import MedicamentsScreen from '../screens/portail_assure/MedicamentsScreen';
import MedicamentDetailsScreen from '../screens/portail_assure/MedicamentDetailsScreen';
import ProfileScreen from '../screens/portail_assure/ProfileScreen';
import SettingsScreen from '../screens/portail_assure/SettingsScreen';
import PharmacyGuardScreen from '../screens/portail_assure/PharmacyGuardScreen';
import CareNetworkScreen from '../screens/portail_assure/CareNetworkScreen';
import AssureClassicPrescriptionsScreen from '../screens/portail_assure/AssureClassicPrescriptionsScreen';
import AssureEPPrescriptionsScreen from '../screens/portail_assure/AssureEPPrescriptionsScreen';
import DrawerMenu from './DrawerMenu';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Bottom Tab Navigator pour les assurés
const AssureTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Family') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Expenses') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Accueil',
        }}
      />
      <Tab.Screen 
        name="Family" 
        component={FamilyScreen}
        options={{
          tabBarLabel: 'Famille',
        }}
      />
      <Tab.Screen 
        name="Expenses" 
        component={ExpensesScreen}
        options={{
          tabBarLabel: 'Dépenses',
        }}
      />
    </Tab.Navigator>
  );
};

// Drawer Navigator pour les assurés
const AssureDrawerNavigator: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerMenu {...props} />}
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
      <Drawer.Screen name="MainTabs" component={AssureTabNavigator} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
};

// Main Assure Navigator avec Login
const AssureNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainApp" component={AssureDrawerNavigator} />
      <Stack.Screen name="Medicaments" component={MedicamentsScreen} />
      <Stack.Screen name="MedicamentDetails" component={MedicamentDetailsScreen} />
      <Stack.Screen name="PharmacyGuard" component={PharmacyGuardScreen} />
      <Stack.Screen name="CareNetwork" component={CareNetworkScreen} />
      <Stack.Screen name="ClassicPrescriptions" component={AssureClassicPrescriptionsScreen} />
      <Stack.Screen name="EPPrescriptions" component={AssureEPPrescriptionsScreen} />
    </Stack.Navigator>
  );
};

export default AssureNavigator;
