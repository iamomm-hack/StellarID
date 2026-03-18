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
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::NextId, &0u64);
    }

    pub fn register_issuer(env: Env, issuer: Address) {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().persistent().set(&DataKey::RegisteredIssuer(issuer), &true);
    }

    pub fn is_registered_issuer(env: Env, issuer: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::RegisteredIssuer(issuer))
            .unwrap_or(false)
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

        let is_registered: bool = env
            .storage()
            .persistent()
            .get(&DataKey::RegisteredIssuer(issuer.clone()))
            .unwrap_or(false);
        if !is_registered {
            panic!("Issuer not registered");
        }

        let id: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::NextId)
            .unwrap_or(0);

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

        env.storage()
            .persistent()
            .set(&DataKey::Credential(id), &credential);

        let mut owner_creds: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::OwnerCredentials(owner.clone()))
            .unwrap_or(Vec::new(&env));
        owner_creds.push_back(id);
        env.storage()
            .persistent()
            .set(&DataKey::OwnerCredentials(owner), &owner_creds);

        env.storage()
            .persistent()
            .set(&DataKey::NextId, &(id + 1));

        env.events()
            .publish((Symbol::new(&env, "credential_minted"),), id);

        id
    }

    pub fn get_credential(env: Env, id: u64) -> Credential {
        env.storage()
            .persistent()
            .get(&DataKey::Credential(id))
            .expect("Credential not found")
    }

    pub fn is_valid(env: Env, id: u64) -> bool {
        let cred: Credential = env
            .storage()
            .persistent()
            .get(&DataKey::Credential(id))
            .expect("Credential not found");
        !cred.revoked && env.ledger().timestamp() < cred.expires_at
    }

    pub fn revoke(env: Env, id: u64, issuer: Address) {
        issuer.require_auth();
        let mut cred: Credential = env
            .storage()
            .persistent()
            .get(&DataKey::Credential(id))
            .expect("Credential not found");
        if cred.issuer != issuer {
            panic!("Only issuer can revoke");
        }
        cred.revoked = true;
        env.storage()
            .persistent()
            .set(&DataKey::Credential(id), &cred);
        env.events()
            .publish((Symbol::new(&env, "credential_revoked"),), id);
    }

    pub fn get_owner_credentials(env: Env, owner: Address) -> Vec<u64> {
        env.storage()
            .persistent()
            .get(&DataKey::OwnerCredentials(owner))
            .unwrap_or(Vec::new(&env))
    }

    pub fn transfer(env: Env, from: Address, to: Address, id: u64) {
        from.require_auth();
        let mut cred: Credential = env
            .storage()
            .persistent()
            .get(&DataKey::Credential(id))
            .expect("Credential not found");
        if cred.owner != from {
            panic!("Not the owner");
        }
        cred.owner = to.clone();
        env.storage()
            .persistent()
            .set(&DataKey::Credential(id), &cred);
        env.events()
            .publish((Symbol::new(&env, "credential_transferred"),), id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::Env;

    #[test]
    fn test_mint_and_validate() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, CredentialNFT);
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

        let contract_id = env.register_contract(None, CredentialNFT);
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

        let contract_id = env.register_contract(None, CredentialNFT);
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

    #[test]
    fn test_transfer() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, CredentialNFT);
        let client = CredentialNFTClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let issuer = Address::generate(&env);
        let owner = Address::generate(&env);
        let new_owner = Address::generate(&env);

        client.initialize(&admin);
        client.register_issuer(&issuer);

        let id = client.mint_credential(
            &owner,
            &issuer,
            &Symbol::new(&env, "age_verification"),
            &String::from_str(&env, "QmTestHash123"),
            &(env.ledger().timestamp() + 86400 * 365),
        );

        client.transfer(&owner, &new_owner, &id);
        let cred = client.get_credential(&id);
        assert_eq!(cred.owner, new_owner);
    }
}
