import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  FlatList,
  Modal,
  TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { SafeAreaView, Platform } from 'react-native';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import Loader, { LoadingCard, LoadingList, LoadingModal } from '../../components/Loader';
import { DependencyContainer } from '../../core/di/DependencyContainer';
import { useModal } from '../../hooks/useModal';
import CustomModal from '../../components/CustomModal';

interface PrestatairePrestationsScreenProps {
  navigation: any;
}

interface PrestationItem {
  id: number;
  nom_beneficiaire: string;
  prenom_beneficiaire: string;
  matricule_assure: number;
  type_prestation: string;
  montant: number;
  date_prestation: string;
  statut: string;
  prestataire_libelle: string;
  details?: string;
}

interface PrestationFilter {
  statut: string;
  type: string;
  dateDebut: string;
  dateFin: string;
}

const PrestatairePrestationsScreen: React.FC<PrestatairePrestationsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { modalState, showAlert } = useModal();
  const { theme } = usePrestataireTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'validated' | 'rejected'>('all');
  const [prestations, setPrestations] = useState<PrestationItem[]>([]);
  const [filteredPrestations, setFilteredPrestations] = useState<PrestationItem[]>([]);
  const [selectedPrestation, setSelectedPrestation] = useState<PrestationItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<PrestationFilter>({
    statut: '',
    type: '',
    dateDebut: '',
    dateFin: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);

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
      console.log('🔍 PrestatairePrestationsScreen.loadData démarré avec données mockées');

      // Données mockées pour les prestations
      const mockPrestations: PrestationItem[] = [
        {
          id: 1,
          nom_beneficiaire: 'DIABATE',
          prenom_beneficiaire: 'Fatou',
          matricule_assure: 123456,
          type_prestation: 'Consultation',
          montant: 15000,
          date_prestation: '2024-01-15',
          statut: 'validée',
          prestataire_libelle: 'CLINIQUE LA PROVIDENCE',
          details: 'Consultation générale avec prescription de médicaments'
        },
        {
          id: 2,
          nom_beneficiaire: 'TRAORE',
          prenom_beneficiaire: 'Moussa',
          matricule_assure: 123457,
          type_prestation: 'Médicaments',
          montant: 25000,
          date_prestation: '2024-01-14',
          statut: 'en attente',
          prestataire_libelle: 'CLINIQUE LA PROVIDENCE',
          details: 'Prescription de médicaments pour traitement du diabète'
        },
        {
          id: 3,
          nom_beneficiaire: 'KONE',
          prenom_beneficiaire: 'Aminata',
          matricule_assure: 123458,
          type_prestation: 'Consultation',
          montant: 12000,
          date_prestation: '2024-01-13',
          statut: 'validée',
          prestataire_libelle: 'CLINIQUE LA PROVIDENCE',
          details: 'Consultation de suivi post-opératoire'
        },
        {
          id: 4,
          nom_beneficiaire: 'SANGARE',
          prenom_beneficiaire: 'Boubacar',
          matricule_assure: 123459,
          type_prestation: 'Médicaments',
          montant: 18000,
          date_prestation: '2024-01-12',
          statut: 'rejetée',
          prestataire_libelle: 'CLINIQUE LA PROVIDENCE',
          details: 'Prescription rejetée - médicament non remboursable'
        },
        {
          id: 5,
          nom_beneficiaire: 'OUATTARA',
          prenom_beneficiaire: 'Kadidia',
          matricule_assure: 123460,
          type_prestation: 'Consultation',
          montant: 20000,
          date_prestation: '2024-01-11',
          statut: 'validée',
          prestataire_libelle: 'CLINIQUE LA PROVIDENCE',
          details: 'Consultation spécialisée en cardiologie'
        },
        {
          id: 6,
          nom_beneficiaire: 'COULIBALY',
          prenom_beneficiaire: 'Ibrahim',
          matricule_assure: 123461,
          type_prestation: 'Médicaments',
          montant: 30000,
          date_prestation: '2024-01-10',
          statut: 'en attente',
          prestataire_libelle: 'CLINIQUE LA PROVIDENCE',
          details: 'Prescription de médicaments pour traitement chronique'
        },
        {
          id: 7,
          nom_beneficiaire: 'DIALLO',
          prenom_beneficiaire: 'Mariam',
          matricule_assure: 123462,
          type_prestation: 'Consultation',
          montant: 18000,
          date_prestation: '2024-01-09',
          statut: 'validée',
          prestataire_libelle: 'CLINIQUE LA PROVIDENCE',
          details: 'Consultation de contrôle de grossesse'
        },
        {
          id: 8,
          nom_beneficiaire: 'BA',
          prenom_beneficiaire: 'Ousmane',
          matricule_assure: 123463,
          type_prestation: 'Médicaments',
          montant: 22000,
          date_prestation: '2024-01-08',
          statut: 'rejetée',
          prestataire_libelle: 'CLINIQUE LA PROVIDENCE',
          details: 'Prescription rejetée - dépassement du plafond'
        }
      ];

      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setPrestations(mockPrestations);
      setFilteredPrestations(mockPrestations);

      console.log('✅ Chargement des prestations mockées terminé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors du chargement des prestations:', error);
      showAlert('Erreur', 'Impossible de charger les prestations', 'error');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activeTab, filters, prestations]);

  const applyFilters = () => {
    let filtered = [...prestations];

    // Filtre par onglet
    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(p => p.statut.toLowerCase().includes('attente'));
        break;
      case 'validated':
        filtered = filtered.filter(p => p.statut.toLowerCase().includes('validé'));
        break;
      case 'rejected':
        filtered = filtered.filter(p => p.statut.toLowerCase().includes('rejeté'));
        break;
      default:
        break;
    }

    // Filtres additionnels
    if (filters.statut) {
      filtered = filtered.filter(p => p.statut.toLowerCase().includes(filters.statut.toLowerCase()));
    }
    if (filters.type) {
      filtered = filtered.filter(p => p.type_prestation.toLowerCase().includes(filters.type.toLowerCase()));
    }

    setFilteredPrestations(filtered);
  };

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
      case 'validée':
        return '#3d8f9d';
      case 'en attente':
        return '#FF9800';
      case 'rejetée':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const handlePrestationPress = (prestation: PrestationItem) => {
    setSelectedPrestation(prestation);
    setShowDetailsModal(true);
  };

  const renderPrestationItem = ({ item }: { item: PrestationItem }) => (
    <TouchableOpacity 
      style={[styles.prestationCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
      onPress={() => handlePrestationPress(item)}
    >
      <View style={styles.prestationContent}>
        <View style={styles.prestationLeft}>
          <View style={[styles.prestationIcon, { backgroundColor: getStatusColor(item.statut) + '15' }]}>
            <Ionicons 
              name={item.type_prestation === 'Consultation' ? 'medical-outline' : 'flask-outline'} 
              size={22} 
              color={getStatusColor(item.statut)} 
            />
          </View>
          <View style={styles.prestationInfo}>
            <Text style={[styles.patientName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.prenom_beneficiaire} {item.nom_beneficiaire}
            </Text>
            <Text style={[styles.prestationType, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.type_prestation}
            </Text>
            <Text style={[styles.prestationDate, { color: theme.colors.textSecondary }]}>
              {formatDate(item.date_prestation)}
            </Text>
            <Text style={[styles.matriculeText, { color: theme.colors.textSecondary }]}>
              Matricule: {item.matricule_assure}
            </Text>
          </View>
        </View>
        <View style={styles.prestationRight}>
          <Text style={[styles.amountText, { color: theme.colors.textPrimary }]}>
            {formatAmount(item.montant)}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.statut) }]}>
            <Text style={styles.statusText}>{item.statut}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    return (
      <FlatList
        data={filteredPrestations}
        renderItem={renderPrestationItem}
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
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="medical-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              Aucune prestation trouvée
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              {activeTab === 'all' ? 'Vous n\'avez pas encore de prestations' : 
               `Aucune prestation ${activeTab === 'pending' ? 'en attente' : 
                activeTab === 'validated' ? 'validée' : 'rejetée'}`}
            </Text>
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
            style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.openDrawer?.()}
          >
            <Ionicons name="menu-outline" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Prestations</Text>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'all' && { backgroundColor: theme.colors.primaryLight }
            ]}
            onPress={() => setActiveTab('all')}
          >
            <Ionicons name="list-outline" size={18} color={activeTab === 'all' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'all' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Toutes ({prestations.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'pending' && { backgroundColor: theme.colors.primaryLight }
            ]}
            onPress={() => setActiveTab('pending')}
          >
            <Ionicons name="time-outline" size={18} color={activeTab === 'pending' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'pending' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              En attente ({prestations.filter(p => p.statut.toLowerCase().includes('attente')).length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'validated' && { backgroundColor: theme.colors.primaryLight }
            ]}
            onPress={() => setActiveTab('validated')}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={activeTab === 'validated' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'validated' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Validées ({prestations.filter(p => p.statut.toLowerCase().includes('validé')).length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'rejected' && { backgroundColor: theme.colors.primaryLight }
            ]}
            onPress={() => setActiveTab('rejected')}
          >
            <Ionicons name="close-circle-outline" size={18} color={activeTab === 'rejected' ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'rejected' ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Rejetées ({prestations.filter(p => p.statut.toLowerCase().includes('rejeté')).length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {initialLoading ? (
        <View style={styles.content}>
          <LoadingCard 
            visible={initialLoading} 
            message="Chargement des prestations..." 
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
        message="Mise à jour des données..." 
        overlay={true}
      />

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.primary }]}>
            <TouchableOpacity 
              onPress={() => setShowDetailsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Détails de la prestation</Text>
          </View>
          
          {selectedPrestation && (
            <ScrollView style={styles.modalContent}>
              <View style={[styles.detailCard, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.detailTitle, { color: theme.colors.textPrimary }]}>
                  Informations du bénéficiaire
                </Text>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Nom:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrestation.prenom_beneficiaire} {selectedPrestation.nom_beneficiaire}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Matricule:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrestation.matricule_assure}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Type:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrestation.type_prestation}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Montant:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {formatAmount(selectedPrestation.montant)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Date:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {formatDate(selectedPrestation.date_prestation)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Statut:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedPrestation.statut) }]}>
                    <Text style={styles.statusText}>{selectedPrestation.statut}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Custom Modal */}
      <CustomModal {...modalState} />
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  prestationCard: {
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F4F8',
    backgroundColor: '#FFFFFF',
  },
  prestationContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  prestationLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  prestationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prestationInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  prestationType: {
    fontSize: 12,
    marginBottom: 2,
  },
  prestationDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  matriculeText: {
    fontSize: 12,
  },
  prestationRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F4F8',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
});

export default PrestatairePrestationsScreen;
