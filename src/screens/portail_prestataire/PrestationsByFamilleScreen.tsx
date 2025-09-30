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
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';
import DateTimePicker from '@react-native-community/datetimepicker';

interface PrestationsByFamilleScreenProps {
  navigation: any;
}

interface PrestationItem {
  id: number;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  matricule_assure: number;
  acte_libelle: string;
  montant: number;
  part_assurance: number;
  part_patient: number;
  created_at: string;
  statut: string;
  garantie_libelle: string;
  prestataire_libelle: string;
  quantite: number;
  prix_unitaire: number;
}

interface FamilleFilter {
  matriculeFamille: string;
  dateDebut: Date;
  dateFin: Date;
}

const { width } = Dimensions.get('window');

const PrestationsByFamilleScreen: React.FC<PrestationsByFamilleScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const apiService = new ApiService();
  
  const [prestations, setPrestations] = useState<PrestationItem[]>([]);
  const [filteredPrestations, setFilteredPrestations] = useState<PrestationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  
  const [selectedPrestation, setSelectedPrestation] = useState<PrestationItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  const [filters, setFilters] = useState<FamilleFilter>({
    matriculeFamille: '',
    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours ago
    dateFin: new Date()
  });
  
  const [tempFilters, setTempFilters] = useState<FamilleFilter>({
    matriculeFamille: '',
    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours ago
    dateFin: new Date()
  });
  
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);

  const loadData = useCallback(async (page: number = 0, reset: boolean = true) => {
    console.log('🔍 PrestationsByFamilleScreen.loadData démarré - Page:', page);
    
    setLoading(true);
    setError(null);
    
    if (reset) {
      setCurrentPage(0);
      setHasMoreData(true);
    }
    
    try {
      const payload = {
        user_id: user?.id,
        filiale_id: user?.filiale_id,
        matricule_assure: filters.matriculeFamille ? parseInt(filters.matriculeFamille) : undefined,
        date_debut: `${filters.dateDebut.toISOString().split('T')[0]}T00:00:00.000Z`,
        date_fin: `${filters.dateFin.toISOString().split('T')[0]}T00:00:00.000Z`,
        data: {
          prestataire_id: user?.prestataire_id || user?.id,
          famille_id: filters.matriculeFamille ? parseInt(filters.matriculeFamille) : undefined
        },
        index: page * 10,
        size: 10
      };

      console.log('📤 Payload API:', JSON.stringify(payload, null, 2));

      const response = await apiService.getPrestations(payload);
      
      console.log('📥 Réponse API complète:', {
        hasError: response.hasError,
        itemsLength: response.items?.length || 0,
        total: response.total,
        page: page,
        payload: payload
      });
      
      if (response && !response.hasError && response.items) {
        console.log('📥 Données reçues:', {
          itemsCount: response.items.length,
          totalItems: response.total || 'Non spécifié',
          currentPage: page,
          hasMoreData: response.items.length === 10,
          nextPageWillBe: page + 1,
          nextPageIndex: (page + 1) * 10
        });
        
        if (reset) {
          setPrestations(response.items);
          setFilteredPrestations(response.items);
        } else {
          setPrestations(prev => [...prev, ...response.items]);
          setFilteredPrestations(prev => [...prev, ...response.items]);
        }
        
        // Vérifier s'il y a plus de données
        // Si nous recevons moins de 10 éléments, c'est la dernière page
        // Si nous recevons exactement 10 éléments, il pourrait y avoir plus de données
        setHasMoreData(response.items.length === 10);
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

      console.log('✅ Chargement des prestations terminé');

    } catch (error) {
      console.error('❌ Erreur lors du chargement des prestations:', error);
      setError('Erreur lors du chargement des données');
      
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
  }, []); // Supprimer loadData des dépendances pour éviter le rechargement automatique

  const loadMoreData = useCallback(() => {
    console.log('🔄 loadMoreData appelé - loading:', loading, 'hasMoreData:', hasMoreData, 'currentPage:', currentPage);
    console.log('📊 État actuel - prestations:', prestations.length, 'filteredPrestations:', filteredPrestations.length);
    if (!loading && hasMoreData) {
      console.log('📥 Chargement de la page suivante:', currentPage + 1);
      loadData(currentPage + 1, false);
    } else {
      console.log('⏹️ Chargement arrêté - loading:', loading, 'hasMoreData:', hasMoreData);
    }
  }, [loading, hasMoreData, currentPage, loadData, prestations.length, filteredPrestations.length]);

  const onRefresh = useCallback(() => {
    loadData(0, true);
  }, [loadData]);

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
    if (!status) return '#666666';
    
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

  const renderPrestationItem = ({ item }: { item: PrestationItem }) => (
    <TouchableOpacity 
      style={[styles.prestationCardModern, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
      onPress={() => openPrestationModal(item)}
    >
      {/* Header moderne avec gradient */}
      <View style={[styles.cardHeaderModern, { backgroundColor: theme.colors.primary + '08' }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainerModern, { backgroundColor: theme.colors.primary }]}>
            <Ionicons 
              name={item.acte_libelle?.includes('CONSULTATION') ? 'medical' : 'flask'} 
              size={24} 
              color="white" 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.cardTitleModern, { color: theme.colors.textPrimary }]} numberOfLines={2}>
              {item.acte_libelle || 'Non renseigné'}
            </Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.dateTextModern, { color: theme.colors.textSecondary }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.statusBadgeModern, { backgroundColor: getStatusColor(item.statut || '') }]}>
          <Text style={styles.statusTextModern}>{getStatusText(item)}</Text>
        </View>
      </View>

      {/* Section patient moderne */}
      <View style={styles.patientSectionModern}>
        <View style={styles.patientRow}>
          <View style={[styles.patientIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="person" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.patientInfoModern}>
            <Text style={[styles.patientNameModern, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.beneficiaire_prenom} {item.beneficiaire_nom}
            </Text>
            <Text style={[styles.patientMatriculeModern, { color: theme.colors.textSecondary }]}>
              Matricule: {item.matricule_assure || 'Non renseigné'}
            </Text>
          </View>
        </View>
      </View>

      {/* Section montants moderne */}
      <View style={styles.amountsSectionModern}>
        <View style={styles.amountRowModern}>
          <View style={styles.amountItem}>
            <Text style={[styles.amountLabelModern, { color: theme.colors.textSecondary }]}>Total</Text>
            <Text style={[styles.amountValueModern, { color: theme.colors.textPrimary }]}>
              {formatAmount(item.montant)}
            </Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountItem}>
            <Text style={[styles.amountLabelModern, { color: theme.colors.textSecondary }]}>Assurance</Text>
            <Text style={[styles.amountValueModern, { color: '#3d8f9d' }]}>
              {formatAmount(item.part_assurance)}
            </Text>
          </View>
          <View style={styles.amountDivider} />
          <View style={styles.amountItem}>
            <Text style={[styles.amountLabelModern, { color: theme.colors.textSecondary }]}>Patient</Text>
            <Text style={[styles.amountValueModern, { color: '#FF9800' }]}>
              {formatAmount(item.part_patient)}
            </Text>
          </View>
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

    if (prestations.length === 0 && !loading) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="people-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={[styles.emptyStateTitle, { color: '#2D3748' }]}>
            Aucune prestation trouvée
          </Text>
          <Text style={[styles.emptyStateText, { color: '#718096' }]}>
            Aucune prestation n'a été trouvée pour cette famille dans la période sélectionnée.
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
        onEndReachedThreshold={0.5}
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
          <Text style={styles.headerTitle}>Prestations par Famille</Text>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={openFilterModal}
          >
            <Ionicons name="filter-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="people-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
            Chargement des prestations...
          </Text>
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
                Filtrer par famille
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
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Matricule de la famille</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.background, 
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary 
                  }]}
                  placeholder="Entrez le matricule de la famille..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={tempFilters.matriculeFamille}
                  onChangeText={(text) => setTempFilters({...tempFilters, matriculeFamille: text})}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date de début</Text>
                <TouchableOpacity 
                  style={[styles.dateButton, { 
                    backgroundColor: theme.colors.background, 
                    borderColor: theme.colors.border 
                  }]}
                  onPress={() => setShowDateDebutPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                  <Text style={[styles.dateButtonText, { color: theme.colors.textPrimary }]}>
                    {tempFilters.dateDebut.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
                {showDateDebutPicker && (
                  <DateTimePicker
                    value={tempFilters.dateDebut}
                    mode="date"
                    display="default"
                    onChange={handleDateDebutChange}
                  />
                )}
              </View>

              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date de fin</Text>
                <TouchableOpacity 
                  style={[styles.dateButton, { 
                    backgroundColor: theme.colors.background, 
                    borderColor: theme.colors.border 
                  }]}
                  onPress={() => setShowDateFinPicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                  <Text style={[styles.dateButtonText, { color: theme.colors.textPrimary }]}>
                    {tempFilters.dateFin.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
                {showDateFinPicker && (
                  <DateTimePicker
                    value={tempFilters.dateFin}
                    mode="date"
                    display="default"
                    onChange={handleDateFinChange}
                  />
                )}
              </View>
            </ScrollView>
            
            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={() => {
                  setTempFilters({
                    matriculeFamille: '',
                    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    dateFin: new Date()
                  });
                  setFilters({
                    matriculeFamille: '',
                    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    dateFin: new Date()
                  });
                  setShowFilterModal(false);
                  loadData(0, true);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setFilters(tempFilters);
                  setShowFilterModal(false);
                  // Vider les données avant de recharger
                  setPrestations([]);
                  setFilteredPrestations([]);
                  setCurrentPage(0);
                  setHasMoreData(true);
                  setInitialLoading(true); // Réactiver le loading initial
                  loadData(0, true);
                }}
              >
                <Ionicons name="checkmark-outline" size={18} color="white" />
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
          <View style={[styles.modalHeaderModern, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity 
              onPress={() => setShowDetailsModal(false)}
              style={styles.closeButtonModern}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitleModern}>Détails de la prestation</Text>
              <Text style={styles.modalSubtitle}>Informations complètes</Text>
            </View>
          </View>
          
          {selectedPrestation && (
            <ScrollView style={styles.modalBodyModern}>
              {/* Carte patient */}
              <View style={[styles.patientCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.patientHeader}>
                  <View style={[styles.patientAvatar, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name="person" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={[styles.patientName, { color: theme.colors.textPrimary }]}>
                      {selectedPrestation.beneficiaire_prenom} {selectedPrestation.beneficiaire_nom}
                    </Text>
                    <Text style={[styles.patientMatricule, { color: theme.colors.textSecondary }]}>
                      Matricule: {selectedPrestation.matricule_assure}
                    </Text>
                  </View>
                  <View style={[styles.statusBadgeModern, { backgroundColor: getStatusColor(selectedPrestation.statut || '') }]}>
                    <Text style={styles.statusTextModern}>{selectedPrestation.statut}</Text>
                  </View>
                </View>
              </View>

              {/* Carte détails financiers */}
              <View style={[styles.financialCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Détails financiers</Text>
                </View>
                <View style={styles.financialGrid}>
                  <View style={styles.financialItem}>
                    <Text style={[styles.financialLabel, { color: theme.colors.textSecondary }]}>Montant total</Text>
                    <Text style={[styles.financialValue, { color: theme.colors.textPrimary }]}>
                      {formatAmount(selectedPrestation.montant)}
                    </Text>
                  </View>
                  <View style={styles.financialItem}>
                    <Text style={[styles.financialLabel, { color: theme.colors.textSecondary }]}>Part assurance</Text>
                    <Text style={[styles.financialValue, { color: '#3d8f9d' }]}>
                      {formatAmount(selectedPrestation.part_assurance)}
                    </Text>
                  </View>
                  <View style={styles.financialItem}>
                    <Text style={[styles.financialLabel, { color: theme.colors.textSecondary }]}>Part patient</Text>
                    <Text style={[styles.financialValue, { color: '#FF9800' }]}>
                      {formatAmount(selectedPrestation.part_patient)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Carte informations supplémentaires */}
              <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Informations</Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Type de prestation</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrestation.acte_libelle}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Garantie</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrestation.garantie_libelle}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Prestataire</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrestation.prestataire_libelle}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Date de création</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                        {formatDate(selectedPrestation.created_at)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
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
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  
  // États de chargement et d'erreur
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Modal de filtres
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  
  // Modal de détails
  modalContainer: {
    flex: 1,
  },
  modalHeaderModern: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButtonModern: {
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitleModern: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  modalBodyModern: {
    flex: 1,
    padding: 20,
  },
  
  // Cartes du modal de détails
  patientCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  patientMatricule: {
    fontSize: 14,
    opacity: 0.8,
  },
  
  financialCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  financialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Styles pour la grille d'informations
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Nouveaux styles modernes pour les cartes
  prestationCardModern: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeaderModern: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainerModern: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  headerInfo: {
    flex: 1,
  },
  cardTitleModern: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 22,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTextModern: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  statusBadgeModern: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  statusTextModern: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  
  patientSectionModern: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInfoModern: {
    flex: 1,
  },
  patientNameModern: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  patientMatriculeModern: {
    fontSize: 13,
    opacity: 0.8,
  },
  
  amountsSectionModern: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  amountRowModern: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabelModern: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  amountValueModern: {
    fontSize: 14,
    fontWeight: '700',
  },
  amountDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 8,
  },
});

export default PrestationsByFamilleScreen;