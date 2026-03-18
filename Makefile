.PHONY: setup migrate compile deploy seed test demo dev check

setup:
	docker-compose up -d
	cd backend && npm install
	cd frontend && npm install
	cd zk-circuits && npm install
	cd contracts/credential_nft && cargo build
	cd contracts/revocation_registry && cargo build
	cd contracts/disclosure_contract && cargo build
	@echo "Setup complete. Run 'make migrate' next."

migrate:
	cd backend && npm run migrate
	@echo "Database migrated."

compile:
	bash scripts/setup-ptau.sh
	cd zk-circuits && bash compile.sh
	bash scripts/copy-circuits.sh
	cd backend && npm run copy-vkeys
	@echo "ZK circuits compiled and copied."

deploy:
	bash scripts/deploy-contracts.sh

seed:
	cd backend && npx ts-node ../scripts/seed-issuers.ts

test:
	cd contracts/credential_nft && cargo test
	cd contracts/revocation_registry && cargo test
	cd contracts/disclosure_contract && cargo test
	cd backend && npm test
	cd frontend && npm run build
	@echo "All tests passed."

demo:
	npx ts-node scripts/demo.ts

dev:
	docker-compose up -d
	cd backend && npm run dev &
	cd frontend && npm run dev

check:
	npx ts-node scripts/check-env.ts
