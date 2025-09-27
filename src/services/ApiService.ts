import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError } from "./apiConfig";
import { CURRENT_ENV, logger } from "./environment";

export class ApiService {
  private api: AxiosInstance;
  private isDevelopment: boolean = CURRENT_ENV.isDevelopment;

  constructor() {
    this.api = axios.create({
      baseURL: CURRENT_ENV.apiBaseUrl,
      timeout: CURRENT_ENV.timeout,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    this.setupInterceptors();
    logger.info("ApiService initialisé", {
      baseURL: CURRENT_ENV.apiBaseUrl, 
      isDevelopment: this.isDevelopment,
    });
  }

  private setupInterceptors() {
    // Intercepteur pour ajouter le token d'authentification
    this.api.interceptors.request.use(
      async (config: any) => {
        try {
          const userData = await AsyncStorage.getItem("user");
          if (userData) {
            const user = JSON.parse(userData);
            if (user.token) {
              config.headers.Authorization = `Bearer ${user.token}`;
            }
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du token:", error);
        }
        return config;
      },
      (error: any) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les réponses
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expiré, nettoyer le stockage
          await AsyncStorage.removeItem("user");
          await AsyncStorage.removeItem("auth_token");
        }
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: AxiosError): ApiError {
    if (error.response) {
      // Erreur de réponse du serveur
      const responseData = error.response.data as any;
      return {
        message: responseData?.message || "Erreur du serveur",
        code: error.response.status.toString(),
        details: error.response.data,
      };
    } else if (error.request) {
      // Erreur de réseau
      return {
        message: "Erreur de connexion réseau",
        code: "NETWORK_ERROR",
        details: error.request,
      };
    } else {
      // Autre erreur
      return {
        message: error.message || "Erreur inconnue",
        code: "UNKNOWN_ERROR",
        details: error,
      };
    }
  }

  // Méthode générique pour les appels API
  private async makeRequest<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<T> {
    try {
      logger.debug("Appel API", { method, endpoint, data, params });
      const response = await this.api.request({
        method,
        url: endpoint,
        data,
        params,
      });
      logger.debug("Réponse API", {
        endpoint,
        status: response.status,
        data: response.data,
      });
      return response.data;
    } catch (error) {
      logger.error("Erreur API", { endpoint, error });
      throw error;
    }
  }

  // ===== MÉTHODES POUR LES ASSURÉS =====

  // Famille - Utiliser les vrais endpoints comme dans l'original
  async getFamilyMembers(request: any): Promise<any> {
    return this.makeRequest("POST", "/beneficiaire/getByCriteria", request);
  }

  async getFamilyConsultations(request: any): Promise<any> {
    return this.makeRequest("POST", "/famille/getPrestationActe", request);
  }

  async getFamilyPrescriptions(request: any): Promise<any> {
    return this.makeRequest("POST", "/famille/getPrescriptionActe", request);
  }

  async getFamilyPrimes(request: any): Promise<any> {
    return this.makeRequest(
      "POST",
      "/beneficiairePrime/getByCriteria",
      request
    );
  }

  // Dépenses
  async getExpenses(request: any): Promise<any> {
    return this.makeRequest("POST", "/famille/depense", request);
  }

  // Médicaments
  async getMedicaments(request: any): Promise<any> {
    return this.makeRequest("POST", "/medicament/getByCriteria", request);
  }

  async getMedicamentDetails(medicamentId: string): Promise<any> {
    return this.makeRequest("GET", `/medicament/${medicamentId}`);
  }

  // ===== MÉTHODES POUR LES PRESTATAIRES =====

  // Vérification d'éligibilité
  async checkBeneficiaryEligibility(payload: any): Promise<any> {
    return this.makeRequest("POST", "/beneficiaire/search", payload);
  }

  // Servir médicaments
  async serveMedicaments(data: any): Promise<any> {
    return this.makeRequest("POST", "/medicament/order", data);
  }

  // KPIs prestataire
  async getKpiPrestataire(request: any): Promise<any> {
    return this.makeRequest(
      "POST",
      "/kpi/depensePrestationPrestataire",
      request
    );
  }

  // Résumé basique prestataire
  async getBasicSummaryPrestataire(request: any): Promise<any> {
    return this.makeRequest("POST", "/kpi/basicSummaryPrestataire", request);
  }

  // Prestations
  async getPrestations(request: any): Promise<any> {
    return this.makeRequest("POST", "/prestationActe/getByCriteria", request);
  }

  // Patients
  async getPatients(request: any): Promise<any> {
    return this.makeRequest("POST", "/patient/getByCriteria", request);
  }

  // Rapports
  async getReports(request: any): Promise<any> {
    return this.makeRequest("POST", "/report/getByCriteria", request);
  }

  // Pharmacies de garde
  async getPharmacyGuard(request: any): Promise<any> {
    return this.makeRequest("POST", "/gardePharmacie/getByCriteria", request);
  }

  // Réseau de soins
  async getCareNetwork(request: any): Promise<any> {
    return this.makeRequest("POST", "/famille/reseauDeSoin", request);
  }

  // ===== MÉTHODES D'AUTHENTIFICATION =====

  async login(credentials: { login: string; password: string }): Promise<any> {
    const request = {
      data: {
        login: credentials.login,
        password: credentials.password,
      },
      filiale_id: null,
      user_id: null,
      prestataire_id: null,
    };
    return this.makeRequest("POST", "/user/login", request);
  }

  async logout(): Promise<void> {
    try {
      // Le logout se fait côté client en supprimant les tokens
      logger.info("Logout côté client - suppression des tokens");
    } catch (error) {
      logger.error("Erreur lors de la déconnexion:", error);
    }
  }

  async refreshToken(): Promise<any> {
    return this.makeRequest("POST", "/user/refresh", {});
  }

  // Recherche bénéficiaire (éligibilité) par matricule ou numéro CNAM (CMU)
  async searchBeneficiaire(payload: any): Promise<any> {
    console.log("🔍 Appel API searchBeneficiaire:", payload);
    const response = await this.makeRequest(
      "POST",
      "/beneficiaire/search",
      payload
    );
    console.log("✅ Réponse API searchBeneficiaire:", response);
    return response;
  }

  // Récupérer les prescriptions d'un bénéficiaire
  async getBeneficiairePrescriptions(payload: any): Promise<any> {
    console.log("🔍 Appel API getBeneficiairePrescriptions:", payload);
    const response = await this.makeRequest(
      "POST",
      "/prescriptionActe/getByCriteria",
      payload
    );
    console.log("✅ Réponse API getBeneficiairePrescriptions:", response);
    return response;
  }

  // Récupérer les prescriptions actes pour pharmacie (alias pour compatibilité MedicaleeApp)
  async getPrescriptionActes(payload: any): Promise<any> {
    console.log("🔍 Appel API getPrescriptionActes:", payload);
    const response = await this.makeRequest(
      "POST",
      "/prescriptionActe/getByCriteria",
      payload
    );
    console.log("✅ Réponse API getPrescriptionActes:", response);
    return response;
  }

  // Récupérer les ordonnances classiques
  async getClassicPrescriptions(params: {
    garantieCodification?: string;
    matriculeAssure?: string;
    matriculeBeneficiaire?: string; // si présent, mappé en data.beneficiaire_id (si numérique)
    dateDebut: string;
    dateFin: string;
    index: number;
    size: number;
    userId?: number;
    filialeId?: number;
  }): Promise<any> {
    console.log("🔍 Appel API getClassicPrescriptions:", params);

    const data: any = {};
    if (params.matriculeBeneficiaire) {
      // Utiliser le matricule directement au lieu de l'ID interne
      data.matricule = params.matriculeBeneficiaire;
    }

    const payload: any = {
      user_id: params.userId ?? 1,
      filiale_id: params.filialeId ?? 1,
      date_debut: `${params.dateDebut}T00:00:00.000Z`,
      date_fin: `${params.dateFin}T00:00:00.000Z`,
      data,
      index: params.index,
      size: params.size,
      // latitude: 5.32654,
      // longitude: -4.023503,
    };
    if (params.matriculeAssure) {
      const assureNum = Number(params.matriculeAssure);
      payload.matricule_assure = Number.isNaN(assureNum)
        ? params.matriculeAssure
        : assureNum;
    }
    if (params.garantieCodification)
      payload.garantie_codification = params.garantieCodification;
    console.log(
      "📦 Payload getClassicPrescriptions →",
      JSON.stringify(payload)
    );

    const response = await this.makeRequest(
      "POST",
      "/ordonnance/getByCriteria",
      payload
    );
    console.log("✅ Réponse API getClassicPrescriptions:", response);
    return response;
  }

  // Récupérer les ordonnances avec entente préalable
  async getOrdonnancesByEntentePrealable(params: {
    garantieCodification?: string;
    matriculeAssure?: string;
    matriculeBeneficiaire?: string;
    dateDebut: string;
    dateFin: string;
    index: number;
    size: number;
    userId?: number;
    filialeId?: number;
  }): Promise<any> {
    console.log("🔍 Appel API getOrdonnancesByEntentePrealable:", params);

    const data: any = {};
    if (params.matriculeBeneficiaire) {
      // Utiliser le matricule directement au lieu de l'ID interne
      data.matricule = params.matriculeBeneficiaire;
    }

    const payload: any = {
      user_id: params.userId ?? 1,
      filiale_id: params.filialeId ?? 1,
      date_debut: `${params.dateDebut}T00:00:00.000Z`,
      date_fin: `${params.dateFin}T23:59:59.999Z`,
      data,
      index: params.index,
      size: params.size,
      latitude: 5.32654,
      longitude: -4.023503,
    };

    if (params.garantieCodification)
      payload.garantie_codification = params.garantieCodification;

    // Inclure le matricule de l'assuré connecté pour filtrer les données
    if (params.matriculeAssure) {
      const asNumber = Number(params.matriculeAssure);
      if (!Number.isNaN(asNumber)) {
        payload.matricule_assure = asNumber;
      } else {
        payload.matricule_assure = params.matriculeAssure;
      }
    }

    console.log(
      "📦 Payload getOrdonnancesByEntentePrealable →",
      JSON.stringify(payload, null, 2)
    );

    const response = await this.makeRequest(
      "POST",
      "/ordonnance/getByEntentePrealable",
      payload
    );
    console.log("✅ Réponse API getOrdonnancesByEntentePrealable:", response);
    return response;
  }

  async getPrescriptionActeByCriteria(params: {
    userId: number;
    filialeId: number;
    garantieCodification?: string;
    matriculeAssure?: number;
    prestataireId?: number;
    beneficiaireId?: number;
    isEntentePrealable?: boolean;
    ordonnanceId?: number;
    dateDebut: string;
    dateFin: string;
    index: number;
    size: number;
  }): Promise<any> {
    console.log("🔍 Appel API getPrescriptionActeByCriteria:", params);

    const data: any = {};
    
    // Ajouter les champs optionnels dans data
    if (params.prestataireId) {
      data.prestataire_id = params.prestataireId;
    }
    
    if (params.beneficiaireId) {
      data.beneficiaire_id = params.beneficiaireId;
    }
    
    if (params.isEntentePrealable !== undefined) {
      data.is_entente_prealable = params.isEntentePrealable;
    }
    
    if (params.ordonnanceId) {
      data.ordonnance_id = params.ordonnanceId;
    }

    const payload: any = {
      user_id: params.userId,
      filiale_id: params.filialeId,
      date_debut: `${params.dateDebut}T00:00:00.000Z`,
      date_fin: `${params.dateFin}T23:59:59.999Z`,
      data,
      index: params.index,
      size: params.size,
    };

    // Ajouter les champs optionnels au niveau principal
    if (params.garantieCodification) {
      payload.garantie_codification = params.garantieCodification;
    }
    
    if (params.matriculeAssure) {
      payload.matricule_assure = params.matriculeAssure;
    }

    console.log(
      "📦 Payload getPrescriptionActeByCriteria →",
      JSON.stringify(payload, null, 2)
    );

    const response = await this.makeRequest(
      "POST",
      "/prescriptionActe/getByCriteria",
      payload
    );
    console.log("✅ Réponse API getPrescriptionActeByCriteria:", response);
    return response;
  }
}

export default ApiService;
