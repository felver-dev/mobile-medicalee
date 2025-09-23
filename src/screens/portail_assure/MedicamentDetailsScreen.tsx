import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';
import { Medicament } from '../../types';

interface MedicamentDetailsScreenProps {
  navigation?: any;
  route?: {
    params: {
      medicament: Medicament;
    };
  };
}

const MedicamentDetailsScreen: React.FC<MedicamentDetailsScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const medicament = route?.params?.medicament;

  if (!medicament) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Aucun médicament sélectionné
        </Text>
      </SafeAreaView>
    );
  }

  const headerTopPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0) + 20;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ExpoStatusBar style="light" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: headerTopPadding }]}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation?.goBack()}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Détails</Text>
          
          <View style={styles.placeholder} />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Informations principales */}
        <View style={styles.section}>
          <View style={[styles.mainCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.medicamentHeader}>
              <View style={[styles.medicamentIcon, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="medical" size={32} color={theme.colors.primary} />
              </View>
              <View style={styles.medicamentInfo}>
                <Text style={[styles.medicamentName, { color: theme.colors.textPrimary }]}>
                  {medicament.libelle}
                </Text>
                <Text style={[styles.medicamentForme, { color: theme.colors.textSecondary }]}>
                  {medicament.forme_galenique}
                </Text>
                <Text style={[styles.medicamentPrice, { color: theme.colors.primary }]}>
                  {medicament.prix_unitaire} FCFA
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Détails */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Informations détaillées
          </Text>
          
          <View style={[styles.detailsCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Nom commercial
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                {medicament.libelle}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Forme galénique
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                {medicament.forme_galenique}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Unité
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                {medicament.unite}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Prix unitaire
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.primary }]}>
                {medicament.prix_unitaire} FCFA
              </Text>
            </View>
            
            {medicament.classe_therapeutique && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                  Classe thérapeutique
                </Text>
                <Text style={[styles.detailValue, { color: theme.colors.textPrimary }]}>
                  {medicament.classe_therapeutique}
                </Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Statut
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: theme.colors.success }]}>
                <Text style={styles.statusText}>{medicament.statut}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
  backButton: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  mainCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  medicamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  medicamentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  medicamentInfo: {
    flex: 1,
  },
  medicamentName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  medicamentForme: {
    fontSize: 14,
    marginBottom: 4,
  },
  medicamentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
});

export default MedicamentDetailsScreen;
