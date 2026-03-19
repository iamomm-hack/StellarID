const fs = require('fs');
const path = require('path');

const circuits = ['age_check', 'income_check', 'residency_check', 'membership_check'];

const buildDir = path.join(__dirname, 'zk-circuits', 'build');
const frontendDir = path.join(__dirname, 'frontend', 'public', 'circuits');
const backendDir = path.join(__dirname, 'backend', 'circuits');

if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });
if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir, { recursive: true });

for (const c of circuits) {
    const wasmSrc = path.join(buildDir, `${c}_js`, `${c}.wasm`);
    const wasmDest = path.join(frontendDir, `${c}.wasm`);
    fs.copyFileSync(wasmSrc, wasmDest);
    console.log(`Copied ${c}.wasm to frontend`);

    const zkeySrc = path.join(buildDir, `${c}_final.zkey`);
    const zkeyDest = path.join(frontendDir, `${c}_final.zkey`);
    fs.copyFileSync(zkeySrc, zkeyDest);
    console.log(`Copied ${c}_final.zkey to frontend`);

    const vkeySrc = path.join(buildDir, `${c}_verification_key.json`);
    const vkeyDest = path.join(backendDir, `${c}_verification_key.json`);
    fs.copyFileSync(vkeySrc, vkeyDest);
    console.log(`Copied ${c}_verification_key.json to backend`);
}

console.log("Artifacts successfully copied!");
