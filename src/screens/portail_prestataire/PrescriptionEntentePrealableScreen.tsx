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
  Dimensions,
  ScrollView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';

interface PrescriptionEntentePrealableScreenProps {
  navigation: any;
}

interface PrescriptionItem {
  id: number;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  beneficiaire_matricule: string;
  matricule_assure?: number;
  medicament_libelle: string;
  quantite: number;
  created_at: string;
  garantie_libelle: string;
  prestataire_libelle: string;
  prix_unitaire?: number;
  statut?: string;
  is_entente_prealable: number;
  posologie: string;
  duree: number;
}

interface PrescriptionFilters {
  dateDebut: Date;
  dateFin: Date;
}

const { width } = Dimensions.get('window');

const PrescriptionEntentePrealableScreen: React.FC<PrescriptionEntentePrealableScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const [apiService] = useState(() => new ApiService());
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionItem[]>([]);
  const [filters, setFilters] = useState<PrescriptionFilters>({
    dateDebut: new Date('2025-01-01'),
    dateFin: new Date('2025-09-30')
  });
  const [tempFilters, setTempFilters] = useState<PrescriptionFilters>({
    dateDebut: new Date('2025-01-01'),
    dateFin: new Date('2025-09-30')
  });
  const [error, setError] = useState<string | null>(null);
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionItem | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const loadData = useCallback(async (page = 0, reset = false) => {
    if (!user) return;
    
    try {
      if (page === 0) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const payload = {
        user_id: user.id, // ID de l'utilisateur connecté (49)
        filiale_id: user.filiale_id, // Filiale de l'utilisateur (1)
        date_debut: `${filters.dateDebut.toISOString().split('T')[0]}T00:00:00.000Z`,
        date_fin: `${filters.dateFin.toISOString().split('T')[0]}T00:00:00.000Z`,
        data: {
          prestataire_id: user.prestataire_id, // ID du prestataire (5) pour récupérer les 97 éléments
          is_entente_prealable: 1 // Filtrer pour les ententes préalables
        },
        index: page * 10,
        size: 10
      };

      console.log('Chargement des ententes préalables - Page:', page, 'Payload:', payload);

      const response = await apiService.getPrescriptionActes(payload);
      console.log('Réponse API ententes préalables:', response);

      if (response && response.items) {
        if (reset || page === 0) {
          setPrescriptions(response.items);
          setFilteredPrescriptions(response.items);
        } else {
          setPrescriptions(prev => [...prev, ...response.items]);
          setFilteredPrescriptions(prev => [...prev, ...response.items]);
        }
        
        // Logique de hasMoreData corrigée (copiée de MedicamentsScreen)
        const totalLoaded = (page + 1) * 10;
        setHasMoreData(totalLoaded < (response.count || 0));
        setCurrentPage(page);
      } else {
        if (reset || page === 0) {
          setPrescriptions([]);
          setFilteredPrescriptions([]);
        }
        setHasMoreData(false);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des ententes préalables:', err);
      setError('Erreur lors du chargement des ententes préalables');
      if (reset || page === 0) {
        setPrescriptions([]);
        setFilteredPrescriptions([]);
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [user, filters, apiService]);

  const loadMoreData = useCallback(() => {
    if (!loading && hasMoreData) {
      console.log('Chargement de plus d\'ententes préalables - Page suivante:', currentPage + 1);
      loadData(currentPage + 1, false);
    }
  }, [loading, hasMoreData, currentPage, loadData]);

  const onRefresh = useCallback(() => {
    console.log('Rafraîchissement des ententes préalables');
    setCurrentPage(0);
    setHasMoreData(true);
    loadData(0, true);
  }, [loadData]);

  const handleDateDebutChange = (event: any, selectedDate?: Date) => {
    setShowDateDebutPicker(false);
    if (selectedDate) {
      setTempFilters(prev => ({ ...prev, dateDebut: selectedDate }));
    }
  };

  const handleDateFinChange = (event: any, selectedDate?: Date) => {
    setShowDateFinPicker(false);
    if (selectedDate) {
      setTempFilters(prev => ({ ...prev, dateFin: selectedDate }));
    }
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilterModal(false);
    setCurrentPage(0);
    setHasMoreData(true);
    setPrescriptions([]);
    setFilteredPrescriptions([]);
    setInitialLoading(true);
    loadData(0, true);
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      dateFin: new Date()
    };
    setTempFilters(defaultFilters);
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#666666';
    switch (status.toLowerCase()) {
      case 'validé':
      case 'valide':
        return '#4CAF50';
      case 'en attente':
      case 'attente':
        return '#FF9800';
      case 'refusé':
      case 'refuse':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return 'Non enregistré';
    return status;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  useEffect(() => {
    loadData(0, true);
  }, []);

  const renderPrescriptionCard = ({ item }: { item: PrescriptionItem }) => (
    <TouchableOpacity
      style={[styles.prescriptionCard, { borderColor: theme.colors.border }]}
      onPress={() => {
        setSelectedPrescription(item);
        setShowPrescriptionModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.prescriptionHeader}>
        <View style={styles.prescriptionIcon}>
          <Ionicons name="time" size={20} color="#FF9800" />
        </View>
        <View style={styles.prescriptionInfo}>
          <Text style={[styles.patientName, { color: theme.colors.textPrimary }]}>
            {item.beneficiaire_prenom} {item.beneficiaire_nom}
          </Text>
          <Text style={[styles.matriculeText, { color: theme.colors.textSecondary }]}>
            Matricule: {item.beneficiaire_matricule || 'Non renseigné'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut || '') + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.statut || '') }]}>
            {getStatusText(item.statut || '')}
          </Text>
        </View>
      </View>
      
      <View style={styles.prescriptionDetails}>
        <Text style={[styles.medicamentName, { color: theme.colors.textPrimary }]}>
          {item.medicament_libelle}
        </Text>
        <Text style={[styles.garantieText, { color: theme.colors.textSecondary }]}>
          {item.garantie_libelle}
        </Text>
      </View>
      
      <View style={styles.prescriptionFooter}>
        <Text style={[styles.prescriptionDate, { color: theme.colors.textSecondary }]}>
          {formatDate(item.created_at)}
        </Text>
        <Text style={[styles.quantityText, { color: theme.colors.textPrimary }]}>
          Qté: {item.quantite}
        </Text>
        <Text style={[styles.priceText, { color: theme.colors.primary }]}>
          {item.prix_unitaire ? formatCurrency(item.prix_unitaire * item.quantite) : 'Non renseigné'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (initialLoading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="time" size={40} color="#FF9800" />
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Chargement des ententes préalables...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color="#F44336" />
          <Text style={[styles.errorText, { color: theme.colors.textPrimary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => loadData(0, true)}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredPrescriptions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={60} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.colors.textPrimary }]}>
            Aucune entente préalable trouvée
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
            Ajustez vos filtres ou vérifiez votre connexion
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredPrescriptions}
        renderItem={renderPrescriptionCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
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
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ententes Préalables</Text>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Filtres
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Date Début */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                  Date de début
                </Text>
                <TouchableOpacity
                  style={[styles.dateInput, { borderColor: theme.colors.border }]}
                  onPress={() => setShowDateDebutPicker(true)}
                >
                  <Text style={[styles.dateInputText, { color: theme.colors.textPrimary }]}>
                    {tempFilters.dateDebut.toLocaleDateString('fr-FR')}
                  </Text>
                  <Ionicons name="calendar" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Date Fin */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                  Date de fin
                </Text>
                <TouchableOpacity
                  style={[styles.dateInput, { borderColor: theme.colors.border }]}
                  onPress={() => setShowDateFinPicker(true)}
                >
                  <Text style={[styles.dateInputText, { color: theme.colors.textPrimary }]}>
                    {tempFilters.dateFin.toLocaleDateString('fr-FR')}
                  </Text>
                  <Ionicons name="calendar" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.border }]}
                onPress={resetFilters}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>
                  Réinitialiser
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={applyFilters}
              >
                <Text style={styles.modalButtonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Prescription Details Modal */}
      <Modal
        visible={showPrescriptionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Détails de l'entente préalable
              </Text>
              <TouchableOpacity
                onPress={() => setShowPrescriptionModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedPrescription && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Bénéficiaire
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrescription.beneficiaire_prenom} {selectedPrescription.beneficiaire_nom}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Matricule
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrescription.beneficiaire_matricule || 'Non renseigné'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Médicament
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrescription.medicament_libelle}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Garantie
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrescription.garantie_libelle}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Quantité
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrescription.quantite}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Prix unitaire
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrescription.prix_unitaire ? formatCurrency(selectedPrescription.prix_unitaire) : 'Non renseigné'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Total
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.primary, fontWeight: 'bold' }]}>
                    {selectedPrescription.prix_unitaire ? formatCurrency(selectedPrescription.prix_unitaire * selectedPrescription.quantite) : 'Non renseigné'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Statut
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPrescription.statut || '') + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(selectedPrescription.statut || '') }]}>
                      {getStatusText(selectedPrescription.statut || '')}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Date
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {formatDate(selectedPrescription.created_at)}
                  </Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showDateDebutPicker && (
        <DateTimePicker
          value={tempFilters.dateDebut}
          mode="date"
          display="default"
          onChange={handleDateDebutChange}
        />
      )}

      {showDateFinPicker && (
        <DateTimePicker
          value={tempFilters.dateFin}
          mode="date"
          display="default"
          onChange={handleDateFinChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
  listContainer: {
    padding: 16,
  },
  prescriptionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prescriptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prescriptionInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  matriculeText: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  prescriptionDetails: {
    marginBottom: 12,
  },
  medicamentName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  garantieText: {
    fontSize: 14,
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescriptionDate: {
    fontSize: 13,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  dateInputText: {
    fontSize: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
  },
});

export default PrescriptionEntentePrealableScreen;
