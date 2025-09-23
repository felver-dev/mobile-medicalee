import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  FlatList,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrestataireTheme } from '../../context/PrestataireThemeContext';
import { useAuth } from '../../context/AuthContext';

interface PrestataireReportsScreenProps {
  navigation: any;
}

interface Report {
  id: number;
  title: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period: string;
  dateGenerated: string;
  status: 'ready' | 'generating' | 'error';
  fileSize?: string;
  downloadCount: number;
}

const PrestataireReportsScreen: React.FC<PrestataireReportsScreenProps> = ({ navigation }) => {
  const { theme } = usePrestataireTheme();
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Données mockées pour les rapports
      const mockReports: Report[] = [
        {
          id: 1,
          title: 'Rapport mensuel - Janvier 2024',
          type: 'monthly',
          period: 'Janvier 2024',
          dateGenerated: '2024-02-01',
          status: 'ready',
          fileSize: '2.3 MB',
          downloadCount: 5
        },
        {
          id: 2,
          title: 'Rapport trimestriel - Q4 2023',
          type: 'quarterly',
          period: 'Q4 2023',
          dateGenerated: '2024-01-15',
          status: 'ready',
          fileSize: '5.7 MB',
          downloadCount: 12
        },
        {
          id: 3,
          title: 'Rapport annuel 2023',
          type: 'annual',
          period: '2023',
          dateGenerated: '2024-01-31',
          status: 'ready',
          fileSize: '12.1 MB',
          downloadCount: 8
        },
        {
          id: 4,
          title: 'Rapport personnalisé - Patients diabétiques',
          type: 'custom',
          period: 'Décembre 2023',
          dateGenerated: '2024-01-20',
          status: 'ready',
          fileSize: '1.8 MB',
          downloadCount: 3
        },
        {
          id: 5,
          title: 'Rapport mensuel - Décembre 2023',
          type: 'monthly',
          period: 'Décembre 2023',
          dateGenerated: '2024-01-05',
          status: 'ready',
          fileSize: '2.1 MB',
          downloadCount: 7
        },
        {
          id: 6,
          title: 'Rapport en cours de génération',
          type: 'monthly',
          period: 'Février 2024',
          dateGenerated: '',
          status: 'generating',
          downloadCount: 0
        }
      ];

      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReports(mockReports);
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'monthly':
        return 'calendar-outline';
      case 'quarterly':
        return 'calendar-number-outline';
      case 'annual':
        return 'calendar-outline';
      case 'custom':
        return 'document-text-outline';
      default:
        return 'document-outline';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'monthly':
        return theme.colors.primary;
      case 'quarterly':
        return '#FF9800';
      case 'annual':
        return '#2196F3';
      case 'custom':
        return '#9C27B0';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return theme.colors.primary;
      case 'generating':
        return '#FF9800';
      case 'error':
        return '#F44336';
      default:
        return theme.colors.textSecondary;
    }
  };

  const handleDownload = (report: Report) => {
    if (report.status === 'ready') {
      console.log('Téléchargement du rapport:', report.title);
      // Ici on pourrait implémenter la logique de téléchargement
    }
  };

  const handleGenerateReport = () => {
    console.log('Génération d\'un nouveau rapport');
    // Ici on pourrait implémenter la logique de génération
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity 
      style={[styles.reportCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
      activeOpacity={0.7}
      onPress={() => handleDownload(item)}
      disabled={item.status !== 'ready'}
    >
      <View style={styles.reportHeader}>
        <View style={[styles.reportIcon, { backgroundColor: getTypeColor(item.type) + '15' }]}>
          <Ionicons name={getTypeIcon(item.type) as any} size={24} color={getTypeColor(item.type)} />
        </View>
        <View style={styles.reportInfo}>
          <Text style={[styles.reportTitle, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.reportPeriod, { color: theme.colors.textSecondary }]}>
            Période: {item.period}
          </Text>
          {item.dateGenerated && (
            <Text style={[styles.reportDate, { color: theme.colors.textSecondary }]}>
              Généré le: {formatDate(item.dateGenerated)}
            </Text>
          )}
        </View>
        <View style={styles.reportActions}>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'ready' ? 'Prêt' : 
               item.status === 'generating' ? 'En cours' : 'Erreur'}
            </Text>
          </View>
          {item.status === 'ready' && (
            <TouchableOpacity 
              style={[styles.downloadButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => handleDownload(item)}
            >
              <Ionicons name="download-outline" size={16} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {item.status === 'ready' && (
        <View style={styles.reportDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="document-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              Taille: {item.fileSize}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="download-outline" size={14} color={theme.colors.textSecondary} />
            <Text style={[styles.detailText, { color: theme.colors.textSecondary }]}>
              {item.downloadCount} téléchargement{item.downloadCount > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      )}
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
            style={[styles.menuButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.openDrawer?.()}
          >
            <Ionicons name="menu-outline" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rapports</Text>
          <TouchableOpacity 
            style={styles.generateButton}
            onPress={handleGenerateReport}
          >
            <Ionicons name="add-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {reports.length > 0 ? (
          <FlatList
            data={reports}
            renderItem={renderReportItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.reportsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              Aucun rapport disponible
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
              Vos rapports apparaîtront ici
            </Text>
            <TouchableOpacity 
              style={[styles.generateButtonLarge, { backgroundColor: theme.colors.primary }]}
              onPress={handleGenerateReport}
            >
              <Ionicons name="add-outline" size={20} color="white" />
              <Text style={styles.generateButtonText}>Générer un rapport</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  generateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  reportsList: {
    padding: 20,
    gap: 16,
  },
  reportCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reportPeriod: {
    fontSize: 12,
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 12,
  },
  reportActions: {
    alignItems: 'flex-end',
    gap: 8,
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
  downloadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 30,
  },
  generateButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrestataireReportsScreen;
