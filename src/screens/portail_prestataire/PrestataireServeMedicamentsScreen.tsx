import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { DependencyContainer } from '../../core/di/DependencyContainer';
import CustomModal from '../../components/CustomModal';
import { useModal } from '../../hooks/useModal';

interface PrescriptionActe {
  id: string;
  medicament_libelle: string;
  forme_medicament_libelle: string;
  posologie: string;
  quantite: number;
  prix_systeme: number;
  duree: number;
  ordonnance_code: string;
  created_at: string;
  is_factured: number;
  is_entente_prealable: number;
  is_exclu: number;
}

interface Beneficiaire {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  statut_libelle: string;
  taux_applicable: number;
}

interface RouteParams {
  beneficiaire: Beneficiaire;
  prescriptions: PrescriptionActe[];
  searchType: 'matricule' | 'cmu';
  searchValue: string;
}

const PrestataireServeMedicamentsScreen: React.FC = () => {
  const { theme } = usePrestataireTheme();
  const { user } = useAuth();
  const { modalState, showAlert } = useModal();
  const navigation = useNavigation();
  const route = useRoute();
  const { beneficiaire, searchType, searchValue } = route.params as RouteParams;
  
  const [prescriptions, setPrescriptions] = useState<PrescriptionActe[]>([]);
  const [loading, setLoading] = useState(true);
  const [serving, setServing] = useState(false);
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<string[]>([]);

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const api = DependencyContainer.getInstance().getApiService();
      
      const request = {
        data: {
          beneficiaire_id: beneficiaire.id,
          matricule: beneficiaire.matricule
        },
        filiale_id: user?.filiale_id || 1, // Du prestataire connecté
        user_id: user?.id || 49, // Du prestataire connecté
        prestataire_id: user?.prestataire_id || 5, // Du prestataire connecté
        index: 0,
        size: 100
      };

      console.log('🔍 Chargement des prescriptions avec:', request);

      const response = await api.getPrescriptionActes(request);
      
      console.log('📋 Réponse API complète:', JSON.stringify(response, null, 2));
      
      if (!response.hasError && response.items) {
        console.log('✅ Prescriptions trouvées:', response.items.length);
        console.log('📝 Premier item:', JSON.stringify(response.items[0], null, 2));
        
        // Debug des prix
        response.items.forEach((item: any, index: number) => {
          console.log(`💰 Item ${index}:`, {
            medicament_libelle: item.medicament_libelle,
            prix_systeme: item.prix_systeme,
            prix_systeme_type: typeof item.prix_systeme,
            prix_systeme_value: item.prix_systeme
          });
        });
        
        setPrescriptions(response.items);
      } else {
        console.log('❌ Aucune prescription trouvée ou erreur:', response);
        showAlert('Information', 'Aucune prescription trouvée pour ce bénéficiaire', 'info');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prescriptions:', error);
      showAlert('Erreur', 'Impossible de charger les prescriptions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getMedicamentStatus = (item: PrescriptionActe) => {
    if (item.is_factured === 1) return 'served';
    if (item.is_exclu === 1) return 'excluded';
    if (item.is_entente_prealable === 1) return 'preapproval';
    return 'available';
  };

  const canSelectMedicament = (item: PrescriptionActe) => {
    return item.is_factured === 0 && item.is_exclu === 0 && item.is_entente_prealable === 0;
  };

  const togglePrescriptionSelection = (prescriptionId: string) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (!prescription || !canSelectMedicament(prescription)) {
      return;
    }

    setSelectedPrescriptions(prev => {
      if (prev.includes(prescriptionId)) {
        return prev.filter(id => id !== prescriptionId);
      } else {
        return [...prev, prescriptionId];
      }
    });
  };

  const handleServeSelectedPrescriptions = () => {
    if (selectedPrescriptions.length === 0) {
      showAlert('Information', 'Veuillez sélectionner au moins un médicament', 'info');
      return;
    }

    // Rediriger vers l'écran de sélection des quantités
    (navigation as any).navigate('QuantitySelection', {
      selectedPrescriptions,
      prescriptions,
      beneficiaire: (route.params as any)?.beneficiaire
    });
  };

  // Charger les prescriptions au démarrage
  useEffect(() => {
    loadPrescriptions();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }]}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Servir Médicaments</Text>
          
          <View style={styles.placeholder} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Informations du bénéficiaire */}
        <View style={[styles.beneficiaireCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Bénéficiaire</Text>
          
          <View style={styles.beneficiaireInfo}>
            <Text style={[styles.beneficiaireName, { color: theme.colors.textPrimary }]}>
              {beneficiaire.nom} {beneficiaire.prenom}
            </Text>
            <Text style={[styles.beneficiaireDetails, { color: theme.colors.textSecondary }]}>
              Matricule: {beneficiaire.matricule}
            </Text>
            <Text style={[styles.beneficiaireDetails, { color: theme.colors.textSecondary }]}>
              Statut: {beneficiaire.statut_libelle}
            </Text>
          </View>
        </View>

        {/* Liste des prescriptions */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Chargement des prescriptions...
            </Text>
          </View>
        ) : prescriptions.length > 0 ? (
          <FlatList
            data={prescriptions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const status = getMedicamentStatus(item);
              const canSelect = canSelectMedicament(item);
              
              const getCardStyle = () => {
                switch (status) {
                  case 'excluded':
                    return { 
                      borderColor: '#DC3545', 
                      backgroundColor: theme.isDark ? '#4A1A1A' : '#FFF5F5' 
                    };
                  case 'preapproval':
                    return { 
                      borderColor: '#FF8C00', 
                      backgroundColor: theme.isDark ? '#4A2C00' : '#FFF8E1' 
                    };
                  case 'served':
                    return { 
                      borderColor: '#6C757D', 
                      backgroundColor: theme.isDark ? '#2A2A2A' : '#F8F9FA' 
                    };
                  default:
                    return { borderColor: theme.colors.border, backgroundColor: theme.colors.surface };
                }
              };

              const getStatusText = () => {
                switch (status) {
                  case 'excluded':
                    return 'Exclu';
                  case 'preapproval':
                    return 'Entente préalable';
                  case 'served':
                    return 'Servi';
                  default:
                    return 'Disponible';
                }
              };

              return (
                <View style={[styles.medicamentCard, getCardStyle()]}>
                  {/* Header avec icône et statut */}
                  <View style={styles.medicamentHeader}>
                    <View style={styles.medicamentIconContainer}>
                      <Ionicons 
                        name="medical" 
                        size={24} 
                        color={theme.colors.primary} 
                      />
                    </View>
                    <View style={styles.medicamentInfo}>
                      <Text style={[styles.medicamentTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                        {item.medicament_libelle || 'Médicament non spécifié'}
                      </Text>
                      <Text style={[styles.medicamentForm, { color: theme.colors.textSecondary }]}>
                        {item.forme_medicament_libelle || 'Forme non spécifiée'}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusIndicator, 
                      { 
                        backgroundColor: status === 'excluded' ? 
                          (theme.isDark ? '#6B2C2C' : '#FFE6E6') : 
                          status === 'preapproval' ? 
                          (theme.isDark ? '#6B4C00' : '#FFF3CD') : 
                          status === 'served' ? 
                          (theme.isDark ? '#2A4A2A' : '#D1FAE5') : 
                          (theme.isDark ? '#2A4A2A' : '#D1FAE5')
                      }
                    ]}>
                      <Ionicons 
                        name={status === 'excluded' ? 'close-circle' : 
                              status === 'preapproval' ? 'warning' : 
                              status === 'served' ? 'checkmark' : 'time'} 
                        size={16} 
                        color={status === 'excluded' ? 
                          (theme.isDark ? '#FF6B6B' : '#DC3545') : 
                          status === 'preapproval' ? 
                          (theme.isDark ? '#FFB84D' : '#FF8C00') : 
                          status === 'served' ? 
                          (theme.isDark ? '#3d8f9d' : '#3d8f9d') : 
                          (theme.isDark ? '#FFB84D' : '#F57C00')} 
                      />
                    </View>
                  </View>

                  {/* Informations principales */}
                  <View style={styles.medicamentDetails}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="flask" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {item.quantite || 0} unité(s)
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {item.duree || 0} jour(s)
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="medical-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          {item.posologie || 'Non spécifié'}
                        </Text>
                      </View>
                        <View style={styles.detailItem}>
                          <Ionicons name="cash" size={16} color={theme.colors.textSecondary} />
                          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                            {item.prix_systeme ? item.prix_systeme.toLocaleString() + ' FCFA' : 'Prix non disponible'}
                          </Text>
                        </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.medicamentActions}>
                    <View style={styles.ordonnanceInfo}>
                      <Ionicons name="document-text" size={14} color={theme.colors.textSecondary} />
                      <Text style={[styles.ordonnanceCode, { color: theme.colors.textSecondary }]}>
                        {item.ordonnance_code || 'N/A'}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.checkboxContainer}
                      onPress={() => togglePrescriptionSelection(item.id)}
                      disabled={!canSelect}
                      activeOpacity={canSelect ? 0.7 : 1}
                    >
                      <View style={[
                        styles.checkbox,
                        { 
                          backgroundColor: selectedPrescriptions.includes(item.id) ? theme.colors.primary : 'transparent',
                          borderColor: canSelect ? theme.colors.primary : '#CCCCCC',
                          opacity: canSelect ? 1 : 0.5,
                        }
                      ]}>
                        {selectedPrescriptions.includes(item.id) && (
                          <Ionicons 
                            name="checkmark" 
                            size={20} 
                            color="#FFFFFF" 
                          />
                        )}
                      </View>
                      <Text style={[
                        styles.checkboxLabel,
                        { 
                          color: canSelect ? theme.colors.textPrimary : theme.colors.textSecondary,
                          opacity: canSelect ? 1 : 0.5
                        }
                      ]}>
                        {getStatusText()}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
              Aucune prescription
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              Ce bénéficiaire n'a pas de prescriptions actives
            </Text>
          </View>
        )}
      </View>

      {/* Bouton d'action flottant */}
      {selectedPrescriptions.length > 0 && (
        <View style={styles.floatingActionContainer}>
          <TouchableOpacity
            style={[styles.floatingActionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleServeSelectedPrescriptions}
            disabled={serving}
          >
            <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      
      <CustomModal {...modalState} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  beneficiaireCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  beneficiaireInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  beneficiaireName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  beneficiaireDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  flatListContent: {
    paddingHorizontal: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  medicamentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  medicamentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  medicamentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicamentInfo: {
    flex: 1,
    marginRight: 12,
  },
  medicamentTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  medicamentForm: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicamentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  medicamentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  ordonnanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ordonnanceCode: {
    fontSize: 12,
    marginLeft: 4,
    opacity: 0.7,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  floatingActionContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  floatingActionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default PrestataireServeMedicamentsScreen;