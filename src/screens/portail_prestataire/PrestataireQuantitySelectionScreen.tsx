import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';
import CustomModal, { useModal } from '../../components/CustomModal';

interface PrescriptionActe {
  id: number;
  medicament_libelle: string;
  quantite: number;
  posologie: string;
  prix_systeme: number;
  forme_medicament_libelle: string;
  duree: number;
  ordonnance_code: string;
  created_at: string;
  is_factured: number;
  is_entente_prealable: number;
  is_exclu: number;
}

interface Beneficiaire {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  statut: string;
  taux_applicable?: number;
}

interface BaremeControlResponse {
  montant_depassement: number;
  part_assurance: number;
  part_patient: number;
  message?: string;
}

interface MedicamentWithDepassement extends PrescriptionActe {
  part_patient_net: number;
  part_assurance_net: number;
  quantite_vendue: number;
  quantite_prescripte: number;
  prix_unitaire_vente: number;
  prix_unitaire: number;
  prix_unitaire_systeme: number;
  is_factured: number;
  depassement: number;
  part_patient: number;
  part_assurance: number;
}

interface RouteParams {
  selectedPrescriptions: number[];
  prescriptions: PrescriptionActe[];
  beneficiaire: Beneficiaire;
}

const PrestataireQuantitySelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = usePrestataireTheme();
  const { user } = useAuth();
  const modalState = useModal();

  const { selectedPrescriptions, prescriptions, beneficiaire } = route.params as RouteParams;

  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [prices, setPrices] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(false);
  const [serving, setServing] = useState(false);
  const [priceErrors, setPriceErrors] = useState<{ [key: number]: boolean }>({});
  const [baremeControl, setBaremeControl] = useState<BaremeControlResponse | null>(null);
  const [isAlertModalVisible, setIsAlertModalVisible] = useState(false);
  const [medicamentsWithDepassement, setMedicamentsWithDepassement] = useState<MedicamentWithDepassement[]>([]);

  // Filtrer les prescriptions sélectionnées
  const selectedPrescriptionData = prescriptions.filter(p => selectedPrescriptions.includes(p.id));

  useEffect(() => {
    // Initialiser les quantités avec les quantités prescrites
    const initialQuantities: { [key: number]: number } = {};
    const initialPrices: { [key: number]: number } = {};
    selectedPrescriptionData.forEach(prescription => {
      initialQuantities[prescription.id] = prescription.quantite;
      initialPrices[prescription.id] = 0; // Champ vide au lieu du prix système
    });
    setQuantities(initialQuantities);
    setPrices(initialPrices);
  }, [selectedPrescriptions]);

  const updatePrice = (prescriptionId: number, price: number) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (prescription && price >= 0) {
      const maxPrice = prescription.prix_systeme * 1.1; // Prix système + 10%
      const hasError = price > maxPrice;
      
      setPrices(prev => ({
        ...prev,
        [prescriptionId]: price
      }));
      
      setPriceErrors(prev => ({
        ...prev,
        [prescriptionId]: hasError
      }));
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPriceForInput = (price: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const updateQuantity = (prescriptionId: number, quantity: number) => {
    const prescription = prescriptions.find(p => p.id === prescriptionId);
    if (prescription && quantity >= 0 && quantity <= prescription.quantite) {
      setQuantities(prev => ({
        ...prev,
        [prescriptionId]: quantity
      }));
    }
  };

  // Fonction pour calculer les totaux
  const calculateTotals = () => {
    // Utiliser les médicaments avec dépassement si disponibles, sinon calculer normalement
    if (medicamentsWithDepassement.length > 0) {
      const totals = medicamentsWithDepassement.reduce(
        (acc, medicament) => {
          acc.totalPrestataire += medicament.quantite_vendue * medicament.prix_unitaire_vente;
          acc.totalAssurance += medicament.part_assurance;
          acc.totalTicketModerateur += medicament.part_patient;
          return acc;
        },
        { totalPrestataire: 0, totalAssurance: 0, totalTicketModerateur: 0 }
      );
      return totals;
    }

    // Calcul normal si pas de dépassement
    let totalPrestataire = 0;
    let totalAssurance = 0;
    let totalTicketModerateur = 0;
    const tauxApplicable = beneficiaire.taux_applicable || 90;

    selectedPrescriptionData.forEach(item => {
      const currentQuantity = quantities[item.id] || 0;
      const currentPrice = prices[item.id] || 0;
      
      if (currentQuantity > 0 && currentPrice > 0) {
        const totalItem = currentPrice * currentQuantity;
        totalPrestataire += totalItem;
        totalAssurance += totalItem * (tauxApplicable / 100);
        totalTicketModerateur += totalItem * ((100 - tauxApplicable) / 100);
      }
    });

    return {
      totalPrestataire,
      totalAssurance,
      totalTicketModerateur,
      tauxApplicable
    };
  };

  const totals = calculateTotals();

  const checkBaremeControl = async () => {
    try {
      const totals = calculateTotals();
      
      const requestData = {
        index: 0,
        size: 1000,
        data: {
          part_assurance: Math.round(totals.totalAssurance),
          part_patient: Math.round(totals.totalTicketModerateur),
          matricule: beneficiaire.matricule
        },
        filiale_id: user?.filiale_id || 1,
        user_id: user?.id || 49,
        prestataire_id: user?.prestataire_id || 5
      };

      const response = await fetch('https://api.medicalee.net/api/bareme/deepSeekPharmacie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      
      if (data && data.montant_depassement > 0) {
        setBaremeControl(data);
        // Appliquer la logique de répartition proportionnelle
        applyDepassementLogic(data.montant_depassement);
        setIsAlertModalVisible(true);
        return false; // Il y a un dépassement
      }
      
      // Si pas de dépassement, réinitialiser les médicaments avec dépassement
      setMedicamentsWithDepassement([]);
      return true; // Pas de dépassement
    } catch (error) {
      console.error('Erreur lors du contrôle barème:', error);
      return true; // En cas d'erreur, on continue
    }
  };

  // Fonction pour appliquer la répartition proportionnelle du dépassement
  const applyDepassementLogic = (montantDepassement: number) => {
    const medicaments = selectedPrescriptionData.map(prescription => {
      const currentQuantity = quantities[prescription.id] || 0;
      const currentPrice = prices[prescription.id] || prescription.prix_systeme;
      const tauxApplicable = beneficiaire.taux_applicable || 0;
      
      // Calculs initiaux
      const prixTotal = currentQuantity * currentPrice;
      const partAssuranceInitiale = Math.round(prixTotal * (tauxApplicable / 100));
      const partPatientInitiale = Math.round(prixTotal - partAssuranceInitiale);
      
      // Ratio de dépassement par médicament
      const ratioDepassement = montantDepassement / selectedPrescriptionData.length;
      
      return {
        ...prescription,
        part_patient_net: partPatientInitiale,
        part_assurance_net: partAssuranceInitiale,
        quantite_vendue: currentQuantity,
        quantite_prescripte: prescription.quantite,
        prix_unitaire_vente: currentPrice,
        prix_unitaire: currentPrice,
        prix_unitaire_systeme: prescription.prix_systeme,
        is_factured: 0,
        depassement: ratioDepassement,
        part_patient: partPatientInitiale,
        part_assurance: partAssuranceInitiale,
      } as MedicamentWithDepassement;
    });

    // Appliquer la répartition proportionnelle si dépassement > 0
    if (montantDepassement > 0) {
      // Calculer le total de l'assurance disponible
      const totalAssurance = medicaments.reduce(
        (sum, medicament) => sum + (medicament.part_assurance || 0),
        0
      );

      if (totalAssurance > 0) {
        medicaments.forEach(medicament => {
          const availableAssurance = medicament.part_assurance || 0;
          
          // Répartition proportionnelle
          const ratio = availableAssurance / totalAssurance;
          let depassementForItem = montantDepassement * ratio;
          
          // Ne jamais rendre part_assurance négative
          if (depassementForItem > availableAssurance) {
            depassementForItem = availableAssurance;
          }
          
          medicament.part_patient = Math.round((medicament.part_patient || 0) + depassementForItem);
          medicament.part_assurance = Math.round(availableAssurance - depassementForItem);
        });
      }
    }

    setMedicamentsWithDepassement(medicaments);
    return medicaments;
  };

  // Fonction pour préparer les données pour l'API de création de prestation
  const preparePrestationData = () => {
    const medicamentsToUse = medicamentsWithDepassement.length > 0 
      ? medicamentsWithDepassement 
      : selectedPrescriptionData.map(p => ({
          ...p,
          quantite_vendue: quantities[p.id] || 0,
          prix_unitaire_vente: prices[p.id] || p.prix_systeme,
          part_patient: Math.round((quantities[p.id] || 0) * (prices[p.id] || p.prix_systeme) * (1 - (beneficiaire.taux_applicable || 90) / 100)),
          part_assurance: Math.round((quantities[p.id] || 0) * (prices[p.id] || p.prix_systeme) * ((beneficiaire.taux_applicable || 90) / 100)),
          part_patient_net: Math.round((quantities[p.id] || 0) * (prices[p.id] || p.prix_systeme) * (1 - (beneficiaire.taux_applicable || 90) / 100)),
          part_assurance_net: Math.round((quantities[p.id] || 0) * (prices[p.id] || p.prix_systeme) * ((beneficiaire.taux_applicable || 90) / 100)),
          quantite_prescripte: p.quantite,
          prix_unitaire_systeme: p.prix_systeme,
          depassement: 0
        }));

    // Calculer les totaux
    const totals = medicamentsToUse.reduce(
      (acc, medicament) => {
        acc.montant += medicament.quantite_vendue * medicament.prix_unitaire_vente;
        acc.part_patient += medicament.part_patient;
        acc.part_assurance += medicament.part_assurance;
        return acc;
      },
      { montant: 0, part_patient: 0, part_assurance: 0 }
    );

    // Préparer les données pour chaque médicament
    const datas = medicamentsToUse.map(medicament => ({
      filiale_id: user?.filiale_id || 1,
      prestataire_id: user?.prestataire_id || 5,
      beneficiaire_id: beneficiaire.id,
      beneficiaire_matricule: beneficiaire.matricule,
      medicament_id: medicament.id,
      bareme_id: null,
      garantie_id: 60,
      garantie_libelle: "PHARMACIE",
      college_id: 33,
      college_libelle: "COLLEGE CADRES",
      police_id: 58,
      police_libelle: "POLICE MEDICALEE",
      ordonnance_id: null,
      ordonnance_libelle: null,
      ordonnance_code: medicament.ordonnance_code || null,
      ordonnance_codification: medicament.ordonnance_code || null,
      ordonnance_prestataire_id: "5",
      ordonnance_prestataire_libelle: "CLINIQUE LA PROVIDENCE",
      garant_id: 20,
      garant_libelle: "GARANT MEDICALEE",
      affection_libelle: "AFFECTION INDEFINIE",
      prestation_acte_id: medicament.id,
      prestation_acte_libelle: medicament.medicament_libelle,
      dossier_id: null,
      acte_id: null,
      commande_medicament_id: null,
      commande_medicament_detail_id: null,
      code: null,
      codification: `PRESCRIP-${Date.now()}`,
      date_prescription: medicament.created_at || null,
      numero_bon: null,
      longitude: -3.997696,
      latitude: 5.3510144,
      numero_bon_principal: null,
      libelle: medicament.medicament_libelle,
      is_commanded: null,
      matricule: beneficiaire.matricule,
      matricule_assure: null,
      medicament_libelle: medicament.medicament_libelle,
      forme_medicament_libelle: medicament.forme_medicament_libelle || "COMPRIMÉ",
      posologie: medicament.posologie || "pos 1",
      duree: medicament.duree || 1,
      is_entente_prealable: medicament.is_entente_prealable || 0,
      is_exclu: medicament.is_exclu || 0,
      is_renewable: 0,
      quantite_renew: 0,
      is_consultation_required_renew: 0,
      mode_prescription: "produit",
      quantite: medicament.quantite_prescripte,
      prix_unitaire: medicament.prix_unitaire_vente,
      depassement: medicament.depassement || 0,
      montant: medicament.quantite_vendue * medicament.prix_unitaire_vente,
      part_patient: medicament.part_patient,
      part_assurance: medicament.part_assurance,
      is_kine: 0,
      date_clotured: null,
      created_at: new Date().toISOString(),
      updated_at: null,
      deleted_at: null,
      is_notif: null,
      is_pending_validate: 0,
      is_deleted: 0,
      created_ip_address: "160.154.151.71",
      created_by: user?.id || 49,
      prix_systeme: medicament.prix_unitaire_systeme,
      is_added: true,
      quantite_pharmacie: medicament.quantite_vendue,
      prix_pharmacie: medicament.prix_unitaire_vente,
      prescription_pharmacie_id: medicament.id,
      part_patient_net: medicament.part_patient_net || medicament.part_patient,
      part_assurance_net: medicament.part_assurance_net || medicament.part_assurance,
      quantite_vendue: medicament.quantite_vendue,
      quantite_prescripte: medicament.quantite_prescripte,
      prix_unitaire_vente: medicament.prix_unitaire_vente,
      prix_unitaire_systeme: medicament.prix_unitaire_systeme
    }));

    return {
      montant: totals.montant,
      part_patient: totals.part_patient,
      part_assurance: totals.part_assurance,
      datas: datas,
      filiale_id: user?.filiale_id || 1,
      user_id: user?.id || 49,
      prestataire_id: user?.prestataire_id || 5
    };
  };

  // Fonction pour créer la prestation
  const createPrestation = async () => {
    try {
      const prestationData = preparePrestationData();
      
      console.log('Données de prestation à créer:', prestationData);
      
      const response = await fetch('https://api.medicalee.net/api/prestationActe/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prestationData),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Prestation créée avec succès:', data);
        return { success: true, data };
      } else {
        console.error('Erreur lors de la création de prestation:', data);
        return { success: false, error: data };
      }
    } catch (error) {
      console.error('Erreur lors de la création de prestation:', error);
      return { success: false, error: error };
    }
  };

  // Fonction pour réinitialiser les états après service
  const resetAfterService = () => {
    // Réinitialiser les quantités et prix
    setQuantities({});
    setPrices({});
    setPriceErrors({});
    
    // Réinitialiser les états de dépassement
    setBaremeControl(null);
    setMedicamentsWithDepassement([]);
    setIsAlertModalVisible(false);
    
    // Réinitialiser l'état de service
    setServing(false);
  };

  const handleServeMedications = async () => {
    try {
      setServing(true);
      
      // Vérifier qu'au moins une quantité est sélectionnée
      const hasQuantity = Object.values(quantities).some(qty => qty > 0);
      if (!hasQuantity) {
        modalState.show({
          title: 'Quantité requise',
          message: 'Veuillez sélectionner au moins une quantité pour servir les médicaments.',
          type: 'error'
        });
        return;
      }

      // Vérifier que tous les prix sont dans les limites autorisées
      const invalidPrices = selectedPrescriptionData.filter(prescription => {
        const enteredPrice = prices[prescription.id] || 0;
        const maxPrice = prescription.prix_systeme * 1.1;
        return enteredPrice > maxPrice;
      });

      if (invalidPrices.length > 0) {
        const maxPrice = invalidPrices[0].prix_systeme * 1.1;
        modalState.show({
          title: 'Prix invalide',
          message: `Le prix saisi dépasse la limite autorisée. Prix maximum: ${maxPrice.toLocaleString()} FCFA (prix système + 10%).`,
          type: 'error'
        });
        return;
      }

      // Vérifier le contrôle barème avant de continuer
      const canProceed = await checkBaremeControl();
      
      if (!canProceed) {
        return; // Le modal d'alerte est affiché
      }
      
      // Créer la prestation via l'API
      const result = await createPrestation();
      
      if (!result.success) {
        modalState.show({
          title: 'Erreur',
          message: 'Erreur lors de la création de la prestation. Veuillez réessayer.',
          type: 'error'
        });
        return;
      }
      
      modalState.show({
        title: 'Succès',
        message: 'Les médicaments ont été servis avec succès. Voulez-vous faire une nouvelle sélection ?',
        type: 'success',
        showCancel: true,
        confirmText: 'Nouvelle sélection',
        cancelText: 'Retour',
        onConfirm: () => {
          resetAfterService();
          // Reste sur l'écran pour nouvelle sélection
        },
        onCancel: () => {
          resetAfterService();
          navigation.goBack();
        }
      });

    } catch (error) {
      console.error('Erreur lors du service des médicaments:', error);
      modalState.show({
        title: 'Erreur',
        message: 'Une erreur est survenue lors du service des médicaments.',
        type: 'error'
      });
    } finally {
      setServing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* En-tête */}
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: "#FFFFFF" }]}>
            Quantités à servir
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Section récapitulatif élégante */}
        {totals.totalPrestataire > 0 && (
          <View style={[styles.elegantTotalsSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.elegantTotalsContent}>
              <View style={styles.elegantTotalItem}>
                <View style={[styles.elegantTotalIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="wallet-outline" size={16} color="#FFFFFF" />
                </View>
                <Text style={[styles.elegantTotalLabel, { color: theme.colors.textPrimary }]}>
                  Total
                </Text>
                <Text style={[styles.elegantTotalValue, { color: theme.colors.primary }]}>
                  {formatPrice(totals.totalPrestataire)}
                </Text>
              </View>
              
              <View style={styles.elegantTotalItem}>
                <View style={[styles.elegantTotalIcon, { backgroundColor: '#3d8f9d' }]}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
                </View>
                <Text style={[styles.elegantTotalLabel, { color: theme.colors.textPrimary }]}>
                  Assurance
                </Text>
                <Text style={[styles.elegantTotalValue, { color: '#3d8f9d' }]}>
                  {formatPrice(totals.totalAssurance)}
                </Text>
              </View>
              
              <View style={styles.elegantTotalItem}>
                <View style={[styles.elegantTotalIcon, { backgroundColor: '#FF9500' }]}>
                  <Ionicons name="person-outline" size={16} color="#FFFFFF" />
                </View>
                <Text style={[styles.elegantTotalLabel, { color: theme.colors.textPrimary }]}>
                  Ticket
                </Text>
                <Text style={[styles.elegantTotalValue, { color: '#FF9500' }]}>
                  {formatPrice(totals.totalTicketModerateur)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Liste des médicaments sélectionnés */}
        <FlatList
          data={selectedPrescriptionData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const currentQuantity = quantities[item.id] || 0;
            const maxQuantity = item.quantite;

            return (
              <View style={[styles.premiumCard, { 
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border 
              }]}>
                {/* Header premium avec icône */}
                <View style={styles.premiumHeader}>
                  <View style={[styles.medicamentIcon, { backgroundColor: theme.colors.primaryLight || '#F0F8FF' }]}>
                    <Ionicons name="medical" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.medicamentDetails}>
                    <Text style={[styles.premiumTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                      {item.medicament_libelle}
                    </Text>
                    <Text style={[styles.premiumSubtitle, { color: theme.colors.textSecondary }]}>
                      {item.forme_medicament_libelle || 'Forme non spécifiée'}
                    </Text>
                  </View>
                  <View style={[styles.premiumBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={[styles.badgeNumber, { color: '#FFFFFF' }]}>
                      {maxQuantity}
                    </Text>
                    <Text style={[styles.badgeLabel, { color: '#FFFFFF' }]}>
                      unités
                    </Text>
                  </View>
                </View>

                {/* Section info système avec design sophistiqué */}
                <View style={[styles.systemInfoCard, { backgroundColor: theme.colors.surface || '#F8F9FA' }]}>
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Ionicons name="cash-outline" size={16} color="#1C1C1E" />
                      <Text style={[styles.infoText, { color: '#1C1C1E', fontWeight: '600' }]}>
                        Prix système
                      </Text>
                      <Text style={[styles.infoValue, { color: '#1C1C1E', fontWeight: '800' }]}>
                        {formatPrice(item.prix_systeme)}
                      </Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons name="time-outline" size={16} color="#1C1C1E" />
                      <Text style={[styles.infoText, { color: '#1C1C1E', fontWeight: '600' }]}>
                        Posologie
                      </Text>
                      <Text style={[styles.infoValue, { color: '#1C1C1E', fontWeight: '800' }]}>
                        {item.posologie}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Prix prestataire avec design premium */}
                {prices[item.id] > 0 && (
                  <View style={[styles.premiumPriceCard, { 
                    backgroundColor: theme.colors.surface || '#F0F8FF',
                    borderLeftColor: theme.colors.primary
                  }]}>
                    <View style={styles.priceHeader}>
                      <Ionicons name="storefront-outline" size={20} color={theme.colors.primary} />
                      <Text style={[styles.priceCardTitle, { color: '#1C1C1E' }]}>
                        Votre tarification
                      </Text>
                    </View>
                    <View style={styles.priceDetails}>
                      <View style={styles.priceLine}>
                        <Text style={[styles.priceLabel, { color: '#1C1C1E', fontWeight: '600' }]}>
                          Prix unitaire
                        </Text>
                        <Text style={[styles.priceAmount, { color: theme.colors.primary }]}>
                          {formatPrice(prices[item.id])}
                        </Text>
                      </View>
                      <View style={styles.priceLine}>
                        <Text style={[styles.totalLabel, { color: '#1C1C1E', fontWeight: '600' }]}>
                          Total ({currentQuantity} × {formatPrice(prices[item.id])})
                        </Text>
                        <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
                          {formatPrice(prices[item.id] * currentQuantity)}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Contrôles premium */}
                <View style={styles.premiumControls}>
                  {/* Prix Input avec design sophistiqué */}
                  <View style={styles.controlSection}>
                    <View style={styles.controlHeader}>
                      <Text style={[styles.controlTitle, { color: theme.colors.textPrimary }]}>
                        Prix unitaire
                      </Text>
                      {priceErrors[item.id] && (
                        <View style={styles.errorIndicator}>
                          <Ionicons name="warning" size={14} color="#FF3B30" />
                          <Text style={[styles.errorText, { color: '#FF3B30' }]}>
                            Max: {formatPrice(item.prix_systeme * 1.1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.premiumInputContainer, { 
                      borderColor: priceErrors[item.id] ? '#FF3B30' : theme.colors.border,
                      backgroundColor: priceErrors[item.id] ? '#FFF5F5' : theme.colors.surface || '#FAFAFA'
                    }]}>
                      <Ionicons name="cash" size={18} color="#1C1C1E" />
                      <TextInput
                        style={[styles.premiumInput, { color: '#1C1C1E' }]}
                        value={prices[item.id] > 0 ? formatPriceForInput(prices[item.id]) : ''}
                        onChangeText={(text) => {
                          const cleanText = text.replace(/[^\d]/g, '');
                          const num = parseFloat(cleanText) || 0;
                          updatePrice(item.id, num);
                        }}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#8E8E93"
                      />
                      <Text style={[styles.currencyLabel, { color: '#1C1C1E', fontWeight: '600' }]}>
                        FCFA
                      </Text>
                    </View>
                  </View>

                  {/* Quantité Input avec design premium */}
                  <View style={styles.controlSection}>
                    <Text style={[styles.controlTitle, { color: theme.colors.textPrimary }]}>
                      Quantité à servir
                    </Text>
                    <View style={styles.premiumQuantityContainer}>
                      <TouchableOpacity
                        style={[styles.premiumQuantityButton, { 
                          backgroundColor: currentQuantity > 0 ? theme.colors.primary : '#F2F2F7',
                          shadowColor: currentQuantity > 0 ? theme.colors.primary : 'transparent',
                        }]}
                        onPress={() => updateQuantity(item.id, currentQuantity - 1)}
                        disabled={currentQuantity <= 0}
                      >
                        <Ionicons name="remove" size={16} color={currentQuantity > 0 ? "#FFFFFF" : theme.colors.textSecondary} />
                      </TouchableOpacity>
                      
                      <View style={[styles.premiumQuantityDisplay, { 
                        backgroundColor: currentQuantity > 0 ? theme.colors.primaryLight || '#F0F8FF' : theme.colors.surface || '#F8F9FA',
                        borderColor: currentQuantity > 0 ? theme.colors.primary : theme.colors.border
                      }]}>
                        <Text style={[styles.quantityDisplayText, { 
                          color: currentQuantity > 0 ? theme.colors.textPrimary : theme.colors.textPrimary,
                          fontWeight: '800'
                        }]}>
                          {currentQuantity}
                        </Text>
                      </View>
                      
                      <TouchableOpacity
                        style={[styles.premiumQuantityButton, { 
                          backgroundColor: currentQuantity < maxQuantity ? theme.colors.primary : '#F2F2F7',
                          shadowColor: currentQuantity < maxQuantity ? theme.colors.primary : 'transparent',
                        }]}
                        onPress={() => updateQuantity(item.id, currentQuantity + 1)}
                        disabled={currentQuantity >= maxQuantity}
                      >
                        <Ionicons name="add" size={16} color={currentQuantity < maxQuantity ? "#FFFFFF" : theme.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.maxQuantityInfo, { color: theme.colors.textSecondary }]}>
                      Maximum disponible: {maxQuantity} unités
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          keyboardShouldPersistTaps="handled"
        />

        {/* Bouton de confirmation flottant */}
        <TouchableOpacity
          style={[styles.floatingConfirmButton, { 
            backgroundColor: '#FF9500',
            opacity: serving ? 0.6 : (Object.values(priceErrors).some(error => error) ? 0.4 : 1)
          }]}
          onPress={handleServeMedications}
          disabled={serving || Object.values(priceErrors).some(error => error)}
        >
          {serving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>

      <CustomModal {...modalState} />

      {/* Modal d'alerte pour dépassement de montant */}
      <Modal
        visible={isAlertModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAlertModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.alertModalContainer, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.alertModalHeader}>
              <View style={[styles.alertIconContainer, { backgroundColor: theme.isDark ? '#2D1B00' : '#FFF5F5' }]}>
                <Ionicons name="warning" size={32} color="#FF9500" />
              </View>
              <Text style={[styles.alertModalTitle, { color: theme.colors.textPrimary }]}>
                ⚠️ Dépassement de montant
              </Text>
            </View>
            
            <View style={styles.alertModalContent}>
              <View style={[styles.alertMessage, { 
                backgroundColor: theme.isDark ? '#2D1B00' : '#FFF5F5',
                borderColor: theme.isDark ? '#4A2C00' : '#FFCDD2'
              }]}>
                <Text style={[styles.alertText, { color: theme.colors.textPrimary }]}>
                  (Dépassement de {baremeControl?.montant_depassement?.toLocaleString()} FCFA sur statut-garantie) 
                  {'\n'}⇒ Risque de dépassement de la limite du montant pour la période JOURNEE: 1 jours 
                  {'\n'}⇒ 0 + {baremeControl?.part_assurance?.toLocaleString()} {'>'} autorisé 20000
                  {'\n\n'}📊 Répartition proportionnelle appliquée entre {medicamentsWithDepassement.length} médicament(s)
                </Text>
              </View>
              
              <View style={styles.newAmountsSection}>
                <Text style={[styles.newAmountsTitle, { color: theme.colors.textPrimary }]}>
                  Nouveaux montants totaux:
                </Text>
                
                <View style={styles.amountRow}>
                  <Ionicons name="wallet-outline" size={20} color="#FF9500" />
                  <Text style={[styles.amountLabel, { color: theme.colors.textPrimary }]}>
                    Part patient:
                  </Text>
                  <Text style={[styles.amountValue, { color: '#FF3B30' }]}>
                    {baremeControl?.part_patient?.toLocaleString()} FCFA
                  </Text>
                </View>
                
                <View style={styles.amountRow}>
                  <Ionicons name="receipt-outline" size={20} color="#3d8f9d" />
                  <Text style={[styles.amountLabel, { color: theme.colors.textPrimary }]}>
                    Part assurance:
                  </Text>
                  <Text style={[styles.amountValue, { color: '#3d8f9d' }]}>
                    {baremeControl?.part_assurance?.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>

              {/* Détails par médicament */}
              {medicamentsWithDepassement.length > 0 && (
                <View style={styles.medicamentsDetailsSection}>
                  <Text style={[styles.medicamentsDetailsTitle, { color: theme.colors.textPrimary }]}>
                    Détails par médicament:
                  </Text>
                  {medicamentsWithDepassement.map((medicament, index) => (
                    <View key={medicament.id} style={[styles.medicamentDetailCard, { 
                      backgroundColor: theme.isDark ? theme.colors.background : '#F8F9FA',
                      borderColor: theme.isDark ? theme.colors.border : '#E9ECEF'
                    }]}>
                      <Text style={[styles.medicamentName, { color: theme.colors.textPrimary }]}>
                        {medicament.medicament_libelle}
                      </Text>
                      <View style={styles.medicamentAmounts}>
                        <View style={styles.medicamentAmountRow}>
                          <Text style={[styles.medicamentAmountLabel, { color: theme.colors.textSecondary }]}>
                            Patient: {medicament.part_patient?.toLocaleString()} FCFA
                          </Text>
                          <Text style={[styles.medicamentAmountLabel, { color: theme.colors.textSecondary }]}>
                            Assurance: {medicament.part_assurance?.toLocaleString()} FCFA
                          </Text>
                        </View>
                        <Text style={[styles.depassementInfo, { color: '#FF9500' }]}>
                          Dépassement: {medicament.depassement?.toFixed(0)} FCFA
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              
              <View style={styles.alertButtons}>
                <TouchableOpacity
                  style={[styles.continueButton, { backgroundColor: '#3d8f9d' }]}
                  onPress={async () => {
                    setIsAlertModalVisible(false);
                    setServing(true);
                    
                    try {
                      // Créer la prestation malgré le dépassement
                      const result = await createPrestation();
                      
                      if (result.success) {
                        modalState.show({
                          title: 'Succès',
                          message: 'Les médicaments ont été servis avec succès malgré le dépassement. Voulez-vous faire une nouvelle sélection ?',
                          type: 'success',
                          showCancel: true,
                          confirmText: 'Nouvelle sélection',
                          cancelText: 'Retour',
                          onConfirm: () => {
                            resetAfterService();
                            // Reste sur l'écran pour nouvelle sélection
                          },
                          onCancel: () => {
                            resetAfterService();
                            navigation.goBack();
                          }
                        });
                      } else {
                        modalState.show({
                          title: 'Erreur',
                          message: 'Erreur lors de la création de la prestation. Veuillez réessayer.',
                          type: 'error'
                        });
                      }
                    } catch (error) {
                      modalState.show({
                        title: 'Erreur',
                        message: 'Erreur lors de la création de la prestation. Veuillez réessayer.',
                        type: 'error'
                      });
                    } finally {
                      setServing(false);
                    }
                  }}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.continueButtonText}>Souhaitez-vous continuer ?</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 0,
  },
  premiumCard: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicamentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  medicamentDetails: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 16,
  },
  premiumSubtitle: {
    fontSize: 11,
    opacity: 0.7,
    fontWeight: '500',
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 40,
  },
  badgeNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgeLabel: {
    fontSize: 8,
    fontWeight: '500',
    opacity: 0.9,
  },
  systemInfoCard: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  premiumPriceCard: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  priceDetails: {
    gap: 6,
  },
  priceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '800',
  },
  totalLabel: {
    fontSize: 13,
    opacity: 0.8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
  },
  premiumControls: {
    gap: 8,
  },
  controlSection: {
    gap: 6,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  errorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  premiumInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  premiumInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  currencyLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  premiumQuantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  premiumQuantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumQuantityDisplay: {
    width: 80,
    height: 40,
    borderWidth: 2,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityDisplayText: {
    fontSize: 16,
    fontWeight: '800',
  },
  maxQuantityInfo: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
    fontWeight: '500',
  },
  elegantTotalsSection: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  elegantTotalsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  elegantTotalItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  elegantTotalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  elegantTotalLabel: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  elegantTotalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  floatingConfirmButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Styles pour le modal d'alerte
  alertModalContent: {
    padding: 20,
  },
  alertMessage: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  newAmountsSection: {
    marginBottom: 20,
  },
  newAmountsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  alertButtons: {
    gap: 12,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Styles pour le modal d'alerte personnalisé
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  alertIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Styles pour les détails des médicaments
  medicamentsDetailsSection: {
    marginTop: 16,
  },
  medicamentsDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  medicamentDetailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  medicamentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  medicamentAmounts: {
    gap: 4,
  },
  medicamentAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  medicamentAmountLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  depassementInfo: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PrestataireQuantitySelectionScreen;