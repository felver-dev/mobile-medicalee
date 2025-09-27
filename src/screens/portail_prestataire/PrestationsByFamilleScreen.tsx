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
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { SafeAreaView, Platform } from 'react-native';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import Loader, { LoadingCard } from '../../components/Loader';

interface PrestationsByFamilleScreenProps {
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
  garantie_libelle: string;
  details?: string;
}

interface FamilleFilter {
  matriculeAssure: string;
  dateDebut: string;
  dateFin: string;
}

const PrestationsByFamilleScreen: React.FC<PrestationsByFamilleScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { theme } = usePrestataireTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [prestations, setPrestations] = useState<PrestationItem[]>([]);
  const [filteredPrestations, setFilteredPrestations] = useState<PrestationItem[]>([]);
  const [selectedPrestation, setSelectedPrestation] = useState<PrestationItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FamilleFilter>({
    matriculeAssure: '',
    dateDebut: '',
    dateFin: ''
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 PrestationsByFamilleScreen.loadData démarré');
      
      // TODO: Intégrer l'API réelle ici
      // Pour l'instant, données vides
      setPrestations([]);
      setFilteredPrestations([]);

      console.log('✅ Chargement des prestations par famille terminé');

    } catch (error) {
      console.error('❌ Erreur lors du chargement des prestations par famille:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyFilters = () => {
    let filtered = [...prestations];

    if (filters.matriculeAssure) {
      filtered = filtered.filter(p => p.matricule_assure.toString().includes(filters.matriculeAssure));
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
            onRefresh={loadData}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              Aucune prestation trouvée
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              Vous n'avez pas encore de prestations pour cette famille
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
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prestations par Famille</Text>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="filter-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
                Filtrer par famille
              </Text>
              <TouchableOpacity 
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.filterItem}>
                <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Matricule de l'assuré</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: theme.colors.background, 
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary 
                  }]}
                  placeholder="Entrez le matricule..."
                  placeholderTextColor={theme.colors.textSecondary}
                  value={filters.matriculeAssure}
                  onChangeText={(text) => setFilters({...filters, matriculeAssure: text})}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>
            
            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                onPress={() => {
                  setFilters({ matriculeAssure: '', dateDebut: '', dateFin: '' });
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.textSecondary }]}>Effacer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  applyFilters();
                  setShowFilterModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>Rechercher</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            <View style={styles.modalContent}>
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
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>Garantie:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                    {selectedPrestation.garantie_libelle}
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
            </View>
          )}
        </SafeAreaView>
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
  modalContainer: {
    flex: 1,
  },
  closeButton: {
    marginRight: 16,
  },
  detailCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
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

export default PrestationsByFamilleScreen;
