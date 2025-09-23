// Types principaux de l'application Medicalee

// Types d'utilisateurs selon le backend
export type UserType = 'USER_BENEF' | 'USER_PRESTATAIRE';

export interface User {
  id: string;
  email: string;
  name: string;
  prenom?: string;
  nom?: string;
  role: 'assure' | 'prestataire';
  token: string;
  beneficiaire_matricule?: string;
  filiale_id?: number;
  prestataire_id?: number;
  prestataire_libelle?: string;
  last_connection?: string;
  validity?: string;
  image_url?: string;
  type_user_codification?: UserType; // Type d'utilisateur retourné par l'API
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface Medicament {
  id: string;
  libelle: string;
  prix_unitaire: number;
  unite: string;
  forme_galenique: string;
  statut: string;
  classe_therapeutique?: string;
  code?: string;
  codification?: string;
  is_entente_prealable?: boolean;
  filiale_libelle?: string;
  created_at?: string;
}

export interface Consultation {
  id: number;
  doctor: string;
  specialty: string;
  date: string;
  status: string;
  amount: string;
  icon: string;
  color: string;
}

export interface Beneficiaire {
  id?: number;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  statut: string;
  taux_applicable?: number;
}

export interface EligibilityResult {
  isEligible: boolean;
  beneficiaire?: Beneficiaire;
  message?: string;
}

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  // Couleurs supplémentaires pour plus de flexibilité
  teal: string;
  tealLight: string;
  tealDark: string;
  blue: string;
  blueLight: string;
  orange: string;
  orangeLight: string;
  textOnPrimary: string;
}

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
}

export interface PrestataireThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  primaryLight: string;
  textOnPrimary: string;
}

export interface PrestataireTheme {
  colors: PrestataireThemeColors;
  isDark: boolean;
}

export interface ApiResponse<T> {
  items: T[];
  total: number;
  hasError?: boolean;
  status?: {
    message: string;
  };
}

export interface SearchBeneficiairePayload {
  is_required_dossier: boolean;
  data: {
    matricule?: string;
    numero_cnam?: string;
  };
  filiale_id: number;
  user_id: number;
  prestataire_id: number;
}
