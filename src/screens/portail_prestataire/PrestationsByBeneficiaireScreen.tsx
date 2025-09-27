import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  RefreshControl, 
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';

interface PrestationsByBeneficiaireScreenProps {
  navigation: any;
}

interface PrestationItem {
  id: number;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  matricule_assure: string;
  acte_libelle: string;
  montant: number;
  part_assurance: number;
  part_patient: number;
  created_at: string;
  statut: string;
  garantie_libelle: string;
  prestataire_libelle: string;
  quantite?: number;
  prix_unitaire?: number;
}

interface BeneficiaireFilter {
  matriculeBeneficiaire: string;
  dateDebut: Date;
  dateFin: Date;
}

const PrestationsByBeneficiaireScreen: React.FC<PrestationsByBeneficiaireScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const [apiService] = useState(() => new ApiService());
  const [refreshing, setRefreshing] = useState(false);
  const [prestations, setPrestations] = useState<PrestationItem[]>([]);
  const [filteredPrestations, setFilteredPrestations] = useState<PrestationItem[]>([]);
  const [selectedPrestation, setSelectedPrestation] = useState<PrestationItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<BeneficiaireFilter>({
    matriculeBeneficiaire: '',
    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours avant
    dateFin: new Date()
  });
  const [tempFilters, setTempFilters] = useState<BeneficiaireFilter>({
    matriculeBeneficiaire: '',
    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours avant
    dateFin: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);

  const loadData = useCallback(async (page: number = 0, reset: boolean = true) => {
    setLoading(true);
    setError(null);
    
    if (reset) {
      setCurrentPage(0);
      setHasMoreData(true);
    }
    
    try {
      console.log('🔍 PrestationsByBeneficiaireScreen.loadData démarré - Page:', page);
      
      if (!user) {
        console.log('❌ Utilisateur non connecté');
        setError('Utilisateur non connecté');
        return;
      }

      const payload = {
        user_id: user.id,
        filiale_id: user.filiale_id,
        matricule_assure: filters.matriculeBeneficiaire ? parseInt(filters.matriculeBeneficiaire) : undefined,
        date_debut: `${filters.dateDebut.toISOString().split('T')[0]}T00:00:00.000Z`,
        date_fin: `${filters.dateFin.toISOString().split('T')[0]}T00:00:00.000Z`,
        data: {
          prestataire_id: user.prestataire_id || user.id,
          beneficiaire_id: filters.matriculeBeneficiaire ? parseInt(filters.matriculeBeneficiaire) : undefined
        },
        index: page * 100,
        size: 100
      };

      console.log('📤 Payload API:', JSON.stringify(payload, null, 2));

      const response = await apiService.getPrestations(payload);
      
      console.log('📥 Réponse API complète:', response);
      
      if (response && !response.hasError && response.items) {
        console.log('📥 Données reçues:', response.items.length, 'éléments');
        
        if (reset) {
          setPrestations(response.items);
          setFilteredPrestations(response.items);
        } else {
          setPrestations(prev => [...prev, ...response.items]);
          setFilteredPrestations(prev => [...prev, ...response.items]);
        }
        
        // Vérifier s'il y a plus de données
        setHasMoreData(response.items.length >= 100);
        setCurrentPage(page);
        setError(null);
      } else {
        console.log('⚠️ Aucune donnée reçue ou erreur dans la réponse');
        if (reset) {
          setPrestations([]);
          setFilteredPrestations([]);
        }
        setHasMoreData(false);
        setError(null);
      }

      console.log('✅ Chargement des prestations par bénéficiaire terminé');

    } catch (error: any) {
      console.log('⚠️ Erreur API:', error?.code || 'Erreur inconnue');
      
      // Gestion des erreurs spécifiques
      if (error?.code === '404') {
        setError('Aucune prestation trouvée pour cette période');
      } else if (error?.code === '401') {
        setError('Session expirée, veuillez vous reconnecter');
      } else if (error?.code === '500') {
        setError('Erreur serveur, veuillez réessayer plus tard');
      } else {
        setError('Impossible de charger les prestations');
      }
      
      if (reset) {
        setPrestations([]);
        setFilteredPrestations([]);
      }
      setHasMoreData(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [user, filters, apiService]);

  useEffect(() => {
    loadData(0, true);
  }, [loadData]);

  const loadMoreData = useCallback(() => {
    console.log('🔄 loadMoreData appelé - loading:', loading, 'hasMoreData:', hasMoreData, 'currentPage:', currentPage);
    if (!loading && hasMoreData) {
      console.log('📥 Chargement de la page suivante:', currentPage + 1);
      loadData(currentPage + 1, false);
    } else {
      console.log('⏹️ Chargement arrêté - loading:', loading, 'hasMoreData:', hasMoreData);
    }
  }, [loading, hasMoreData, currentPage, loadData]);

  const onRefresh = useCallback(() => {
    loadData(0, true);
  }, [loadData]);

  const handleDateDebutChange = (event: any, selectedDate?: Date) => {
    setShowDateDebutPicker(false);
    if (selectedDate) {
      setTempFilters({...tempFilters, dateDebut: selectedDate});
    }
  };

  const handleDateFinChange = (event: any, selectedDate?: Date) => {
    setShowDateFinPicker(false);
    if (selectedDate) {
      setTempFilters({...tempFilters, dateFin: selectedDate});
    }
  };

  const openFilterModal = () => {
    setTempFilters(filters);
    setShowFilterModal(true);
  };

  const openPrestationModal = (prestation: PrestationItem) => {
    setSelectedPrestation(prestation);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'validée':
        return '#3d8f9d';
      case 'en attente':
        return '#FF9800';
      case 'rejetée':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const getStatusText = (prestation: PrestationItem) => {
    return prestation.statut || 'Inconnu';
  };

  const handlePrestationPress = (prestation: PrestationItem) => {
    setSelectedPrestation(prestation);
    setShowDetailsModal(true);
  };

  const renderPrestationItem = ({ item }: { item: PrestationItem }) => (
    <TouchableOpacity 
      style={[styles.prestationCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
      onPress={() => openPrestationModal(item)}
    >
      {/* Header avec icône et statut */}
      <View style={styles.prestationHeader}>
        <View style={styles.prestationHeaderLeft}>
          <View style={[styles.prestationIcon, { backgroundColor: getStatusColor(item.statut) + '15' }]}>
            <Ionicons 
              name={item.acte_libelle?.includes('CONSULTATION') ? 'medical-outline' : 'flask-outline'} 
              size={20} 
              color={getStatusColor(item.statut)} 
            />
          </View>
          <View style={styles.prestationInfo}>
            <Text style={[styles.prestationTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.acte_libelle || 'Non renseigné'}
            </Text>
            <Text style={[styles.prestationDate, { color: theme.colors.textSecondary }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
          <Text style={styles.statusText}>{getStatusText(item)}</Text>
        </View>
      </View>

      {/* Informations patient avec nouvelle disposition */}
      <View style={styles.patientSectionNew}>
        <View style={styles.patientCardContainer}>
          <View style={styles.patientHeaderCard}>
            <View style={[styles.patientAvatarCard, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="person" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.patientDetails}>
              <Text style={[styles.patientNameCard, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                {item.beneficiaire_prenom} {item.beneficiaire_nom}
              </Text>
              <View style={styles.patientBadgeContainer}>
                <View style={[styles.patientBadge, { backgroundColor: theme.colors.primary + '10' }]}>
                  <Ionicons name="card-outline" size={12} color={theme.colors.primary} />
                  <Text style={[styles.patientBadgeText, { color: theme.colors.primary }]}>
                    {item.matricule_assure || 'Non renseigné'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Footer avec montants */}
      <View style={styles.prestationFooter}>
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Total</Text>
          <Text style={[styles.amountValue, { color: theme.colors.textPrimary }]}>
            {formatAmount(item.montant)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Assurance</Text>
          <Text style={[styles.amountValue, { color: '#3d8f9d' }]}>
            {formatAmount(item.part_assurance)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Patient</Text>
          <Text style={[styles.amountValue, { color: '#FF9800' }]}>
            {formatAmount(item.part_patient)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    console.log('🔍 renderContent appelé - error:', error, 'loading:', loading, 'initialLoading:', initialLoading, 'prestations:', prestations.length, 'filteredPrestations:', filteredPrestations.length);
    
    if (error) {
      return (
        <View style={styles.errorState}>
          <View style={[styles.errorIcon, { backgroundColor: '#F44336' + '15' }]}>
            <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          </View>
          <Text style={[styles.errorTitle, { color: '#2D3748' }]}>
            Erreur de chargement
          </Text>
          <Text style={[styles.errorText, { color: '#718096' }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => loadData(0, true)}
          >
            <Ionicons name="refresh-outline" size={20} color="white" />
            <Text style={[styles.retryButtonText, { color: 'white' }]}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredPrestations.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="medical-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: '#2D3748' }]}>
            Aucune prestation trouvée
          </Text>
          <Text style={[styles.emptyStateText, { color: '#718096' }]}>
            Aucune prestation pour la période sélectionnée
          </Text>
          <TouchableOpacity 
            style={[styles.emptyStateButton, { backgroundColor: theme.colors.primary }]}
            onPress={openFilterModal}
          >
            <Ionicons name="filter-outline" size={20} color="white" />
            <Text style={[styles.emptyStateButtonText, { color: 'white' }]}>Modifier les filtres</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredPrestations}
        renderItem={renderPrestationItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading && !initialLoading}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => {
          if (loading && !initialLoading) {
            return (
              <View style={styles.loadingFooter}>
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                  Chargement...
                </Text>
              </View>
            );
          }
          return null;
        }}
      />
    );
  };

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }]}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prestations par Bénéficiaire</Text>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {initialLoading ? (
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingIcon, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name="medical-outline" size={48} color={theme.colors.primary} />
            </View>
            <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
              Chargement des prestations...
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          {renderContent()}
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Filtrer par bénéficiaire
              </Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Nom du bénéficiaire</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.background, 
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary 
                  }]}
                  placeholder="Entrez le nom du bénéficiaire..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={filters.matriculeBeneficiaire}
                  onChangeText={(text) => setFilters({...filters, matriculeBeneficiaire: text})}
                />
              </View>
            </ScrollView>
            
            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={() => {
                  setFilters({ matriculeBeneficiaire: '', dateDebut: '', dateFin: '' });
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  applyFilters();
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Rechercher</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity 
              onPress={() => setShowDetailsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détails de la prestation</Text>
          </View>
          
          {selectedPrestation && (
            <View style={styles.modalContent}>
              <View style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.detailTitle, { color: theme.colors.textPrimary }]}>
                  Informations du bénéficiaire
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Nom:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrestation.prenom_beneficiaire} {selectedPrestation.nom_beneficiaire}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Matricule:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrestation.matricule_assure}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Type:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrestation.type_prestation}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Garantie:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrestation.garantie_libelle}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Montant:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {formatAmount(selectedPrestation.montant)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Date:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {formatDate(selectedPrestation.date_prestation)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Statut:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPrestation.statut) }]}>
                    <Text style={styles.statusText}>{selectedPrestation.statut}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  prestationCard: {
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
  },
  prestationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  prestationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prestationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prestationInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  prestationType: {
    fontSize: 12,
    marginBottom: 2,
  },
  prestationDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  matriculeText: {
    fontSize: 12,
  },
  prestationRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterItem: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
  },
  closeButton: {
    marginRight: 16,
  },
  detailCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  
  // Styles pour les états d'erreur et vide
  errorState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
});

export default PrestationsByBeneficiaireScreen;
