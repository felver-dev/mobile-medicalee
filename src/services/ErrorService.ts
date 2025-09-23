// Service de gestion des erreurs pour l'application Medicalee

import { logger } from './environment';

export interface ErrorInfo {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
  endpoint?: string;
}

export class ErrorService {
  private static instance: ErrorService;
  private errors: ErrorInfo[] = [];

  private constructor() {}

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  // Enregistrer une erreur
  public logError(error: ErrorInfo): void {
    this.errors.push(error);
    logger.error('Erreur API', error);
    
    // Garder seulement les 100 dernières erreurs
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  // Obtenir les erreurs récentes
  public getRecentErrors(limit: number = 10): ErrorInfo[] {
    return this.errors.slice(-limit);
  }

  // Nettoyer les erreurs
  public clearErrors(): void {
    this.errors = [];
  }

  // Créer une erreur à partir d'une exception
  public createErrorFromException(
    error: any, 
    endpoint?: string, 
    userId?: string
  ): ErrorInfo {
    const errorInfo: ErrorInfo = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Erreur inconnue',
      details: error.details || error,
      timestamp: new Date().toISOString(),
      userId,
      endpoint,
    };

    this.logError(errorInfo);
    return errorInfo;
  }

  // Gérer les erreurs spécifiques à l'API
  public handleApiError(error: any, endpoint?: string, userId?: string): ErrorInfo {
    let errorInfo: ErrorInfo;

    if (error.response) {
      // Erreur de réponse du serveur
      errorInfo = {
        code: error.response.status.toString(),
        message: error.response.data?.message || 'Erreur du serveur',
        details: error.response.data,
        timestamp: new Date().toISOString(),
        userId,
        endpoint,
      };
    } else if (error.request) {
      // Erreur de réseau
      errorInfo = {
        code: 'NETWORK_ERROR',
        message: 'Erreur de connexion réseau',
        details: error.request,
        timestamp: new Date().toISOString(),
        userId,
        endpoint,
      };
    } else {
      // Autre erreur
      errorInfo = {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Erreur inconnue',
        details: error,
        timestamp: new Date().toISOString(),
        userId,
        endpoint,
      };
    }

    this.logError(errorInfo);
    return errorInfo;
  }

  // Obtenir un message d'erreur convivial pour l'utilisateur
  public getUserFriendlyMessage(error: ErrorInfo): string {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return 'Problème de connexion. Vérifiez votre connexion internet.';
      case '401':
        return 'Session expirée. Veuillez vous reconnecter.';
      case '403':
        return 'Accès non autorisé.';
      case '404':
        return 'Ressource non trouvée.';
      case '500':
        return 'Erreur du serveur. Veuillez réessayer plus tard.';
      case 'TIMEOUT':
        return 'Délai d\'attente dépassé. Veuillez réessayer.';
      default:
        return error.message || 'Une erreur est survenue.';
    }
  }

  // Vérifier si une erreur est récupérable
  public isRecoverableError(error: ErrorInfo): boolean {
    const recoverableCodes = ['NETWORK_ERROR', 'TIMEOUT', '500', '502', '503', '504'];
    return recoverableCodes.includes(error.code);
  }

  // Obtenir des suggestions de récupération
  public getRecoverySuggestions(error: ErrorInfo): string[] {
    const suggestions: string[] = [];

    switch (error.code) {
      case 'NETWORK_ERROR':
        suggestions.push('Vérifiez votre connexion internet');
        suggestions.push('Réessayez dans quelques instants');
        break;
      case 'TIMEOUT':
        suggestions.push('Réessayez l\'opération');
        suggestions.push('Vérifiez votre connexion');
        break;
      case '401':
        suggestions.push('Reconnectez-vous à l\'application');
        break;
      case '500':
        suggestions.push('Réessayez dans quelques minutes');
        suggestions.push('Contactez le support si le problème persiste');
        break;
      default:
        suggestions.push('Réessayez l\'opération');
        suggestions.push('Contactez le support si le problème persiste');
    }

    return suggestions;
  }
}

export default ErrorService;
