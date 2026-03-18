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
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
    }

    pub fn revoke(env: Env, credential_id: u64, issuer: Address, reason: Symbol) {
        issuer.require_auth();

        let record = RevocationRecord {
            credential_id,
            issuer: issuer.clone(),
            revoked_at: env.ledger().timestamp(),
            reason,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Revoked(credential_id), &record);

        // Track per-issuer revocation list
        let mut issuer_list: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::IssuerRevocations(issuer.clone()))
            .unwrap_or(Vec::new(&env));
        issuer_list.push_back(credential_id);
        env.storage()
            .persistent()
            .set(&DataKey::IssuerRevocations(issuer), &issuer_list);

        env.events()
            .publish((Symbol::new(&env, "credential_revoked"),), credential_id);
    }

    pub fn is_revoked(env: Env, credential_id: u64) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Revoked(credential_id))
    }

    pub fn get_revocation_record(env: Env, credential_id: u64) -> RevocationRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Revoked(credential_id))
            .expect("Credential not revoked")
    }

    pub fn get_revocation_list(env: Env, issuer: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::IssuerRevocations(issuer))
            .unwrap_or(Vec::new(&env))
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

        let contract_id = env.register_contract(None, RevocationRegistry);
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

        let contract_id = env.register_contract(None, RevocationRegistry);
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

        let contract_id = env.register_contract(None, RevocationRegistry);
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
