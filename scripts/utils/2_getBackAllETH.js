const hre = require("hardhat");
const fs = require("fs");
const readlineSync = require("readline-sync");
const { getNativeBalance } = require("../../utils/getBalances");

async function main() {
  // const privateKey = "0xa2481a0f296e389573a83f74f3cca5798b6c361d5428dce67c4341207f825dfb"
  // GET BENEFIACARY ACCOUNT
//   const beneficiaryWallet = "0x2F15F9c7C7100698E10A48E3EA22b582FA4fB859";

  const beneficiaryWallet = readlineSync.question("Enter Beneficiary public account address: ");
  console.log(`BENEFIACIARY WALLET: ${beneficiaryWallet}`);


  // GET WALLETS FROM FILE
  const walletsAddress = [];
  const wallets = JSON.parse(fs.readFileSync("./wallets.json", "utf-8"));

  // GET WALLET ADDRESS LIST
  for (let index = 0; index < wallets.length; index++) {
    walletsAddress.push(wallets[index].privateKey);
  }
  // console.log("Addresses to GET BACK ETH:", walletsAddress)

  for (let index = 0; index < walletsAddress.length; index++) {
    console.log("Addresses to GET BACK ETH:", walletsAddress[index]);

    const wallet = new hre.ethers.Wallet(
      walletsAddress[index],
      hre.ethers.provider
    );
    const balance = await getNativeBalance(wallet.address);
    console.log("Balance: ", Number(balance));

    // Estimate the gas for the transaction
    const estimatedGas = await hre.ethers.provider.estimateGas({
      from: wallet.address,
      to: beneficiaryWallet,
      value: balance,
    });
    console.log(`Estimated Gas: ${estimatedGas.toString()}`);

     // Get current fee data (for legacy and EIP-1559)
    const feeData = await hre.ethers.provider.getFeeData(); 

    // EIP-1559 fields
    // const feePerGas = hre.ethers.formatUnits(feeData.gasPrice, "gwei");
    const maxFeePerGas = hre.ethers.formatUnits(feeData.maxFeePerGas, "gwei");
    console.log(`Max Fee per Gas (EIP-1559): ${maxFeePerGas} Gwei`);

    // Calculate total gas fees in Ether
    const totalGasFeeEIP1559 = estimatedGas * feeData.maxFeePerGas; // For EIP-1559 transactions

    console.log(`Total Gas Fee (EIP-1559): ${hre.ethers.formatUnits(totalGasFeeEIP1559, "ether")} ETH`);



    // TRANSFER AMOUNT  AFTER DEDUCING GAS FEE
    const inputAmount = String(Number(balance) - 1.01*Number(totalGasFeeEIP1559));
    console.log("Input Amount: ", inputAmount);

    const trxn = await wallet.sendTransaction({
      to: beneficiaryWallet,
      value: hre.ethers.parseUnits(inputAmount, "wei"),
    });
    await trxn.wait();
    console.log(
      "Balance Now: ",
      Number(await getNativeBalance(wallet.address))
    );

    console.log("--------------------------------------------------------------------------")
  }
}

main().catch((error) => {
  console.log(error);
  process.exitCode = 1;
});
