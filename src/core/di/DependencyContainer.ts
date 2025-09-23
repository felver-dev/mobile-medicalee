import { ApiService } from '../../services/ApiService';

export class DependencyContainer {
  private static instance: DependencyContainer;
  private apiService: ApiService;

  private constructor() {
    this.apiService = new ApiService();
  }

  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  public getFamilyRepositoryNew(): any {
    return {
      getFamilyMembers: async (matriculeAssure: number, user: any, index: number = 0, size: number = 20) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          matricule_assure: matriculeAssure.toString(),
          data: {},
          index: index,
          size: size,
        };
        const response = await this.apiService.getFamilyMembers(request);
        return response.items || [];
      },
      getFamilyConsultations: async (matriculeAssure: number, user: any, index: number = 0, size: number = 20) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {
            matricule_assure: matriculeAssure.toString(),
          },
          index: index,
          size: size,
        };
        const response = await this.apiService.getFamilyConsultations(request);
        return response.items || [];
      },
      getFamilyPrescriptions: async (matriculeAssure: number, user: any, index: number = 0, size: number = 20) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {
            matricule_assure: matriculeAssure.toString(),
          },
          index: index,
          size: size,
        };
        const response = await this.apiService.getFamilyPrescriptions(request);
        return response.items || [];
      },
      getFamilyPrimes: async (matriculeAssure: number, user: any, index: number = 0, size: number = 20) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {
            matricule_assure: matriculeAssure.toString(),
          },
          index: index,
          size: size,
        };
        const response = await this.apiService.getFamilyPrimes(request);
        return response.items || [];
      },
    };
  }

  public getMedicalRepositoryNew(): any {
    return {
      getMedicaments: async (index: number = 0, size: number = 20, user?: any, searchKey?: string) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          order_by: "libelle",
          search_key: searchKey || "",
          data: {},
          index: index,
          size: size
        };
        const response = await this.apiService.getMedicaments(request);
        return {
          items: response.items || [],
          total: response.count || 0
        };
      },
      getMedicamentDetails: (medicamentId: string) => 
        this.apiService.getMedicamentDetails(medicamentId),
    };
  }

  public getExpensesRepositoryNew(): any {
    return {
      getExpenses: async (matriculeAssure: number, user: any, index: number = 0, size: number = 20) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          index,
          size,
          data: {
            matricule_assure: matriculeAssure.toString(),
          },
        };
        const response = await this.apiService.getExpenses(request);
        const items = response?.item?.items || response?.items || [];
        const totals = response?.item?.totals_list || response?.totals_list || [];
        return { items, totals_list: totals };
      },
    };
  }

  public getPrestataireRepositoryNew(): any {
    return {
      checkBeneficiaryEligibility: (payload: any) => 
        this.apiService.checkBeneficiaryEligibility(payload),
      serveMedicaments: (data: any) => 
        this.apiService.serveMedicaments(data),
      getKpiPrestataire: async (prestataireId: number, user: any) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {
            date_debut: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            date_fin: new Date().toISOString()
          },
          index: 0,
          size: 100000,
          prestataire_id: prestataireId,
          prestataire_libelle: user.prestataire_libelle || ''
        };
        const response = await this.apiService.getKpiPrestataire(request);
        const rawKpiData = response.items || [];
        return rawKpiData.map((item: any, index: number) => ({
          id: index + 1,
          libelle: item.title || 'N/A',
          valeur: item.part_assurance || item.count || 0,
          unite: 'XOF',
          couleur: '#3d8f9d',
          icone: item.icon || 'analytics-outline'
        }));
      },
      getBasicSummaryPrestataire: async (prestataireId: number, user: any) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {
            date_debut: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
            date_fin: new Date().toISOString()
          },
          index: 0,
          size: 100000,
          prestataire_id: prestataireId,
          prestataire_libelle: user.prestataire_libelle || ''
        };
        const response = await this.apiService.getBasicSummaryPrestataire(request);
        const rawData = response.items || [];
        return {
          total_prestations: rawData.reduce((total: number, item: any) => total + (item.count || 0), 0),
          total_montant: rawData.reduce((total: number, item: any) => total + (item.part_assurance || 0), 0),
          nombre_patients: 0,
          taux_satisfaction: 85
        };
      },
    };
  }

  public getPrestationsRepositoryNew(): any {
    return {
      getPrestations: async (prestataireId: number, user: any) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {
            prestataire_id: prestataireId
          },
          index: 0,
          size: 100
        };
        const response = await this.apiService.getPrestations(request);
        return response.items || [];
      },
    };
  }

  // Repository pour les patients
  public getPatientsRepository(): any {
    return {
      getPatients: async (prestataireId: number, user: any) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {
            prestataire_id: prestataireId
          },
          index: 0,
          size: 100
        };
        const response = await this.apiService.getPatients(request);
        return response.items || [];
      },
    };
  }

  // Repository pour les rapports
  public getReportsRepository(): any {
    return {
      getReports: async (prestataireId: number, user: any) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {
            prestataire_id: prestataireId
          },
          index: 0,
          size: 100
        };
        const response = await this.apiService.getReports(request);
        return response.items || [];
      },
    };
  }

  // Repository pour le réseau de soins (pharmacies de garde)
  public getCareNetworkRepository(): any {
    return {
      getPharmacyGuard: async (user: any, index: number = 0, size: number = 20, startDate?: Date, endDate?: Date) => {
        // D'abord, essayons une requête simple sans filtres de dates
        const simpleRequest = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {},
          index: index,
          size: size
        };
        
        console.log('🔍 Requête simple pharmacies de garde:', JSON.stringify(simpleRequest, null, 2));
        
        try {
          const response = await this.apiService.getPharmacyGuard(simpleRequest);
          console.log('📥 Réponse API pharmacies de garde (simple):', response);
          console.log('📥 Items dans la réponse:', response?.items);
          console.log('📥 Nombre d\'items:', response?.items?.length || 0);
          console.log('📥 Structure complète de la réponse:', JSON.stringify(response, null, 2));
          
          // Si on a des données avec la requête simple, on les retourne
          if (response?.items && response.items.length > 0) {
            return response.items;
          }
          
          // Sinon, essayons avec les filtres de dates
          console.log('🔄 Aucune donnée avec requête simple, essayons avec filtres de dates...');
          
          const filterStartDate = startDate || new Date('2025-01-01T00:00:00.000Z');
          const filterEndDate = endDate || new Date('2025-12-31T23:59:59.000Z');
          
          const requestWithFilters = {
            user_id: user.id,
            filiale_id: user.filiale_id,
            filter_inf: {
              key: "date_debut",
              value: filterStartDate.toISOString()
            },
            filter_sup: {
              key: "date_fin", 
              value: filterEndDate.toISOString()
            },
            data: {},
            index: index,
            size: size
          };
          
          console.log('🔍 Requête avec filtres pharmacies de garde:', JSON.stringify(requestWithFilters, null, 2));
          
          const responseWithFilters = await this.apiService.getPharmacyGuard(requestWithFilters);
          console.log('📥 Réponse API pharmacies de garde (avec filtres):', responseWithFilters);
          console.log('📥 Items dans la réponse:', responseWithFilters?.items);
          console.log('📥 Nombre d\'items:', responseWithFilters?.items?.length || 0);
          
          return responseWithFilters.items || [];
          
        } catch (error: any) {
          console.error('❌ Erreur API pharmacies de garde:', error);
          console.error('❌ Détails de l\'erreur:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          throw error;
        }
      },
      getCareNetwork: async (user: any) => {
        const request = {
          user_id: user.id,
          filiale_id: user.filiale_id,
          data: {
            matricule_assure: user.beneficiaire_matricule
          },
          index: 0,
          size: 1000
        };
        
        console.log('🔍 Requête réseau de soins:', JSON.stringify(request, null, 2));
        
        try {
          const response = await this.apiService.getCareNetwork(request);
          console.log('📥 Réponse API réseau de soins:', response);
          console.log('📥 Items dans la réponse:', response?.items);
          console.log('📥 Nombre d\'items:', response?.items?.length || 0);
          console.log('📥 Structure complète de la réponse:', JSON.stringify(response, null, 2));
          
          // Vérifier si la réponse a une erreur
          if (response && response.hasError) {
            console.error('❌ API retourne une erreur:', response.status?.message);
            throw new Error(response.status?.message || 'Erreur API');
          }
          
          // Retourner les items ou un tableau vide
          const items = response?.items || response?.data || [];
          console.log('📤 Items retournés:', items.length);
          return items;
          
        } catch (error: any) {
          console.error('❌ Erreur API réseau de soins:', error);
          console.error('❌ Détails de l\'erreur:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          
          // Retourner un tableau vide en cas d'erreur
          return [];
        }
      },
    };
  }

  // Service API direct
  public getApiService(): ApiService {
    return this.apiService;
  }

  // DataSource API pour les appels directs
  public getApiDataSource(): any {
    return {
      searchBeneficiaire: async (payload: any) => {
        return await this.apiService.searchBeneficiaire(payload);
      },
      getBeneficiairePrescriptions: async (payload: any) => {
        return await this.apiService.getBeneficiairePrescriptions(payload);
      }
    };
  }
}