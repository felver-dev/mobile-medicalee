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
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'react-native';
import { SafeAreaView, Platform } from 'react-native';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';
import { GARANTIES_WITH_ALL } from '../../constants/garanties';

interface PrestationsByGarantieScreenProps {
  navigation: any;
}

interface PrestationItem {
  id: number;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  matricule_assure: number;
  acte_libelle: string;
  montant: number;
  created_at: string;
  garantie_libelle: string;
  prestataire_libelle: string;
  part_patient: number;
  part_assurance: number;
  quantite: number;
  prix_unitaire: number;
}

interface PrestationFilters {
  garantie: string;
  dateDebut: Date;
  dateFin: Date;
}

const PrestationsByGarantieScreen: React.FC<PrestationsByGarantieScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const [apiService] = useState(() => new ApiService());
  const [prestations, setPrestations] = useState<PrestationItem[]>([]);
  const [filteredPrestations, setFilteredPrestations] = useState<PrestationItem[]>([]);
  const [selectedPrestation, setSelectedPrestation] = useState<PrestationItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<PrestationFilters>({
    garantie: 'PHARMA',
    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours en arrière
    dateFin: new Date()
  });
  const [tempFilters, setTempFilters] = useState<PrestationFilters>({
    garantie: 'PHARMA',
    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours en arrière
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
      console.log('🔍 PrestationsByGarantieScreen.loadData démarré - Page:', page);
      
      if (!user) {
        console.log('❌ Utilisateur non connecté');
        setError('Utilisateur non connecté');
        return;
      }

      const payload = {
        user_id: user.id,
        filiale_id: user.filiale_id,
        garantie_codification: filters.garantie && filters.garantie !== '' ? filters.garantie : undefined,
        date_debut: `${filters.dateDebut.toISOString().split('T')[0]}T00:00:00.000Z`,
        date_fin: `${filters.dateFin.toISOString().split('T')[0]}T00:00:00.000Z`,
        data: {
          prestataire_id: user.prestataire_id || user.id
        },
        index: page * 100,
        size: 100
      };

      console.log('📤 Payload API:', JSON.stringify(payload, null, 2));
      console.log('🔍 Garantie sélectionnée:', filters.garantie);
      console.log('🔍 Garantie dans payload:', payload.garantie_codification);

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

      console.log('✅ Chargement des prestations par garantie terminé');

    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des prestations par garantie:', error);
      setError(error.message || 'Erreur lors du chargement des données');
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
    console.log('🔍 useEffect loadData appelé');
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
    if (!amount || amount === 0) return 'Non renseigné';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const getStatusColor = (prestation: PrestationItem) => {
    // Logique basée sur les données disponibles
    if (prestation.part_assurance > 0) return '#3d8f9d'; // Validée
    if (prestation.part_patient > 0) return '#FF9800'; // En attente
    return '#666666'; // Par défaut
  };

  const getStatusText = (prestation: PrestationItem) => {
    if (prestation.part_assurance > 0) return 'Validée';
    if (prestation.part_patient > 0) return 'En attente';
    return 'Non renseigné';
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
          <View style={[styles.prestationIcon, { backgroundColor: getStatusColor(item) + '15' }]}>
            <Ionicons 
              name={item.acte_libelle?.includes('CONSULTATION') ? 'medical-outline' : 'flask-outline'} 
              size={20} 
              color={getStatusColor(item)} 
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
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
          <Text style={styles.statusText}>{getStatusText(item)}</Text>
        </View>
      </View>

      {/* Informations patient améliorées */}
      <View style={styles.patientSection}>
        <View style={styles.patientHeaderCard}>
          <View style={[styles.patientAvatarCard, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.patientDetails}>
            <Text style={[styles.patientNameCard, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.beneficiaire_prenom} {item.beneficiaire_nom}
            </Text>
            <View style={styles.patientMatriculeRow}>
              <Ionicons name="card-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.patientMatriculeCard, { color: theme.colors.textSecondary }]}>
                {item.matricule_assure || 'Non renseigné'}
              </Text>
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
    
    if (initialLoading) {
      return (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <Ionicons name="medical-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
            Chargement des prestations...
          </Text>
        </View>
      );
    }
    
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
          <Text style={styles.headerTitle}>Prestations par Garantie</Text>
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
                Filtrer les prestations
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
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Garantie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.garantieScroll}>
                  {GARANTIES_WITH_ALL.map((garantie) => (
                    <TouchableOpacity
                      key={garantie.code}
                      style={[
                        styles.garantieOption,
                        { 
                          backgroundColor: tempFilters.garantie === garantie.code ? theme.colors.primary : theme.colors.background,
                          borderColor: theme.colors.border
                        }
                      ]}
                      onPress={() => setTempFilters({...tempFilters, garantie: garantie.code})}
                    >
                      <Text style={[
                        styles.garantieText,
                        { color: tempFilters.garantie === garantie.code ? 'white' : theme.colors.textPrimary }
                      ]}>
                        {garantie.libelle}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date début</Text>
                <TouchableOpacity
                  style={[styles.dateInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={() => setShowDateDebutPicker(true)}
                >
                  <Text style={[styles.dateInputText, { color: theme.colors.textPrimary }]}>
                    {tempFilters.dateDebut.toLocaleDateString('fr-FR')}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date fin</Text>
                <TouchableOpacity
                  style={[styles.dateInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={() => setShowDateFinPicker(true)}
                >
                  <Text style={[styles.dateInputText, { color: theme.colors.textPrimary }]}>
                    {tempFilters.dateFin.toLocaleDateString('fr-FR')}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={() => {
                  const resetFilters = {
                    garantie: 'PHARMA',
                    dateDebut: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours en arrière
                    dateFin: new Date()
                  };
                  setTempFilters(resetFilters);
                  setFilters(resetFilters);
                  setShowFilterModal(false);
                  loadData(0, true);
                }}
              >
                <Ionicons name="refresh-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  console.log('🔄 Application des filtres:', tempFilters);
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
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showDateDebutPicker && (
        <DateTimePicker
          value={tempFilters.dateDebut}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateDebutChange}
        />
      )}

      {showDateFinPicker && (
        <DateTimePicker
          value={tempFilters.dateFin}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateFinChange}
        />
      )}

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          {/* Header moderne avec gradient */}
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
            <ScrollView style={styles.modalContentModern} showsVerticalScrollIndicator={false}>
              {/* Card principale avec informations du patient */}
              <View style={[styles.patientCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.patientHeader}>
                  <View style={[styles.patientAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="person" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={[styles.patientNameCard, { color: theme.colors.textPrimary }]}>
                      {selectedPrestation.beneficiaire_prenom} {selectedPrestation.beneficiaire_nom}
                    </Text>
                    <Text style={[styles.patientMatriculeCard, { color: theme.colors.textSecondary }]}>
                      Matricule: {selectedPrestation.matricule_assure || 'Non renseigné'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadgeModern, { backgroundColor: getStatusColor(selectedPrestation) + '20' }]}>
                    <Text style={[styles.statusTextModern, { color: getStatusColor(selectedPrestation) }]}>
                      {getStatusText(selectedPrestation)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Card des détails financiers */}
              <View style={[styles.financialCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                    <Ionicons name="cash-outline" size={20} color="#4CAF50" />
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

              {/* Card des informations supplémentaires */}
              <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIcon, { backgroundColor: '#2196F3' + '20' }]}>
                    <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Informations supplémentaires</Text>
                </View>
                
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Date de prestation</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                        {formatDate(selectedPrestation.created_at)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="shield-outline" size={16} color={theme.colors.textSecondary} />
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Garantie</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrestation.garantie_libelle || 'Non renseigné'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="business-outline" size={16} color={theme.colors.textSecondary} />
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Prestataire</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrestation.prestataire_libelle || 'Non renseigné'}
                      </Text>
                    </View>
                  </View>
                  
                  {selectedPrestation.quantite && (
                    <View style={styles.infoItem}>
                      <Ionicons name="cube-outline" size={16} color={theme.colors.textSecondary} />
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Quantité</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                          {selectedPrestation.quantite}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  {selectedPrestation.prix_unitaire && (
                    <View style={styles.infoItem}>
                      <Ionicons name="pricetag-outline" size={16} color={theme.colors.textSecondary} />
                      <View style={styles.infoContent}>
                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Prix unitaire</Text>
                        <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                          {formatAmount(selectedPrestation.prix_unitaire)}
                        </Text>
                      </View>
                    </View>
                  )}
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
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    minWidth: 200,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: 'white',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  prestationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  prestationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prestationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  patientInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  matriculeText: {
    fontSize: 12,
    marginLeft: 8,
  },
  prestationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  amountRow: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#3d8f9d',
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
  prestationDate: {
    fontSize: 12,
    marginBottom: 2,
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
  filterItem: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  garantieScroll: {
    flexDirection: 'row',
  },
  garantieOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  garantieText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateInputText: {
    fontSize: 16,
    fontWeight: '500',
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
  
  // Nouveaux styles pour le modal moderne
  modalHeaderModern: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonModern: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitleModern: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
  },
  modalContentModern: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  
  // Styles pour la card patient
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
  statusBadgeModern: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusTextModern: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Styles pour les cards
  financialCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  infoCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Styles pour la grille financière
  financialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  financialLabel: {
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Styles pour la grille d'informations
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
  
  // Styles améliorés pour l'affichage du patient
  patientSection: {
    marginVertical: 12,
  },
  patientHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  patientAvatarCard: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientNameCard: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  patientMatriculeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientMatriculeCard: {
    fontSize: 13,
    marginLeft: 6,
    opacity: 0.8,
  },
});

export default PrestationsByGarantieScreen;
