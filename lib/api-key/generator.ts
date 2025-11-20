import crypto from "crypto"

const PREFIX = process.env.API_KEY_PREFIX || "sk_"
const RANDOM_LENGTH = parseInt(process.env.API_KEY_RANDOM_LENGTH || "32", 10)

export interface GeneratedApiKey {
  fullKey: string
  prefix: string
  apiClientId: string
  randomPart: string
}

/**
 * Gera uma API Key no formato: sk_<apiClientId>_<random>
 */
export function generateApiKey(apiClientId: string): GeneratedApiKey {
  const randomPart = crypto.randomBytes(RANDOM_LENGTH).toString("hex")
  const prefix = PREFIX
  const fullKey = `${prefix}${apiClientId}_${randomPart}`

  return {
    fullKey,
    prefix,
    apiClientId,
    randomPart
  }
}

/**
 * Extrai o apiClientId de uma API Key
 */
export function extractApiClientId(apiKey: string): string | null {
  const prefix = PREFIX
  if (!apiKey.startsWith(prefix)) {
    return null
  }

  const withoutPrefix = apiKey.slice(prefix.length)
  const parts = withoutPrefix.split("_")

  if (parts.length < 2) {
    return null
  }

  return parts[0]
}
