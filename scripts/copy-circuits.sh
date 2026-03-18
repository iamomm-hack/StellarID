#!/bin/bash
echo "Copying ZK circuit artifacts to frontend..."
mkdir -p frontend/public/circuits

for circuit in age_check income_check residency_check membership_check; do
    cp zk-circuits/build/${circuit}_js/${circuit}.wasm \
       frontend/public/circuits/${circuit}.wasm

    cp zk-circuits/build/${circuit}_final.zkey \
       frontend/public/circuits/${circuit}_final.zkey

    cp zk-circuits/build/${circuit}_verification_key.json \
       frontend/public/circuits/${circuit}_verification_key.json

    echo "Copied $circuit artifacts"
done
echo "All circuit artifacts copied to frontend/public/circuits/"
