#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype,
    Address, Env, Symbol, String, Vec, Map,
};

#[contracttype]
#[derive(Clone)]
pub struct VerificationRecord {
    pub user: Address,
    pub credential_id: u64,
    pub claim_type: Symbol,
    pub proof_hash: String,
    pub verified_at: u64,
    pub result: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    VerificationCount,
    Verification(u64),
    UserVerifications(Address),
}

#[contract]
pub struct DisclosureContract;

#[contractimpl]
impl DisclosureContract {
    fn extend_ttl(env: &Env, key: &DataKey) {
        env.storage().persistent().extend_ttl(key, 50_000, 500_000);
    }

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::VerificationCount, &0u64);

        Self::extend_ttl(&env, &DataKey::Admin);
        Self::extend_ttl(&env, &DataKey::VerificationCount);
    }

    pub fn verify_and_record(
        env: Env,
        user: Address,
        credential_id: u64,
        claim_type: Symbol,
        proof_hash: String,
    ) -> bool {
        let admin_key = DataKey::Admin;
        let admin: Address = env.storage().persistent().get(&admin_key).unwrap();
        admin.require_auth();
        Self::extend_ttl(&env, &admin_key);

        let count_key = DataKey::VerificationCount;
        let count: u64 = env
            .storage()
            .persistent()
            .get(&count_key)
            .unwrap_or(0);
        Self::extend_ttl(&env, &count_key);

        let record = VerificationRecord {
            user: user.clone(),
            credential_id,
            claim_type: claim_type.clone(),
            proof_hash,
            verified_at: env.ledger().timestamp(),
            result: true,
        };

        let verif_key = DataKey::Verification(count);
        env.storage()
            .persistent()
            .set(&verif_key, &record);
        Self::extend_ttl(&env, &verif_key);

        // Track per-user verification list
        let user_key = DataKey::UserVerifications(user.clone());
        let mut user_verifications: Vec<u64> = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or(Vec::new(&env));
        user_verifications.push_back(count);
        env.storage()
            .persistent()
            .set(&user_key, &user_verifications);
        Self::extend_ttl(&env, &user_key);

        env.storage()
            .persistent()
            .set(&count_key, &(count + 1));
        Self::extend_ttl(&env, &count_key);

        env.events().publish(
            (Symbol::new(&env, "verification_recorded"),),
            count,
        );

        true
    }

    pub fn get_verification(env: Env, id: u64) -> VerificationRecord {
        let verif_key = DataKey::Verification(id);
        let record: VerificationRecord = env.storage()
            .persistent()
            .get(&verif_key)
            .expect("Verification not found");
        Self::extend_ttl(&env, &verif_key);
        record
    }

    pub fn get_verification_history(env: Env, user: Address) -> Vec<Map<Symbol, String>> {
        let user_key = DataKey::UserVerifications(user);
        let user_verif_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&user_key)
            .unwrap_or(Vec::new(&env));
        if user_verif_ids.len() > 0 {
            Self::extend_ttl(&env, &user_key);
        }

        let mut history: Vec<Map<Symbol, String>> = Vec::new(&env);

        for id in user_verif_ids.iter() {
            let verif_key = DataKey::Verification(id);
            let record: VerificationRecord = env
                .storage()
                .persistent()
                .get(&verif_key)
                .unwrap();
            Self::extend_ttl(&env, &verif_key);

            let mut entry = Map::new(&env);
            entry.set(
                Symbol::new(&env, "claim_type"),
                String::from_str(&env, "verified"),
            );
            entry.set(
                Symbol::new(&env, "proof_hash"),
                record.proof_hash,
            );
            history.push_back(entry);
        }

        history
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_verify_and_record() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DisclosureContract, ());
        let client = DisclosureContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin);

        let result = client.verify_and_record(
            &user,
            &42,
            &Symbol::new(&env, "age_check"),
            &String::from_str(&env, "QmProofHash123"),
        );

        assert!(result);

        let record = client.get_verification(&0);
        assert_eq!(record.credential_id, 42);
        assert_eq!(record.user, user);
    }

    #[test]
    fn test_verification_history() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(DisclosureContract, ());
        let client = DisclosureContractClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        let user = Address::generate(&env);

        client.initialize(&admin);

        client.verify_and_record(
            &user,
            &1,
            &Symbol::new(&env, "age_check"),
            &String::from_str(&env, "QmProof1"),
        );

        client.verify_and_record(
            &user,
            &2,
            &Symbol::new(&env, "income_check"),
            &String::from_str(&env, "QmProof2"),
        );

        let history = client.get_verification_history(&user);
        assert_eq!(history.len(), 2);
    }
}
