#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Symbol, Vec,
};

#[contracttype]
#[derive(Clone)]
pub struct RevocationRecord {
    pub credential_id: u64,
    pub issuer: Address,
    pub revoked_at: u64,
    pub reason: Symbol,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Revoked(u64),
    IssuerRevocations(Address),
}

#[contract]
pub struct RevocationRegistry;

#[contractimpl]
impl RevocationRegistry {
    fn extend_ttl(env: &Env, key: &DataKey) {
        env.storage().persistent().extend_ttl(key, 50_000, 500_000);
    }

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        Self::extend_ttl(&env, &DataKey::Admin);
    }

    pub fn revoke(env: Env, credential_id: u64, issuer: Address, reason: Symbol) {
        issuer.require_auth();

        let record = RevocationRecord {
            credential_id,
            issuer: issuer.clone(),
            revoked_at: env.ledger().timestamp(),
            reason,
        };

        let revoked_key = DataKey::Revoked(credential_id);
        env.storage()
            .persistent()
            .set(&revoked_key, &record);
        Self::extend_ttl(&env, &revoked_key);

        // Track per-issuer revocation list
        let issuer_key = DataKey::IssuerRevocations(issuer.clone());
        let mut issuer_list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&issuer_key)
            .unwrap_or(Vec::new(&env));
        issuer_list.push_back(credential_id);
        env.storage()
            .persistent()
            .set(&issuer_key, &issuer_list);
        Self::extend_ttl(&env, &issuer_key);

        env.events()
            .publish((Symbol::new(&env, "credential_revoked"),), credential_id);
    }

    pub fn is_revoked(env: Env, credential_id: u64) -> bool {
        let revoked_key = DataKey::Revoked(credential_id);
        let has_key = env.storage().persistent().has(&revoked_key);
        if has_key {
            Self::extend_ttl(&env, &revoked_key);
        }
        has_key
    }

    pub fn get_revocation_record(env: Env, credential_id: u64) -> RevocationRecord {
        let revoked_key = DataKey::Revoked(credential_id);
        let record: RevocationRecord = env.storage()
            .persistent()
            .get(&revoked_key)
            .expect("Credential not revoked");
        Self::extend_ttl(&env, &revoked_key);
        record
    }

    pub fn get_revocation_list(env: Env, issuer: Address) -> Vec<u64> {
        let issuer_key = DataKey::IssuerRevocations(issuer);
        let list: Vec<u64> = env.storage()
            .persistent()
            .get(&issuer_key)
            .unwrap_or(Vec::new(&env));
        if list.len() > 0 {
            Self::extend_ttl(&env, &issuer_key);
        }
        list
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_revoke_and_check() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(RevocationRegistry, ());
        let client = RevocationRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);

        client.initialize(&admin);

        assert!(!client.is_revoked(&42));
        client.revoke(&42, &issuer, &Symbol::new(&env, "fraud"));
        assert!(client.is_revoked(&42));
    }

    #[test]
    fn test_revocation_record() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(RevocationRegistry, ());
        let client = RevocationRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);

        client.initialize(&admin);
        client.revoke(&99, &issuer, &Symbol::new(&env, "expired"));

        let record = client.get_revocation_record(&99);
        assert_eq!(record.credential_id, 99);
        assert_eq!(record.issuer, issuer);
    }

    #[test]
    fn test_issuer_revocation_list() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(RevocationRegistry, ());
        let client = RevocationRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);

        client.initialize(&admin);
        client.revoke(&10, &issuer, &Symbol::new(&env, "fraud"));
        client.revoke(&20, &issuer, &Symbol::new(&env, "expired"));
        client.revoke(&30, &issuer, &Symbol::new(&env, "request"));

        let list = client.get_revocation_list(&issuer);
        assert_eq!(list.len(), 3);
    }
}
