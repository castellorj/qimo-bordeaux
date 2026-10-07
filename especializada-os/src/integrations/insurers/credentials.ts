/**
 * Cofre de credenciais das seguradoras (somente servidor).
 * Produção: secrets manager (AWS Secrets Manager / GCP Secret Manager / Vault),
 * com rotação e trilha de acesso. NUNCA expor ao navegador nem gravar em log.
 */
export interface InsurerCredentials {
  insurerId: string;
  environment: "homologacao" | "producao";
  brokerCode: string; // código do corretor na seguradora / SUSEP
  clientId?: string;
  clientSecret?: string;
  certificatePem?: string; // mTLS, quando exigido
  apiKey?: string;
  extra?: Record<string, string>;
}

export interface CredentialVault {
  get(insurerId: string, env: InsurerCredentials["environment"]): Promise<InsurerCredentials | null>;
}

/** Implementação mínima por variáveis de ambiente (ex.: INSURER_PORTO_PRODUCAO_CLIENT_ID). */
export const envVault: CredentialVault = {
  async get(insurerId, env) {
    if (typeof window !== "undefined") throw new Error("Credenciais de seguradora só podem ser lidas no servidor");
    const key = `INSURER_${insurerId.replace(/^ins-/, "").replace(/-/g, "_").toUpperCase()}_${env.toUpperCase()}`;
    const read = (s: string) => process.env[`${key}_${s}`];
    const brokerCode = read("BROKER_CODE");
    if (!brokerCode) return null;
    return { insurerId, environment: env, brokerCode, clientId: read("CLIENT_ID"), clientSecret: read("CLIENT_SECRET"), apiKey: read("API_KEY"), certificatePem: read("CERT_PEM") };
  },
};
