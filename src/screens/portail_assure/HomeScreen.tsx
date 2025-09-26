import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getGreeting, getLastConnectionText, getValidityStatus } from '../../utils';
import { ApiService } from '../../services/ApiService';

interface HomeScreenProps {
  navigation?: any;
}

const { width } = Dimensions.get('window');

interface RecentConsultation {
  id: number;
  beneficiaire_prenom: string;
  beneficiaire_nom: string;
  beneficiaire_matricule: string;
  acte_libelle: string;
  prestataire_libelle: string;
  montant: string;
  part_assurance: string;
  part_patient: string;
  taux_couverture: number;
  created_at: string;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [recentConsultations, setRecentConsultations] = useState<RecentConsultation[]>([]);
  const [loadingConsultations, setLoadingConsultations] = useState(true);
  const [apiService] = useState(() => new ApiService());

  // Fonction pour charger les consultations récentes
  const loadRecentConsultations = async () => {
    try {
      setLoadingConsultations(true);
      console.log('🔄 Chargement des consultations récentes...');
      
      if (!user?.beneficiaire_matricule) {
        console.log('❌ Pas de matricule utilisateur disponible');
        setLoadingConsultations(false);
        return;
      }

      const response = await apiService.getFamilyConsultations({
        user_id: parseInt(user.id),
        filiale_id: user.filiale_id || 1,
        data: {
          matricule_assure: user.beneficiaire_matricule
        },
        index: 0,
        size: 3 // Limiter à 3 consultations récentes
      });

      console.log('✅ Consultations récentes chargées:', response);
      
      if (response?.items && Array.isArray(response.items)) {
        setRecentConsultations(response.items);
      } else {
        console.log('⚠️ Aucune consultation trouvée');
        setRecentConsultations([]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des consultations récentes:', error);
      setRecentConsultations([]);
    } finally {
      setLoadingConsultations(false);
    }
  };

  // Charger les consultations récentes au montage du composant
  useEffect(() => {
    if (user?.beneficiaire_matricule) {
      loadRecentConsultations();
    }
  }, [user?.beneficiaire_matricule]);

  const quickActions = [
    { 
      title: 'Ma Carte tiers-payant', 
      subtitle: 'Gérer ma carte',
      icon: 'card-outline', 
      color: theme.colors.primary,
      bgColor: theme.colors.primaryLight,
      action: 'card'
    },
    { 
      title: 'Pharmacies de garde', 
      subtitle: 'Consulter les pharmacies',
      icon: 'medical-outline', 
      color: theme.colors.success,
      bgColor: '#E8F5E8',
      action: 'pharmacies-garde'
    },
    { 
      title: 'Médicaments', 
      subtitle: 'Catalogue des médicaments',
      icon: 'flask-outline', 
      color: theme.colors.warning,
      bgColor: '#FFF3E0',
      action: 'medicaments'
    },
    { 
      title: 'Mon réseau des soins', 
      subtitle: 'Consulter le réseau',
      icon: 'business-outline', 
      color: theme.colors.secondary,
      bgColor: '#E3F2FD',
      action: 'reseau-soins'
    },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'card':
        console.log('Navigation vers Ma Carte tiers-payant');
        break;
      case 'pharmacies-garde':
        navigation?.navigate('PharmacyGuard');
        break;
      case 'medicaments':
        navigation?.navigate('Medicaments');
        break;
      case 'reseau-soins':
        navigation?.navigate('CareNetwork');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Enhanced Welcome Section */}
        <View style={[styles.welcomeSection, { backgroundColor: theme.colors.primary }]}>
          {/* Top Bar with Menu and Notifications */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => navigation?.openDrawer?.()}
            >
              <Ionicons name="menu-outline" size={20} color="white" />
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>

          {/* Main Welcome Content */}
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeText}>
              <Text style={[styles.greeting, { color: theme.colors.primaryLight }]}>
                {getGreeting()},
              </Text>
              <Text style={[styles.userName, { color: theme.colors.textOnPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.primaryLight }]} numberOfLines={1} ellipsizeMode="tail">
                {user ? `Matricule : ${user.beneficiaire_matricule}` : ''}
              </Text>
              
              {/* Status Information */}
              <View style={styles.statusContainer}>
                <View style={styles.statusItem}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.primaryLight} />
                  <Text style={[styles.statusText, { color: theme.colors.primaryLight }]}>
                    {getLastConnectionText(user?.last_connection)}
                  </Text>
                </View>
                <View style={styles.statusItem}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={getValidityStatus(user?.validity).color} />
                  <Text style={[styles.statusText, { color: getValidityStatus(user?.validity).color }]}>
                    {getValidityStatus(user?.validity).text}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.textOnPrimary }]}> 
                {user && user.image_url ? (
                  <Image source={{ uri: user.image_url }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <Ionicons name="person" size={32} color={theme.colors.primary} />
                )}
              </View>
              {/* Online Status Indicator */}
              <View style={[styles.onlineIndicator, { backgroundColor: theme.colors.success }]} />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Actions rapides
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.quickActionCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => handleQuickAction(action.action)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.bgColor }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[styles.actionTitle, { color: theme.colors.textPrimary }]}>{action.title}</Text>
                <Text style={[styles.actionSubtitle, { color: theme.colors.textSecondary }]}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Consultations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Consultations récentes
            </Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => navigation?.navigate('MainTabs', { screen: 'Family', params: { activeTab: 'consultations' } })}
            >
              <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>
                Afficher tout
              </Text>
              <Ionicons name="chevron-forward-outline" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.consultationsList}>
            {loadingConsultations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Chargement des consultations...
                </Text>
              </View>
            ) : recentConsultations.length > 0 ? (
              recentConsultations.map((consultation) => {
                const formatDate = (dateString: string) => {
                  try {
                    const date = new Date(dateString);
                    return date.toLocaleDateString('fr-FR');
                  } catch {
                    return 'Date invalide';
                  }
                };

                const formatAmount = (amount: string) => {
                  try {
                    const num = parseFloat(amount);
                    return `${num.toLocaleString('fr-FR')} F CFA`;
                  } catch {
                    return amount;
                  }
                };

                const getStatusInfo = (tauxCouverture: number) => {
                  if (tauxCouverture > 0) {
                    return { text: 'Remboursée', color: '#059669' };
                  }
                  return { text: 'En attente', color: '#D97706' };
                };

                const statusInfo = getStatusInfo(consultation.taux_couverture);

                return (
                  <TouchableOpacity
                    key={consultation.id} 
                    style={[styles.consultationCard, { backgroundColor: theme.colors.surface }]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.consultationLeft}>
                      <View style={[styles.consultationIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Ionicons name="medical-outline" size={20} color="#3d8f9d" />
                      </View>
                      <View style={styles.consultationInfo}>
                        <Text style={[styles.consultationDoctor, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                          {consultation.beneficiaire_prenom} {consultation.beneficiaire_nom}
                        </Text>
                        <Text style={[styles.consultationSpecialty, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                          {consultation.acte_libelle}
                        </Text>
                        <Text style={[styles.consultationDate, { color: theme.colors.textSecondary }]}>
                          {formatDate(consultation.created_at)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.consultationRight}>
                      <View style={[styles.consultationStatus, { backgroundColor: statusInfo.color }]}>
                        <Text style={styles.consultationStatusText}>{statusInfo.text}</Text>
                      </View>
                      <Text style={[styles.consultationAmount, { color: theme.colors.textPrimary }]}>
                        {formatAmount(consultation.montant)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="medical-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  Aucune consultation récente
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  Vos consultations récentes apparaîtront ici
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    height: 40,
  },
  welcomeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeText: {
    flex: 1,
    minWidth: 0,
    maxWidth: '70%',
    flexShrink: 1,
  },
  greeting: {
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  statusContainer: {
    marginTop: 12,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
  },
  consultationsList: {
    gap: 12,
  },
  consultationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  consultationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  consultationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  consultationInfo: {
    flex: 1,
  },
  consultationDoctor: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  consultationSpecialty: {
    fontSize: 13,
    marginBottom: 2,
  },
  consultationDate: {
    fontSize: 12,
  },
  consultationRight: {
    alignItems: 'flex-end',
  },
  consultationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  consultationStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  consultationAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default HomeScreen;
