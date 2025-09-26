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

interface PrescriptionEnAttenteScreenProps {
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
  date_demande?: string;
  motif_demande?: string;
  priorite?: string;
}

interface AttenteFilter {
  priorite: string;
  dateDebut: string;
  dateFin: string;
  matriculeAssure: string;
}

const PrescriptionEnAttenteScreen: React.FC<PrescriptionEnAttenteScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { modalState, showAlert } = useModal();
  const { theme } = usePrestataireTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AttenteFilter>({
    priorite: '',
    dateDebut: '',
    dateFin: '',
    matriculeAssure: ''
  });
  const [showDateDebutPicker, setShowDateDebutPicker] = useState(false);
  const [showDateFinPicker, setShowDateFinPicker] = useState(false);

  const [apiService] = useState(() => new ApiService());

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const loadData = async () => {
    if (!user) {
      console.log('❌ Utilisateur non connecté');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 PrescriptionEnAttenteScreen.loadData démarré');

      // Utiliser les dates par défaut si non définies
      const dateDebut = filters.dateDebut || new Date().toISOString().split('T')[0];
      const dateFin = filters.dateFin || new Date().toISOString().split('T')[0];

      const response = await apiService.getPrescriptionActeByCriteria({
        userId: Number(user.id),
        filialeId: user.filiale_id || 1,
        matriculeAssure: filters.matriculeAssure ? Number(filters.matriculeAssure) : undefined,
        prestataireId: user.prestataire_id || undefined,
        isEntentePrealable: true, // Spécifique aux prescriptions en attente
        dateDebut,
        dateFin,
        index: 0,
        size: 20,
      });

      console.log('✅ Réponse API:', response);

      if (response && response.items) {
        const prescriptionsData = response.items.map((item: any) => ({
          id: item.id,
          beneficiaire_nom: item.beneficiaire_nom || 'N/A',
          beneficiaire_prenom: item.beneficiaire_prenom || 'N/A',
          beneficiaire_matricule: item.beneficiaire_matricule || 'N/A',
          medicament_libelle: item.medicament_libelle || item.libelle || 'N/A',
          quantite: item.quantite || 0,
          posologie: item.posologie || 'N/A',
          date_prescription: item.date_prescription || item.created_at,
          statut: item.statut || 'En attente',
          garantie_libelle: item.garantie_libelle || 'N/A',
          montant: item.montant,
          details: item.details || 'N/A',
          date_demande: item.date_demande || item.created_at,
          motif_demande: item.motif_demande || 'Demande d\'entente préalable',
          priorite: item.priorite || 'NORMAL'
        }));

        setPrescriptions(prescriptionsData);
        setFilteredPrescriptions(prescriptionsData);
        console.log('✅ Prescriptions en attente chargées:', prescriptionsData.length);
      } else {
        setPrescriptions([]);
        setFilteredPrescriptions([]);
        console.log('⚠️ Aucune prescription en attente trouvée');
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement des prescriptions:', error);
      showAlert('Erreur', 'Impossible de charger les prescriptions', 'error');
      setPrescriptions([]);
      setFilteredPrescriptions([]);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Initialiser les dates par défaut
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      dateDebut: prev.dateDebut || today,
      dateFin: prev.dateFin || today
    }));
  }, []);

  // Filtrer les prescriptions
  useEffect(() => {
    let filtered = prescriptions;

    if (filters.priorite) {
      filtered = filtered.filter(p => p.priorite?.toLowerCase().includes(filters.priorite.toLowerCase()));
    }

    if (filters.dateDebut) {
      filtered = filtered.filter(p => p.date_prescription >= filters.dateDebut);
    }

    if (filters.dateFin) {
      filtered = filtered.filter(p => p.date_prescription <= filters.dateFin);
    }

    setFilteredPrescriptions(filtered);
  }, [prescriptions, filters]);

  const handleFilterChange = (key: keyof AttenteFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
      priorite: '',
      dateDebut: '',
      dateFin: '',
      matriculeAssure: ''
    });
  };

  const getStatusColor = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'en attente':
        return '#FF9800';
      case 'validée':
        return '#4CAF50';
      case 'refusée':
        return '#F44336';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusBgColor = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'en attente':
        return '#FFF3E0';
      case 'validée':
        return '#E8F5E8';
      case 'refusée':
        return '#FFEBEE';
      default:
        return theme.colors.background;
    }
  };

  const getPrioriteColor = (priorite?: string) => {
    switch (priorite?.toLowerCase()) {
      case 'urgent':
        return '#F44336';
      case 'normal':
        return '#FF9800';
      case 'faible':
        return '#4CAF50';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getPrioriteBgColor = (priorite?: string) => {
    switch (priorite?.toLowerCase()) {
      case 'urgent':
        return '#FFEBEE';
      case 'normal':
        return '#FFF3E0';
      case 'faible':
        return '#E8F5E8';
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
    if (!amount) return 'N/A';
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const renderPrescription = ({ item }: { item: PrescriptionItem }) => (
    <TouchableOpacity 
      style={[styles.prescriptionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      onPress={() => console.log('Voir détails prescription:', item.id)}
    >
      {/* Header */}
      <View style={[styles.prescriptionHeader, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.prescriptionHeaderLeft}>
          <View style={[styles.prescriptionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
          </View>
          <Text style={[styles.prescriptionTitle, { color: theme.colors.textPrimary }]}>
            Prescription #{item.id}
          </Text>
        </View>
        <View style={styles.prescriptionHeaderRight}>
          <View style={[styles.prescriptionStatusBadge, { backgroundColor: getStatusBgColor(item.statut) }]}>
            <Text style={[styles.prescriptionStatusText, { color: getStatusColor(item.statut) }]}>
              {item.statut}
            </Text>
          </View>
          {item.priorite && (
            <View style={[styles.prioriteBadge, { backgroundColor: getPrioriteBgColor(item.priorite) }]}>
              <Text style={[styles.prioriteText, { color: getPrioriteColor(item.priorite) }]}>
                {item.priorite}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Patient Info */}
      <View style={styles.prescriptionContent}>
        <View style={styles.prescriptionPatientInfo}>
          <Text style={[styles.prescriptionPatientName, { color: theme.colors.textPrimary }]}>
            {item.beneficiaire_prenom} {item.beneficiaire_nom} ({item.beneficiaire_matricule})
          </Text>
        </View>

        {/* Details Grid */}
        <View style={styles.prescriptionInfoGrid}>
          <View style={styles.prescriptionInfoItem}>
            <View style={styles.prescriptionInfoIcon}>
              <Ionicons name="medical-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.prescriptionInfoText}>
              <Text style={[styles.prescriptionInfoLabel, { color: theme.colors.textSecondary }]}>Médicament</Text>
              <Text style={[styles.prescriptionInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {item.medicament_libelle}
              </Text>
            </View>
          </View>

          <View style={styles.prescriptionInfoItem}>
            <View style={styles.prescriptionInfoIcon}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.prescriptionInfoText}>
              <Text style={[styles.prescriptionInfoLabel, { color: theme.colors.textSecondary }]}>Date</Text>
              <Text style={[styles.prescriptionInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {formatDate(item.date_prescription)}
              </Text>
            </View>
          </View>

          <View style={styles.prescriptionInfoItem}>
            <View style={styles.prescriptionInfoIcon}>
              <Ionicons name="cube-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.prescriptionInfoText}>
              <Text style={[styles.prescriptionInfoLabel, { color: theme.colors.textSecondary }]}>Quantité</Text>
              <Text style={[styles.prescriptionInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {item.quantite} unités
              </Text>
            </View>
          </View>

          <View style={styles.prescriptionInfoItem}>
            <View style={styles.prescriptionInfoIcon}>
              <Ionicons name="card-outline" size={16} color={theme.colors.primary} />
            </View>
            <View style={styles.prescriptionInfoText}>
              <Text style={[styles.prescriptionInfoLabel, { color: theme.colors.textSecondary }]}>Montant</Text>
              <Text style={[styles.prescriptionInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {formatAmount(item.montant)}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.prescriptionFooter, { borderTopColor: theme.colors.border }]}>
          <View style={styles.prescriptionFooterLeft}>
            <View style={styles.prescriptionFooterItem}>
              <Text style={[styles.prescriptionFooterLabel, { color: theme.colors.textSecondary }]}>
                Motif
              </Text>
              <Text style={[styles.prescriptionFooterValue, { color: theme.colors.primary }]}>
                {item.motif_demande}
              </Text>
            </View>
            <View style={styles.prescriptionFooterItem}>
              <Text style={[styles.prescriptionFooterLabel, { color: theme.colors.textSecondary }]}>
                Posologie
              </Text>
              <Text style={[styles.prescriptionFooterValue, { color: theme.colors.primary }]}>
                {item.posologie}
              </Text>
            </View>
          </View>
          <View style={styles.prescriptionFooterRight}>
            <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.textSecondary} />
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
          message="Chargement des prescriptions en attente..." 
          height={300}
        />
      );
    }

    return (
      <View style={styles.content}>
        {/* Header amélioré */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.headerGradient}>
            <View style={styles.topBar}>
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={22} color="white" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Prescriptions en Attente</Text>
                <Text style={styles.headerSubtitle}>Gestion des prescriptions médicales</Text>
              </View>
              <TouchableOpacity 
                style={[styles.filterButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={() => setShowFilters(true)}
              >
                <Ionicons name="filter" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            {/* Statistiques rapides */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="document-text" size={16} color="white" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>
                    {initialLoading ? '...' : filteredPrescriptions.length}
                  </Text>
                  <Text style={styles.statLabel}>Prescriptions</Text>
                </View>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="people" size={16} color="white" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>
                    {initialLoading ? '...' : new Set(filteredPrescriptions.map(p => p.beneficiaire_matricule)).size}
                  </Text>
                  <Text style={styles.statLabel}>Bénéficiaires</Text>
                </View>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="shield-checkmark" size={16} color="white" />
                </View>
                <View style={styles.statTextContainer}>
                  <Text style={styles.statValue}>
                    {initialLoading ? '...' : new Set(filteredPrescriptions.map(p => p.garantie_libelle)).size}
                  </Text>
                  <Text style={styles.statLabel}>Garanties</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Bouton Filtres */}
        <View style={styles.filterToggleContainer}>
          <TouchableOpacity 
            style={[styles.filterToggleButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons name="filter" size={18} color="white" />
            <Text style={styles.filterToggleText}>Filtres</Text>
          </TouchableOpacity>
        </View>

        {/* Liste des prescriptions */}
        <View style={styles.listContainer}>

          {filteredPrescriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                Aucune prescription en attente
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                {filters.priorite || filters.matriculeAssure || filters.dateDebut || filters.dateFin 
                  ? 'Essayez de modifier vos filtres' 
                  : 'Aucune prescription en attente pour le moment'}
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
                  <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Priorité</Text>
                  <TextInput
                    style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                    placeholder="Toutes les priorités"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={filters.priorite}
                    onChangeText={(text) => handleFilterChange('priorite', text)}
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
                  loadData();
                  setShowFilters(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Rechercher</Text>
              </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 70 : 40,
  },
  headerGradient: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTextContainer: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  filterToggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  filterToggleText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
  prescriptionCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  prescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  prescriptionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prescriptionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prescriptionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  prescriptionStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  prescriptionStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  prioriteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  prioriteText: {
    fontSize: 10,
    fontWeight: '600',
  },
  prescriptionContent: {
    padding: 16,
  },
  prescriptionPatientInfo: {
    marginBottom: 16,
  },
  prescriptionPatientName: {
    fontSize: 16,
    fontWeight: '600',
  },
  prescriptionInfoGrid: {
    gap: 12,
    marginBottom: 16,
  },
  prescriptionInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prescriptionInfoIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prescriptionInfoText: {
    flex: 1,
  },
  prescriptionInfoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  prescriptionInfoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  prescriptionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  prescriptionFooterLeft: {
    flex: 1,
  },
  prescriptionFooterItem: {
    gap: 4,
    marginBottom: 8,
  },
  prescriptionFooterLabel: {
    fontSize: 12,
  },
  prescriptionFooterValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  prescriptionFooterRight: {
    marginLeft: 16,
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
});

export default PrescriptionEnAttenteScreen;
