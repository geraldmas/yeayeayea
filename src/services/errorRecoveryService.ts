import { debugLogsService } from '../utils/dataService';
import { logger } from '../utils/logger';

/**
 * Service de récupération après crash.
 * Il capture les erreurs non interceptées et les promesses rejetées
 * afin de consigner les informations dans la base de logs puis
 * d'exécuter une fonction de récupération optionnelle.
 */
export class ErrorRecoveryService {
  static init(restartCallback?: () => void): void {
    process.on('uncaughtException', error => {
      this.handleError(error, restartCallback);
    });

    process.on('unhandledRejection', reason => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.handleError(error, restartCallback);
    });
  }

  private static async handleError(error: Error, restartCallback?: () => void) {
    logger.error('Unhandled error caught by ErrorRecoveryService', error);
    try {
      await debugLogsService.create({
        log_type: 'error',
        severity: 'critical',
        message: error.message,
        context: {},
        stack_trace: error.stack
      });
    } catch (logErr) {
      logger.error('Failed to persist error log', logErr);
    } finally {
      if (restartCallback) {
        try {
          restartCallback();
        } catch (callbackErr) {
          logger.error('Error while executing recovery callback', callbackErr);
        }
      }
    }
  }
}
