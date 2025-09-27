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

interface PrestatairePrestationsScreenProps {
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
  dateDebut: Date;
  dateFin: Date;
}

const { width } = Dimensions.get('window');

const PrestatairePrestationsScreen: React.FC<PrestatairePrestationsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const [apiService] = useState(() => new ApiService());
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [prestations, setPrestations] = useState<PrestationItem[]>([]);
  const [filteredPrestations, setFilteredPrestations] = useState<PrestationItem[]>([]);
  const [filters, setFilters] = useState<PrestationFilters>({
    dateDebut: new Date(),
    dateFin: new Date()
  });
  const [tempFilters, setTempFilters] = useState<PrestationFilters>({
    dateDebut: new Date(),
    dateFin: new Date()
  });
  const [error, setError] = useState<string | null>(null);
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [selectedPrestation, setSelectedPrestation] = useState<PrestationItem | null>(null);
  const [showPrestationModal, setShowPrestationModal] = useState(false);

  const prestationOptions = [
    {
      id: 'garanties',
      title: 'Par Garanties',
      subtitle: 'Voir par type de garantie',
      icon: 'shield-checkmark-outline',
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      route: 'PrestationsByGarantie'
    },
    {
      id: 'famille',
      title: 'Par Famille',
      subtitle: 'Consulter par famille',
      icon: 'people-outline',
      color: '#2196F3',
      bgColor: '#E3F2FD',
      route: 'PrestationsByFamille'
    },
    {
      id: 'beneficiaire',
      title: 'Par Bénéficiaire',
      subtitle: 'Rechercher par bénéficiaire',
      icon: 'person-outline',
      color: '#FF9800',
      bgColor: '#FFF3E0',
      route: 'PrestationsByBeneficiaire'
    }
  ];

  const handleOptionPress = (route: string) => {
    console.log('Navigation vers:', route);
    setShowMenuModal(false);
    navigation.navigate(route);
  };

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

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };

  const openFilterModal = () => {
    setTempFilters(filters);
    setShowFilterModal(true);
  };

  const openPrestationModal = (prestation: PrestationItem) => {
    setSelectedPrestation(prestation);
    setShowPrestationModal(true);
  };

  const loadData = useCallback(async (page: number = 0, reset: boolean = true) => {
    setLoading(true);
    setError(null);
    
    if (reset) {
      setCurrentPage(0);
      setHasMoreData(true);
    }
    
    try {
      console.log('🔍 PrestatairePrestationsScreen.loadData démarré - Page:', page);
      
      if (!user) {
        console.log('❌ Utilisateur non connecté');
        setError('Utilisateur non connecté');
        return;
      }

      const payload = {
        user_id: user.id,
        filiale_id: user.filiale_id,
        date_debut: `${filters.dateDebut.toISOString().split('T')[0]}T00:00:00.000Z`,
        date_fin: `${filters.dateFin.toISOString().split('T')[0]}T23:59:59.999Z`,
        data: {
          prestataire_id: user.prestataire_id || user.id
        },
        index: page * 100,
        size: 100
      };

      console.log('📤 Payload API:', JSON.stringify(payload, null, 2));

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
        // Si nous recevons moins de 100 éléments, c'est la dernière page
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

      console.log('✅ Chargement des prestations terminé');

    } catch (error: any) {
      console.log('⚠️ Erreur API:', error?.code || 'Erreur inconnue');
      
      // Gestion des erreurs spécifiques
      if (error?.code === '404') {
        setError('Aucune prestation trouvée pour cette période');
      } else if (error?.code === '401') {
        setError('Session expirée, veuillez vous reconnecter');
      } else if (error?.code === '500') {
        setError('Erreur serveur, veuillez réessayer plus tard');
      } else {
        setError('Impossible de charger les prestations');
      }
      
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

  const getStatusColor = (item: PrestationItem) => {
    // Déterminer le statut basé sur les données disponibles
    if (item.part_assurance > 0) {
      return '#3d8f9d'; // Validée
    } else if (item.montant > 0 && item.part_assurance === 0) {
      return '#FF9800'; // En attente
    } else {
      return '#666666'; // Autre
    }
  };

  const getStatusText = (item: PrestationItem) => {
    if (item.part_assurance > 0) {
      return 'Validée';
    } else if (item.montant > 0 && item.part_assurance === 0) {
      return 'En attente';
    } else {
      return 'Non définie';
    }
  };

  const renderPrestationItem = ({ item }: { item: PrestationItem }) => (
    <TouchableOpacity 
      style={[styles.prestationCard, { backgroundColor: theme.colors.surface }]}
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
          <View style={styles.prestationHeaderInfo}>
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

      {/* Informations patient */}
      <View style={styles.patientInfo}>
        <View style={styles.patientRow}>
          <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.patientName, { color: theme.colors.textPrimary }]}>
            {item.beneficiaire_prenom} {item.beneficiaire_nom}
          </Text>
        </View>
        <View style={styles.patientRow}>
          <Ionicons name="card-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.matriculeText, { color: theme.colors.textSecondary }]}>
            {item.matricule_assure || 'Non renseigné'}
          </Text>
        </View>
      </View>

      {/* Footer avec montants */}
      <View style={styles.prestationFooter}>
        <View style={styles.amountContainer}>
          <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Montant total</Text>
          <Text style={[styles.amountText, { color: theme.colors.textPrimary }]}>
            {formatAmount(item.montant)}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Part assurance</Text>
          <Text style={[styles.amountText, { color: '#3d8f9d' }]}>
            {formatAmount(item.part_assurance)}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Part patient</Text>
          <Text style={[styles.amountText, { color: '#FF9800' }]}>
            {formatAmount(item.part_patient)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyStateIcon, { backgroundColor: '#FF6B6B15' }]}>
            <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
          </View>
          <Text style={[styles.emptyStateTitle, { color: '#FF6B6B' }]}>
            Erreur de chargement
          </Text>
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
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
            refreshing={loading}
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
            style={[styles.filterButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={openFilterModal}
          >
            <Ionicons name="filter-outline" size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Mes Prestations</Text>
            <Text style={styles.headerSubtitle}>
              {filteredPrestations.length} prestation{filteredPrestations.length > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
            onPress={() => setShowMenuModal(true)}
          >
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>


      {/* Content */}
      {initialLoading ? (
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
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
      

      {/* Menu Modal */}
      <Modal
        visible={showMenuModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Options de prestations
              </Text>
              <TouchableOpacity 
                onPress={() => setShowMenuModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuOptions}>
              {prestationOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.menuOption, { borderBottomColor: theme.colors.border }]}
                  onPress={() => handleOptionPress(option.route)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuOptionIcon, { backgroundColor: option.bgColor }]}>
                    <Ionicons name={option.icon as any} size={20} color={option.color} />
                  </View>
                  <View style={styles.menuOptionContent}>
                    <Text style={[styles.menuOptionTitle, { color: theme.colors.textPrimary }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.menuOptionSubtitle, { color: theme.colors.textSecondary }]}>
                      {option.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
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
          <View style={[styles.filterModalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.filterModalHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.filterModalHeaderLeft}>
                <View style={[styles.filterModalIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                  <Ionicons name="filter-outline" size={20} color={theme.colors.primary} />
                </View>
                <Text style={[styles.filterModalTitle, { color: theme.colors.textPrimary }]}>
                  Filtrer les prestations
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody}>
              <View style={styles.filterSection}>
                <Text style={[styles.filterSectionTitle, { color: theme.colors.textPrimary }]}>
                  Période de recherche
                </Text>
                
                <View style={styles.filterItem}>
                  <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date de début</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { 
                      backgroundColor: theme.colors.background, 
                      borderColor: theme.colors.border 
                    }]}
                    onPress={() => setShowDateDebutPicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
                    <Text style={[styles.dateButtonText, { color: theme.colors.textPrimary }]}>
                      {formatDateForDisplay(tempFilters.dateDebut)}
                    </Text>
                  </TouchableOpacity>
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
                    <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
                    <Text style={[styles.dateButtonText, { color: theme.colors.textPrimary }]}>
                      {formatDateForDisplay(tempFilters.dateFin)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
            
            <View style={[styles.filterModalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity
                style={[styles.filterModalButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={() => {
                  const resetFilters = {
                    dateDebut: new Date(),
                    dateFin: new Date()
                  };
                  setTempFilters(resetFilters);
                  setFilters(resetFilters);
                  setShowFilterModal(false);
                  loadData(0, true);
                }}
              >
                <Ionicons name="refresh-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={[styles.filterModalButtonText, { color: theme.colors.textSecondary }]}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterModalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setFilters(tempFilters);
                  setShowFilterModal(false);
                  loadData(0, true);
                }}
              >
                <Ionicons name="checkmark-outline" size={18} color="white" />
                <Text style={[styles.filterModalButtonText, { color: 'white' }]}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showDateDebutPicker && (
        <DateTimePicker
          value={filters.dateDebut}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateDebutChange}
        />
      )}

      {showDateFinPicker && (
        <DateTimePicker
          value={filters.dateFin}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateFinChange}
        />
      )}

      {/* Prestation Details Modal */}
      <Modal
        visible={showPrestationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrestationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.prestationModalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.prestationModalHeader, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.prestationModalHeaderLeft}>
                <View style={[styles.prestationModalIcon, { backgroundColor: selectedPrestation ? getStatusColor(selectedPrestation) + '15' : theme.colors.primary + '15' }]}>
                  <Ionicons 
                    name={selectedPrestation?.acte_libelle?.includes('CONSULTATION') ? 'medical-outline' : 'flask-outline'} 
                    size={20} 
                    color={selectedPrestation ? getStatusColor(selectedPrestation) : theme.colors.primary} 
                  />
                </View>
                <View>
                  <Text style={[styles.prestationModalTitle, { color: theme.colors.textPrimary }]}>
                    Détails de la prestation
                  </Text>
                  <Text style={[styles.prestationModalSubtitle, { color: theme.colors.textSecondary }]}>
                    {selectedPrestation?.acte_libelle || 'Non renseigné'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setShowPrestationModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.prestationModalBody}>
              {selectedPrestation && (
                <>
                  {/* Informations générales */}
                  <View style={styles.prestationDetailSection}>
                    <Text style={[styles.prestationDetailSectionTitle, { color: theme.colors.textPrimary }]}>
                      Informations générales
                    </Text>
                    
                    <View style={styles.prestationDetailRow}>
                      <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Patient</Text>
                      <Text style={[styles.prestationDetailValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrestation.beneficiaire_prenom} {selectedPrestation.beneficiaire_nom}
                      </Text>
                    </View>
                    
                    <View style={styles.prestationDetailRow}>
                      <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Matricule assuré</Text>
                      <Text style={[styles.prestationDetailValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrestation.matricule_assure || 'Non renseigné'}
                      </Text>
                    </View>
                    
                    <View style={styles.prestationDetailRow}>
                      <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Date de prestation</Text>
                      <Text style={[styles.prestationDetailValue, { color: theme.colors.textPrimary }]}>
                        {formatDate(selectedPrestation.created_at)}
                      </Text>
                    </View>
                    
                    <View style={styles.prestationDetailRow}>
                      <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Statut</Text>
                      <View style={[styles.prestationDetailBadge, { backgroundColor: getStatusColor(selectedPrestation) }]}>
                        <Text style={styles.prestationDetailBadgeText}>{getStatusText(selectedPrestation)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Détails financiers */}
                  <View style={styles.prestationDetailSection}>
                    <Text style={[styles.prestationDetailSectionTitle, { color: theme.colors.textPrimary }]}>
                      Détails financiers
                    </Text>
                    
                    <View style={styles.prestationDetailRow}>
                      <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Montant total</Text>
                      <Text style={[styles.prestationDetailValue, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                        {formatAmount(selectedPrestation.montant)}
                      </Text>
                    </View>
                    
                    <View style={styles.prestationDetailRow}>
                      <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Part assurance</Text>
                      <Text style={[styles.prestationDetailValue, { color: '#3d8f9d', fontWeight: '600' }]}>
                        {formatAmount(selectedPrestation.part_assurance)}
                      </Text>
                    </View>
                    
                    <View style={styles.prestationDetailRow}>
                      <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Part patient</Text>
                      <Text style={[styles.prestationDetailValue, { color: '#FF9800', fontWeight: '600' }]}>
                        {formatAmount(selectedPrestation.part_patient)}
                      </Text>
                    </View>
                  </View>

                  {/* Informations supplémentaires */}
                  <View style={styles.prestationDetailSection}>
                    <Text style={[styles.prestationDetailSectionTitle, { color: theme.colors.textPrimary }]}>
                      Informations supplémentaires
                    </Text>
                    
                    <View style={styles.prestationDetailRow}>
                      <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Garantie</Text>
                      <Text style={[styles.prestationDetailValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrestation.garantie_libelle || 'Non renseigné'}
                      </Text>
                    </View>
                    
                    <View style={styles.prestationDetailRow}>
                      <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Prestataire</Text>
                      <Text style={[styles.prestationDetailValue, { color: theme.colors.textPrimary }]}>
                        {selectedPrestation.prestataire_libelle || 'Non renseigné'}
                      </Text>
                    </View>
                    
                    {selectedPrestation.quantite && (
                      <View style={styles.prestationDetailRow}>
                        <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Quantité</Text>
                        <Text style={[styles.prestationDetailValue, { color: theme.colors.textPrimary }]}>
                          {selectedPrestation.quantite}
                        </Text>
                      </View>
                    )}
                    
                    {selectedPrestation.prix_unitaire && (
                      <View style={styles.prestationDetailRow}>
                        <Text style={[styles.prestationDetailLabel, { color: theme.colors.textSecondary }]}>Prix unitaire</Text>
                        <Text style={[styles.prestationDetailValue, { color: theme.colors.textPrimary }]}>
                          {formatAmount(selectedPrestation.prix_unitaire)}
                        </Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>
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
  menuButton: {
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
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#2D3748',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    color: '#718096',
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
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  prestationCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  prestationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prestationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prestationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prestationHeaderInfo: {
    flex: 1,
  },
  prestationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  prestationDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  patientInfo: {
    marginBottom: 16,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
    opacity: 0.7,
  },
  prestationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  amountContainer: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'center',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  menuOptions: {
    paddingVertical: 8,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  menuOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuOptionContent: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuOptionSubtitle: {
    fontSize: 13,
    lineHeight: 18,
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
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    flex: 1,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  // Nouveaux styles pour le modal de filtres amélioré
  filterModalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  filterModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterModalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterModalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  filterModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    borderWidth: 1,
  },
  filterModalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Styles pour le modal de détails de prestation
  prestationModalContent: {
    width: '95%',
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  prestationModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  prestationModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prestationModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prestationModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  prestationModalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  prestationModalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  prestationDetailSection: {
    marginBottom: 24,
  },
  prestationDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#3d8f9d',
  },
  prestationDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  prestationDetailLabel: {
    fontSize: 14,
    flex: 1,
  },
  prestationDetailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  prestationDetailBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  prestationDetailBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PrestatairePrestationsScreen;