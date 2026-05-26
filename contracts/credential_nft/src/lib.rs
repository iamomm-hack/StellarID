#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Symbol, String, Vec,
};

#[contracttype]
#[derive(Clone)]
pub struct Credential {
    pub id: u64,
    pub owner: Address,
    pub issuer: Address,
    pub credential_type: Symbol,
    pub claim_hash: String,
    pub issued_at: u64,
    pub expires_at: u64,
    pub revoked: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    NextId,
    Credential(u64),
    OwnerCredentials(Address),
    RegisteredIssuer(Address),
}

#[contract]
pub struct CredentialNFT;

#[contractimpl]
impl CredentialNFT {
    fn extend_ttl(env: &Env, key: &DataKey) {
        env.storage().persistent().extend_ttl(key, 50_000, 500_000);
    }

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::NextId, &0u64);

        Self::extend_ttl(&env, &DataKey::Admin);
        Self::extend_ttl(&env, &DataKey::NextId);
    }

    pub fn register_issuer(env: Env, issuer: Address) {
        let admin_key = DataKey::Admin;
        let admin: Address = env.storage().persistent().get(&admin_key).unwrap();
        admin.require_auth();
        Self::extend_ttl(&env, &admin_key);

        let issuer_key = DataKey::RegisteredIssuer(issuer);
        env.storage().persistent().set(&issuer_key, &true);
        Self::extend_ttl(&env, &issuer_key);
    }

    pub fn is_registered_issuer(env: Env, issuer: Address) -> bool {
        let issuer_key = DataKey::RegisteredIssuer(issuer);
        let registered = env.storage()
            .persistent()
            .get(&issuer_key)
            .unwrap_or(false);
        if registered {
            Self::extend_ttl(&env, &issuer_key);
        }
        registered
    }

    pub fn mint_credential(
        env: Env,
        owner: Address,
        issuer: Address,
        credential_type: Symbol,
        claim_hash: String,
        expires_at: u64,
    ) -> u64 {
        issuer.require_auth();

        let issuer_key = DataKey::RegisteredIssuer(issuer.clone());
        let is_registered: bool = env
            .storage()
            .persistent()
            .get(&issuer_key)
            .unwrap_or(false);
        if !is_registered {
            panic!("Issuer not registered");
        }
        Self::extend_ttl(&env, &issuer_key);

        let next_id_key = DataKey::NextId;
        let id: u64 = env
            .storage()
            .persistent()
            .get(&next_id_key)
            .unwrap_or(0);
        Self::extend_ttl(&env, &next_id_key);

        let credential = Credential {
            id,
            owner: owner.clone(),
            issuer,
            credential_type,
            claim_hash,
            issued_at: env.ledger().timestamp(),
            expires_at,
            revoked: false,
        };

        let cred_key = DataKey::Credential(id);
        env.storage()
            .persistent()
            .set(&cred_key, &credential);
        Self::extend_ttl(&env, &cred_key);

        let owner_key = DataKey::OwnerCredentials(owner.clone());
        let mut owner_creds: Vec<u64> = env
            .storage()
            .persistent()
            .get(&owner_key)
            .unwrap_or(Vec::new(&env));
        owner_creds.push_back(id);
        env.storage()
            .persistent()
            .set(&owner_key, &owner_creds);
        Self::extend_ttl(&env, &owner_key);

        env.storage()
            .persistent()
            .set(&next_id_key, &(id + 1));
        Self::extend_ttl(&env, &next_id_key);

        env.events()
            .publish((Symbol::new(&env, "credential_minted"),), id);

        id
    }

    pub fn get_credential(env: Env, id: u64) -> Credential {
        let cred_key = DataKey::Credential(id);
        let cred: Credential = env.storage()
            .persistent()
            .get(&cred_key)
            .expect("Credential not found");
        Self::extend_ttl(&env, &cred_key);
        cred
    }

    pub fn is_valid(env: Env, id: u64) -> bool {
        let cred_key = DataKey::Credential(id);
        let cred: Credential = env
            .storage()
            .persistent()
            .get(&cred_key)
            .expect("Credential not found");
        Self::extend_ttl(&env, &cred_key);
        !cred.revoked && env.ledger().timestamp() < cred.expires_at
    }

    pub fn revoke(env: Env, id: u64, issuer: Address) {
        issuer.require_auth();
        let cred_key = DataKey::Credential(id);
        let mut cred: Credential = env
            .storage()
            .persistent()
            .get(&cred_key)
            .expect("Credential not found");
        if cred.issuer != issuer {
            panic!("Only issuer can revoke");
        }
        cred.revoked = true;
        env.storage()
            .persistent()
            .set(&cred_key, &cred);
        Self::extend_ttl(&env, &cred_key);
        env.events()
            .publish((Symbol::new(&env, "credential_revoked"),), id);
    }

    pub fn get_owner_credentials(env: Env, owner: Address) -> Vec<u64> {
        let owner_key = DataKey::OwnerCredentials(owner);
        let creds: Vec<u64> = env.storage()
            .persistent()
            .get(&owner_key)
            .unwrap_or(Vec::new(&env));
        if creds.len() > 0 {
            Self::extend_ttl(&env, &owner_key);
        }
        creds
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_mint_and_validate() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CredentialNFT, ());
        let client = CredentialNFTClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let owner = Address::generate(&env);

        client.initialize(&admin);
        client.register_issuer(&issuer);

        let id = client.mint_credential(
            &owner,
            &issuer,
            &Symbol::new(&env, "age_verification"),
            &String::from_str(&env, "QmTestHash123"),
            &(env.ledger().timestamp() + 86400 * 365),
        );

        assert_eq!(id, 0);
        assert!(client.is_valid(&id));
    }

    #[test]
    fn test_revoke() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CredentialNFT, ());
        let client = CredentialNFTClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let owner = Address::generate(&env);

        client.initialize(&admin);
        client.register_issuer(&issuer);

        let id = client.mint_credential(
            &owner,
            &issuer,
            &Symbol::new(&env, "age_verification"),
            &String::from_str(&env, "QmTestHash123"),
            &(env.ledger().timestamp() + 86400 * 365),
        );

        client.revoke(&id, &issuer);
        assert!(!client.is_valid(&id));
    }

    #[test]
    fn test_get_owner_credentials() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(CredentialNFT, ());
        let client = CredentialNFTClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let owner = Address::generate(&env);

        client.initialize(&admin);
        client.register_issuer(&issuer);

        client.mint_credential(
            &owner,
            &issuer,
            &Symbol::new(&env, "age_verification"),
            &String::from_str(&env, "QmHash1"),
            &(env.ledger().timestamp() + 86400 * 365),
        );

        client.mint_credential(
            &owner,
            &issuer,
            &Symbol::new(&env, "income_check"),
            &String::from_str(&env, "QmHash2"),
            &(env.ledger().timestamp() + 86400 * 365),
        );

        let creds = client.get_owner_credentials(&owner);
        assert_eq!(creds.len(), 2);
    }
}
