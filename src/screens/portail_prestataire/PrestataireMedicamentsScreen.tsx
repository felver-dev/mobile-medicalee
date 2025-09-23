import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  StyleSheet, 
  StatusBar, 
  Platform, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import { DependencyContainer } from '../../core/di/DependencyContainer';
import CustomModal from '../../components/CustomModal';
import { useModal } from '../../hooks/useModal';

type SearchType = 'matricule' | 'cmu';

interface EligibilityResult {
  isEligible: boolean;
  beneficiaire?: {
    id?: number;
    matricule: string;
    nom: string;
    prenom: string;
    date_naissance: string;
    statut: string;
    taux_applicable?: number;
  };
  message?: string;
}

const PrestataireMedicamentsScreen: React.FC = () => {
  const { theme } = usePrestataireTheme();
  const { user } = useAuth();
  const { modalState, showAlert } = useModal();
  const navigation = useNavigation();
  
  const [searchType, setSearchType] = useState<SearchType>('matricule');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type);
    setSearchValue('');
    setResult(null);
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      showAlert('Erreur', 'Veuillez saisir une valeur', 'error');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const api = DependencyContainer.getInstance().getApiService();
      const payload = {
        is_required_dossier: false,
        data: {
          [searchType === 'matricule' ? 'matricule' : 'numero_cnam']: searchValue.trim()
        },
        filiale_id: user?.filiale_id || 1,
        user_id: user?.id || 49,
        prestataire_id: user?.prestataire_id || 5
      };
      const data = await api.searchBeneficiaire(payload);

      console.log('🔍 Réponse API recherche:', JSON.stringify(data, null, 2));

      if (!data?.hasError && data?.item) {
        setResult({
          isEligible: true,
          beneficiaire: {
            id: data.item.id,
            matricule: data.item.matricule,
            nom: data.item.nom,
            prenom: data.item.prenom,
            date_naissance: data.item.date_naissance,
            statut: data.item.statut_libelle,
            taux_applicable: data.item.taux_applicable
          },
          message: 'Bénéficiaire trouvé et éligible'
        });
      } else {
        setResult({
          isEligible: false,
          message: data?.status?.message || 'Bénéficiaire non trouvé ou non éligible'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      showAlert('Erreur', 'Impossible de vérifier l\'éligibilité', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadBeneficiairePrescriptions = async (beneficiaire: any) => {
    setLoadingPrescriptions(true);
    try {
      const api = DependencyContainer.getInstance().getApiService();
      const payload = {
        data: {
          beneficiaire_id: beneficiaire.id,
          matricule: beneficiaire.matricule
        },
        filiale_id: user?.filiale_id || 1,
        user_id: user?.id || 49,
        prestataire_id: user?.prestataire_id || 5,
        index: 0,
        size: 100
      };
      
      console.log('🔍 Chargement des prescriptions avec:', payload);
      const data = await api.getBeneficiairePrescriptions(payload);
      console.log('📋 Réponse API complète:', JSON.stringify(data, null, 2));

      if (!data?.hasError && data?.items) {
        console.log('✅ Prescriptions trouvées:', data.items.length);
        console.log('📝 Premier item:', JSON.stringify(data.items[0], null, 2));
        return data.items;
      } else {
        console.log('❌ Aucune prescription trouvée ou erreur:', data);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors du chargement des prescriptions:', error);
      showAlert('Erreur', 'Impossible de charger les prescriptions', 'error');
      return [];
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar translucent barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }]}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => (navigation as any).openDrawer?.()}
          >
            <Ionicons name="menu-outline" size={20} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Médicaments</Text>
          
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sélecteur de type de recherche */}
        <View style={[styles.searchTypeContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Type de recherche</Text>
          
          <View style={styles.searchTypeButtons}>
            <TouchableOpacity
              style={[
                styles.searchTypeButton,
                { 
                  backgroundColor: searchType === 'matricule' ? theme.colors.primary : theme.colors.background,
                  borderColor: theme.colors.border
                }
              ]}
              onPress={() => handleSearchTypeChange('matricule')}
            >
              <Text style={[
                styles.searchTypeButtonText,
                { color: searchType === 'matricule' ? '#FFFFFF' : theme.colors.textPrimary }
              ]}>
                Matricule
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.searchTypeButton,
                { 
                  backgroundColor: searchType === 'cmu' ? theme.colors.primary : theme.colors.background,
                  borderColor: theme.colors.border
                }
              ]}
              onPress={() => handleSearchTypeChange('cmu')}
            >
              <Text style={[
                styles.searchTypeButtonText,
                { color: searchType === 'cmu' ? '#FFFFFF' : theme.colors.textPrimary }
              ]}>
                CMU
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Champ de saisie */}
        <View style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {searchType === 'matricule' ? 'Numéro de matricule' : 'Code CMU'}
          </Text>
          
          <View style={[styles.inputWrapper, { borderColor: theme.colors.border }]}>
            <Ionicons 
              name={searchType === 'matricule' ? 'card-outline' : 'medical-outline'} 
              size={20} 
              color={theme.colors.textSecondary} 
            />
            <TextInput
              style={[styles.textInput, { color: theme.colors.textPrimary }]}
              placeholder={`Saisissez le ${searchType === 'matricule' ? 'matricule' : 'code CMU'}`}
              placeholderTextColor={theme.colors.textSecondary}
              value={searchValue}
              onChangeText={setSearchValue}
              keyboardType="default"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Bouton de recherche */}
        <TouchableOpacity
          style={[
            styles.searchButton,
            { backgroundColor: theme.colors.primary },
            loading && styles.searchButtonDisabled
          ]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#FFFFFF" />
              <Text style={styles.searchButtonText}>Vérifier l'éligibilité</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Résultats */}
        {result && (
          <View style={[
            styles.resultContainer,
            { 
              backgroundColor: theme.colors.surface,
              borderColor: result.isEligible ? '#3d8f9d' : '#DC3545',
              borderWidth: 2
            }
          ]}>
            <View style={styles.resultHeader}>
              <Ionicons 
                name={result.isEligible ? 'checkmark-circle' : 'close-circle'} 
                size={24} 
                color={result.isEligible ? '#3d8f9d' : '#DC3545'} 
              />
              <Text style={[
                styles.resultTitle,
                { color: result.isEligible ? '#3d8f9d' : '#DC3545' }
              ]}>
                {result.isEligible ? 'Éligible' : 'Non éligible'}
              </Text>
            </View>
            
            <Text style={[styles.resultMessage, { color: theme.colors.textSecondary }]}>
              {result.message}
            </Text>

            {result.beneficiaire && (
              <View style={styles.beneficiaireInfo}>
                <Text style={[styles.beneficiaireName, { color: theme.colors.textPrimary }]}>
                  {result.beneficiaire.nom} {result.beneficiaire.prenom}
                </Text>
                <Text style={[styles.beneficiaireDetails, { color: theme.colors.textSecondary }]}>
                  Matricule: {result.beneficiaire.matricule}
                </Text>
                <Text style={[styles.beneficiaireDetails, { color: theme.colors.textSecondary }]}>
                  Statut: {result.beneficiaire.statut}
                </Text>
              </View>
            )}
            
            {/* Bouton Servir Médicaments - affiché si éligible */}
            {result.isEligible && (
              <TouchableOpacity
                style={[
                  styles.serveButton, 
                  { backgroundColor: loadingPrescriptions ? theme.colors.border : theme.colors.primary },
                  loadingPrescriptions && styles.serveButtonDisabled
                ]}
                onPress={async () => {
                  if (loadingPrescriptions) return;
                  
                  try {
                    const prescriptions = await loadBeneficiairePrescriptions(result.beneficiaire);
                    
                    if (prescriptions.length === 0) {
                      showAlert('Information', 'Aucune prescription trouvée pour ce bénéficiaire', 'info');
                      return;
                    }

                    (navigation as any).navigate('ServeMedicaments', { 
                      beneficiaire: result.beneficiaire,
                      prescriptions: prescriptions,
                      searchType,
                      searchValue 
                    });
                  } catch (error) {
                    console.error('Erreur lors du chargement des prescriptions:', error);
                    showAlert('Erreur', 'Impossible de charger les prescriptions', 'error');
                  }
                }}
                disabled={loadingPrescriptions}
              >
                {loadingPrescriptions ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="medical" size={20} color="#FFFFFF" />
                )}
                <Text style={styles.serveButtonText}>
                  {loadingPrescriptions ? 'Chargement...' : 'Servir Médicaments'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
      
      <CustomModal {...modalState} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchTypeContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  searchTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  searchTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultMessage: {
    fontSize: 14,
    marginBottom: 12,
  },
  beneficiaireInfo: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  beneficiaireName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  beneficiaireDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  serveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  serveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  serveButtonDisabled: {
    opacity: 0.6,
  },
});

export default PrestataireMedicamentsScreen;