// Configuration des endpoints API pour Medicalee
export const API_CONFIG = {
  BASE_URL: 'https://api.medicalee.com', // Remplacez par votre vraie URL API
  TIMEOUT: 30000,
  ENDPOINTS: {
    // Authentification
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    
    // Assurés
    FAMILY_MEMBERS: '/assure/family/members',
    FAMILY_CONSULTATIONS: '/assure/family/consultations',
    FAMILY_PRESCRIPTIONS: '/assure/family/prescriptions',
    FAMILY_PRIMES: '/assure/family/primes',
    EXPENSES: '/assure/expenses',
    MEDICAMENTS: '/assure/medicaments',
    MEDICAMENT_DETAILS: '/assure/medicaments/:id',
    
    // Prestataires
    CHECK_ELIGIBILITY: '/prestataire/check-eligibility',
    SERVE_MEDICAMENTS: '/prestataire/serve-medicaments',
    KPI_PRESTATAIRE: '/prestataire/:id/kpis',
    SUMMARY_PRESTATAIRE: '/prestataire/:id/summary',
    PRESTATIONS: '/prestataire/:id/prestations',
    PATIENTS: '/prestataire/:id/patients',
    REPORTS: '/prestataire/:id/reports',
  }
};

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Types pour les erreurs API
export interface ApiError {
  message: string;
  code: string;
  details?: any;
}
