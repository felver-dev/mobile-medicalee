import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Platform,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import ApiService from '../../services/ApiService';

interface PrestataireOrdonnancesScreenProps {
  navigation: any;
}

interface OrdonnanceItem {
  id: number;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  beneficiaire_matricule: string;
  medicament_libelle: string;
  quantite: number;
  created_at: string;
  statut?: string;
  garantie_libelle: string;
  prestataire_libelle: string;
  prix_unitaire?: number;
  posologie: string;
  duree: number;
  ordonnance_code: string;
}

interface AssureFilter {
  dateDebut: Date;
  dateFin: Date;
  matriculeAssure?: number;
}

const OrdonnanceByAssureScreen: React.FC<PrestataireOrdonnancesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const [apiService] = useState(() => new ApiService());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [matriculeInput, setMatriculeInput] = useState('');
  const [ordonnances, setOrdonnances] = useState<OrdonnanceItem[]>([]);
  const [filteredOrdonnances, setFilteredOrdonnances] = useState<OrdonnanceItem[]>([]);
  const [filters, setFilters] = useState<AssureFilter>({
    dateDebut: new Date('2025-01-01'),
    dateFin: new Date('2025-09-30'),
    matriculeAssure: undefined,
  });
  const [tempFilters, setTempFilters] = useState<AssureFilter>({
    dateDebut: new Date('2025-01-01'),
    dateFin: new Date('2025-09-30'),
    matriculeAssure: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<OrdonnanceItem | null>(null);
  const [showOrdonnanceModal, setShowOrdonnanceModal] = useState(false);

  const pageSize = 10;

  const loadData = useCallback(async (page: number = 0, isRefresh: boolean = false) => {
    console.log('🚀 loadData ordonnances par assuré appelé avec:', { page, isRefresh, user });
    if (!user) {
      console.log('❌ Pas d\'utilisateur connecté');
      setInitialLoading(false);
      return;
    }
    
    try {
      if (isRefresh || page === 0) {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const payload = {
        user_id: user.id,
        filiale_id: user.filiale_id,
        date_debut: `${filters.dateDebut.toISOString().split('T')[0]}T00:00:00.000Z`,
        date_fin: `${filters.dateFin.toISOString().split('T')[0]}T00:00:00.000Z`,
        matricule_assure: filters.matriculeAssure,
        data: {
          prestataire_id: user.prestataire_id || user.id,
        },
        index: page * pageSize,
        size: pageSize
      };

      console.log('📦 Payload ordonnances par assuré:', JSON.stringify(payload, null, 2));

      const response = await apiService.getOrdonnancesByCriteria(payload);

      console.log('📦 Réponse API ordonnances par assuré:', response);

      if (response && !response.hasError && response.items) {
        console.log('✅ Données reçues:', response.items.length, 'elements');
        
        const ordonnancesData = response.items.map((item: any) => ({
          id: item.id,
          beneficiaire_nom: item.beneficiaire_nom || 'Non renseigné',
          beneficiaire_prenom: item.beneficiaire_prenom || 'Non renseigné',
          beneficiaire_matricule: item.beneficiaire_matricule || item.matricule || 'Non renseigné',
          medicament_libelle: item.code || item.codification || 'Non renseigné',
          quantite: 1,
          posologie: 'Non renseigné',
          created_at: item.created_at,
          statut: 'En attente',
          garantie_libelle: item.garantie_libelle || 'Non renseigné',
          prestataire_libelle: item.prestataire_libelle || 'Non renseigné',
          prix_unitaire: null,
          duree: 0,
          ordonnance_code: item.code || item.codification || 'Non renseigné'
        }));

        if (isRefresh || page === 0) {
          console.log('🔄 Mise à jour des données - Page initiale');
          setOrdonnances(ordonnancesData);
          setFilteredOrdonnances(ordonnancesData);
          console.log('📊 Ordonnances mises à jour:', ordonnancesData.length);
          setTimeout(() => {
            console.log('⚡ Force setInitialLoading false après délai');
            setInitialLoading(false);
          }, 100);
        } else {
          console.log('➕ Ajout de données - Page suivante');
          setOrdonnances(prev => [...prev, ...ordonnancesData]);
          setFilteredOrdonnances(prev => [...prev, ...ordonnancesData]);
        }

        const totalLoaded = (page + 1) * pageSize;
        const hasMore = totalLoaded < (response.count || 0);
        console.log('📊 État more data:', { totalLoaded, total: response.count, hasMore });
        setHasMoreData(hasMore);
        
        if (page === 0) {
          setTotalItems(response.count || 0);
        }
        
        setCurrentPage(page);
      } else {
        console.log('❌ Pas de données dans la réponse:', response);
        if (isRefresh || page === 0) {
          setOrdonnances([]);
          setFilteredOrdonnances([]);
        }
        setHasMoreData(false);
      }
    } catch (err) {
      console.log('❌ Erreur lors du chargement des ordonnances par assuré:', err);
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      console.log('🏁 Fin du chargement - Reset des états loading');
      if (isRefresh || page === 0) {
        setInitialLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [user, filters, apiService]);

  const loadMoreData = useCallback(async () => {
    console.log('📈 loadMoreData ordonnances par assuré - Tentative');
    console.log('📈 État actuel:', { loadingMore, hasMoreData, currentPage: currentPage + 1 });
    
    if (!loadingMore && hasMoreData) {
      console.log('📈 ⏬ Chargement page suivante...');
      await loadData(currentPage + 1, false);
    } else {
      console.log('📈 ❌ Conditions non remplies:', { loadingMore, hasMoreData });
    }
  }, [loadingMore, hasMoreData, currentPage, loadData ]);

  useEffect(() => {
    console.log('🔧 useEffect ordonnances par assuré - Chargement initial');
    if (user) {
      loadData(0, true);
    }
  }, [user]);

  const onRefresh = useCallback(() => {
    console.log('🔄 Refresh ordonnances par assuré');
    setTotalItems(0);
    setHasMoreData(true);
    loadData(0, true);
  }, [loadData]);

  const handleDateDebutChange = (event: any, selectedDate?: Date) => {
    setShowDateDebutPicker(false);
    if (selectedDate) {
      setTempFilters(prev => ({
        ...prev,
        dateDebut: selectedDate,
      }));
    }
  };

  const handleDateFinChange = (event: any, selectedDate?: Date) => {
    setShowDateFinPicker(false);
    if (selectedDate) {
      setTempFilters(prev => ({
        ...prev,
        dateFin: selectedDate,
      }));
    }
  };

  const applyFilters = () => {
    const matriculeValue = matriculeInput.trim() ? parseInt(matriculeInput.trim()) : undefined;
    const newFilters = {
      ...tempFilters,
      matriculeAssure: matriculeValue,
    };
    setFilters(newFilters);
    setShowFilterModal(false);
    setTotalItems(0);
    setHasMoreData(true);
    loadData(0, true);
  };

  const clearFilters = () => {
    const defaultFilters: AssureFilter = {
      dateDebut: new Date('2025-01-01'),
      dateFin: new Date('2025-09-30'),
      matriculeAssure: undefined,
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setMatriculeInput('');
    setShowFilterModal(false);
    setTotalItems(0);
    setHasMoreData(true);
    loadData(0, true);
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'valide': case 'validé': return '#4CAF50';
      case 'en attente': return '#FF9800';
      case 'refuse': case 'refusé': return '#F44336';
      case 'entente préalable': return '#2196F3';
      case 'exclu': return '#795548';
      default: return '#666666';
    }
  };

  const getStatusBgColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'valide': case 'validé': return '#E8F5E8';
      case 'en attente': return '#FFF3E0';
      case 'refuse': case 'refusé': return '#FFEBEE';
      case 'entente préalable': return '#E3F2FD';
      case 'exclu': return '#EFEBE9';
      default: return '#F5F5F5';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderOrdonnanceCard = ({ item }: { item: OrdonnanceItem }) => (
    <TouchableOpacity
      style={[styles.ordonnanceCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => {
        setSelectedOrdonnance(item);
        setShowOrdonnanceModal(true);
      }}
    >
      <View style={[styles.ordonnanceIcon, { backgroundColor: theme.colors.primary + '15' }]}>
        <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
      </View>
      
      <View style={styles.ordonnanceInfo}>
        <Text style={[styles.patientName, { color: theme.colors.textPrimary }]}>
          {item.beneficiaire_prenom} {item.beneficiaire_nom}
        </Text>
        <Text style={[styles.matriculeText, { color: theme.colors.textSecondary }]}>
          {item.beneficiaire_matricule}
        </Text>
        <Text style={[styles.medicamentText, { color: theme.colors.textPrimary }]}>
          {item.medicament_libelle}
        </Text>
        <View style={styles.ordonnanceFooter}>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.created_at)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.statut || '') }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.statut || '') }]}>
              {item.statut || 'Non enregistré'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (initialLoading) {
      return (
        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Chargement des ordonnances...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => loadData(0, true)}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredOrdonnances.length === 0) {
      return (
        <View style={[styles.emptyState, { backgroundColor: theme.colors.background }]}>
          <Ionicons name="document-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.colors.textPrimary }]}>
            Aucune ordonnance trouvée
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
            Essayez de modifier vos critères de recherche
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredOrdonnances}
        renderItem={renderOrdonnanceCard}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={() => 
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={[styles.footerLoaderText, { color: theme.colors.textSecondary }]}>
                Chargement...
              </Text>
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopPadding} />
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Ordonnances par Assuré</Text>
            <Text style={styles.headerSubtitle}>
              {filteredOrdonnances.length} ordonnance{filteredOrdonnances.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.headerFilterButton, { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0 }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {renderContent()}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.filterModalHeader}>
              <Text style={[styles.filterModalTitle, { color: theme.colors.textPrimary }]}>
                Filtres
              </Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody}>
              {/* Date Début */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: theme.colors.textPrimary }]}>
                  Date de début
                </Text>
                <TouchableOpacity
                  style={[styles.dateInput, { borderColor: theme.colors.border }]}
                  onPress={() => setShowDateDebutPicker(true)}
                >
                  <Text style={[styles.dateInputText, { color: theme.colors.textPrimary }]}>
                    {tempFilters.dateDebut.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Date Fin */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: theme.colors.textPrimary }]}>
                  Date de fin
                </Text>
                <TouchableOpacity
                  style={[styles.dateInput, { borderColor: theme.colors.border }]}
                  onPress={() => setShowDateFinPicker(true)}
                >
                  <Text style={[styles.dateInputText, { color: theme.colors.textPrimary }]}>
                    {tempFilters.dateFin.toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Matricule Assuré */}
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: theme.colors.textPrimary }]}>
                  Matricule assuré (optionnel)
                </Text>
                <View style={[styles.textInput, { borderColor: theme.colors.border }]}>
                  <TextInput
                    style={[styles.textInputField, { color: theme.colors.textPrimary }]}
                    placeholder="Entrer le matricule..."
                    placeholderTextColor={theme.colors.textSecondary}
                    value={matriculeInput}
                    onChangeText={setMatriculeInput}
                    keyboardType="numeric"
                    maxLength={15}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterActions}>
              <TouchableOpacity
                    style={[styles.filterButton, { backgroundColor: theme.colors.border }]}
                    onPress={clearFilters }
                  >
                    <Text style={[styles.filterButtonText, { color: theme.colors.textSecondary }]}>
                      Réinitialiser
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.filterButton, { backgroundColor: theme.colors.primary }]}
                    onPress={applyFilters}
                  >
                    <Text style={[styles.filterButtonText, { color: 'white' }]}>
                      Rechercher
                    </Text>
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

      {/* Ordonnance Details Modal */}
      <Modal
        visible={showOrdonnanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrdonnanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="document-text" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                  Détails de l'ordonnance
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                  {selectedOrdonnance?.ordonnance_code}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowOrdonnanceModal(false)}
                style={[styles.closeButton, { backgroundColor: theme.colors.border }]}
              >
                <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedOrdonnance && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Patient Info Card */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Information Patient</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="person" size={16} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          Nom complet
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                          {selectedOrdonnance.beneficiaire_prenom} {selectedOrdonnance.beneficiaire_nom}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="card-outline" size={16} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          Matricule
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                          {selectedOrdonnance.beneficiaire_matricule}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Ordonnance Info Card */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Détails Ordonnance</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="medical" size={16} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          Médicament
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                          {selectedOrdonnance.medicament_libelle}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          Garantie
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                          {selectedOrdonnance.garantie_libelle}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="list-outline" size={16} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          Quantité
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                          {selectedOrdonnance.quantite}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="clipboard-outline" size={16} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          Posologie
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                          {selectedOrdonnance.posologie}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Status & Date Card */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Informations Générales</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          Statut
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(selectedOrdonnance.statut || '') }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(selectedOrdonnance.statut || '') }]}>
                            {selectedOrdonnance.statut || 'Non enregistré'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <View style={styles.detailIconContainer}>
                        <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                      </View>
                      <View style={styles.detailContent}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          Date de création
                        </Text>
                        <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                          {formatDate(selectedOrdonnance.created_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    paddingBottom: 20,
  },
  headerTopPadding: {
    height: (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  headerFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatListContent: {
    padding: 16,
  },
  ordonnanceCard: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  ordonnanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ordonnanceContent: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  matriculeText: {
    fontSize: 14,
    marginBottom: 8,
  },
  medicamentText: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  ordonnanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerLoaderText: {
    marginTop: 8,
    fontSize: 14,
  },
  
  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterModalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateInput: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  dateInputText: {
    fontSize: 16,
  },
  filterActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Text Input Styles
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInputField: {
    fontSize: 16,
    paddingVertical: 4,
  },
  
  // Modal Details
  modalContent: {
    width: width * 0.95,
    maxHeight: '85%',
    borderRadius: 20,
    backgroundColor: 'white',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitleContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  modalBody: {
    padding: 20,
    paddingTop: 10,
  },
  
  // Info Cards
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  cardContent: {
    gap: 12,
  },
  
  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.8,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default OrdonnanceByAssureScreen;
