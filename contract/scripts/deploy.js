const hre = require("hardhat");

async function main() {
  console.log("Deploying TokenLaunchpad contract...");

  // Deploy TokenLaunchpad contract
  const TokenLaunchpad = await hre.ethers.getContractFactory("TokenLaunchpad");
  const launchpad = await TokenLaunchpad.deploy();
  await launchpad.waitForDeployment();
  const launchpadAddress = await launchpad.getAddress();
  
  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("TokenLaunchpad deployed to:", launchpadAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
