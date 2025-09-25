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

interface AssureEPPrescriptionsScreenProps {
  navigation: any;
}

interface EPOrdonnance {
  id: number;
  created_by_login: string;
  updated_by_login: string;
  filiale_id: number;
  filiale_libelle: string;
  prestataire_id: number;
  prestataire_libelle: string;
  beneficiaire_id: number;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  image_url: string | null;
  beneficiaire_matricule: string;
  college_id: number;
  college_libelle: string;
  police_id: number;
  police_libelle: string;
  souscripteur_id: number | null;
  garant_id: number;
  garant_libelle: string;
  garantie_id: number;
  garantie_libelle: string;
  affection_id: number;
  affection_libelle: string;
  code: string;
  codification: string;
  libelle: string | null;
  ged_file_url: string | null;
  matricule: string;
  matricule_assure: string | null;
  prestataire_codification: string | null;
  renseignement_clinique: string | null;
  is_factured: boolean | null;
  is_clotured: boolean | null;
  date_clotured: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  is_notif: boolean | null;
  is_transaction: number;
  is_pending_validate: number;
  is_deleted: number;
  created_ip_address: string | null;
  updated_ip_address: string | null;
  deleted_ip_address: string | null;
  type_ordonnance: number;
  created_by: number;
  updated_by: number | null;
  deleted_by: number | null;
  total_prescription: number;
  total_entente_prealable: number;
}

const PAGE_SIZE = 20;

// Mapping des garanties
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

const AssureEPPrescriptionsScreen: React.FC<AssureEPPrescriptionsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [ordonnances, setOrdonnances] = useState<EPOrdonnance[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filtres
  const [selectedGarantie, setSelectedGarantie] = useState('PHARMA');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [matriculeBeneficiaire, setMatriculeBeneficiaire] = useState('');
  const [showGarantiePicker, setShowGarantiePicker] = useState(false);
  const apiRef = useRef<ApiService>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<'start' | 'end'>('start');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  if (!apiRef.current) {
    apiRef.current = new ApiService();
  }
  
  const hasLoadedInitial = useRef(false);

  // Initialiser les dates par défaut (90 derniers jours)
  useEffect(() => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setDate(today.getDate() - 90);
    
    setDateFin(today.toISOString().split('T')[0]);
    setDateDebut(threeMonthsAgo.toISOString().split('T')[0]);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true, 0);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
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
      console.log('🔍 [EP] Chargement - page:', page, 'garantie:', selectedGarantie, 'dates:', dateDebut, dateFin, 'matriculeBeneficiaire:', matriculeBeneficiaire);
      const resp = await apiRef.current!.getOrdonnancesByEntentePrealable({
        garantieCodification: selectedGarantie,
        matriculeAssure: String(user?.beneficiaire_matricule || ''),
        matriculeBeneficiaire: matriculeBeneficiaire || undefined,
        dateDebut,
        dateFin,
        index: page,
        size: PAGE_SIZE,
      });
      const list: EPOrdonnance[] = resp?.items || resp?.data?.items || [];
      console.log('✅ [EP] Réponse - items:', list.length);

      if (isRefresh || page === 0) {
        setOrdonnances(list);
      } else {
        setOrdonnances(prev => [...prev, ...list]);
      }
      
      setHasMoreData(list.length === PAGE_SIZE);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Erreur lors du chargement des ordonnances avec entente préalable:', error);
      if (isRefresh || page === 0) {
        setOrdonnances([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
      setIsLoading(false);
    }
  }, [user, selectedGarantie, dateDebut, dateFin, matriculeBeneficiaire]);

  const loadMoreData = useCallback(() => {
    if (!loadingMore && hasMoreData && !isLoading) {
      loadData(false, currentPage + 1);
    }
  }, [loadingMore, hasMoreData, currentPage, isLoading]);

  useEffect(() => {
    if (user?.beneficiaire_matricule && !hasLoadedInitial.current) {
      hasLoadedInitial.current = true;
      loadData(true, 0);
    }
  }, [user?.beneficiaire_matricule]);

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

  const renderGarantiePicker = () => (
    <View style={[styles.pickerContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <ScrollView style={styles.pickerScroll}>
        {GARANTIES.map((garantie) => (
          <TouchableOpacity
            key={garantie.code}
            style={[
              styles.pickerItem,
              selectedGarantie === garantie.code && { backgroundColor: theme.colors.primaryLight }
            ]}
            onPress={() => {
              setSelectedGarantie(garantie.code);
              setShowGarantiePicker(false);
            }}
          >
            <Text style={[
              styles.pickerItemText,
              { color: selectedGarantie === garantie.code ? theme.colors.primary : theme.colors.textPrimary }
            ]}>
              {garantie.libelle}
            </Text>
            {selectedGarantie === garantie.code && (
              <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOrdonnance = ({ item }: { item: EPOrdonnance }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.prescriptionIcon}>
            <Ionicons name="shield-medical-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.prescriptionInfo}>
            <Text style={[styles.prescriptionTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.code || `Ordonnance #${item.id}`}
            </Text>
            <Text style={[styles.prescriptionPatient, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.beneficiaire_prenom} {item.beneficiaire_nom}
            </Text>
            <Text style={[styles.prescriptionProvider, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.prestataire_libelle}
            </Text>
            <View style={styles.contactInfo}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Ionicons name="medical-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.total_prescription} prescription(s), {item.total_entente_prealable} entente(s)
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Ionicons name="shield-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.garantie_libelle}
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
          <Text style={styles.headerTitle}>Ordonnances avec Entente Préalable</Text>
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
                {GARANTIES.find(g => g.code === selectedGarantie)?.libelle || 'Sélectionner'}
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
              {GARANTIES.map((garantie) => (
                <TouchableOpacity 
                  key={garantie.code} 
                  style={styles.pickerItem} 
                  onPress={() => { setSelectedGarantie(garantie.code); setShowGarantiePicker(false); }}
                >
                  <Text style={[styles.pickerItemText, { color: theme.colors.textPrimary }]}>{garantie.libelle}</Text>
                  {selectedGarantie === garantie.code && <Ionicons name="checkmark" size={16} color={theme.colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Content */}
      {initialLoading ? (
        <View style={styles.content}>
          <Loader visible={initialLoading} message="Chargement des ordonnances avec entente préalable..." />
        </View>
      ) : (
        <View style={styles.content}>
          <FlatList
            data={ordonnances}
            renderItem={renderOrdonnance}
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
              <View style={styles.emptyState}>
                <Ionicons name="shield-medical-outline" size={48} color={theme.colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                  Aucune ordonnance avec entente préalable trouvée
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                  Aucune ordonnance avec entente préalable pour la période sélectionnée
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
    backgroundColor: '#FEF3C7',
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

export default AssureEPPrescriptionsScreen;
