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

interface PrestataireOrdonnancesScreenProps {
  navigation: any;
}

interface OrdonnanceItem {
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
  posologie: string;
  duree: number;
  ordonnance_code: string;
}

interface OrdonnanceFilters {
  dateDebut: Date;
  dateFin: Date;
}

const { width } = Dimensions.get('window');

const PrestataireOrdonnancesScreen: React.FC<PrestataireOrdonnancesScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const [apiService] = useState(() => new ApiService());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [ordonnances, setOrdonnances] = useState<OrdonnanceItem[]>([]);
  const [filteredOrdonnances, setFilteredOrdonnances] = useState<OrdonnanceItem[]>([]);
  const [filters] = useState<OrdonnanceFilters>({
    dateDebut: new Date('2025-01-01'),
    dateFin: new Date('2025-09-30')
  });
  const [tempFilters, setTempFilters] = useState<OrdonnanceFilters>({
    dateDebut: new Date('2025-01-01'),
    dateFin: new Date('2025-09-30')
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

  const ordonnanceOptions = [
    {
      id: 'garantie',
      title: 'Par Garantie',
      subtitle: 'Voir par type de garantie',
      icon: 'shield-checkmark-outline',
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      route: 'OrdonnanceByGarantie'
    },
    {
      id: 'assure',
      title: 'Par Assuré',
      subtitle: 'Voir par assuré',
      icon: 'people-outline',
      color: '#2196F3',
      bgColor: '#E3F2FD',
      route: 'OrdonnanceByAssure'
    }
  ];

  const loadData = useCallback(async (page: number = 0, isRefresh: boolean = false) => {
    console.log('🚀 loadData appelé avec:', { page, isRefresh, user });
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
        user_id: 41,  // Hardcode pour tester
        filiale_id: 1,  // Hardcode pour tester
        date_debut: "2025-01-01T00:00:00.000Z",
        date_fin: "2025-09-30T00:00:00.000Z",
        data: {
          prestataire_id: 5  // Hardcode pour tester
        },
        index: page * pageSize,
        size: pageSize
      };

      console.log('Chargement des ordonnances - Page:', page, 'Payload:', payload);

      const response = await apiService.getOrdonnancesByCriteria(payload);
      console.log('📦 Réponse API ordonnances:', response);
      console.log('📦 Type de réponse:', typeof response);
      console.log('📦 hasError:', response?.hasError);
      console.log('📦 status:', response?.status);

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
            console.log('⚡ Force setInitialLoading false après 1 seconde');
            setInitialLoading(false);
          }, 100);
        } else {
          console.log('➕ Ajout de données - Page suivante');
          setOrdonnances(prev => [...prev, ...ordonnancesData]);
          setFilteredOrdonnances(prev => [...prev, ...ordonnancesData]);
        }

        // Logique de hasMoreData corrigée (copiée de MedicamentsScreen)
        setTotalItems(response.count || 0);
        setCurrentPage(page);
        
        const totalLoaded = (page + 1) * pageSize;
        setHasMoreData(totalLoaded < (response.count || 0));
        
      } else {
        console.log('❌ Pas de données dans la réponse:', response);
        if (isRefresh || page === 0) {
          setOrdonnances([]);
          setFilteredOrdonnances([]);
        }
        setHasMoreData(false);
      }
    } catch (error) {
      console.log('❌ Erreur lors du chargement:', error);
      setError('Erreur lors du chargement des ordonnances');
      if (isRefresh || page === 0) {
        setOrdonnances([]);
        setFilteredOrdonnances([]);
      }
    } finally {
      console.log('🏁 Fin du chargement - Reset des états loading');
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  }, [user]);

  const loadMoreData = useCallback(() => {
    if (!loading && hasMoreData) {
      console.log('Chargement de plus d\'ordonnances - Page suivante:', currentPage + 1);
      loadData(currentPage + 1, false);
    }
  }, [loading, hasMoreData, currentPage, loadData]);

  const onRefresh = useCallback(() => {
    console.log('Rafraîchissement des ordonnances');
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
    setOrdonnances([]);
    setFilteredOrdonnances([]);
    setHasMoreData(true);
    loadData(0, true);
  };

  const resetFilters = () => {
    const defaultFilters = {
      dateDebut: new Date('2025-01-01'),
      dateFin: new Date('2025-09-30')
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    setCurrentPage(0);
    setHasMoreData(true);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getStatusBgColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  useEffect(() => {
    console.log('🎯 useEffect appelé - Chargement initial');
    loadData(0, true);
  }, []);

  const renderOrdonnanceCard = ({ item }: { item: OrdonnanceItem }) => (
    <TouchableOpacity
      style={[styles.ordonnanceCard, { borderColor: theme.colors.border }]}
      onPress={() => {
        setSelectedOrdonnance(item);
        setShowOrdonnanceModal(true);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.ordonnanceHeader}>
        <View style={styles.ordonnanceIcon}>
          <Ionicons name="document-text" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.ordonnanceInfo}>
          <Text style={[styles.patientName, { color: theme.colors.textPrimary }]}>
            {item.beneficiaire_prenom} {item.beneficiaire_nom}
          </Text>
          <Text style={[styles.matriculeText, { color: theme.colors.textSecondary }]}>
            Matricule: {item.beneficiaire_matricule}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item.statut || '') }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.statut || '') }]}>
            {item.statut || 'Non enregistré'}
          </Text>
        </View>
      </View>
      
      <View style={styles.ordonnanceDetails}>
        <Text style={[styles.medicamentName, { color: theme.colors.textPrimary }]}>
          {item.medicament_libelle}
        </Text>
        <Text style={[styles.garantieText, { color: theme.colors.textSecondary }]}>
          {item.garantie_libelle}
        </Text>
        <Text style={[styles.ordonnanceCode, { color: theme.colors.primary }]}>
          Code: {item.ordonnance_code}
        </Text>
      </View>
      
      <View style={styles.ordonnanceFooter}>
        <Text style={[styles.ordonnanceDate, { color: theme.colors.textSecondary }]}>
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
    console.log('🔍 renderContent - initialLoading:', initialLoading, 'filteredOrdonnances:', filteredOrdonnances.length);
    
    if (initialLoading) {
      console.log('⏳ Affichage du chargement initial');
      return (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="document-text" size={40} color={theme.colors.primary} />
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
            onPress={() => loadData(0, true)}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredOrdonnances.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={60} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            Aucune ordonnance
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Aucune ordonnance trouvée pour cette période
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredOrdonnances}
        renderItem={renderOrdonnanceCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={loading}
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
          if (!loading) return null;
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

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }]}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.openDrawer()}
          >
            <Ionicons name="menu" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Ordonnances</Text>
            <Text style={styles.headerSubtitle}>
              {filteredOrdonnances.length} ordonnance{filteredOrdonnances.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.headerFilterButton, { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0 }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setShowMenuModal(true)}
          >
            <Ionicons name="ellipsis-vertical" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* Menu Modal */}
      <Modal
        visible={showMenuModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.menuModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: theme.colors.textPrimary }]}>
                Options Ordonnances
              </Text>
              <TouchableOpacity
                onPress={() => setShowMenuModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuContent}>
              {ordonnanceOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.menuOption, { backgroundColor: option.bgColor }]}
                  onPress={() => {
                    setShowMenuModal(false);
                    navigation.getParent()?.navigate(option.route);
                  }}
                >
                  <View style={[styles.menuOptionIcon, { backgroundColor: option.color }]}>
                    <Ionicons name={option.icon as any} size={24} color="white" />
                  </View>
                  <View style={styles.menuOptionContent}>
                    <Text style={[styles.menuOptionTitle, { color: theme.colors.textPrimary }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.menuOptionSubtitle, { color: theme.colors.textSecondary }]}>
                      {option.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.filterModal, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.filterHeader}>
              <Text style={[styles.filterTitle, { color: theme.colors.textPrimary }]}>
                Filtrer les ordonnances
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterContent}>
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date début</Text>
                <TouchableOpacity
                  style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={() => setShowDateDebutPicker(true)}
                >
                  <Text style={[styles.filterInputText, { color: tempFilters.dateDebut ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                    {tempFilters.dateDebut ? tempFilters.dateDebut.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
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
                  <Text style={[styles.filterInputText, { color: tempFilters.dateFin ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                    {tempFilters.dateFin ? tempFilters.dateFin.toLocaleDateString('fr-FR') : 'Sélectionner une date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={resetFilters}
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

                {/* Financial Info Card */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="cash-outline" size={20} color={theme.colors.primary} />
                    <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Information Financière</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.financialRow}>
                      <View style={styles.financialItem}>
                        <Text style={[styles.financialLabel, { color: theme.colors.textSecondary }]}>
                          Prix unitaire
                        </Text>
                        <Text style={[styles.financialValue, { color: theme.colors.textPrimary }]}>
                          {selectedOrdonnance.prix_unitaire ? formatCurrency(selectedOrdonnance.prix_unitaire) : 'Non renseigné'}
                        </Text>
                      </View>
                      <View style={styles.financialItem}>
                        <Text style={[styles.financialLabel, { color: theme.colors.textSecondary }]}>
                          Total
                        </Text>
                        <Text style={[styles.financialTotal, { color: theme.colors.primary }]}>
                          {selectedOrdonnance.prix_unitaire ? formatCurrency(selectedOrdonnance.prix_unitaire * selectedOrdonnance.quantite) : 'Non renseigné'}
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
  headerFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButton: {
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
  listContent: {
    paddingVertical: 20,
  },
  ordonnanceCard: {
    backgroundColor: 'white',
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
  ordonnanceIcon: {
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ordonnanceDetails: {
    marginBottom: 12,
  },
  medicamentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  garantieText: {
    fontSize: 12,
    marginBottom: 4,
  },
  ordonnanceCode: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ordonnanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ordonnanceDate: {
    fontSize: 12,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
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
  menuModal: {
    width: width * 0.9,
    borderRadius: 16,
    padding: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  menuContent: {
    gap: 12,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  menuOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuOptionContent: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuOptionSubtitle: {
    fontSize: 14,
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
  
  // Financial Row
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  financialLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  financialTotal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Status Badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  // Legacy styles for compatibility
  detailSection: {
    marginBottom: 16,
  },
});

export default PrestataireOrdonnancesScreen;
