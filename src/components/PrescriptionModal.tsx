import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface PrescriptionModalProps {
  visible: boolean;
  onClose: () => void;
  prescription: any;
  type: 'view' | 'buy';
  onConfirm?: () => void;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  visible,
  onClose,
  prescription,
  type,
  onConfirm,
}) => {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Date non disponible';
    }
  };

  if (!prescription) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            {type === 'view' ? 'Détails de l\'ordonnance' : 'Achat de médicaments'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* En-tête de l'ordonnance */}
          <View style={styles.prescriptionHeader}>
            <View style={[styles.prescriptionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
              <Ionicons name="receipt-outline" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.prescriptionTitleContainer}>
              <Text style={[styles.prescriptionTitle, { color: theme.colors.textPrimary }]}>
                Ordonnance #{prescription.id}
              </Text>
              <Text style={[styles.prescriptionDate, { color: theme.colors.textSecondary }]}>
                {formatDate(prescription.date_prescription)}
              </Text>
            </View>
          </View>

          {/* Informations du patient */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Patient
            </Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {prescription.beneficiaire_prenom} {prescription.beneficiaire_nom}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="card-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                Matricule: {prescription.matricule}
              </Text>
            </View>
          </View>

          {/* Informations du prestataire */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Prestataire
            </Text>
            <View style={styles.infoRow}>
              <Ionicons name="medical-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {prescription.prestataire_libelle}
              </Text>
            </View>
          </View>

          {/* Informations des médicaments */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Médicaments
            </Text>
            <View style={styles.infoRow}>
              <Ionicons name="medical-outline" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                {prescription.nombre_medicaments} médicament(s) prescrit(s)
              </Text>
            </View>
          </View>

          {/* Message spécial pour l'achat */}
          {type === 'buy' && (
            <View style={[styles.buyMessage, { backgroundColor: theme.colors.warning + '20', borderColor: theme.colors.warning }]}>
              <Ionicons name="information-circle-outline" size={20} color={theme.colors.warning} />
              <Text style={[styles.buyMessageText, { color: theme.colors.warning }]}>
                Voulez-vous acheter les médicaments de cette ordonnance ?
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Boutons d'action */}
        <View style={[styles.actions, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
          {type === 'view' ? (
            <TouchableOpacity 
              style={[styles.button, styles.okButton, { backgroundColor: theme.colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.okButtonText}>OK</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton, { backgroundColor: theme.colors.surfaceSecondary, borderColor: theme.colors.border }]}
                onPress={onClose}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  onConfirm?.();
                  onClose();
                }}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  prescriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  prescriptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  prescriptionTitleContainer: {
    flex: 1,
  },
  prescriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  prescriptionDate: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  buyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 20,
  },
  buyMessageText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  okButton: {
    backgroundColor: '#3d8f9d',
    borderColor: '#3d8f9d',
  },
  okButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#3d8f9d',
    borderColor: '#3d8f9d',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default PrescriptionModal;
