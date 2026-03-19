const { execSync } = require('child_process');
const fs = require('fs');

function run(cmd) {
    console.log(`Executing: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
}

const circuits = ['age_check', 'income_check', 'residency_check', 'membership_check'];

try {
    if (!fs.existsSync('build')) {
        fs.mkdirSync('build');
    }

    for (const circuit of circuits) {
        console.log(`\n=== Compiling ${circuit} ===`);
        run(`circom ${circuit}.circom --r1cs --wasm --sym -o build/`);
        
        console.log(`Generating zkey for ${circuit}...`);
        run(`npx snarkjs groth16 setup build/${circuit}.r1cs pot12_final.ptau build/${circuit}_0000.zkey`);
        
        run(`npx snarkjs zkey contribute build/${circuit}_0000.zkey build/${circuit}_final.zkey --name="StellarID Contribution" -e="stellarid random entropy 1234"`);
        
        run(`npx snarkjs zkey export verificationkey build/${circuit}_final.zkey build/${circuit}_verification_key.json`);
        
        console.log(`${circuit} done.`);
    }
    console.log("All circuits compiled successfully!");
} catch (e) {
    console.error("Compilation failed:", e.message);
    process.exit(1);
}
