import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  FlatList 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { SafeAreaView, Platform } from 'react-native';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import Loader, { LoadingCard, LoadingList } from '../../components/Loader';
import { useModal } from '../../hooks/useModal';
import CustomModal from '../../components/CustomModal';
import { DependencyContainer } from '../../core/di/DependencyContainer';

interface PrestataireDashboardScreenProps {
  navigation: any;
}

interface KpiItem {
  id: number;
  libelle: string;
  valeur: number;
  unite: string;
  couleur: string;
  icone: string;
}

interface PrestationItem {
  id: number;
  nom_beneficiaire: string;
  prenom_beneficiaire: string;
  type_prestation: string;
  montant: number;
  date_prestation: string;
  statut: string;
}

const PrestataireDashboardScreen: React.FC<PrestataireDashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const { modalState, showAlert } = useModal();
  const { theme } = usePrestataireTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard'>('dashboard');
  const [kpis, setKpis] = useState<KpiItem[]>([]);
  const [prestations, setPrestations] = useState<PrestationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
      console.log('🔍 PrestataireDashboardScreen.loadData démarré avec données mockées');

      // Données mockées pour les KPIs
      const mockKpis: KpiItem[] = [
        {
          id: 1,
          libelle: 'Consultations',
          valeur: 156,
          unite: 'consultations',
          couleur: '#3d8f9d',
          icone: 'medical-outline'
        },
        {
          id: 2,
          libelle: 'Chiffre d\'affaires',
          valeur: 2450000,
          unite: 'FCFA',
          couleur: '#2196F3',
          icone: 'cash-outline'
        },
        {
          id: 3,
          libelle: 'Patients traités',
          valeur: 89,
          unite: 'patients',
          couleur: '#FF9800',
          icone: 'people-outline'
        },
        {
          id: 4,
          libelle: 'Taux de satisfaction',
          valeur: 94,
          unite: '%',
          couleur: '#4CAF50',
          icone: 'thumbs-up-outline'
        }
      ];

      // Données mockées pour les prestations récentes
      const mockPrestations: PrestationItem[] = [
        {
          id: 1,
          nom_beneficiaire: 'DIABATE',
          prenom_beneficiaire: 'Fatou',
          type_prestation: 'Consultation',
          montant: 15000,
          date_prestation: '2024-01-15',
          statut: 'validée'
        },
        {
          id: 2,
          nom_beneficiaire: 'TRAORE',
          prenom_beneficiaire: 'Moussa',
          type_prestation: 'Médicaments',
          montant: 25000,
          date_prestation: '2024-01-14',
          statut: 'en attente'
        },
        {
          id: 3,
          nom_beneficiaire: 'KONE',
          prenom_beneficiaire: 'Aminata',
          type_prestation: 'Consultation',
          montant: 12000,
          date_prestation: '2024-01-13',
          statut: 'validée'
        },
        {
          id: 4,
          nom_beneficiaire: 'SANGARE',
          prenom_beneficiaire: 'Boubacar',
          type_prestation: 'Médicaments',
          montant: 18000,
          date_prestation: '2024-01-12',
          statut: 'rejetée'
        },
        {
          id: 5,
          nom_beneficiaire: 'OUATTARA',
          prenom_beneficiaire: 'Kadidia',
          type_prestation: 'Consultation',
          montant: 20000,
          date_prestation: '2024-01-11',
          statut: 'validée'
        }
      ];

      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));

      setKpis(mockKpis);
      setPrestations(mockPrestations);

      console.log('✅ Chargement des données mockées terminé avec succès');

    } catch (error) {
      console.error('❌ Erreur lors du chargement des données:', error);
      showAlert('Erreur', 'Impossible de charger les données du dashboard', 'error');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const renderKpiCard = ({ item }: { item: KpiItem }) => (
    <View style={[styles.kpiCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <View style={[styles.kpiIcon, { backgroundColor: item.couleur + '20' }]}>
        <Ionicons name={item.icone as any} size={24} color={item.couleur} />
      </View>
      <View style={styles.kpiContent}>
        <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>
          {item.libelle}
        </Text>
        <Text style={[styles.kpiValue, { color: theme.colors.textPrimary }]}>
          {item.unite === 'FCFA' ? formatAmount(item.valeur) : 
           item.unite === '%' ? `${item.valeur}%` : 
           item.valeur.toLocaleString('fr-FR')}
        </Text>
        <Text style={[styles.kpiUnit, { color: theme.colors.textSecondary }]}>
          {item.unite !== 'FCFA' && item.unite !== '%' ? item.unite : ''}
        </Text>
      </View>
    </View>
  );

  const renderPrestationItem = ({ item }: { item: PrestationItem }) => (
    <TouchableOpacity 
      style={[styles.prestationCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
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
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Section KPIs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Indicateurs de performance
          </Text>
          <FlatList
            data={kpis}
            renderItem={renderKpiCard}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.kpiGrid}
            columnWrapperStyle={styles.kpiRow}
          />
        </View>

        {/* Section Prestations récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Prestations récentes
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Prestations')}
              style={styles.seeAllButton}
            >
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                Voir tout
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          {prestations.length > 0 ? (
            <FlatList
              data={prestations}
              renderItem={renderPrestationItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.prestationsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                Aucune prestation récente
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                Vos prestations récentes apparaîtront ici
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
          <Text style={styles.headerTitle}>Tableau de bord</Text>
        </View>
      </View>

      {/* Content */}
      {initialLoading ? (
        <View style={styles.content}>
          <LoadingCard 
            visible={initialLoading} 
            message="Chargement du tableau de bord..." 
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  kpiGrid: {
    gap: 12,
  },
  kpiRow: {
    justifyContent: 'space-between',
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F4F8',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 6,
  },
  kpiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiContent: {
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  kpiUnit: {
    fontSize: 10,
    textAlign: 'center',
  },
  prestationsList: {
    gap: 12,
  },
  prestationCard: {
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
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PrestataireDashboardScreen;
