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
  Platform,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import ApiService from '../../services/ApiService';

interface AssureClassicPrescriptionsScreenProps {
  navigation: any;
}

interface ClassicPrescription {
  id: number;
  matricule_assure: string;
  matricule: string;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  prestataire_libelle: string;
  prestataire_id: number;
  date_prescription: string;
  nombre_medicaments: number;
  code?: string;
  libelle?: string;
}

const PAGE_SIZE = 10;

// Mapping des garanties (code → libellé)
const GARANTIES = [
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

const AssureClassicPrescriptionsScreen: React.FC<AssureClassicPrescriptionsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [prescriptions, setPrescriptions] = useState<ClassicPrescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [resultsCount, setResultsCount] = useState<number | null>(null);
  
  // Filtres
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [matriculeBeneficiaire, setMatriculeBeneficiaire] = useState('');
  const [selectedGarantie, setSelectedGarantie] = useState<string | undefined>('PHARMA');
  const [showGarantiePicker, setShowGarantiePicker] = useState(false);
  const apiRef = useRef<ApiService | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end'>('start');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  if (!apiRef.current) {
    apiRef.current = new ApiService();
  }
  
  const hasLoadedInitial = useRef(false);

  // Pas de valeurs par défaut visuelles; on appliquera today/tomorrow au moment de l'appel si vide
  useEffect(() => {
    // no-op
  }, []);

  const openDatePicker = (field: 'start' | 'end') => {
    setActiveDateField(field);
    const base = field === 'start' ? dateDebut : dateFin;
    const parsed = base ? new Date(base) : new Date();
    setTempDate(parsed);
    setShowDatePicker(true);
  };

  const onDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!selected) return;
    const iso = selected.toISOString().split('T')[0];
    if (activeDateField === 'start') setDateDebut(iso);
    else setDateFin(iso);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true, 0);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const loadData = useCallback(async (isRefresh: boolean = false, page: number = 0) => {
    if (isLoading && !isRefresh) return;
    if (!isRefresh && page > 0 && !hasMoreData) return;
    
    setIsLoading(true);
    
    if (isRefresh) {
      setLoading(true);
      setCurrentPage(0);
      setHasMoreData(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Déterminer les dates effectives par défaut:
      // si vides → aujourd'hui (début) et demain (fin)
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      // Si on filtre par matricule bénéficiaire sans dates, élargir période (début d'année → aujourd'hui)
      let effectiveStart = dateDebut;
      let effectiveEnd = dateFin;
      if (!effectiveStart || !effectiveEnd) {
        if (matriculeBeneficiaire && !dateDebut && !dateFin) {
          const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
          effectiveStart = yearStart;
          effectiveEnd = todayStr;
        } else {
          effectiveStart = effectiveStart || todayStr;
          effectiveEnd = effectiveEnd || tomorrowStr;
        }
      }

      console.log('🔍 [Classic] Chargement - page:', page, 'dateDebut:', effectiveStart, 'dateFin:', effectiveEnd, 'matriculeBeneficiaire:', matriculeBeneficiaire);

      // Revenir au comportement initial: endpoint ordonnances (un item = une ordonnance)
      const resp = await apiRef.current!.getClassicPrescriptions({
        garantieCodification: selectedGarantie || undefined,
        matriculeAssure: user?.beneficiaire_matricule ? String(user.beneficiaire_matricule) : undefined,
        matriculeBeneficiaire: matriculeBeneficiaire || undefined,
        dateDebut: effectiveStart,
        dateFin: effectiveEnd,
        index: page,
        size: PAGE_SIZE,
        userId: user?.id ? Number(user.id) : undefined,
        filialeId: typeof user?.filiale_id === 'number' ? user.filiale_id : undefined,
      });
      const listRaw = Array.isArray(resp?.items) ? resp.items : (Array.isArray(resp?.data?.items) ? resp.data.items : []);
      const totalCount: number | undefined = typeof resp?.count === 'number' ? resp.count : (typeof resp?.data?.count === 'number' ? resp.data.count : undefined);
      const list: ClassicPrescription[] = listRaw as ClassicPrescription[];
      console.log('✅ [Classic] Réponse - items:', list.length, 'count:', totalCount, 'ids:', list.map((it:any)=>it?.id));

      if (isRefresh || page === 0) {
        setPrescriptions(list);
      } else {
        setPrescriptions(prev => [...prev, ...list]);
      }
      if (typeof totalCount === 'number') setResultsCount(totalCount);
      else setResultsCount(list.length);
      
      setHasMoreData(list.length === PAGE_SIZE);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Erreur lors du chargement des ordonnances classiques:', error);
      if (isRefresh || page === 0) {
        setPrescriptions([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
      setIsLoading(false);
    }
  }, [user, dateDebut, dateFin, matriculeBeneficiaire, selectedGarantie]);

  const loadMoreData = useCallback(() => {
    if (!loadingMore && hasMoreData && !isLoading) {
      loadData(false, currentPage + 1);
    }
  }, [loadingMore, hasMoreData, currentPage, isLoading]);

  useEffect(() => {
    if (!hasLoadedInitial.current) {
      hasLoadedInitial.current = true;
      loadData(true, 0);
    }
  }, [user]);

  const handleSearch = () => {
    setCurrentPage(0);
    setHasMoreData(true);
    loadData(true, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date non disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR');
  };

  const renderPrescription = ({ item }: { item: ClassicPrescription }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.prescriptionIcon}>
            <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.prescriptionInfo}>
            <Text style={[styles.prescriptionTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.code || (item as any).codification || (item as any).ordonnance_codification || `Ordonnance #${item.id}`}
            </Text>
            <Text style={[styles.prescriptionPatient, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {(item as any).beneficiaire_prenom} {(item as any).beneficiaire_nom}
            </Text>
            <Text style={[styles.prescriptionProvider, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {(item as any).prestataire_libelle}
            </Text>
            <View style={styles.contactInfo}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {formatDate((item as any).date_prescription || (item as any).created_at)}
              </Text>
            </View>
          <View style={styles.contactInfo}>
            <Ionicons name="id-card-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {(item as any).beneficiaire_matricule}
            </Text>
          </View>
            <View style={styles.contactInfo}>
              <Ionicons name="medical-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {(item as any).nombre_medicaments ?? ''} {(item as any).nombre_medicaments ? 'médicament(s)' : ''}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Ordonnances Classiques</Text>
          <View style={styles.placeholder} />
        </View>
      </View>

      {/* Filtres améliorés */}
      <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.filtersHeader}>
          <Ionicons name="filter-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.filtersTitle, { color: theme.colors.textPrimary }]}>Filtres de recherche</Text>
        </View>
        
        <View style={styles.filtersGrid}>
          {/* Garantie */}
          <View style={styles.filterCard}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Garantie</Text>
            <TouchableOpacity
              style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => setShowGarantiePicker(!showGarantiePicker)}
            >
              <Text style={[styles.filterInputText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {selectedGarantie ? (GARANTIES.find(g => g.code === selectedGarantie)?.libelle || selectedGarantie) : 'Toutes garanties'}
              </Text>
              <Ionicons name="chevron-down-outline" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Date début */}
          <View style={styles.filterCard}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date début</Text>
            <TouchableOpacity 
              style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => openDatePicker('start')} 
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.filterInputText, { color: theme.colors.textPrimary }]}>
                {dateDebut || 'Sélectionner'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date fin */}
          <View style={styles.filterCard}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Date fin</Text>
            <TouchableOpacity 
              style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={() => openDatePicker('end')} 
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={[styles.filterInputText, { color: theme.colors.textPrimary }]}>
                {dateFin || 'Sélectionner'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Matricule bénéficiaire */}
          <View style={styles.filterCard}>
            <Text style={[styles.filterLabel, { color: theme.colors.textSecondary }]}>Matricule bénéficiaire</Text>
            <View style={[styles.filterInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <Ionicons name="person-outline" size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.textInput, { color: theme.colors.textPrimary }]}
                value={matriculeBeneficiaire}
                onChangeText={setMatriculeBeneficiaire}
                placeholder="Optionnel"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        </View>

        {/* Bouton de recherche */}
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: theme.colors.primary }]} 
          onPress={handleSearch}
          activeOpacity={0.8}
        >
          <Ionicons name="search-outline" size={20} color="white" />
          <Text style={styles.searchButtonText}>Rechercher</Text>
        </TouchableOpacity>

        {/* Picker de garantie */}
        {showGarantiePicker && (
          <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.pickerHeader}>
              <Text style={[styles.pickerTitle, { color: theme.colors.textPrimary }]}>Sélectionner une garantie</Text>
              <TouchableOpacity onPress={() => setShowGarantiePicker(false)}>
                <Ionicons name="close-outline" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={styles.pickerItem} 
                onPress={() => { setSelectedGarantie(undefined); setShowGarantiePicker(false); }}
              >
                <Text style={[styles.pickerItemText, { color: theme.colors.textPrimary }]}>Toutes garanties</Text>
                {!selectedGarantie && <Ionicons name="checkmark" size={16} color={theme.colors.primary} />}
              </TouchableOpacity>
              {GARANTIES.map((g) => (
                <TouchableOpacity key={g.code} style={styles.pickerItem} onPress={() => { setSelectedGarantie(g.code); setShowGarantiePicker(false); }}>
                  <Text style={[styles.pickerItemText, { color: theme.colors.textPrimary }]}>{g.libelle}</Text>
                  {selectedGarantie === g.code && <Ionicons name="checkmark" size={16} color={theme.colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Content */}
      {initialLoading ? (
        <View style={styles.content}>
          <Loader visible={initialLoading} message="Chargement des ordonnances..." />
        </View>
      ) : (
        <View style={styles.content}>
          {resultsCount !== null && (
            <View style={{ paddingHorizontal: 20, paddingTop: 10 }}>
              <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Résultats: {resultsCount}</Text>
            </View>
          )}
          <FlatList
            data={prescriptions}
            renderItem={renderPrescription}
            keyExtractor={(item, index) => (item?.id ? `${item.id}-${index}` : `${index}`)}
            initialNumToRender={10}
            windowSize={5}
            removeClippedSubviews={false}
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
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  Aucune ordonnance classique trouvée
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  Aucune ordonnance classique pour la période sélectionnée
                </Text>
              </View>
            )}
          />
        </View>
      )}
      
      {/* Loader overlay */}
      <Loader 
        visible={loading && !initialLoading} 
        message="Mise à jour des données..." 
        overlay={true}
      />

      {showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onDateChange}
        />
      )}
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
  placeholder: {
    width: 40,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterCard: {
    width: '48%',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  filterInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    paddingHorizontal: 8,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pickerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerScroll: {
    maxHeight: 200,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
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
  prescriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prescriptionInfo: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  prescriptionPatient: {
    fontSize: 12,
    marginBottom: 2,
  },
  prescriptionProvider: {
    fontSize: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    marginLeft: 6,
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
    color: '#666666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    minHeight: 300,
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
    marginBottom: 4,
  },
});

export default AssureClassicPrescriptionsScreen;
