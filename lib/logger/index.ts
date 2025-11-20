type LogLevel = "info" | "warn" | "error" | "debug"

interface LogData {
  level: LogLevel
  message: string
  timestamp: string
  method?: string
  path?: string
  statusCode?: number
  duration?: number
  payload?: unknown
  response?: unknown
  error?: unknown
  userId?: string
  companyId?: string
  apiKeyId?: string
}

export class Logger {
  private formatLog(data: LogData): string {
    const logEntry = {
      ...data,
      timestamp: new Date().toISOString()
    }
    return JSON.stringify(logEntry, null, 2)
  }

  private log(level: LogLevel, data: Omit<LogData, "level" | "timestamp">) {
    const logData: LogData = {
      level,
      ...data,
      timestamp: new Date().toISOString()
    }

    const formatted = this.formatLog(logData)

    switch (level) {
      case "error":
        console.error(formatted)
        break
      case "warn":
        console.warn(formatted)
        break
      case "debug":
        if (process.env.NODE_ENV === "development") {
          console.debug(formatted)
        }
        break
      default:
        console.log(formatted)
    }
  }

  info(data: Omit<LogData, "level" | "timestamp">) {
    this.log("info", data)
  }

  warn(data: Omit<LogData, "level" | "timestamp">) {
    this.log("warn", data)
  }

  error(data: Omit<LogData, "level" | "timestamp">) {
    this.log("error", data)
  }

  debug(data: Omit<LogData, "level" | "timestamp">) {
    this.log("debug", data)
  }

  request(data: {
    method: string
    path: string
    payload?: unknown
    userId?: string
    companyId?: string
    apiKeyId?: string
  }) {
    this.debug({
      message: "Incoming request",
      ...data
    })
  }

  response(data: {
    method: string
    path: string
    statusCode: number
    duration: number
    response?: unknown
    userId?: string
    companyId?: string
    apiKeyId?: string
  }) {
    this.debug({
      message: "Outgoing response",
      ...data
    })
  }
}

export const logger = new Logger()
