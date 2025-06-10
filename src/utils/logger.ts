export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

class Logger {
  private format(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  log(level: LogLevel, message: string, ...optionalParams: unknown[]): void {
    const formatted = this.format(level, message);
    switch (level) {
      case LogLevel.ERROR:
        console.error(formatted, ...optionalParams);
        break;
      case LogLevel.WARN:
        console.warn(formatted, ...optionalParams);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV !== 'production') {
          console.debug(formatted, ...optionalParams);
        }
        break;
      default:
        console.info(formatted, ...optionalParams);
    }
  }

  error(message: string, ...params: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...params);
  }

  warn(message: string, ...params: unknown[]): void {
    this.log(LogLevel.WARN, message, ...params);
  }

  info(message: string, ...params: unknown[]): void {
    this.log(LogLevel.INFO, message, ...params);
  }

  debug(message: string, ...params: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...params);
  }
}

export const logger = new Logger();
