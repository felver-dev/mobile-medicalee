// Configuration des environnements pour l'application Medicalee

export interface EnvironmentConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  timeout: number;
}

export const ENVIRONMENTS = {
  DEVELOPMENT: {
    apiBaseUrl: 'https://api.medicalee.net/api', // URL réelle de l'API
    isDevelopment: true,
    logLevel: 'debug' as const,
    timeout: 30000,
  },
  STAGING: {
    apiBaseUrl: 'https://api.medicalee.net/api', // URL réelle de l'API
    isDevelopment: false,
    logLevel: 'info' as const,
    timeout: 20000,
  },
  PRODUCTION: {
    apiBaseUrl: 'https://api.medicalee.net/api', // URL réelle de l'API
    isDevelopment: false,
    logLevel: 'error' as const,
    timeout: 15000,
  },
};

// Configuration actuelle basée sur l'environnement
export const getCurrentEnvironment = (): EnvironmentConfig => {
  // En mode développement React Native, utiliser DEVELOPMENT
  if (__DEV__) {
    return ENVIRONMENTS.DEVELOPMENT;
  }
  
  // En production, utiliser PRODUCTION
  return ENVIRONMENTS.PRODUCTION;
};

// Configuration actuelle
export const CURRENT_ENV = getCurrentEnvironment();

// Fonction pour logger selon le niveau configuré
export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_ENV.logLevel === 'debug') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (['debug', 'info'].includes(CURRENT_ENV.logLevel)) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (['debug', 'info', 'warn'].includes(CURRENT_ENV.logLevel)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};
