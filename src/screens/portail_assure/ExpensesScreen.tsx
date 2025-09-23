import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  FlatList, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Loader, { LoadingCard, LoadingList } from '../../components/Loader';
import { useModal } from '../../hooks/useModal';
import CustomModal from '../../components/CustomModal';
import { DependencyContainer } from '../../core/di/DependencyContainer';

interface ExpensesScreenProps {
  navigation: any;
}

// Utilisation des types de l'API avec any pour éviter les conflits
type ExpenseItem = any;

interface ExpenseSummary {
  total_depenses: number;
  total_consultations: number;
  total_pharmacie: number;
  total_primes: number;
  part_assurance: number;
  part_assure: number;
}

const PAGE_SIZE = 20;

const ExpensesScreen: React.FC<ExpensesScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { modalState, showAlert } = useModal();
  const [refreshing, setRefreshing] = useState(false);
  // Affichage direct de la liste des membres (pas d'onglets)
  const [familyExpenses, setFamilyExpenses] = useState<ExpenseItem[]>([]);
  const [totals, setTotals] = useState<any[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary>({
    total_depenses: 0,
    total_consultations: 0,
    total_pharmacie: 0,
    total_primes: 0,
    part_assurance: 0,
    part_assure: 0
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageIndexRef = useRef(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const loadData = async (reset: boolean = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const expensesRepository = DependencyContainer.getInstance().getExpensesRepositoryNew();
      if (!user?.beneficiaire_matricule) {
        throw new Error('Utilisateur non authentifié ou matricule manquant');
      }
      const matriculeAssure = parseInt(user.beneficiaire_matricule);

      console.log('Chargement des données dépenses pour matricule:', matriculeAssure);

      // Déterminer l'index à charger
      const targetIndex = reset ? 0 : pageIndexRef.current;

      if (reset) {
        setFamilyExpenses([]);
        setHasMore(true);
      }

      // Charger Dépenses famille (agrégats par bénéficiaire)
      try {
        const { items, totals_list } = await expensesRepository.getExpenses(matriculeAssure, user, targetIndex, PAGE_SIZE);
        console.log('Dépenses famille (items):', items?.length || 0);
        setFamilyExpenses((prev) => reset ? (items || []) : [...prev, ...(items || [])]);
        setTotals(totals_list || []);
        if ((items?.length || 0) < PAGE_SIZE) setHasMore(false);
        else pageIndexRef.current = targetIndex + PAGE_SIZE;
      } catch (error) {
        console.error('Erreur dépenses famille:', error);
        if (reset) setFamilyExpenses([]);
        setHasMore(false);
      }

  // Pas de chargement de primes sur cet écran (géré ailleurs)

      // Calcul du résumé après chargement des données
      setTimeout(() => {
        // Utiliser totals_list si fournie
        const totalsMap: Record<string, number> = {} as any;
        (totals || []).forEach((t: any) => {
          const key = Object.keys(t)[0];
          totalsMap[key] = parseFloat(t[key]) || 0;
        });
        const totalConsultations = totalsMap['cons_total'] || 0;
        const totalPharmacie = totalsMap['pharma_total'] || 0;
        const totalDepenses = totalsMap['total_depense_total'] || (totalConsultations + totalPharmacie);

        setSummary({
          total_depenses: totalDepenses,
          total_consultations: totalConsultations,
          total_pharmacie: totalPharmacie,
          total_primes: 0,
          part_assurance: 0,
          part_assure: 0
        });
      }, 100);

    } catch (error) {
      console.error('Erreur générale lors du chargement des données:', error);
      showAlert('Erreur', 'Impossible de charger les données des dépenses', 'error');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  const loadMore = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      await loadData(false);
    } finally {
      setLoadingMore(false);
    }
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
    if (!status) return '#666666';
    switch (status.toLowerCase()) {
      case 'validé':
      case 'payée':
        return '#4CAF50';
      case 'en attente':
        return '#FF9800';
      case 'rejeté':
        return '#F44336';
      default:
        return '#666666';
    }
  };

  const renderSummaryCard = () => (
    <View style={styles.summaryContainer}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
        Résumé des dépenses
      </Text>
      
      <View style={styles.summaryGrid}>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {formatAmount(summary.total_depenses)}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Total dépenses
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {formatAmount(summary.part_assurance)}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Part assurance
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.orangeLight }]}>
          <Ionicons name="person-outline" size={24} color={theme.colors.warning} />
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {formatAmount(summary.part_assure)}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Part assuré
          </Text>
        </View>
        
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.blueLight }]}>
          <Ionicons name="cash-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.summaryValue, { color: theme.colors.textPrimary }]}>
            {formatAmount(summary.total_primes)}
          </Text>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Primes reçues
          </Text>
        </View>
      </View>

      <View style={styles.detailBreakdown}>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
            Consultations:
          </Text>
          <Text style={[styles.breakdownValue, { color: theme.colors.textPrimary }]}>
            {formatAmount(summary.total_consultations)}
          </Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
            Pharmacie:
          </Text>
          <Text style={[styles.breakdownValue, { color: theme.colors.textPrimary }]}>
            {formatAmount(summary.total_pharmacie)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderExpenseItem = ({ item }: { item: ExpenseItem }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
    >
      {/* Main Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={[styles.expenseIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons 
              name={'person-circle-outline'} 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={[styles.expenseTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.nom} {item.prenom}
            </Text>
            <Text style={[styles.expensePatient, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              Matricule: {item.matricule}
            </Text>
            <Text style={[styles.expenseProvider, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              Consultations: {item.cons || 0} • Pharmacie: {item.pharma || 0}
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.statusButton, { backgroundColor: getStatusColor(item.statut || '') }] }>
            <Text style={styles.statusButtonText}>{(item.total_depense || 0).toLocaleString('fr-FR')} XOF</Text>
          </View>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.contactInfo}>
        <View style={styles.contactItem}>
          <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.contactText, { color: theme.colors.textSecondary }] }>
            Matricule assure: {item.matricule_assure}
          </Text>
        </View>
      </View>

      {/* Statistics Section */}
      <View style={[styles.statsSection, { borderTopColor: theme.colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.textPrimary }] }>
            {formatAmount(parseFloat(item.total_depense) || 0)}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }] }>
            Total dépenses
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}> {formatAmount(parseFloat(item.cons) || 0)} </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}> Consultations </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}> {formatAmount(parseFloat(item.pharma) || 0)} </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}> Pharmacie </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Aucun rendu de primes sur cet écran

  const renderContent = () => {
    return (
      <FlatList
        data={familyExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => `${item.id}-${item.matricule}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={loadingMore ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
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
          
          <Text style={styles.headerTitle}>Mes Dépenses</Text>
          
        </View>
      </View>

      {/* Liste directe sans onglets */}
      {initialLoading ? (
        <View style={styles.content}>
          <LoadingCard 
            visible={initialLoading} 
            message="Chargement des données de dépenses..." 
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
    paddingTop: 20,
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
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  summaryContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 15,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  detailBreakdown: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8F4F8',
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  expenseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  expensePatient: {
    fontSize: 12,
    marginBottom: 2,
  },
  expenseProvider: {
    fontSize: 12,
  },
  statusButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  contactInfo: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
});

export default ExpensesScreen;

