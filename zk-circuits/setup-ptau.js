const { execSync } = require('child_process');

function run(cmd) {
    console.log(`Executing: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
}

try {
    console.log("Generating PTAU file...");
    run('npx snarkjs powersoftau new bn128 12 pot12_0000.ptau -v');
    run('npx snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v -e="random text"');
    run('npx snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v');
    console.log("Done!");
} catch (e) {
    console.error("Error generating PTAU:", e.message);
    process.exit(1);
}
