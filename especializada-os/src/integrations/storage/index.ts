/**
 * Storage de documentos. Produção: S3-compatível (AWS S3, Cloudflare R2,
 * MinIO), bucket privado, criptografia em repouso, URLs assinadas de curta
 * duração geradas no servidor após checagem de permissão (RBAC + carteira).
 * DEMO: apenas metadados (e texto, para documentos .txt) no estado local.
 */
export interface StorageProvider {
  putObject(key: string, body: Uint8Array, mime: string): Promise<void>;
  signedGetUrl(key: string, ttlSeconds: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}
