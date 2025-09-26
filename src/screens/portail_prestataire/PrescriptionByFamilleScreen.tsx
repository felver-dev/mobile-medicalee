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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { SafeAreaView, Platform } from 'react-native';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import Loader, { LoadingCard } from '../../components/Loader';
import { useModal } from '../../hooks/useModal';
import CustomModal from '../../components/CustomModal';

interface PrescriptionByFamilleScreenProps {
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
  famille_id?: number;
  famille_nom?: string;
}

interface FamilleFilter {
  famille: string;
  dateDebut: string;
  dateFin: string;
  beneficiaire: string;
}

const PrescriptionByFamilleScreen: React.FC<PrescriptionByFamilleScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { modalState, showAlert } = useModal();
  const { theme } = usePrestataireTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<PrescriptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FamilleFilter>({
    famille: '',
    dateDebut: '',
    dateFin: '',
    beneficiaire: ''
  });

  const familles = [
    { id: 1, nom: 'Famille KONAN' },
    { id: 2, nom: 'Famille TRAORE' },
    { id: 3, nom: 'Famille DIABATE' },
    { id: 4, nom: 'Famille OUATTARA' },
    { id: 5, nom: 'Famille BAMBA' }
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 PrescriptionByFamilleScreen.loadData démarré');

      // Données mockées pour les prescriptions par famille
      const mockPrescriptions: PrescriptionItem[] = [
        {
          id: 1,
          beneficiaire_nom: 'KONAN',
          beneficiaire_prenom: 'JEAN',
          beneficiaire_matricule: '25000001',
          medicament_libelle: 'PARACETAMOL 500MG',
          quantite: 20,
          posologie: '1 comprimé 3x/jour',
          date_prescription: '2024-01-15',
          statut: 'Validée',
          garantie_libelle: 'PHARMACIE',
          montant: 2500,
          details: 'Traitement de la fièvre',
          famille_id: 1,
          famille_nom: 'Famille KONAN'
        },
        {
          id: 2,
          beneficiaire_nom: 'KONAN',
          beneficiaire_prenom: 'MARIE',
          beneficiaire_matricule: '25000002',
          medicament_libelle: 'AMOXICILLINE 1G',
          quantite: 14,
          posologie: '1 comprimé 2x/jour',
          date_prescription: '2024-01-14',
          statut: 'En attente',
          garantie_libelle: 'PHARMACIE',
          montant: 3500,
          details: 'Traitement antibiotique',
          famille_id: 1,
          famille_nom: 'Famille KONAN'
        },
        {
          id: 3,
          beneficiaire_nom: 'TRAORE',
          beneficiaire_prenom: 'PAUL',
          beneficiaire_matricule: '25000003',
          medicament_libelle: 'VITAMINE C 1G',
          quantite: 30,
          posologie: '1 comprimé/jour',
          date_prescription: '2024-01-13',
          statut: 'Validée',
          garantie_libelle: 'MEDICAL',
          montant: 1800,
          details: 'Complément alimentaire',
          famille_id: 2,
          famille_nom: 'Famille TRAORE'
        }
      ];

      setPrescriptions(mockPrescriptions);
      setFilteredPrescriptions(mockPrescriptions);
      console.log('✅ Données mockées chargées:', mockPrescriptions.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des prescriptions:', error);
      showAlert('Erreur', 'Impossible de charger les prescriptions', 'error');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrer les prescriptions
  useEffect(() => {
    let filtered = prescriptions;

    if (filters.famille) {
      filtered = filtered.filter(p => p.famille_nom?.toLowerCase().includes(filters.famille.toLowerCase()));
    }

    if (filters.beneficiaire) {
      filtered = filtered.filter(p => 
        p.beneficiaire_nom.toLowerCase().includes(filters.beneficiaire.toLowerCase()) ||
        p.beneficiaire_prenom.toLowerCase().includes(filters.beneficiaire.toLowerCase()) ||
        p.beneficiaire_matricule.includes(filters.beneficiaire)
      );
    }

    if (filters.dateDebut) {
      filtered = filtered.filter(p => p.date_prescription >= filters.dateDebut);
    }

    if (filters.dateFin) {
      filtered = filtered.filter(p => p.date_prescription <= filters.dateFin);
    }

    setFilteredPrescriptions(filtered);
  }, [prescriptions, filters]);

  const handleFilterChange = (key: keyof FamilleFilter, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      famille: '',
      dateDebut: '',
      dateFin: '',
      beneficiaire: ''
    });
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
            <Ionicons name="people-outline" size={20} color={theme.colors.primary} />
          </View>
          <Text style={[styles.prescriptionTitle, { color: theme.colors.textPrimary }]}>
            Prescription #{item.id}
          </Text>
        </View>
        <View style={[styles.prescriptionStatusBadge, { backgroundColor: getStatusBgColor(item.statut) }]}>
          <Text style={[styles.prescriptionStatusText, { color: getStatusColor(item.statut) }]}>
            {item.statut}
          </Text>
        </View>
      </View>

      {/* Patient Info */}
      <View style={styles.prescriptionContent}>
        <View style={styles.prescriptionPatientInfo}>
          <Text style={[styles.prescriptionPatientName, { color: theme.colors.textPrimary }]}>
            {item.beneficiaire_prenom} {item.beneficiaire_nom} ({item.beneficiaire_matricule})
          </Text>
          <Text style={[styles.prescriptionFamille, { color: theme.colors.textSecondary }]}>
            {item.famille_nom}
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
                Garantie
              </Text>
              <Text style={[styles.prescriptionFooterValue, { color: theme.colors.primary }]}>
                {item.garantie_libelle}
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
          message="Chargement des prescriptions par famille..." 
          height={300}
        />
      );
    }

    return (
      <View style={styles.content}>
        {/* Header avec filtres */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Prescriptions par Famille</Text>
            <TouchableOpacity 
              style={[styles.filterButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="filter-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtres */}
        {showFilters && (
          <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.filtersHeader}>
              <Text style={[styles.filtersTitle, { color: theme.colors.textPrimary }]}>Filtres</Text>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={[styles.clearFiltersText, { color: theme.colors.primary }]}>Effacer</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.filtersGrid}>
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Famille</Text>
                <TextInput
                  style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  placeholder="Toutes les familles"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={filters.famille}
                  onChangeText={(text) => handleFilterChange('famille', text)}
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Bénéficiaire</Text>
                <TextInput
                  style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  placeholder="Nom, prénom ou matricule"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={filters.beneficiaire}
                  onChangeText={(text) => handleFilterChange('beneficiaire', text)}
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date début</Text>
                <TextInput
                  style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={filters.dateDebut}
                  onChangeText={(text) => handleFilterChange('dateDebut', text)}
                />
              </View>

              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date fin</Text>
                <TextInput
                  style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={filters.dateFin}
                  onChangeText={(text) => handleFilterChange('dateFin', text)}
                />
              </View>
            </View>
          </View>
        )}

        {/* Liste des prescriptions */}
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.colors.textPrimary }]}>
              Prescriptions ({filteredPrescriptions.length})
            </Text>
          </View>

          {filteredPrescriptions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                Aucune prescription trouvée
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                {filters.famille || filters.beneficiaire || filters.dateDebut || filters.dateFin 
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
    paddingTop: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
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
  filtersContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearFiltersText: {
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
  prescriptionFamille: {
    fontSize: 14,
    marginTop: 4,
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

export default PrescriptionByFamilleScreen;
