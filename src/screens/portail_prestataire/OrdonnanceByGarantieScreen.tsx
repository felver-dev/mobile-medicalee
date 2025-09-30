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
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';
import { GARANTIES_WITH_ALL } from '../../constants/garanties';

interface OrdonnanceByGarantieScreenProps {
  navigation: any;
}

interface OrdonnanceItem {
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
  ordonnance_code: string;
}

interface GarantieFilter {
  garantie: string | undefined;
  dateDebut: string;
  dateFin: string;
}

const { width } = Dimensions.get('window');

const OrdonnanceByGarantieScreen: React.FC<OrdonnanceByGarantieScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const [apiService] = useState(() => new ApiService());
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [ordonnances, setOrdonnances] = useState<OrdonnanceItem[]>([]);
  const [filteredOrdonnances, setFilteredOrdonnances] = useState<OrdonnanceItem[]>([]);
  const [filters, setFilters] = useState<GarantieFilter>({
    garantie: undefined,
    dateDebut: '2025-01-01',
    dateFin: '2025-09-30'
  });
  const [tempFilters, setTempFilters] = useState<GarantieFilter>({
    garantie: undefined,
    dateDebut: '2025-01-01',
    dateFin: '2025-09-30'
  });
  const [error, setError] = useState<string | null>(null);
  const [showGarantiePicker, setShowGarantiePicker] = useState(false);
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedOrdonnance, setSelectedOrdonnance] = useState<OrdonnanceItem | null>(null);
  const [showOrdonnanceModal, setShowOrdonnanceModal] = useState(false);

  const pageSize = 10;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(0);
    setOrdonnances([]);
    setFilteredOrdonnances([]);
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
    console.log('🔄 Ordonnances actuelles:', ordonnances.length);
    console.log('🔄 Total items:', totalItems);
    
    if (!loadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      console.log('✅ Chargement de plus d\'ordonnances - Page suivante:', nextPage);
      loadData(nextPage, true);
    } else {
      console.log('❌ Pas de chargement - LoadingMore:', loadingMore, 'HasMoreData:', hasMoreData, 'Total:', totalItems);
    }
  }, [currentPage, loadingMore, hasMoreData, loadData]);

  const loadData = useCallback(async (page: number = 0, append: boolean = false) => {
    if (!user) {
      console.log('❌ Utilisateur non connecté dans OrdonnanceByGarantieScreen');
      setInitialLoading(false);
      return;
    }

    console.log('🚀 OrdonnanceByGarantieScreen.loadData démarré - Page:', page, 'Append:', append);
    console.log('👤 User connecté:', user);

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setInitialLoading(false); // Arrêter l'écran de chargement initial
    }

    try {
      console.log('🔍 OrdonnanceByGarantieScreen.loadData démarré - Page:', page);
      console.log('👤 User:', user);
      console.log('🔧 Filters:', filters);

      // Utiliser les dates par défaut si non définies
      const today = new Date();
      const dateDebut = filters.dateDebut || '2025-01-01';
      const dateFin = filters.dateFin || '2025-09-30';

      const payload = {
        user_id: user.id,
        filiale_id: user.filiale_id,
        garantie_codification: filters.garantie && filters.garantie !== '' && filters.garantie !== undefined ? filters.garantie : undefined,
        date_debut: `${dateDebut}T00:00:00.000Z`,
        date_fin: `${dateFin}T00:00:00.000Z`,
        data: {
          prestataire_id: user.prestataire_id || user.id,
        },
        index: page * pageSize,
        size: pageSize,
      };

      console.log('📦 Payload OrdonnanceByGarantieScreen:', JSON.stringify(payload, null, 2));
      console.log('🔍 Filtres actuels:', filters);

      const response = await apiService.getOrdonnancesByCriteria(payload);

      console.log('✅ Réponse API complète:', response);
      console.log('📊 Nombre d\'items:', response?.items?.length || 0);
      
      // Debug des champs disponibles dans la première ordonnance
      if (response?.items?.[0]) {
        console.log('📋 Champs disponibles dans la première ordonnance:');
        console.log('Keys:', Object.keys(response.items[0]));
        console.log('Premier item complet:', response.items[0]);
      }

      if (response && response.items) {
        const ordonnancesData = response.items.map((item: any) => ({
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
            details: item.observation || 'Non renseigné',
            ordonnance_code: item.ordonnance_code || 'Non renseigné'
          }));

        if (append) {
          setOrdonnances(prev => [...prev, ...ordonnancesData]);
          setFilteredOrdonnances(prev => [...prev, ...ordonnancesData]);
        } else {
          setOrdonnances(ordonnancesData);
          setFilteredOrdonnances(ordonnancesData);
        }

        // Logique de hasMoreData corrigée (copiée de MedicamentsScreen)
        setTotalItems(response.count || 0);
        setCurrentPage(page);
        
        const totalLoaded = (page + 1) * pageSize;
        setHasMoreData(totalLoaded < (response.count || 0));
        
        console.log('📈 État après chargement:');
        console.log('📈 Éléments reçus:', ordonnancesData.length);
        console.log('📈 Total items:', response.count || 0);
        console.log('📈 Total chargé:', totalLoaded);
        console.log('📈 HasMoreData:', totalLoaded < (response.count || 0));
        console.log('📈 CurrentPage:', page);
      } else {
        if (!append) {
          setOrdonnances([]);
          setFilteredOrdonnances([]);
        }
        setHasMoreData(false);
        console.log('⚠️ Aucune ordonnance trouvée - Response:', response);
        console.log('⚠️ Response.items:', response?.items);
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des ordonnances:', error);
      setError('Erreur lors du chargement des ordonnances');
      if (!append) {
        setOrdonnances([]);
        setFilteredOrdonnances([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, [user, filters, apiService]);

  const handleFilterChange = (key: keyof GarantieFilter, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleGarantieSelect = (garantie: any) => {
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

  const applyFilters = async () => {
    setFilters(tempFilters);
    setCurrentPage(0);
    setOrdonnances([]);
    setFilteredOrdonnances([]);
    setHasMoreData(true);
    await loadData(0, false);
  };

  const clearFilters = async () => {
    setFilters({
      garantie: undefined,
      dateDebut: '2025-01-01',
      dateFin: '2025-09-30'
    });
    setCurrentPage(0);
    setHasMoreData(true);
    await loadData(0, false);
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

  const renderOrdonnance = ({ item }: { item: OrdonnanceItem }) => (
    <TouchableOpacity 
      style={[styles.ordonnanceCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => {
        setSelectedOrdonnance(item);
        setShowOrdonnanceModal(true);
      }}
      activeOpacity={0.7}
    >
      {/* Header avec avatar et statut */}
      <View style={styles.ordonnanceHeader}>
        <View style={styles.ordonnanceIconContainer}>
          <Ionicons name="clipboard" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.ordonnanceInfo}>
          <Text style={[styles.patientName, { color: theme.colors.textPrimary }]}>
            {item.beneficiaire_prenom} {item.beneficiaire_nom}
          </Text>
          <Text style={[styles.matriculeText, { color: theme.colors.textSecondary }]}>
            {item.beneficiaire_matricule}
          </Text>
        </View>
        <View style={[styles.ordonnanceStatusBadge, { backgroundColor: getStatusBgColor(item.statut) }]}>
          <Text style={[styles.ordonnanceStatusText, { color: getStatusColor(item.statut) }]}>
            {item.statut}
          </Text>
        </View>
      </View>

      {/* Contenu compact */}
      <View style={styles.ordonnanceContent}>
        {/* Informations en ligne */}
        <View style={styles.ordonnanceInfoRow}>
          <View style={styles.ordonnanceInfoItem}>
            <View style={styles.ordonnanceInfoIconContainer}>
              <Ionicons name="calendar" size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.ordonnanceInfoTextContainer}>
              <Text style={[styles.ordonnanceInfoLabel, { color: theme.colors.textSecondary }]}>
                Date
              </Text>
              <Text style={[styles.ordonnanceInfoValue, { color: theme.colors.textPrimary }]}>
                {formatDate(item.date_prescription)}
              </Text>
            </View>
          </View>
          
          <View style={styles.ordonnanceInfoItem}>
            <View style={styles.ordonnanceInfoIconContainer}>
              <Ionicons name="cube" size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.ordonnanceInfoTextContainer}>
              <Text style={[styles.ordonnanceInfoLabel, { color: theme.colors.textSecondary }]}>
                Quantité
              </Text>
              <Text style={[styles.ordonnanceInfoValue, { color: theme.colors.textPrimary }]}>
                {item.quantite}
              </Text>
            </View>
          </View>
          
          <View style={styles.ordonnanceInfoItem}>
            <View style={styles.ordonnanceInfoIconContainer}>
              <Ionicons name="medical" size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.ordonnanceInfoTextContainer}>
              <Text style={[styles.ordonnanceInfoLabel, { color: theme.colors.textSecondary }]}>
                Posologie
              </Text>
              <Text style={[styles.ordonnanceInfoValue, { color: theme.colors.textPrimary }]}>
                {item.posologie}
              </Text>
            </View>
          </View>
          
          <View style={styles.ordonnanceInfoItem}>
            <View style={styles.ordonnanceInfoIconContainer}>
              <Ionicons name="card" size={14} color={theme.colors.primary} />
            </View>
            <View style={styles.ordonnanceInfoTextContainer}>
              <Text style={[styles.ordonnanceInfoLabel, { color: theme.colors.textSecondary }]}>
                Montant
              </Text>
              <Text style={[styles.ordonnanceInfoValue, { color: theme.colors.textPrimary }]}>
                {formatAmount(item.montant)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer compact */}
        <View style={[styles.ordonnanceFooter, { backgroundColor: theme.colors.background }]}>
          <View style={styles.ordonnanceFooterContent}>
            <View style={styles.ordonnanceFooterLeft}>
              <Ionicons name="shield-checkmark" size={14} color={theme.colors.primary} />
              <Text style={[styles.ordonnanceFooterText, { color: theme.colors.textSecondary }]}>
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
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="clipboard" size={40} color="#2196F3" />
          </View>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Chargement des ordonnances...
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
            onPress={() => loadData(0, false)}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredOrdonnances.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="clipboard-outline" size={60} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            Aucune ordonnance
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {filters.garantie 
              ? 'Aucune ordonnance trouvée pour cette garantie' 
              : 'Aucune ordonnance disponible pour le moment'}
          </Text>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => loadData(0, false)}
          >
            <Text style={styles.refreshButtonText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredOrdonnances}
        renderItem={renderOrdonnance}
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
        onEndReachedThreshold={0.5}
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
      />
    );
  };

  const headerTopPadding = Platform.OS === 'ios' ? 50 : 30;

  useEffect(() => {
    console.log('🔧 useEffect OrdonnanceByGarantieScreen - Chargement initial');
    if (user) {
      loadData(0, false);
    } else {
      setInitialLoading(false);
    }
  }, [user, loadData]);

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
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Ordonnances par Garantie</Text>
            <Text style={styles.headerSubtitle}>
              {filteredOrdonnances.length} ordonnance{filteredOrdonnances.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.headerFilterButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { color: theme.colors.textPrimary }]}>
                Filtrer les ordonnances
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterContent}>
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Garantie</Text>
                <TouchableOpacity
                  style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={() => setShowGarantiePicker(true)}
                >
                  <Text style={[styles.filterInputText, { color: filters.garantie !== undefined ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                    {filters.garantie !== undefined 
                      ? GARANTIES_WITH_ALL.find(g => g.code === filters.garantie)?.libelle || 'Sélectionner une garantie'
                      : 'Sélectionner une garantie'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
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
            </ScrollView>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={clearFilters}
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

      {/* Garantie Picker Modal */}
      <Modal
        visible={showGarantiePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGarantiePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.garantiePickerModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.garantiePickerHeader}>
              <Text style={[styles.garantiePickerTitle, { color: theme.colors.textPrimary }]}>
                Sélectionner une garantie
              </Text>
              <TouchableOpacity
                onPress={() => setShowGarantiePicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.garantiePickerContainer} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.garantieScrollContent}
            >
              {GARANTIES_WITH_ALL.map((garantie) => (
                <TouchableOpacity
                  key={garantie.code}
                  style={[
                    styles.garantieOption,
                    { 
                      backgroundColor: filters.garantie === garantie.code 
                        ? theme.colors.primary + '20' 
                        : theme.colors.background,
                      borderColor: filters.garantie === garantie.code 
                        ? theme.colors.primary 
                        : theme.colors.border,
                      borderWidth: filters.garantie === garantie.code ? 2 : 1,
                    }
                  ]}
                  onPress={() => handleGarantieSelect(garantie)}
                >
                  <Text style={[
                    styles.garantieOptionText,
                    { 
                      color: filters.garantie === garantie.code 
                        ? theme.colors.primary 
                        : theme.colors.textPrimary,
                      fontWeight: filters.garantie === garantie.code ? 'bold' : '500',
                      fontSize: 16,
                    }
                  ]}>
                    {garantie.libelle}
                  </Text>
                  {filters.garantie === garantie.code && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
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

      {/* Ordonnance Details Modal */}
      <Modal
        visible={showOrdonnanceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrdonnanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Détails de l'ordonnance
              </Text>
              <TouchableOpacity
                onPress={() => setShowOrdonnanceModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.ordonnanceModalBody}>
              {selectedOrdonnance && (
                <View style={styles.ordonnanceDetails}>
                  {/* Détails du médicament directement */}
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Médicament</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                      {selectedOrdonnance.medicament_libelle}
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Quantité</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                      {selectedOrdonnance.quantite}
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Posologie</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                      {selectedOrdonnance.posologie}
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Montant</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.primary, fontWeight: '600' }]}>
                      {formatAmount(selectedOrdonnance.montant)}
                    </Text>
                  </View>
                  
                  {selectedOrdonnance.details && selectedOrdonnance.details !== 'Non renseigné' && (
                    <View style={styles.infoItem}>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Détails</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                        {selectedOrdonnance.details}
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingVertical: 20,
  },
  ordonnanceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  ordonnanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ordonnanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ordonnanceInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  matriculeText: {
    fontSize: 12,
  },
  ordonnanceStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ordonnanceStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ordonnanceContent: {
    flex: 1,
  },
  ordonnanceInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  ordonnanceInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  ordonnanceInfoIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  ordonnanceInfoTextContainer: {
    flex: 1,
  },
  ordonnanceInfoLabel: {
    fontSize: 10,
    marginBottom: 2,
  },
  ordonnanceInfoValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  ordonnanceFooter: {
    borderRadius: 8,
    padding: 8,
  },
  ordonnanceFooterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ordonnanceFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ordonnanceFooterText: {
    fontSize: 12,
    marginLeft: 4,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 10,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  filterContent: {
    padding: 20,
  },
  filterItem: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterInputText: {
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
  garantiePickerModal: {
    width: width * 0.95,
    maxHeight: '80%',
    borderRadius: 16,
  },
  garantiePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  garantiePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  garantiePickerContainer: {
    maxHeight: 500,
  },
  garantieScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  garantieOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  garantieOptionText: {
    fontSize: 16,
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 16,
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
  ordonnanceModalBody: {
    padding: 20,
  },
  ordonnanceDetails: {
    gap: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
  },
});

export default OrdonnanceByGarantieScreen;
