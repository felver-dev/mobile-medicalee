import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { SafeAreaView, Platform } from 'react-native';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import Loader, { LoadingCard } from '../../components/Loader';
import { useModal } from '../../hooks/useModal';
import CustomModal from '../../components/CustomModal';
import ApiService from '../../services/ApiService';
import { GARANTIES_WITH_ALL } from '../../constants/garanties';

interface PrescriptionByGarantieScreenProps {
  navigation: any;
}

interface PrescriptionItem {
  id: number;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  beneficiaire_matricule: string;
  medicament_libelle: string;
  quantite: number;
  posologie: string;
  date_prescription: string;
  statut: string;
  garantie_libelle: string;
  montant?: number;
  prix_unitaire?: number;
  details?: string;
}

interface GarantieFilter {
  garantie: string | undefined;
  dateDebut: string;
  dateFin: string;
  matriculeAssure: string;
}

const PrescriptionByGarantieScreen: React.FC<PrescriptionByGarantieScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { modalState, showAlert } = useModal();
  const { theme } = usePrestataireTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  const pageSize = 10;
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<GarantieFilter>({
    garantie: undefined,
    dateDebut: '2025-01-01',
    dateFin: '2025-09-30',
    matriculeAssure: ''
  });
  const [showGarantiePicker, setShowGarantiePicker] = useState(false);
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionItem | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  const [apiService] = useState(() => new ApiService());

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(0);
    setPrescriptions([]);
    setFilteredPrescriptions([]);
    setTotalItems(0);
    setHasMoreData(true);
    loadData(0, false);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const loadMoreData = useCallback(() => {
    console.log('🔄 loadMoreData appelé:');
    console.log('🔄 LoadingMore:', loadingMore);
    console.log('🔄 HasMoreData:', hasMoreData);
    console.log('🔄 CurrentPage:', currentPage);
    console.log('🔄 Prescriptions actuelles:', prescriptions.length);
    console.log('🔄 Total items:', totalItems);
    
    if (!loadingMore && hasMoreData && prescriptions.length < totalItems) {
      const nextPage = currentPage + 1;
      console.log('✅ Chargement de plus de prescriptions - Page suivante:', nextPage);
      loadData(nextPage, true);
    } else {
      console.log('❌ Pas de chargement - LoadingMore:', loadingMore, 'HasMoreData:', hasMoreData, 'Total:', totalItems);
    }
  }, [currentPage, loadingMore, hasMoreData, loadData, prescriptions.length, totalItems]);

  const loadData = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!user) {
      console.log('❌ Utilisateur non connecté');
      return;
    }

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🔍 PrescriptionByGarantieScreen.loadData démarré - Page:', page);
      console.log('👤 User:', user);
      console.log('🔧 Filters:', filters);

      // Utiliser les dates par défaut si non définies
      const today = new Date();
      const dateDebut = filters.dateDebut || '2025-01-01';
      const dateFin = filters.dateFin || '2025-09-30';

      const apiParams = {
        userId: Number(user.id),
        filialeId: user.filiale_id || 1,
        garantieCodification: filters.garantie && filters.garantie !== '' && filters.garantie !== undefined ? filters.garantie : undefined,
        matriculeAssure: filters.matriculeAssure ? Number(filters.matriculeAssure) : undefined,
        prestataireId: user.prestataire_id || undefined,
        dateDebut,
        dateFin,
        index: page * pageSize,
        size: pageSize,
      };

      console.log('📦 Paramètres API:', apiParams);
      console.log('🔍 Filtres actuels:', filters);

      const response = await apiService.getPrescriptionActeByCriteria(apiParams);

      console.log('✅ Réponse API complète:', response);
      console.log('📊 Nombre d\'items:', response?.items?.length || 0);
      console.log('🔍 Items avec is_entente_prealable:', response?.items?.filter((item: any) => item.is_entente_prealable)?.length || 0);
      
      // Debug des champs disponibles dans la première prescription
      if (response?.items?.[0]) {
        console.log('📋 Champs disponibles dans la première prescription:');
        console.log('Keys:', Object.keys(response.items[0]));
        console.log('Premier item complet:', response.items[0]);
      }

      if (response && response.items) {
        const prescriptionsData = response.items.map((item: any) => ({
            id: item.id,
            beneficiaire_nom: item.beneficiaire_nom || 'Non renseigné',
            beneficiaire_prenom: item.beneficiaire_prenom || 'Non renseigné',
            beneficiaire_matricule: item.beneficiaire_matricule || item.matricule || 'Non renseigné',
            medicament_libelle: item.medicament_libelle || item.libelle || 'Non renseigné',
            quantite: item.quantite || 0,
            posologie: item.posologie || 'Non renseigné',
            date_prescription: item.date_prescription || item.created_at,
            statut: item.is_entente_prealable ? 'Entente préalable' : (item.is_exclu ? 'Exclu' : 'En attente'),
            garantie_libelle: item.garantie_libelle || 'Non renseigné',
            montant: item.montant || (item.prix_unitaire ? item.prix_unitaire * item.quantite : undefined),
            prix_unitaire: item.prix_unitaire,
            details: item.observation || 'Non renseigné'
          }));

        if (append) {
          setPrescriptions(prev => [...prev, ...prescriptionsData]);
          setFilteredPrescriptions(prev => [...prev, ...prescriptionsData]);
        } else {
          setPrescriptions(prescriptionsData);
          setFilteredPrescriptions(prescriptionsData);
        }

        // Logique de hasMoreData corrigée
        setTotalItems(response.count || 0);
        setCurrentPage(page);
        
        const totalLoaded = (page + 1) * pageSize;
        setHasMoreData(prescriptionsData.length === pageSize && totalLoaded < (response.count || 0));
        
        console.log('📈 État après chargement:');
        console.log('📈 Éléments reçus:', prescriptionsData.length);
        console.log('📈 Total items:', response.count || 0);
        console.log('📈 Total chargé:', totalLoaded);
        console.log('📈 HasMoreData:', prescriptionsData.length === pageSize && totalLoaded < (response.count || 0));
        console.log('📈 CurrentPage:', page);
      } else {
        if (!append) {
          setPrescriptions([]);
          setFilteredPrescriptions([]);
        }
        setHasMoreData(false);
        console.log('⚠️ Aucune prescription trouvée - Response:', response);
        console.log('⚠️ Response.items:', response?.items);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des prescriptions:', error);
      showAlert('Erreur', 'Impossible de charger les prescriptions', 'error');
      if (!append) {
        setPrescriptions([]);
        setFilteredPrescriptions([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, [user, apiService]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Initialiser les dates par défaut
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      dateDebut: prev.dateDebut || today,
      dateFin: prev.dateFin || today
    }));
  }, []);

  // Pas de filtrage côté client - l'API filtre déjà
  useEffect(() => {
    setFilteredPrescriptions(prescriptions);
  }, [prescriptions]);

  const handleFilterChange = (key: keyof GarantieFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGarantieSelect = (garantie: { code: string; libelle: string }) => {
    setFilters(prev => ({ ...prev, garantie: garantie.code }));
    setShowGarantiePicker(false);
  };

  const handleDateDebutChange = (event: any, selectedDate?: Date) => {
    setShowDateDebutPicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFilters(prev => ({ ...prev, dateDebut: dateString }));
    }
  };

  const handleDateFinChange = (event: any, selectedDate?: Date) => {
    setShowDateFinPicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFilters(prev => ({ ...prev, dateFin: dateString }));
    }
  };

  const applyFilters = () => {
    setCurrentPage(0);
    setPrescriptions([]);
    setFilteredPrescriptions([]);
    setHasMoreData(true);
    loadData(0, false);
  };

  const clearFilters = () => {
    setFilters({
      garantie: undefined,
      dateDebut: '2025-01-01',
      dateFin: '2025-09-30',
      matriculeAssure: ''
    });
    setCurrentPage(0);
    setHasMoreData(true);
  };

  const getStatusColor = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'validée':
        return '#4CAF50';
      case 'en attente':
        return '#FF9800';
      case 'refusée':
        return '#F44336';
      case 'entente préalable':
        return '#2196F3';
      case 'exclu':
        return '#F44336';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusBgColor = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'validée':
        return '#E8F5E8';
      case 'en attente':
        return '#FFF3E0';
      case 'refusée':
        return '#FFEBEE';
      case 'entente préalable':
        return '#E3F2FD';
      case 'exclu':
        return '#FFEBEE';
      default:
        return theme.colors.background;
    }
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

  const formatAmount = (amount?: number) => {
    if (!amount || amount === 0) return 'Non renseigné';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const renderPrescription = ({ item }: { item: PrescriptionItem }) => (
    <TouchableOpacity 
      style={[styles.prescriptionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => {
        setSelectedPrescription(item);
        setShowPrescriptionModal(true);
      }}
    >
      {/* Header compact */}
      <View style={[styles.prescriptionHeader, { backgroundColor: theme.colors.primaryLight }]}>
        <View style={styles.prescriptionHeaderContent}>
          <View style={styles.prescriptionHeaderLeft}>
            <View style={[styles.prescriptionIconContainer, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="medical" size={16} color="white" />
            </View>
            <View style={styles.prescriptionHeaderText}>
              <Text style={[styles.prescriptionTitle, { color: theme.colors.textPrimary }]}>
                #{item.id} • {item.beneficiaire_prenom} {item.beneficiaire_nom}
              </Text>
              <Text style={[styles.prescriptionSubtitle, { color: theme.colors.textSecondary }]}>
                {item.medicament_libelle}
              </Text>
            </View>
          </View>
          <View style={[styles.prescriptionStatusBadge, { backgroundColor: getStatusBgColor(item.statut) }]}>
            <Text style={[styles.prescriptionStatusText, { color: getStatusColor(item.statut) }]}>
              {item.statut}
            </Text>
          </View>
        </View>
      </View>

      {/* Contenu compact */}
      <View style={styles.prescriptionContent}>
        {/* Informations en ligne */}
        <View style={styles.prescriptionInfoRow}>
          <View style={styles.prescriptionInfoItem}>
            <View style={styles.prescriptionInfoIconContainer}>
              <Ionicons name="calendar" size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.prescriptionInfoTextContainer}>
              <Text style={[styles.prescriptionInfoLabel, { color: theme.colors.textSecondary }]}>
                Date
              </Text>
              <Text style={[styles.prescriptionInfoValue, { color: theme.colors.textPrimary }]}>
                {formatDate(item.date_prescription)}
              </Text>
            </View>
          </View>
          
          <View style={styles.prescriptionInfoItem}>
            <View style={styles.prescriptionInfoIconContainer}>
              <Ionicons name="cube" size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.prescriptionInfoTextContainer}>
              <Text style={[styles.prescriptionInfoLabel, { color: theme.colors.textSecondary }]}>
                Quantité
              </Text>
              <Text style={[styles.prescriptionInfoValue, { color: theme.colors.textPrimary }]}>
                {item.quantite}
              </Text>
            </View>
          </View>
          
          <View style={styles.prescriptionInfoItem}>
            <View style={styles.prescriptionInfoIconContainer}>
              <Ionicons name="medical" size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.prescriptionInfoTextContainer}>
              <Text style={[styles.prescriptionInfoLabel, { color: theme.colors.textSecondary }]}>
                Posologie
              </Text>
              <Text style={[styles.prescriptionInfoValue, { color: theme.colors.textPrimary }]}>
                {item.posologie}
              </Text>
            </View>
          </View>
          
          <View style={styles.prescriptionInfoItem}>
            <View style={styles.prescriptionInfoIconContainer}>
              <Ionicons name="card" size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.prescriptionInfoTextContainer}>
              <Text style={[styles.prescriptionInfoLabel, { color: theme.colors.textSecondary }]}>
                Montant
              </Text>
              <Text style={[styles.prescriptionInfoValue, { color: theme.colors.textPrimary }]}>
                {formatAmount(item.montant)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer compact */}
        <View style={[styles.prescriptionFooter, { backgroundColor: theme.colors.background }]}>
          <View style={styles.prescriptionFooterContent}>
            <View style={styles.prescriptionFooterLeft}>
              <Ionicons name="shield-checkmark" size={14} color={theme.colors.primary} />
              <Text style={[styles.prescriptionFooterText, { color: theme.colors.textSecondary }]}>
                {item.garantie_libelle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.textSecondary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (initialLoading) {
      return (
        <LoadingCard 
          visible={initialLoading} 
          message="Chargement des prescriptions par garantie..." 
          height={300}
        />
      );
    }

    return (
      <View style={styles.content}>
        {/* Header simple et propre */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Prescriptions par Garantie</Text>
              <Text style={styles.headerSubtitle}>
                {filteredPrescriptions.length} prescription{filteredPrescriptions.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => {
                console.log('🔍 Bouton filtre pressé');
                setShowFilters(true);
              }}
            >
              <Ionicons name="filter" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>


        {/* Liste des prescriptions */}
        <View style={styles.listContainer}>
          <View style={styles.spacer} />

          {filteredPrescriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                Aucune prescription trouvée
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                {filters.garantie || filters.matriculeAssure || filters.dateDebut || filters.dateFin 
                  ? 'Essayez de modifier vos filtres' 
                  : 'Aucune prescription disponible pour le moment'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredPrescriptions}
              renderItem={renderPrescription}
              keyExtractor={(item) => item.id.toString()}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[theme.colors.primary]}
                  tintColor={theme.colors.primary}
                />
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onEndReached={loadMoreData}
              onEndReachedThreshold={0.1}
              ListFooterComponent={() => {
                if (!loadingMore) return null;
                return (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={[styles.loadingMoreText, { color: theme.colors.textSecondary }]}>
                      Chargement...
                    </Text>
                  </View>
                );
              }}
              removeClippedSubviews={false}
            />
          )}
        </View>
      </View>
    );
  };

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      
      {renderContent()}
      
      {/* Loader overlay */}
      <Loader 
        visible={loading && !initialLoading} 
        message="Mise à jour des prescriptions..." 
        overlay={true}
      />

      {/* Custom Modal */}
      <CustomModal {...modalState} />

      {/* Filtres Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.filterModalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.filterModalTitle, { color: theme.colors.textPrimary }]}>
                Filtres de recherche
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.filterModalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.filtersGrid}>
                <View style={styles.filterItem}>
                  <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Garantie</Text>
                  <TouchableOpacity
                    style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                    onPress={() => setShowGarantiePicker(true)}
                  >
                    <Text style={[styles.filterInputText, { color: filters.garantie !== undefined ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                      {filters.garantie !== undefined ? GARANTIES_WITH_ALL.find(g => g.code === filters.garantie)?.libelle : 'Sélectionner une garantie'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.filterItem}>
                  <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Matricule Assuré</Text>
                  <TextInput
                    style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                    placeholder="Matricule de l'assuré"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={filters.matriculeAssure}
                    onChangeText={(text) => handleFilterChange('matriculeAssure', text)}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.filterItem}>
                  <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date début</Text>
                  <TouchableOpacity
                    style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                    onPress={() => setShowDateDebutPicker(true)}
                  >
                    <Text style={[styles.filterInputText, { color: filters.dateDebut ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                      {filters.dateDebut || 'Sélectionner une date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.filterItem}>
                  <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date fin</Text>
                  <TouchableOpacity
                    style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                    onPress={() => setShowDateFinPicker(true)}
                  >
                    <Text style={[styles.filterInputText, { color: filters.dateFin ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                      {filters.dateFin || 'Sélectionner une date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={clearFilters}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  applyFilters();
                  setShowFilters(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Rechercher</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Garantie Picker Modal */}
      <Modal
        visible={showGarantiePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGarantiePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.filterModalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.filterModalTitle, { color: theme.colors.textPrimary }]}>
                Sélectionner une garantie
              </Text>
              <TouchableOpacity
                onPress={() => setShowGarantiePicker(false)}
                style={styles.filterModalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.garantiePickerContainer}>
              {GARANTIES_WITH_ALL.map((garantie) => (
                <TouchableOpacity
                  key={garantie.code}
                  style={[
                    styles.garantiePickerItem,
                    { 
                      backgroundColor: filters.garantie === garantie.code ? theme.colors.primaryLight : theme.colors.background,
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => handleGarantieSelect(garantie)}
                >
                  <Text style={[
                    styles.garantiePickerText,
                    { color: filters.garantie === garantie.code ? theme.colors.primary : theme.colors.textPrimary }
                  ]}>
                    {garantie.libelle}
                  </Text>
                  {filters.garantie === garantie.code && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showDateDebutPicker && (
        <DateTimePicker
          value={filters.dateDebut ? new Date(filters.dateDebut) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateDebutChange}
        />
      )}

      {showDateFinPicker && (
        <DateTimePicker
          value={filters.dateFin ? new Date(filters.dateFin) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateFinChange}
        />
      )}

      {/* Modal de détails de prescription */}
      <Modal
        visible={showPrescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPrescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.prescriptionModalContent, { backgroundColor: theme.colors.surface }]}>
            {/* Header moderne */}
            <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
              <View style={styles.modalHeaderContent}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="medical" size={24} color="white" />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>Détails de la prescription</Text>
                    {selectedPrescription && (
                      <Text style={styles.modalSubtitle}>
                        #{selectedPrescription.id} • {selectedPrescription.beneficiaire_prenom} {selectedPrescription.beneficiaire_nom}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setShowPrescriptionModal(false)}
                  style={styles.filterModalCloseButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.prescriptionModalBody}>
              {selectedPrescription && (
                <View style={styles.prescriptionDetails}>
                  {/* Détails du médicament directement */}
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Médicament</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                      {selectedPrescription.medicament_libelle}
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Quantité</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                      {selectedPrescription.quantite}
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Posologie</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                      {selectedPrescription.posologie}
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Montant</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.primary, fontWeight: '600' }]}>
                      {formatAmount(selectedPrescription.montant)}
                    </Text>
                  </View>
                  
                  {selectedPrescription.details && selectedPrescription.details !== 'Non renseigné' && (
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Détails</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrescription.details}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingVertical: 32,
    minHeight: 120,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  filtersContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  filtersHeader: {
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filtersHeaderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filtersGrid: {
    gap: 12,
  },
  filterItem: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterInputText: {
    fontSize: 14,
    flex: 1,
  },
  garantiePickerContainer: {
    paddingVertical: 10,
    maxHeight: 400,
  },
  garantiePickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  garantiePickerText: {
    fontSize: 16,
    fontWeight: '500',
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
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterModalCloseButton: {
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
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  spacer: {
    height: 20,
  },
  listHeader: {
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
  },
  prescriptionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  prescriptionHeader: {
    padding: 12,
  },
  prescriptionHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescriptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prescriptionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  prescriptionHeaderText: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  prescriptionSubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  prescriptionStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prescriptionStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  prescriptionContent: {
    padding: 12,
    paddingTop: 0,
  },
  prescriptionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  prescriptionInfoItem: {
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  prescriptionInfoIconContainer: {
    marginBottom: 4,
  },
  prescriptionInfoTextContainer: {
    alignItems: 'center',
  },
  prescriptionInfoLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 2,
  },
  prescriptionInfoValue: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  prescriptionFooter: {
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  prescriptionFooterContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prescriptionFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prescriptionFooterText: {
    fontSize: 11,
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // Styles pour le modal de détails de prescription
  prescriptionModalContent: {
    maxHeight: '80%',
    width: '90%',
    margin: 20,
    marginTop: 100,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  modalHeader: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prescriptionModalBody: {
    padding: 16,
  },
  prescriptionDetails: {
    // Supprimé flex: 1 pour éviter l'étirement
  },
  infoItem: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
  },
});

export default PrescriptionByGarantieScreen;
