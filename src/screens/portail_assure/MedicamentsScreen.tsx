import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SectionList,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Medicament } from '../../types';
import { useNavigation } from '@react-navigation/native';
import { DependencyContainer } from '../../core/di/DependencyContainer';
import { groupByAlphabet } from '../../utils';
import Loader, { LoadingCard } from '../../components/Loader';
import { useModal } from '../../hooks/useModal';
import CustomModal from '../../components/CustomModal';

interface GroupedMedicament {
  letter: string;
  data: Medicament[];
}

const MedicamentsScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const { modalState, showAlert } = useModal();
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [filteredMedicaments, setFilteredMedicaments] = useState<Medicament[]>([]);
  const [groupedMedicaments, setGroupedMedicaments] = useState<GroupedMedicament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  const pageSize = 20;

  // Fonction pour charger les médicaments avec recherche
  const loadMedicamentsWithSearch = useCallback(async (searchQuery: string = '', page: number = 0) => {
    try {
      if (page === 0) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }
      
      console.log(`Chargement des médicaments avec recherche: "${searchQuery}" - Page ${page}...`);
      
      const medicalRepository = DependencyContainer.getInstance().getMedicalRepositoryNew();
      const response = await medicalRepository.getMedicaments(page, pageSize, user, searchQuery);
      console.log('Réponse API médicaments:', response);
      
      const mappedMedicaments = response.items.map((item: any) => ({
        id: item.id,
        libelle: item.libelle || 'Médicament non spécifié',
        prix_unitaire: item.prix || 0,
        unite: 'Unité',
        forme_galenique: item.forme_medicament_libelle || 'Forme non spécifiée',
        statut: item.is_exclu ? 'Exclu' : 'Disponible',
        classe_therapeutique: undefined,
        code: item.code,
        codification: item.codification,
        is_entente_prealable: item.is_entente_prealable,
        filiale_libelle: item.filiale_libelle,
        created_at: item.created_at
      }));
      
      console.log('Médicaments mappés:', mappedMedicaments.length);
      
      if (page === 0) {
        setMedicaments(mappedMedicaments);
        setCurrentPage(0);
      } else {
        setMedicaments(prev => [...prev, ...mappedMedicaments]);
      }
      
      setHasMoreData(mappedMedicaments.length === pageSize);
      setTotalItems(response.total || 0);
      
    } catch (error) {
      console.error('Erreur lors du chargement des médicaments:', error);
      showAlert('Erreur', 'Erreur lors du chargement des médicaments', 'error');
    } finally {
      if (page === 0) {
        setSearchLoading(false);
        setInitialLoading(false);
      } else {
        setLoading(false);
      }
    }
  }, [pageSize]);

  // Fonction pour charger les données
  const loadData = async (page: number = 0, isRefresh: boolean = false) => {
    if (isRefresh) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      console.log(`Chargement des médicaments - Page ${page}, Taille ${pageSize}...`);
      
      const medicalRepository = DependencyContainer.getInstance().getMedicalRepositoryNew();
      const response = await medicalRepository.getMedicaments(page, pageSize, user, '');
      console.log('Réponse API médicaments:', response);
      
      const mappedMedicaments = response.items.map((item: any) => ({
        id: item.id,
        libelle: item.libelle || 'Médicament non spécifié',
        prix_unitaire: item.prix || 0,
        unite: 'Unité',
        forme_galenique: item.forme_medicament_libelle || 'Forme non spécifiée',
        statut: item.is_exclu ? 'Exclu' : 'Disponible',
        classe_therapeutique: undefined,
        code: item.code,
        codification: item.codification,
        is_entente_prealable: item.is_entente_prealable,
        filiale_libelle: item.filiale_libelle,
        created_at: item.created_at
      }));
      
      console.log('Médicaments mappés:', mappedMedicaments);
      
      if (isRefresh) {
        setMedicaments(mappedMedicaments);
        if (!isSearchMode) {
          setFilteredMedicaments(mappedMedicaments);
          setGroupedMedicaments(groupByAlphabet(mappedMedicaments, (item: Medicament) => item.libelle));
        }
      } else {
        const newMedicaments = [...medicaments, ...mappedMedicaments];
        setMedicaments(newMedicaments);
        
        if (!isSearchMode) {
          setFilteredMedicaments(newMedicaments);
          setGroupedMedicaments(groupByAlphabet(newMedicaments, (item: Medicament) => item.libelle));
        }
      }
      
      setTotalItems(response.total);
      setCurrentPage(page);
      
      const totalLoaded = (page + 1) * pageSize;
      setHasMoreData(totalLoaded < response.total);
      
    } catch (error) {
      console.error('Erreur lors du chargement des médicaments:', error);
      showAlert('Erreur', 'Impossible de charger les médicaments', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  // Fonction pour charger plus de données
  const loadMoreData = useCallback(() => {
    if (!loadingMore && hasMoreData) {
      const nextPage = currentPage + 1;
      if (isSearchMode && searchQuery.trim() !== '') {
        // En mode recherche, charger plus de résultats de recherche
        loadMedicamentsWithSearch(searchQuery, nextPage);
      } else {
        // En mode normal, charger plus de données normales
        loadData(nextPage, false);
      }
    }
  }, [currentPage, loadingMore, hasMoreData, isSearchMode, searchQuery]);

  // Fonction de refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(0);
    setMedicaments([]);
    setFilteredMedicaments([]);
    setGroupedMedicaments([]);
    setHasMoreData(true);
    loadData(0, true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  // Charger les données au démarrage
  useEffect(() => {
    console.log('🚀 Chargement initial des médicaments');
    loadData(0, true);
  }, []);


  // Gérer l'affichage des résultats de recherche
  useEffect(() => {
    console.log('🔍 Affichage des résultats:', searchQuery);
    console.log('📊 Nombre de médicaments disponibles:', medicaments.length);
    
    if (searchQuery.trim() === '') {
      console.log('🔄 Mode normal - affichage de tous les médicaments');
      setIsSearchMode(false);
    } else {
      console.log('🔎 Mode recherche - affichage des résultats serveur');
      setIsSearchMode(true);
    }
    
    // Utiliser directement les médicaments de l'API (pas de filtrage local)
    setFilteredMedicaments(medicaments);
    setGroupedMedicaments(groupByAlphabet(medicaments, (item: Medicament) => item.libelle));
  }, [searchQuery, medicaments]);

  // Recherche côté serveur - déclenchée par le bouton
  const handleSearch = () => {
    const query = searchInput.trim();
    console.log('🔍 Recherche côté serveur effectuée:', query);
    setSearchQuery(query);
    
    if (query === '') {
      // Si recherche vide, recharger toutes les données
      loadData(0, true);
    } else {
      // Recherche côté serveur
      loadMedicamentsWithSearch(query, 0);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setIsSearchMode(false);
    // Recharger les données complètes
    loadData(0, true);
  };

  const handleMedicamentPress = (medicament: Medicament) => {
    navigation?.navigate('MedicamentDetails', { medicament });
  };

  const renderSectionHeader = ({ section }: { section: GroupedMedicament }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.sectionHeaderText, { color: theme.colors.textPrimary }]}>{section.letter}</Text>
    </View>
  );

  const renderSectionItem = ({ item }: { item: Medicament }) => (
    <TouchableOpacity
      style={[
        styles.medicamentCard,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 }
      ]}
      onPress={() => handleMedicamentPress(item)}
    >
      <View style={styles.medicamentContent}>
        <View style={[styles.medicamentIcon, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="medical" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.medicamentInfo}>
          <Text style={[styles.medicamentName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {item.libelle || 'Nom non disponible'}
          </Text>
          <View style={styles.medicamentDetailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="flask-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.medicamentDetails, { color: theme.colors.textSecondary }]}>
                {item.forme_galenique || 'Forme non spécifiée'}
              </Text>
            </View>
          </View>
          {item.classe_therapeutique && (
            <View style={styles.therapeuticClass}>
              <Ionicons name="library-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.medicamentLaboratory, { color: theme.colors.textSecondary }]}>{item.classe_therapeutique}</Text>
            </View>
          )}
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isDark ? 'rgba(40, 167, 69, 0.15)' : '#E8F5E8' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: '#28A745' }
              ]}>
                {item.statut || 'Disponible'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.medicamentPrice}>
          <Text style={[styles.priceText, { color: theme.colors.primary }]}>{item.prix_unitaire || 0} FCFA</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>Chargement...</Text>
      </View>
    );
  };


  console.log('🔍 État de la recherche:', { 
    searchQuery, 
    searchInput, 
    medicaments: medicaments.length, 
    filteredMedicaments: filteredMedicaments.length, 
    groupedMedicaments: groupedMedicaments.length,
    isSearchMode,
    loading 
  });

  if (filteredMedicaments.length === 0 && !loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar translucent barStyle={isDark ? 'light-content' : 'light-content'} backgroundColor="transparent" />
        <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20 }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Médicaments</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.searchBar, { backgroundColor: isDark ? theme.colors.surface : theme.colors.primaryLight, borderColor: theme.colors.border }]}> 
            <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
              placeholder="Tapez le nom du médicament puis appuyez sur rechercher..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchInput}
              onChangeText={setSearchInput}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={[styles.searchButton, { backgroundColor: theme.colors.primary }]} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {searchLoading && (
          <View style={[styles.searchLoaderContainer, { backgroundColor: theme.colors.surface }]}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.searchLoaderText, { color: theme.colors.textSecondary }]}>Recherche en cours...</Text>
          </View>
        )}

        <View style={styles.emptyContainer}>
          <Ionicons name="flask-outline" size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            {isSearchMode ? 'Aucun médicament trouvé' : 'Chargement des médicaments...'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {isSearchMode ? 'Essayez avec d\'autres mots-clés' : 'Les médicaments se chargent progressivement'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    return (
      <SectionList
        key={`sectionlist-${groupedMedicaments.length}-${isSearchMode}`}
        sections={groupedMedicaments}
        renderItem={renderSectionItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary] as any}
          />
        }
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        stickySectionHeadersEnabled={true}
        ItemSeparatorComponent={() => null}
        SectionSeparatorComponent={() => null}
        removeClippedSubviews={false}
        legacyImplementation={false}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle={isDark ? 'light-content' : 'light-content'} backgroundColor="transparent" />
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20 }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Médicaments</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? theme.colors.surface : theme.colors.primaryLight, borderColor: theme.colors.border }]}> 
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Rechercher par nom de médicament..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchInput}
            onChangeText={setSearchInput}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {/* Bouton de recherche - toujours visible */}
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: theme.colors.primary }]} onPress={handleSearch}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {searchLoading && (
        <View style={[styles.searchLoaderContainer, { backgroundColor: theme.colors.surface }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.searchLoaderText, { color: theme.colors.textSecondary }]}>Recherche en cours...</Text>
        </View>
      )}

      {/* Contenu principal */}
      {initialLoading ? (
        <View style={styles.content}>
          <LoadingCard 
            visible={initialLoading} 
            message="Chargement des médicaments..." 
            height={300}
          />
        </View>
      ) : (
        <View style={styles.content}>
          {renderContent()}
        </View>
      )}
      
      {/* Loader overlay */}
      <Loader 
        visible={loading && !initialLoading} 
        message="Chargement..." 
      />
      
      {/* Modal pour les erreurs */}
      <CustomModal
        visible={modalState.visible}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onClose={modalState.onClose}
        onConfirm={modalState.onConfirm}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#3d8f9d',
    paddingTop: 50,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    flex: 1,
    marginRight: 10,
    height: 60,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333333',
    height: 40,
    textAlignVertical: 'center',
  },
  searchButton: {
    backgroundColor: '#3d8f9d',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    width: 60,
  },
  searchLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9FA',
  },
  searchLoaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
    marginBottom: 0,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  medicamentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
  },
  medicamentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicamentInfo: {
    flex: 1,
  },
  medicamentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  medicamentDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
  },
  medicamentLaboratory: {
    fontSize: 12,
    color: '#999999',
  },
  medicamentPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3d8f9d',
  },
  medicamentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  medicamentDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 2,
  },
  therapeuticClass: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666666',
  },
});

export default MedicamentsScreen;
