import { DefaultAzureCredential } from '@azure/identity'
import { SecretClient } from '@azure/keyvault-secrets'

const KEY_VAULT_URL =
  process.env.AZURE_KEY_VAULT_URL ||
  'https://kv-cravo-devops.vault.azure.net/'

const credential = new DefaultAzureCredential()
const secretClient = new SecretClient(KEY_VAULT_URL, credential)

export async function loadKeyVaultSecrets() {
  try {
    console.log(`Loading secrets from Azure Key Vault: ${KEY_VAULT_URL}`)

    const jwtSecret = await secretClient.getSecret('JWT-SECRET')
    const mongoUri = await secretClient.getSecret('MONGO-URI')
    const refreshTokenSecret =
      await secretClient.getSecret('REFRESH-TOKEN-SECRET')

    if (!jwtSecret.value) {
      throw new Error('JWT-SECRET was found but has no value')
    }

    if (!mongoUri.value) {
      throw new Error('MONGO-URI was found but has no value')
    }

    if (!refreshTokenSecret.value) {
      throw new Error('REFRESH-TOKEN-SECRET was found but has no value')
    }

    process.env.JWT_SECRET = jwtSecret.value
    process.env.MONGO_URI = mongoUri.value
    process.env.REFRESH_TOKEN_SECRET = refreshTokenSecret.value

    console.log('Azure Key Vault secrets loaded successfully')
  } catch (error) {
    console.error(
      'Failed to load secrets from Azure Key Vault:',
      error.message
    )

    throw error
  }
}