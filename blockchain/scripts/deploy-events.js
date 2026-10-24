// Deploys only EventRegistry (pointing at the existing organizer + service-provider NFTs) and merges its address + ABI
// into ../src/contracts/deployment.json. ChainConnectV2 and the NFTs are left as they are.
const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const frontendFile = path.join(__dirname, "..", "..", "src", "contracts", "deployment.json");
  const dep = JSON.parse(fs.readFileSync(frontendFile, "utf8"));

  const factory = await hre.ethers.getContractFactory("EventRegistry");
  const contract = await factory.deploy(dep.organizerNft.address, dep.serviceProviderNft.address);
  const tx = contract.deploymentTransaction();
  await contract.waitForDeployment();
  const receipt = await tx.wait();
  const address = await contract.getAddress();
  console.log(`EventRegistry: ${address}  (tx ${tx.hash}, block ${receipt.blockNumber})`);

  if (hre.network.name === "hardhat") return console.log("Local dry run: deployment.json left untouched.");

  dep.eventRegistry = { address, txHash: tx.hash, blockNumber: receipt.blockNumber, abi: (await hre.artifacts.readArtifact("EventRegistry")).abi };
  fs.writeFileSync(frontendFile, JSON.stringify(dep, null, 2));
  fs.writeFileSync(path.join(__dirname, "..", "deployments", `${hre.network.name}.json`), JSON.stringify(dep, null, 2));
  console.log("Merged eventRegistry into src/contracts/deployment.json and blockchain/deployments/" + hre.network.name + ".json");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
