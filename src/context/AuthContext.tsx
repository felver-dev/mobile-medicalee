import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, LoginCredentials, UserType } from '../types';
import { DependencyContainer } from '../core/di/DependencyContainer';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials, expectedUserType: UserType) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  // Helper methods
  isBeneficiaire: () => boolean;
  isPrestataire: () => boolean;
  validateUserAccess: (expectedUserType: UserType) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper methods
  const isBeneficiaire = useCallback((): boolean => {
    return user?.type_user_codification === 'USER_BENEF';
  }, [user]);

  const isPrestataire = useCallback((): boolean => {
    return user?.type_user_codification === 'USER_PRESTATAIRE';
  }, [user]);

  const validateUserAccess = useCallback((expectedUserType: UserType): boolean => {
    if (!user) return false;
    
    const hasAccess = user.type_user_codification === expectedUserType;
    
    if (!hasAccess) {
      console.log('❌ Accès refusé:', {
        expected: expectedUserType,
        actual: user.type_user_codification,
        user: user.email
      });
    }
    
    return hasAccess;
  }, [user]);

  const login = async (credentials: LoginCredentials, expectedUserType: UserType): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Utiliser la vraie API
      const apiService = DependencyContainer.getInstance().getApiService();
      const response = await apiService.login(credentials);
      
      console.log('Réponse API login:', response);
      console.log('Expected user type:', expectedUserType);
      
      if (response.hasError) {
        throw new Error(response.status.message || 'Erreur de connexion');
      }
      
      const userData = response.item;
      
      console.log('User type from API:', userData.type_user_codification);
      
      // Validation du type d'utilisateur
      if (userData.type_user_codification !== expectedUserType) {
        const errorMessage = expectedUserType === 'USER_BENEF' 
          ? 'Accès refusé : Vous devez être un assuré pour accéder à ce portail'
          : 'Accès refusé : Vous devez être un prestataire pour accéder à ce portail';
        
        console.log('❌ Type d\'utilisateur incorrect:', {
          expected: expectedUserType,
          actual: userData.type_user_codification,
          user: credentials.login
        });
        
        throw new Error(errorMessage);
      }
      
      // Déterminer le rôle basé sur le type d'utilisateur
      const role = userData.type_user_codification === 'USER_BENEF' ? 'assure' : 'prestataire';
      
      // Transformer les données de l'API vers notre interface User
      const user: User = {
        id: userData.id.toString(),
        email: userData.email || credentials.login,
        name: `${userData.prenom || ''} ${userData.nom || ''}`.trim() || credentials.login,
        prenom: userData.prenom,
        nom: userData.nom,
        role: role,
        token: userData.code || 'token-' + Date.now(),
        beneficiaire_matricule: userData.beneficiaire_matricule,
        filiale_id: userData.filiale_id,
        prestataire_id: userData.prestataire_id,
        prestataire_libelle: userData.prestataire_libelle,
        last_connection: userData.last_connection,
        validity: userData.validity,
        image_url: userData.image_url,
        type_user_codification: userData.type_user_codification,
      };

      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Erreur de connexion');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    isLoading,
    error,
    isBeneficiaire,
    isPrestataire,
    validateUserAccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
