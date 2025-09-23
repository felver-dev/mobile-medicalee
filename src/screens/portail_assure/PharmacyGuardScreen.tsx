import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { DependencyContainer } from '../../core/di/DependencyContainer';
import { useTheme } from '../../context/ThemeContext';
import { useModal } from '../../hooks/useModal';

// Interface pour les pharmacies de garde
interface PharmacyGuard {
  id: number;
  prestataire_libelle: string;
  filiale_libelle: string;
  codification: string;
  code: string;
  date_debut: string;
  date_fin: string;
  is_deleted: number;
}

const PharmacyGuardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const { showAlert } = useModal();
  
  const [pharmacies, setPharmacies] = useState<PharmacyGuard[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPharmacies, setFilteredPharmacies] = useState<PharmacyGuard[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  // États pour les sélecteurs de dates
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // +30 jours
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const pageSize = 20;

  const loadPharmacies = useCallback(async (isRefresh: boolean = false, page: number = 0) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setCurrentPage(0);
        setHasMoreData(true);
      } else if (page === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log('🔍 Utilisateur actuel:', user);
      console.log('🔍 ID utilisateur:', user?.id);
      console.log('🔍 Filiale ID:', user?.filiale_id);

      const careNetworkRepository = DependencyContainer.getInstance().getCareNetworkRepository();
      console.log('📦 Repository récupéré:', !!careNetworkRepository);
      
      // Passer les dates sélectionnées au repository
      console.log('📅 Dates sélectionnées - Début:', startDate.toLocaleDateString('fr-FR'), 'Fin:', endDate.toLocaleDateString('fr-FR'));
      console.log('📅 Format ISO envoyé à l\'API - Début:', startDate.toISOString(), 'Fin:', endDate.toISOString());
      
      const response = await careNetworkRepository.getPharmacyGuard(
        user || undefined, 
        page * pageSize, 
        pageSize,
        startDate,
        endDate
      );
      
      console.log('✅ Pharmacies de garde chargées:', response);
      console.log('✅ Type de réponse:', typeof response);
      console.log('✅ Est un tableau:', Array.isArray(response));
      console.log('✅ Longueur:', response?.length || 0);
      console.log('✅ Première pharmacie:', response?.[0]);
      
      if (isRefresh || page === 0) {
        setPharmacies(response || []);
        setTotalCount(response?.length || 0);
      } else {
        setPharmacies(prev => [...prev, ...(response || [])]);
      }
      
      // Vérifier s'il y a plus de données à charger
      if (response && response.length < pageSize) {
        setHasMoreData(false);
      }
      
    } catch (error: any) {
      console.error('❌ Erreur lors du chargement des pharmacies de garde:', error);
      console.error('❌ Détails de l\'erreur:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      showAlert('Erreur', 'Impossible de charger les pharmacies de garde', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [user, pageSize, startDate, endDate, showAlert]);

  useEffect(() => {
    // Attendre que l'utilisateur soit chargé mais ne pas charger automatiquement les données
    console.log('🔍 useEffect déclenché - user:', user);
    console.log('🔍 user.id:', user?.id);
    console.log('🔍 user.filiale_id:', user?.filiale_id);
    
    if (user && user.id && user.filiale_id) {
      console.log('✅ Utilisateur chargé, prêt pour la recherche');
      // Ne pas charger automatiquement, attendre l'action de l'utilisateur
    } else {
      console.log('⏳ En attente du chargement de l\'utilisateur...');
      console.log('⏳ user existe:', !!user);
      console.log('⏳ user.id existe:', !!user?.id);
      console.log('⏳ user.filiale_id existe:', !!user?.filiale_id);
    }
  }, [user]);

  // Recherche en temps réel
  useEffect(() => {
    console.log('Recherche déclenchée - searchQuery:', searchQuery, 'pharmacies count:', pharmacies.length);
    
    if (!pharmacies || pharmacies.length === 0) {
      console.log('Aucune pharmacie disponible pour la recherche');
      return;
    }
    
    if (searchQuery.trim() === '') {
      setFilteredPharmacies(pharmacies);
      console.log('Recherche vide - pharmacies affichées:', pharmacies.length);
    } else {
      const filtered = pharmacies.filter(pharmacy => {
        const matches = 
          pharmacy.prestataire_libelle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pharmacy.filiale_libelle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pharmacy.codification?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pharmacy.code?.includes(searchQuery) ||
          (pharmacy.is_deleted === 0 ? 'active' : 'supprimée').includes(searchQuery.toLowerCase());
        
        if (matches) {
          console.log('Match trouvé:', pharmacy.prestataire_libelle);
        }
        return matches;
      });
      console.log('Recherche filtrée - résultats:', filtered.length);
      setFilteredPharmacies(filtered);
    }
  }, [searchQuery, pharmacies]);

  // Initialiser filteredPharmacies avec pharmacies au chargement
  useEffect(() => {
    setFilteredPharmacies(pharmacies);
  }, [pharmacies]);

  const loadMorePharmacies = useCallback(() => {
    if (!loadingMore && hasMoreData && !searchQuery.trim()) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      loadPharmacies(false, nextPage);
    }
  }, [loadingMore, hasMoreData, searchQuery, currentPage, loadPharmacies]);

  const onRefresh = () => {
    loadPharmacies(true);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date non disponible';
    }
  };

  const renderPharmacyItem = ({ item }: { item: PharmacyGuard }) => (
    <TouchableOpacity style={[styles.pharmacyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={styles.pharmacyContent}>
        <View style={[styles.pharmacyIcon, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="medical" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.pharmacyInfo}>
          <Text style={[styles.pharmacyName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {item.prestataire_libelle || 'Pharmacie non spécifiée'}
          </Text>
          <View style={styles.pharmacyDetailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="business-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.pharmacyDetails, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.filiale_libelle || 'Filiale non disponible'}
              </Text>
            </View>
          </View>
          <View style={styles.pharmacyDetailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="code-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.pharmacyDetails, { color: theme.colors.textSecondary }]}>
                {item.codification || 'Code non disponible'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.pharmacySchedule}>
          <Text style={[styles.scheduleText, { color: theme.colors.primary }]}>Garde</Text>
          <Text style={[styles.scheduleDate, { color: theme.colors.textSecondary }]}>{formatDate(item.date_debut)}</Text>
          <Text style={[styles.scheduleTo, { color: theme.colors.textSecondary }]}>à</Text>
          <Text style={[styles.scheduleDate, { color: theme.colors.textSecondary }]}>{formatDate(item.date_fin)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    // Si l'utilisateur n'est pas connecté, afficher un message spécifique
    if (!user) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>Authentification requise</Text>
          <Text style={styles.emptySubtitle}>
            Vous devez être connecté pour consulter les pharmacies de garde.
          </Text>
        </View>
      );
    }

    // Si l'utilisateur est connecté mais pas de données
    if (pharmacies.length === 0 && !loading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>Rechercher des pharmacies de garde</Text>
          <Text style={styles.emptySubtitle}>
            Sélectionnez une période et cliquez sur "Rechercher" pour voir les pharmacies de garde disponibles.
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="medical-outline" size={64} color="#CCCCCC" />
        <Text style={styles.emptyTitle}>Aucune pharmacie de garde</Text>
        <Text style={styles.emptySubtitle}>
          Aucune pharmacie de garde n'est disponible pour la période sélectionnée.
        </Text>
      </View>
    );
  };

  if (authLoading) {
    const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>Pharmacies de garde</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Vérification de l'authentification...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>Pharmacies de garde</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Chargement des pharmacies...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: 'white' }]}>Pharmacies de garde</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Barre de recherche */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }] }>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.surfaceSecondary }]}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]} 
            placeholder="Rechercher une pharmacie..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {/* Sélecteurs de dates */}
        <View style={[styles.dateSelectorsContainer, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <Text style={[styles.dateSelectorsTitle, { color: theme.colors.textPrimary }]}>Période de garde :</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={[styles.dateButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => setShowStartDatePicker(true)}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.dateButtonText, { color: theme.colors.textSecondary }]}>Du {startDate.toLocaleDateString('fr-FR')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dateButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => setShowEndDatePicker(true)}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.dateButtonText, { color: theme.colors.textSecondary }]}>Au {endDate.toLocaleDateString('fr-FR')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.searchButton, { backgroundColor: theme.colors.primary }]} 
              onPress={() => {
                console.log('🔍 Bouton Rechercher cliqué');
                console.log('📅 Dates sélectionnées:', startDate.toLocaleDateString('fr-FR'), 'à', endDate.toLocaleDateString('fr-FR'));
                loadPharmacies(true, 0);
              }}
            >
              <Ionicons name="search" size={16} color="#FFFFFF" />
              <Text style={styles.searchButtonText}>Rechercher</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resetButton, { borderColor: theme.colors.primary }]} onPress={() => { setStartDate(new Date('2025-09-01')); setEndDate(new Date('2025-09-30')); }}>
              <Ionicons name="refresh" size={16} color={theme.colors.primary} />
              <Text style={[styles.resetButtonText, { color: theme.colors.primary }]}>Réinitialiser</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={filteredPharmacies}
        renderItem={renderPharmacyItem}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>Rechercher des pharmacies de garde</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Sélectionnez une période et cliquez sur "Rechercher" pour voir les pharmacies de garde disponibles.</Text>
          </View>
        )}
        contentContainerStyle={filteredPharmacies.length === 0 ? styles.emptyListContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMorePharmacies}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => loadingMore ? (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingMoreText, { color: theme.colors.textSecondary }]}>Chargement...</Text>
          </View>
        ) : null}
      />

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: 'inherit',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  dateSelectorsContainer: {
    marginTop: 15,
    padding: 12,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
  },
  dateSelectorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'inherit',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  dateButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: 'inherit',
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  searchButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pharmacyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pharmacyContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pharmacyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  pharmacyDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pharmacyDetails: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
    flex: 1,
  },
  pharmacySchedule: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3d8f9d',
    marginBottom: 4,
  },
  scheduleDate: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'right',
  },
  scheduleTo: {
    fontSize: 10,
    color: '#999999',
    marginVertical: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
  },
});

export default PharmacyGuardScreen;
