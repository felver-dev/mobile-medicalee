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
  SafeAreaView,
  StatusBar,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../../hooks/useModal';
import { DependencyContainer } from '../../core/di/DependencyContainer';

// Interface pour les éléments du réseau de soins
interface CareNetworkItem {
  id: number;
  nom: string;
  prenom: string;
  reseau_de_soin_libelle: string;
  matricule: string;
  matricule_assure: string;
  nombre_prestataire: number;
  total_depense: number;
  reseau_de_soin_id: number;
}

interface CareNetworkScreenProps {
  navigation: any;
}

const CareNetworkScreen: React.FC<CareNetworkScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'network'>('network');
  const [careNetwork, setCareNetwork] = useState<CareNetworkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true, 0);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const loadMoreData = useCallback(() => {
    if (!loadingMore && hasMoreData) {
      loadData(false, currentPage + 1);
    }
  }, [loadingMore, hasMoreData, currentPage]);

  const pageSize = 20;

  const loadData = async (isRefresh: boolean = false, page: number = 0) => {
    // Vérifier que l'utilisateur est disponible
    if (!user || !user.id || !user.filiale_id || !user.beneficiaire_matricule) {
      console.log('⚠️ Utilisateur non disponible pour le chargement des données');
      console.log('⚠️ user.id:', user?.id);
      console.log('⚠️ user.filiale_id:', user?.filiale_id);
      console.log('⚠️ user.beneficiaire_matricule:', user?.beneficiaire_matricule);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (isRefresh) {
      setLoading(true);
      setCurrentPage(0);
      setHasMoreData(true);
    } else if (page === 0) {
      setInitialLoading(true);
      setCurrentPage(0);
      setHasMoreData(true);
    } else {
      setLoadingMore(true);
    }
    
    const dependencyContainer = DependencyContainer.getInstance();
    const careNetworkRepository = dependencyContainer.getCareNetworkRepository();
    
    // Charger les données du réseau de soins depuis l'API
    try {
      const careNetworkData = await careNetworkRepository.getCareNetwork(user || undefined);
      console.log('Données réseau de soins reçues:', careNetworkData);
      console.log('Type de données:', typeof careNetworkData);
      console.log('Est un tableau:', Array.isArray(careNetworkData));
      console.log('Longueur:', careNetworkData?.length || 0);
      
      if (isRefresh || page === 0) {
        // Première page ou refresh : remplacer les données
        setCareNetwork(careNetworkData || []);
      } else {
        // Pages suivantes : ajouter aux données existantes
        setCareNetwork(prev => [...prev, ...(careNetworkData || [])]);
      }
      
      // Vérifier s'il y a plus de données
      setHasMoreData((careNetworkData?.length || 0) === pageSize);
      setCurrentPage(page);
      
    } catch (error: any) {
      console.error('Erreur API réseau de soins:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      
      if (isRefresh || page === 0) {
        setCareNetwork([]);
      }
      showAlert('Erreur', 'Impossible de charger les données du réseau de soins', 'error');
    } finally {
      // Toujours arrêter les loaders dans le finally
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    // Désactiver le chargement automatique pour éviter le loader en boucle
    console.log('🔍 useEffect déclenché - user:', user);
    console.log('🔍 user.id:', user?.id);
    console.log('🔍 user.filiale_id:', user?.filiale_id);
    
    // Arrêter le loader initial immédiatement
    setInitialLoading(false);
    
    if (user && user.id && user.filiale_id && user.beneficiaire_matricule) {
      console.log('✅ Utilisateur chargé, prêt pour le chargement manuel');
      console.log('✅ beneficiaire_matricule:', user.beneficiaire_matricule);
    } else {
      console.log('⏳ En attente du chargement de l\'utilisateur...');
      console.log('⏳ user.id:', user?.id);
      console.log('⏳ user.filiale_id:', user?.filiale_id);
      console.log('⏳ user.beneficiaire_matricule:', user?.beneficiaire_matricule);
    }
  }, [user]);

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
      case 'actif':
      case 'en service':
      case 'disponible':
        return '#4CAF50';
      case 'programmée':
        return '#FF9800';
      case 'inactif':
      case 'fermé':
        return '#F44336';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clinique':
      case 'centre médical':
        return 'medical-outline';
      case 'hôpital':
        return 'business-outline';
      case 'pharmacie':
        return 'flask-outline';
      default:
        return 'location-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'clinique':
      case 'centre médical':
        return '#1976D2';
      case 'hôpital':
        return '#2E7D32';
      case 'pharmacie':
        return '#F57C00';
      default:
        return theme.colors.textSecondary;
    }
  };

  const filteredData = () => {
    if (!searchQuery) return careNetwork;
    
    const query = searchQuery.toLowerCase();
    return careNetwork.filter(item => 
      item.nom.toLowerCase().includes(query) ||
      item.prenom.toLowerCase().includes(query) ||
      item.reseau_de_soin_libelle.toLowerCase().includes(query) ||
      item.matricule.toLowerCase().includes(query)
    );
  };

  const renderCareNetworkItem = ({ item }: { item: CareNetworkItem }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
      onPress={() => {
        // Naviguer vers l'écran des centres avec les paramètres du réseau
        navigation.navigate('CareCenters', {
          networkId: item.reseau_de_soin_id,
          networkName: item.reseau_de_soin_libelle,
          matriculeAssure: item.matricule_assure
        });
      }}
    >
      {/* Main Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={[styles.networkIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons 
              name="person-outline" 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          <View style={styles.networkInfo}>
            <Text style={[styles.networkTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.nom} {item.prenom}
            </Text>
            <Text style={[styles.networkType, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.reseau_de_soin_libelle}
            </Text>
            <Text style={[styles.networkSpecialite, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              Matricule: {item.matricule}
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.prestataireCount, { color: theme.colors.primary }]}>
            {item.nombre_prestataire} prestataires
          </Text>
          <View style={[styles.statusButton, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.statusButtonText}>Actif</Text>
          </View>
        </View>
      </View>
      
      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <Ionicons name="card-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            Dépenses: {formatAmount(item.total_depense)}
          </Text>
        </View>
        <View style={styles.contactItem}>
          <Ionicons name="business-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            Réseau ID: {item.reseau_de_soin_id}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (initialLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }] }>
            Chargement des données...
          </Text>
        </View>
      );
    }
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }] }>
            Actualisation...
          </Text>
        </View>
      );
    }
    
    const filtered = filteredData();
    
    return (
      <FlatList
        data={filtered}
        renderItem={renderCareNetworkItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={loadMoreData}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => 
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingMoreText}>Chargement...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.textSecondary }]}>Charger les données</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>Appuyez sur "Actualiser" pour charger les données du réseau de soins.</Text>
            <TouchableOpacity 
              style={[styles.loadButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                console.log('🔄 Chargement manuel déclenché');
                loadData(true, 0);
              }}
            >
              <Text style={styles.loadButtonText}>Actualiser</Text>
            </TouchableOpacity>
          </View>
        )}
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
            <Ionicons name="arrow-back-outline" size={20} color="white" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: 'white' }]}>Réseau de Soins</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            placeholder="Rechercher..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  networkIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  networkInfo: {
    flex: 1,
  },
  networkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  networkType: {
    fontSize: 12,
    marginBottom: 2,
  },
  networkSpecialite: {
    fontSize: 12,
  },
  prestataireCount: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: 'inherit',
  },
  contactInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loadButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default CareNetworkScreen;
