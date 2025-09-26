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
  details?: string;
}

interface GarantieFilter {
  garantie: string;
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<GarantieFilter>({
    garantie: '',
    dateDebut: '',
    dateFin: '',
    matriculeAssure: ''
  });
  const [showGarantiePicker, setShowGarantiePicker] = useState(false);
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);

  const garanties = [
    { code: '', libelle: 'Toutes les garanties' },
    { code: 'PHARMA', libelle: 'Pharmacie' },
    { code: 'EXA', libelle: 'Autres examens' },
    { code: 'AUX', libelle: 'Auxiliaires médicaux' },
    { code: 'AMP', libelle: 'Assistance médicale à la procréation' },
    { code: 'BILN', libelle: 'Bilan de santé' },
    { code: 'BIO', libelle: 'Biologie' },
    { code: 'CONS', libelle: 'Consultation' },
    { code: 'DEN', libelle: 'Dentisterie' },
    { code: 'HOS', libelle: 'Hospitalisation' },
    { code: 'IMA', libelle: 'Imagerie & examens spécialisés' },
    { code: 'MAT', libelle: 'Maternité' },
    { code: 'OPT', libelle: 'Optique' },
    { code: 'TRA', libelle: 'Transport médicalisé' },
  ];

  const [apiService] = useState(() => new ApiService());

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(0);
    setHasMoreData(true);
    loadData(0, false);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const loadMoreData = useCallback(() => {
    if (!loadingMore && hasMoreData) {
      console.log('🔄 Chargement de la page suivante:', currentPage + 1);
      loadData(currentPage + 1, true);
    }
  }, [loadingMore, hasMoreData, currentPage]);

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
      const dateDebut = filters.dateDebut || today.toISOString().split('T')[0];
      const dateFin = filters.dateFin || today.toISOString().split('T')[0];

      const apiParams = {
        userId: Number(user.id),
        filialeId: user.filiale_id || 1,
        garantieCodification: filters.garantie && filters.garantie !== '' ? filters.garantie : undefined,
        matriculeAssure: filters.matriculeAssure ? Number(filters.matriculeAssure) : undefined,
        prestataireId: user.prestataire_id || undefined,
        dateDebut,
        dateFin,
        index: page * 20,
        size: 20,
      };

      console.log('📦 Paramètres API:', apiParams);

      const response = await apiService.getPrescriptionActeByCriteria(apiParams);

      console.log('✅ Réponse API complète:', response);
      console.log('📊 Nombre d\'items:', response?.items?.length || 0);

      if (response && response.items) {
        const prescriptionsData = response.items.map((item: any) => ({
          id: item.id,
          beneficiaire_nom: item.beneficiaire_nom || 'Non renseigné',
          beneficiaire_prenom: item.beneficiaire_prenom || 'Non renseigné',
          beneficiaire_matricule: item.beneficiaire_matricule || 'Non renseigné',
          medicament_libelle: item.medicament_libelle || item.libelle || 'Non renseigné',
          quantite: item.quantite || 0,
          posologie: item.posologie || 'Non renseigné',
          date_prescription: item.date_prescription || item.created_at,
          statut: item.statut || 'En attente',
          garantie_libelle: item.garantie_libelle || 'Non renseigné',
          montant: item.montant,
          details: item.details || 'Non renseigné'
        }));

        if (append) {
          setPrescriptions(prev => [...prev, ...prescriptionsData]);
          setFilteredPrescriptions(prev => [...prev, ...prescriptionsData]);
        } else {
          setPrescriptions(prescriptionsData);
          setFilteredPrescriptions(prescriptionsData);
        }

        // Vérifier s'il y a plus de données
        setHasMoreData(prescriptionsData.length === 20);
        setCurrentPage(page);
        
        console.log('✅ Prescriptions chargées:', prescriptionsData.length, 'Total:', append ? prescriptions.length + prescriptionsData.length : prescriptionsData.length);
        console.log('📋 Première prescription:', prescriptionsData[0]);
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
  }, [user, filters, apiService]);

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

  const clearFilters = () => {
    setFilters({
      garantie: '',
      dateDebut: '',
      dateFin: '',
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
    if (!amount) return 'Non renseigné';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const renderPrescription = ({ item }: { item: PrescriptionItem }) => (
    <TouchableOpacity 
      style={[styles.prescriptionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => console.log('Voir détails prescription:', item.id)}
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
              
              {/* Bouton de test pour forcer le chargement */}
              <TouchableOpacity 
                style={[styles.testButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  console.log('🧪 Test manuel - Rechargement des données');
                  setCurrentPage(0);
                  setHasMoreData(true);
                  loadData(0, false);
                }}
              >
                <Text style={styles.testButtonText}>Tester le chargement</Text>
              </TouchableOpacity>
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
              ListFooterComponent={() => (
                loadingMore ? (
                  <View style={styles.loadingMoreContainer}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={[styles.loadingMoreText, { color: theme.colors.textSecondary }]}>
                      Chargement...
                    </Text>
                  </View>
                ) : null
              )}
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
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Filtres de recherche
              </Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                style={styles.modalCloseButton}
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
                    <Text style={[styles.filterInputText, { color: filters.garantie ? theme.colors.textPrimary : theme.colors.textSecondary }]}>
                      {filters.garantie ? garanties.find(g => g.code === filters.garantie)?.libelle : 'Sélectionner une garantie'}
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
                  setCurrentPage(0);
                  setHasMoreData(true);
                  loadData(0, false);
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
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Sélectionner une garantie
              </Text>
              <TouchableOpacity
                onPress={() => setShowGarantiePicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.garantiePickerContainer}>
              {garanties.map((garantie) => (
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
            </View>
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
    paddingBottom: 8,
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
  testButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrescriptionByGarantieScreen;
