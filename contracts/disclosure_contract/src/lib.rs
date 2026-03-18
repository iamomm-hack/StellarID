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
    VerificationCount,
    Verification(u64),
    UserVerifications(Address),
}

#[contract]
pub struct DisclosureContract;

#[contractimpl]
impl DisclosureContract {
    pub fn initialize(env: Env) {
        env.storage()
            .persistent()
            .set(&DataKey::VerificationCount, &0u64);
    }

    pub fn verify_and_record(
        env: Env,
        user: Address,
        credential_id: u64,
        claim_type: Symbol,
        proof_hash: String,
    ) -> bool {
        user.require_auth();

        let count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::VerificationCount)
            .unwrap_or(0);

        let record = VerificationRecord {
            user: user.clone(),
            credential_id,
            claim_type: claim_type.clone(),
            proof_hash,
            verified_at: env.ledger().timestamp(),
            result: true,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Verification(count), &record);

        // Track per-user verification list
        let mut user_verifications: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserVerifications(user.clone()))
            .unwrap_or(Vec::new(&env));
        user_verifications.push_back(count);
        env.storage()
            .persistent()
            .set(&DataKey::UserVerifications(user), &user_verifications);

        env.storage()
            .persistent()
            .set(&DataKey::VerificationCount, &(count + 1));

        env.events().publish(
            (Symbol::new(&env, "verification_recorded"),),
            count,
        );

        true
    }

    pub fn get_verification(env: Env, id: u64) -> VerificationRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Verification(id))
            .expect("Verification not found")
    }

    pub fn get_verification_history(env: Env, user: Address) -> Vec<Map<Symbol, String>> {
        let user_verif_ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&DataKey::UserVerifications(user))
            .unwrap_or(Vec::new(&env));

        let mut history: Vec<Map<Symbol, String>> = Vec::new(&env);

        for id in user_verif_ids.iter() {
            let record: VerificationRecord = env
                .storage()
                .persistent()
                .get(&DataKey::Verification(id))
                .unwrap();

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

        let contract_id = env.register_contract(None, DisclosureContract);
        let client = DisclosureContractClient::new(&env, &contract_id);

        let user = Address::generate(&env);

        client.initialize();

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

        let contract_id = env.register_contract(None, DisclosureContract);
        let client = DisclosureContractClient::new(&env, &contract_id);

        let user = Address::generate(&env);

        client.initialize();

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
