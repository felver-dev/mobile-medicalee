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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Loader, { LoadingCard, LoadingList } from '../../components/Loader';
import { useModal } from '../../hooks/useModal';
import CustomModal from '../../components/CustomModal';
import PrescriptionModal from '../../components/PrescriptionModal';
import { DependencyContainer } from '../../core/di/DependencyContainer';

interface FamilyScreenProps {
  navigation: any;
  route?: any;
}

// Utilisation de any pour éviter les conflits de types
type FamilyMember = any;

interface FamilyConsultation {
  id: number;
  matricule_assure: string;
  matricule: string;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  prestataire_libelle: string;
  prestataire_id: number;
  libelle: string;
  acte_libelle: string;
  created_at: string;
  montant: string;
}

interface FamilyPrescription {
  id: number;
  matricule_assure: string;
  matricule: string;
  beneficiaire_nom: string;
  beneficiaire_prenom: string;
  prestataire_libelle: string;
  prestataire_id: number;
  date_prescription: string;
  nombre_medicaments: number;
}

const PAGE_SIZE = 20;

const FamilyScreen: React.FC<FamilyScreenProps> = ({ navigation, route }) => {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { modalState, showAlert } = useModal();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'consultations' | 'prescriptions' | 'primes'>('members');
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [consultations, setConsultations] = useState<FamilyConsultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<FamilyPrescription[]>([]);
  const [primes, setPrimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<FamilyPrescription | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const hasLoadedInitial = useRef(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true, 0);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const loadData = useCallback(async (isRefresh: boolean = false, page: number = 0) => {
    // Protection contre les appels simultanés
    if (isLoading && !isRefresh) {
      console.log('Chargement déjà en cours, ignoré');
      return;
    }
    
    // Protection contre les appels répétés
    if (!isRefresh && page > 0 && !hasMoreData) {
      console.log('Pas plus de données disponibles, ignoré');
      return;
    }
    
    setIsLoading(true);
    
    if (isRefresh) {
      setLoading(true);
      setCurrentPage(0);
      setHasMoreData(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const familyRepository = DependencyContainer.getInstance().getFamilyRepositoryNew();
      if (!user?.beneficiaire_matricule) {
        throw new Error('Utilisateur non authentifié ou matricule manquant');
      }
      const matriculeAssure = parseInt(user.beneficiaire_matricule);

      console.log('Chargement des données famille pour matricule:', matriculeAssure);
      console.log('Utilisateur connecté:', user);
      console.log('Matricule utilisateur:', user?.beneficiaire_matricule);

      // Charger les membres de famille
      try {
        const familyMembersData = await familyRepository.getFamilyMembers(matriculeAssure, user, page, PAGE_SIZE);
        console.log('Membres de famille reçus:', familyMembersData);
        
        if (isRefresh || page === 0) {
          setFamilyMembers(familyMembersData);
        } else {
          setFamilyMembers(prev => [...prev, ...familyMembersData]);
        }
        
        setHasMoreData(familyMembersData.length === PAGE_SIZE);
        setCurrentPage(page);
      } catch (error) {
        console.error('Erreur lors du chargement des membres de famille:', error);
        if (isRefresh || page === 0) {
          setFamilyMembers([]);
        }
      }

      // Charger les consultations
      try {
        console.log('🔍 Chargement consultations pour matricule:', matriculeAssure);
        const consultationsData = await familyRepository.getFamilyConsultations(matriculeAssure, user, page, PAGE_SIZE);
        console.log('📋 Consultations reçues:', consultationsData);
        console.log('📊 Nombre de consultations:', consultationsData.length);
        
        if (isRefresh || page === 0) {
          setConsultations(consultationsData);
        } else {
          setConsultations(prev => [...prev, ...consultationsData]);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des consultations:', error);
        if (isRefresh || page === 0) {
          setConsultations([]);
        }
      }

      // Charger les prescriptions
      try {
        console.log('🔍 Chargement prescriptions pour matricule:', matriculeAssure);
        const prescriptionsData = await familyRepository.getFamilyPrescriptions(matriculeAssure, user, page, PAGE_SIZE);
        console.log('💊 Prescriptions reçues:', prescriptionsData);
        console.log('📊 Nombre de prescriptions:', prescriptionsData.length);
        
        if (isRefresh || page === 0) {
          setPrescriptions(prescriptionsData);
        } else {
          setPrescriptions(prev => [...prev, ...prescriptionsData]);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des prescriptions:', error);
        if (isRefresh || page === 0) {
          setPrescriptions([]);
        }
      }

      // Charger les primes
      try {
        console.log('💰 Chargement primes pour matricule:', matriculeAssure);
        const primesData = await familyRepository.getFamilyPrimes(matriculeAssure, user, page, PAGE_SIZE);
        console.log('💎 Primes reçues:', primesData);
        console.log('📊 Nombre de primes:', primesData.length);
        
        if (isRefresh || page === 0) {
          setPrimes(primesData);
        } else {
          setPrimes(prev => [...prev, ...primesData]);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des primes:', error);
        if (isRefresh || page === 0) {
          setPrimes([]);
        }
      }

    } catch (error) {
      console.error('Erreur générale lors du chargement des données:', error);
      showAlert('Erreur', 'Impossible de charger les données de famille', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoading(false);
      setIsLoading(false);
    }
  }, [user]);

  const loadMoreData = useCallback(() => {
    if (!loadingMore && hasMoreData && !isLoading) {
      console.log('Chargement de la page suivante:', currentPage + 1);
      loadData(false, currentPage + 1);
    }
  }, [loadingMore, hasMoreData, currentPage, isLoading]);

  useEffect(() => {
    if (user?.beneficiaire_matricule && !hasLoadedInitial.current) {
      console.log('Chargement initial des données famille');
      hasLoadedInitial.current = true;
      loadData(true, 0);
    }
  }, [user?.beneficiaire_matricule]);

  // Gérer les paramètres de navigation pour définir l'onglet actif
  useEffect(() => {
    if (route?.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route?.params?.activeTab]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date non disponible';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    return date.toLocaleDateString('fr-FR');
  };

  const calculateAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const formatAmountDisplay = (value: any) => {
    if (value === null || value === undefined || value === '') return 'Montant non disponible';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Montant invalide';
    return `${num.toLocaleString('fr-FR')} FCFA`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'actif':
      case 'validé':
        return '#3d8f9d';
      case 'en attente':
        return '#3d8f9d';
      case 'rejeté':
        return '#3d8f9d';
      default:
        return '#3d8f9d';
    }
  };

  const renderFamilyMember = ({ item }: { item: FamilyMember }) => (
    <TouchableOpacity 
      style={[styles.memberCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
    >
      {/* Header avec avatar et statut */}
      <View style={[styles.memberHeader, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.memberHeaderLeft}>
          <View style={[styles.memberAvatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.memberInitials, { color: theme.colors.textInverse }]}>
              {item.prenom?.charAt(0) || ''}{item.nom?.charAt(0) || ''}
            </Text>
          </View>
          <View style={styles.memberHeaderInfo}>
            <Text style={[styles.memberName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.prenom} {item.nom}
            </Text>
            <View style={[styles.memberStatusBadge, { backgroundColor: getStatusColor(item.statut_libelle) }]}>
              <Text style={[styles.memberStatusText, { color: 'white' }]} numberOfLines={1}>
                {item.statut_libelle}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.memberHeaderRight}>
          {item.is_vip && (
            <View style={styles.vipBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}
        </View>
      </View>

      {/* Informations principales */}
      <View style={styles.memberContent}>
        <View style={styles.memberInfoGrid}>
          <View style={styles.memberInfoItem}>
            <View style={styles.memberInfoIcon}>
              <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.memberInfoText}>
              <Text style={[styles.memberInfoLabel, { color: theme.colors.textSecondary }]}>Matricule</Text>
              <Text style={[styles.memberInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {item.matricule || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.memberInfoItem}>
            <View style={styles.memberInfoIcon}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.memberInfoText}>
              <Text style={[styles.memberInfoLabel, { color: theme.colors.textSecondary }]}>Âge</Text>
              <Text style={[styles.memberInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {calculateAge(item.date_naissance)} ans
              </Text>
            </View>
          </View>

          {item.civilite_libelle && (
            <View style={styles.memberInfoItem}>
              <View style={styles.memberInfoIcon}>
                <Ionicons name="person-circle-outline" size={16} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.memberInfoText}>
                <Text style={[styles.memberInfoLabel, { color: theme.colors.textSecondary }]}>Civilité</Text>
                <Text style={[styles.memberInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {item.civilite_libelle}
                </Text>
              </View>
            </View>
          )}

          {item.college_libelle && (
            <View style={styles.memberInfoItem}>
              <View style={styles.memberInfoIcon}>
                <Ionicons name="school-outline" size={16} color={theme.colors.textSecondary} />
              </View>
              <View style={styles.memberInfoText}>
                <Text style={[styles.memberInfoLabel, { color: theme.colors.textSecondary }]}>Collège</Text>
                <Text style={[styles.memberInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {item.college_libelle}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Contacts et Police en bas */}
        <View style={[styles.memberFooter, { borderTopColor: theme.colors.border }]}>
          <View style={styles.memberFooterLeft}>
            {item.telephone && (
              <View style={styles.memberContactItem}>
                <Ionicons name="call-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.memberContactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.telephone}
                </Text>
              </View>
            )}
            {item.police_libelle && (
              <View style={styles.memberContactItem}>
                <Ionicons name="shield-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.memberContactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                  {item.police_libelle}
                </Text>
              </View>
            )}
          </View>
          {item.email && (
            <View style={styles.memberFooterRight}>
              <Ionicons name="mail-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.memberEmailText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderConsultation = ({ item }: { item: FamilyConsultation }) => {
    console.log('🎨 Rendu consultation:', item);
    return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
    >
      {/* Main Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.consultationIconContainer}>
            <Ionicons 
              name="medical-outline" 
              size={24} 
              color={theme.colors.primary} 
            />
          </View>
          <View style={styles.consultationInfo}>
            <Text style={[styles.consultationTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.libelle || item.acte_libelle}
            </Text>
            <Text style={[styles.consultationPatient, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.beneficiaire_prenom} {item.beneficiaire_nom}
            </Text>
            <Text style={[styles.consultationProvider, { color: theme.colors.textSecondary }]} numberOfLines={1}>
              {item.prestataire_libelle}
            </Text>
            <View style={styles.contactInfo}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.prestataire_libelle}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.consultationAmount, { color: theme.colors.primary }]} numberOfLines={1}>
            {formatAmountDisplay(item.montant)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
    );
  };

  const handleBuyMedicaments = (prescription: FamilyPrescription) => {
    console.log('🛒 Achat de médicaments pour l\'ordonnance:', prescription.id);
    setSelectedPrescription(prescription);
    setShowBuyModal(true);
  };

  const handleViewPrescription = (prescription: FamilyPrescription) => {
    console.log('👁️ Voir les détails de l\'ordonnance:', prescription.id);
    setSelectedPrescription(prescription);
    setShowViewModal(true);
  };

  const handleConfirmBuy = () => {
    console.log('✅ Confirmation d\'achat pour l\'ordonnance:', selectedPrescription?.id);
    showAlert('Succès', 'Commande de médicaments enregistrée avec succès !', 'success');
  };

  const renderPrescription = ({ item }: { item: FamilyPrescription }) => (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <TouchableOpacity 
        style={styles.cardContent}
        activeOpacity={0.7}
        onPress={() => handleViewPrescription(item)}
      >
        <View style={styles.cardLeft}>
          <View style={styles.prescriptionIcon}>
            <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.prescriptionInfo}>
            <Text style={[styles.prescriptionTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              Ordonnance #{item.id}
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
                {formatDate(item.date_prescription)}
              </Text>
            </View>
            <View style={styles.contactInfo}>
              <Ionicons name="medical-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.contactText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                {item.nombre_medicaments} médicament(s)
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.prescriptionAmount}>
          <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>
      
      {/* Boutons d'action */}
      <View style={styles.prescriptionActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.viewButton, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
          onPress={() => handleViewPrescription(item)}
        >
          <Ionicons name="eye-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.actionButtonText, { color: theme.colors.textSecondary }]}>Voir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.buyButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => handleBuyMedicaments(item)}
        >
          <Ionicons name="cart-outline" size={16} color="white" />
          <Text style={styles.buyButtonText}>Acheter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPrime = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.primeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
    >
      {/* Header avec icône et statut */}
      <View style={[styles.primeHeader, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.primeHeaderLeft}>
          <View style={[styles.primeIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="card-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.primeHeaderInfo}>
            <Text style={[styles.primeTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.beneficiaire_nom || 'N/A'} {item.beneficiaire_prenom || ''}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.primaryLight }]}>
              <Text style={[styles.statusText, { color: theme.colors.primary }]} numberOfLines={1}>
                {item.statut_libelle || 'N/A'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.primeHeaderRight}>
          <Text style={[styles.primeAmount, { color: theme.colors.primary }]} numberOfLines={1}>
            {formatAmountDisplay(item.prime_ttc)}
          </Text>
        </View>
      </View>

      {/* Informations principales */}
      <View style={styles.primeContent}>
        <View style={styles.primeInfoGrid}>
          <View style={styles.primeInfoItem}>
            <View style={styles.primeInfoIcon}>
              <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.primeInfoText}>
              <Text style={[styles.primeInfoLabel, { color: theme.colors.textSecondary }]}>Matricule</Text>
              <Text style={[styles.primeInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {item.matricule || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.primeInfoItem}>
            <View style={styles.primeInfoIcon}>
              <Ionicons name="school-outline" size={16} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.primeInfoText}>
              <Text style={[styles.primeInfoLabel, { color: theme.colors.textSecondary }]}>Collège</Text>
              <Text style={[styles.primeInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {item.college_libelle || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.primeInfoItem}>
            <View style={styles.primeInfoIcon}>
              <Ionicons name="shield-outline" size={16} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.primeInfoText}>
              <Text style={[styles.primeInfoLabel, { color: theme.colors.textSecondary }]}>Police</Text>
              <Text style={[styles.primeInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {item.police_libelle || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.primeInfoItem}>
            <View style={styles.primeInfoIcon}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.primeInfoText}>
              <Text style={[styles.primeInfoLabel, { color: theme.colors.textSecondary }]}>Date d'entrée</Text>
              <Text style={[styles.primeInfoValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                {formatDate(item.date_entree)}
              </Text>
            </View>
          </View>
        </View>

        {/* Plafond en bas */}
        <View style={[styles.primeFooter, { borderTopColor: theme.colors.border }]}>
          <View style={styles.primeFooterLeft}>
            <Ionicons name="trending-up-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.primeFooterLabel, { color: theme.colors.textSecondary }]}>Plafond</Text>
          </View>
          <Text style={[styles.primeFooterValue, { color: theme.colors.textPrimary }]} numberOfLines={1}>
            {formatAmountDisplay(item.plafond)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'members':
        return (
          <FlatList
            data={familyMembers}
            renderItem={renderFamilyMember}
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
          />
        );
      case 'consultations':
        console.log('📋 Rendu consultations - Nombre:', consultations.length);
        console.log('📋 Données consultations:', consultations);
        return (
          <FlatList
            data={consultations}
            renderItem={renderConsultation}
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
            ListEmptyComponent={() => {
              console.log('📋 Affichage état vide pour consultations');
              return (
                <View style={styles.emptyState}>
                  <Ionicons name="medical-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                    Aucune consultation trouvée
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                    Vous n'avez pas encore de consultations enregistrées
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
                    Matricule: {user?.beneficiaire_matricule || 'Non disponible'}
                  </Text>
                </View>
              );
            }}
          />
        );
      case 'prescriptions':
        console.log('💊 Rendu prescriptions (boutons uniquement)');
        return (
          <View style={styles.prescriptionsContainer}>
            <View style={styles.prescriptionButtonsContainer}>
              <TouchableOpacity
                style={[styles.prescriptionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => navigation.navigate('ClassicPrescriptions')}
                activeOpacity={0.7}
              >
                <View style={styles.prescriptionButtonContent}>
                  <View style={[styles.prescriptionButtonIcon, { backgroundColor: theme.colors.primaryLight }]}>
                    <Ionicons name="document-outline" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.prescriptionButtonInfo}>
                    <Text style={[styles.prescriptionButtonTitle, { color: theme.colors.textPrimary }]}>Ordonnances Classiques</Text>
                    <Text style={[styles.prescriptionButtonSubtitle, { color: theme.colors.textSecondary }]}>Consultez vos ordonnances classiques</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.prescriptionButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={() => navigation.navigate('EPPrescriptions')}
                activeOpacity={0.7}
              >
                <View style={styles.prescriptionButtonContent}>
                  <View style={[styles.prescriptionButtonIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="shield-medical-outline" size={24} color="#D97706" />
                  </View>
                  <View style={styles.prescriptionButtonInfo}>
                    <Text style={[styles.prescriptionButtonTitle, { color: theme.colors.textPrimary }]}>Ordonnances avec Entente Préalable</Text>
                    <Text style={[styles.prescriptionButtonSubtitle, { color: theme.colors.textSecondary }]}>Consultez vos ordonnances nécessitant une entente préalable</Text>
                  </View>
                  <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.textSecondary} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'primes':
        console.log('💰 Rendu primes - Nombre:', primes.length);
        console.log('💰 Données primes:', primes);
        return (
          <FlatList
            data={primes}
            renderItem={renderPrime}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={() => {
              console.log('💰 Affichage état vide pour primes');
              return (
                <View style={styles.emptyState}>
                  <Ionicons name="card-outline" size={48} color={theme.colors.textSecondary} />
                  <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
                    Aucune prime trouvée
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
                    Vous n'avez pas encore de primes enregistrées
                  </Text>
                  <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary, fontSize: 12, marginTop: 8 }]}>
                    Matricule: {user?.beneficiaire_matricule || 'Non disponible'}
                  </Text>
                </View>
              );
            }}
          />
        );
      default:
        return null;
    }
  };

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle="light-content" backgroundColor="transparent" />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }] }>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.openDrawer?.()}
          >
            <Ionicons name="menu-outline" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ma Famille</Text>
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
            activeTab === 'members' && { backgroundColor: theme.colors.primaryLight }
          ]}
          onPress={() => setActiveTab('members')}
        >
          <Ionicons name="people-outline" size={18} color={activeTab === 'members' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'members' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            Membres
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'consultations' && { backgroundColor: theme.colors.primaryLight }
          ]}
          onPress={() => setActiveTab('consultations')}
        >
          <Ionicons name="medical-outline" size={18} color={activeTab === 'consultations' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'consultations' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            Consultations
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'prescriptions' && { backgroundColor: theme.colors.primaryLight }
          ]}
          onPress={() => setActiveTab('prescriptions')}
        >
          <Ionicons name="receipt-outline" size={18} color={activeTab === 'prescriptions' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'prescriptions' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            Ordonnances
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'primes' && { backgroundColor: theme.colors.primaryLight }
          ]}
          onPress={() => setActiveTab('primes')}
        >
          <Ionicons name="card-outline" size={18} color={activeTab === 'primes' ? theme.colors.primary : theme.colors.textSecondary} />
          <Text style={[
            styles.tabText,
            { color: activeTab === 'primes' ? theme.colors.primary : theme.colors.textSecondary }
          ]}>
            Prime
          </Text>
        </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {initialLoading ? (
        <View style={styles.content}>
          <LoadingCard 
            visible={initialLoading} 
            message="Chargement des données de famille..." 
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

      {/* Modal de détails de l'ordonnance */}
      <PrescriptionModal
        visible={showViewModal}
        onClose={() => setShowViewModal(false)}
        prescription={selectedPrescription}
        type="view"
      />

      {/* Modal d'achat de médicaments */}
      <PrescriptionModal
        visible={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        prescription={selectedPrescription}
        type="buy"
        onConfirm={handleConfirmBuy}
      />
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
  activeTab: {
    backgroundColor: '#F0F9FA',
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
  // Nouveau design pour les cartes de membres
  memberCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8F4F8',
    backgroundColor: '#FFFFFF',
  },
  memberTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3d8f9d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberBadges: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FFF8DC',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  vipText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#B8860B',
    marginLeft: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  memberInfo: {
    marginBottom: 12,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  memberMatricule: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  memberAge: {
    fontSize: 13,
    color: '#666666',
  },
  memberDetails: {
    marginTop: 8,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 11,
    color: '#666666',
    marginLeft: 6,
    flex: 1,
  },
  memberContacts: {
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  memberStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
  },
  // Styles pour les autres cartes (consultations, prescriptions)
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
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  consultationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  consultationInfo: {
    flex: 1,
  },
  consultationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  consultationPatient: {
    fontSize: 12,
    marginBottom: 2,
  },
  consultationProvider: {
    fontSize: 12,
    marginBottom: 4,
  },
  consultationAmount: {
    fontSize: 16,
    fontWeight: 'bold',
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
  prescriptionAmount: {
    alignItems: 'flex-end',
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
    color: '#333333',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    color: '#666666',
    marginBottom: 4,
  },
  // Styles pour les boutons d'action des ordonnances
  prescriptionActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  buyButton: {
    backgroundColor: '#3d8f9d',
    borderColor: '#3d8f9d',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  // Styles pour les boutons de navigation des ordonnances
  prescriptionsContainer: {
    flex: 1,
  },
  prescriptionButtonsContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    gap: 12,
  },
  prescriptionButton: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  prescriptionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  prescriptionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prescriptionButtonInfo: {
    flex: 1,
  },
  prescriptionButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  prescriptionButtonSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  
  // Styles pour les cartes de primes améliorées
  primeCard: {
    marginHorizontal: 2,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  
  // Styles pour les cartes de membres améliorées
  memberCard: {
    marginHorizontal: 2,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  memberHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInitials: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberHeaderInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  memberStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberHeaderRight: {
    alignItems: 'flex-end',
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  vipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#856404',
    marginLeft: 2,
  },
  memberContent: {
    padding: 16,
  },
  memberInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memberInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  memberInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  memberInfoText: {
    flex: 1,
  },
  memberInfoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  memberInfoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  memberFooterLeft: {
    flex: 1,
  },
  memberContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberContactText: {
    fontSize: 12,
    marginLeft: 6,
  },
  memberFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberEmailText: {
    fontSize: 12,
    marginLeft: 6,
  },
  primeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  primeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  primeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  primeHeaderInfo: {
    flex: 1,
  },
  primeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primeHeaderRight: {
    alignItems: 'flex-end',
  },
  primeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  primeContent: {
    padding: 16,
  },
  primeInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  primeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  primeInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  primeInfoText: {
    flex: 1,
  },
  primeInfoLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  primeInfoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  primeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  primeFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primeFooterLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  primeFooterValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default FamilyScreen;