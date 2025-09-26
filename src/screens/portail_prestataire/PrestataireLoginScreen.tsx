import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LoginCredentials } from '../../types';
import CustomModal, { useModal } from '../../components/CustomModal';

interface PrestataireLoginScreenProps {
  navigation: any;
}

const PrestataireLoginScreen: React.FC<PrestataireLoginScreenProps> = ({ navigation }) => {
  console.log('🔵 PrestataireLoginScreen - Composant rendu');
  
  const { theme } = usePrestataireTheme();
  const { isLoading, error, login: loginFunction } = useAuth();
  const { showAlert } = useModal();
  const f1 = useRef(new Animated.Value(0)).current;
  const f2 = useRef(new Animated.Value(0)).current;
  const f3 = useRef(new Animated.Value(0)).current;
  const f4 = useRef(new Animated.Value(0)).current;
  const f5 = useRef(new Animated.Value(0)).current;
  const f6 = useRef(new Animated.Value(0)).current;
  const f7 = useRef(new Animated.Value(0)).current;
  
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const float = (v: Animated.Value, delay: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: dur, delay, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: dur, useNativeDriver: true }),
        ])
      ).start();
    float(f1, 0, 2100);
    float(f2, 200, 2000);
    float(f3, 400, 2050);
    float(f4, 600, 1950);
    float(f5, 800, 2150);
    float(f6, 1000, 1900);
    float(f7, 1200, 1850);
  }, [f1, f2, f3, f4, f5, f6, f7]);

  const handleLogin = async () => {
    if (!login || !password) {
      showAlert('Erreur', 'Veuillez remplir tous les champs', 'warning');
      return;
    }

    console.log('🔵 PrestataireLoginScreen - Tentative de connexion:', { login, password: '***' });

    const credentials: LoginCredentials = {
      login: login,
      password: password,
    };

    try {
      console.log('🔵 Appel loginFunction avec USER_PRESTATAIRE...');
      const success = await loginFunction(credentials, 'USER_PRESTATAIRE');
      console.log('🔵 Résultat loginFunction:', success);
      
      if (success) {
        console.log('🔵 Connexion réussie, navigation vers MainApp...');
        // Navigation vers l'écran d'accueil des prestataires
        navigation.navigate('MainApp');
      } else {
        console.log('🔴 Connexion échouée');
        showAlert('Erreur de connexion', 'Identifiant ou mot de passe incorrect', 'error');
      }
    } catch (error) {
      console.log('🔴 Erreur capturée:', error);
      const errorMessage = error instanceof Error ? error.message : 'Identifiant ou mot de passe incorrect';
      
      // Vérifier si c'est une erreur de type d'utilisateur
      if (errorMessage.includes('Accès refusé')) {
        console.log('🔴 Accès refusé - navigation vers AccessDenied');
        navigation.navigate('AccessDenied', { 
          portalType: 'assuré',
          onRetry: () => navigation.goBack()
        });
      } else {
        console.log('🔴 Erreur autre:', errorMessage);
        showAlert('Erreur de connexion', errorMessage, 'error');
      }
    }
  };

  const handleBackToPortal = () => {
    navigation.goBack();
  };

  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} backgroundColor={theme.colors.background} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Bulles d'arrière-plan animées */}
        <View style={styles.bubblesContainer}>
          <Animated.View style={[styles.bubble, styles.bubble1, { backgroundColor: theme.colors.primary + '20' }, { transform: [ { translateY: f1.interpolate({ inputRange: [0,1], outputRange: [0, -10] }) }, { scale: f1.interpolate({ inputRange: [0,1], outputRange: [1, 1.06] }) } ] } ]} />
          <Animated.View style={[styles.bubble, styles.bubble2, { backgroundColor: theme.colors.primary + '25' }, { transform: [ { translateY: f2.interpolate({ inputRange: [0,1], outputRange: [0, -12] }) }, { scale: f2.interpolate({ inputRange: [0,1], outputRange: [1, 1.06] }) } ] } ]} />
          <Animated.View style={[styles.bubble, styles.bubble3, { backgroundColor: theme.colors.primary + '15' }, { transform: [ { translateY: f3.interpolate({ inputRange: [0,1], outputRange: [0, -8] }) }, { scale: f3.interpolate({ inputRange: [0,1], outputRange: [1, 1.05] }) } ] } ]} />
          <Animated.View style={[styles.bubble, styles.bubble4, { backgroundColor: theme.colors.primary + '22' }, { transform: [ { translateY: f4.interpolate({ inputRange: [0,1], outputRange: [0, -14] }) }, { scale: f4.interpolate({ inputRange: [0,1], outputRange: [1, 1.07] }) } ] } ]} />
          <Animated.View style={[styles.bubble, styles.bubble5, { backgroundColor: theme.colors.primary + '18' }, { transform: [ { translateY: f5.interpolate({ inputRange: [0,1], outputRange: [0, -9] }) }, { scale: f5.interpolate({ inputRange: [0,1], outputRange: [1, 1.05] }) } ] } ]} />
          <Animated.View style={[styles.bubble, styles.bubble6, { backgroundColor: theme.colors.primary + '1A' }, { transform: [ { translateY: f6.interpolate({ inputRange: [0,1], outputRange: [0, -11] }) }, { scale: f6.interpolate({ inputRange: [0,1], outputRange: [1, 1.05] }) } ] } ]} />
          <Animated.View style={[styles.bubble, styles.bubble7, { backgroundColor: theme.colors.primary + '12' }, { transform: [ { translateY: f7.interpolate({ inputRange: [0,1], outputRange: [0, -7] }) }, { scale: f7.interpolate({ inputRange: [0,1], outputRange: [1, 1.04] }) } ] } ]} />
        </View>

        <ScrollView 
          style={{ backgroundColor: 'transparent' }}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToPortal}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="medical-outline" size={40} color="#FFFFFF" />
            </View>
            
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Portail Prestataires
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Connectez-vous à votre espace prestataire
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                Identifiant prestataire
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name="business-outline" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  placeholder="Saisissez votre identifiant"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={login}
                  onChangeText={setLogin}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                Mot de passe
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
                <TextInput
                  style={[styles.textInput, { color: theme.colors.textPrimary }]}
                  placeholder="Saisissez votre mot de passe"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Text>
              <Ionicons name="log-out-outline" size={20} color="white" />
            </TouchableOpacity>

            {/* Error Message */}
            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}
          </View>

          {/* Footer Info */}
          <View style={styles.footerInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.success} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                Connexion sécurisée
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                Accès 24h/24
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Custom Modal - handled by useModal hook */}
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 0,
    padding: 8,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(61, 143, 157, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  footerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
  },
  // Styles pour les bulles d'arrière-plan
  bubblesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 50,
  },
  bubble1: {
    width: 100,
    height: 100,
    top: '10%',
    left: '5%',
  },
  bubble2: {
    width: 80,
    height: 80,
    top: '20%',
    right: '10%',
  },
  bubble3: {
    width: 60,
    height: 60,
    top: '50%',
    left: '8%',
  },
  bubble4: {
    width: 90,
    height: 90,
    top: '65%',
    right: '5%',
  },
  bubble5: {
    width: 70,
    height: 70,
    top: '80%',
    left: '15%',
  },
  bubble6: {
    width: 85,
    height: 85,
    top: '35%',
    left: '40%',
  },
  bubble7: {
    width: 50,
    height: 50,
    top: '72%',
    right: '12%',
  },
});

export default PrestataireLoginScreen;
