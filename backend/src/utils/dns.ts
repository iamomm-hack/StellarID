import dns from 'dns';

/**
 * Resolves TXT records for a domain and checks if the verification token is present.
 * Supports:
 * 1. Exact match of token (e.g. "stellarid-verify-1234-abcd...")
 * 2. Key-value match (e.g. "stellarid-verify=1234-abcd...")
 * 
 * @param domain Claimed domain name (e.g., "mit.edu")
 * @param token Unique verification token
 */
export async function verifyDomainDNS(domain: string, token: string): Promise<boolean> {
  try {
    // Clean domain name
    const cleanDomain = domain.trim().toLowerCase();
    console.log(`[DNS Verification] Querying TXT records for: ${cleanDomain}`);
    
    const records = await dns.promises.resolveTxt(cleanDomain);
    const flatRecords = records.flat().map(r => r.trim());
    
    const tokenWithoutPrefix = token.replace('stellarid-verify-', '');
    
    for (const record of flatRecords) {
      // 1. Exact token match: "stellarid-verify-uuid"
      if (record === token) {
        return true;
      }
      
      // 2. Standard format: "stellarid-verify=uuid" or "stellarid-verify = uuid"
      const normalizedRecord = record.replace(/\s+/g, '');
      if (
        normalizedRecord === `stellarid-verify=${token}` ||
        normalizedRecord === `stellarid-verify=${tokenWithoutPrefix}`
      ) {
        return true;
      }
    }
    
    return false;
  } catch (err: any) {
    console.error(`[DNS Verification] DNS query failed for ${domain}:`, err.message);
    return false;
  }
}
