import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PortalSelectionScreen from '../screens/PortalSelectionScreen';
import AccessDeniedScreen from '../screens/AccessDeniedScreen';
import AssureNavigator from './AssureNavigator';
import PrestataireNavigator from './PrestataireNavigator';
import { PrestataireThemeProvider } from '../context/PrestataireThemeContext';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

// Wrapper pour le portail Prestataire avec son propre thème
const PrestataireAppWrapper: React.FC = () => {
  return (
    <PrestataireThemeProvider>
      <PrestataireNavigator />
    </PrestataireThemeProvider>
  );
};

const MainNavigator: React.FC = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="PortalSelection"
    >
      <Stack.Screen name="PortalSelection" component={PortalSelectionScreen} />
      <Stack.Screen name="AccessDenied" component={AccessDeniedScreen} />
      <Stack.Screen name="AssureApp" component={AssureNavigator} />
      <Stack.Screen name="PrestataireApp" component={PrestataireAppWrapper} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
