import argon2 from "argon2"

/**
 * Gera hash de uma API Key usando argon2
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  return argon2.hash(apiKey, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4
  })
}

/**
 * Verifica se uma API Key corresponde ao hash
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, apiKey)
  } catch (error) {
    return false
  }
}
