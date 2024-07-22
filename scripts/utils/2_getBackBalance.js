const hre = require('hardhat');
const { getNativeBalance } = require('../../utils/getBalances');

async function main(){

    const privateKey = "0xa2481a0f296e389573a83f74f3cca5798b6c361d5428dce67c4341207f825dfb"
    const beneficiaryWallet =  "0x2F15F9c7C7100698E10A48E3EA22b582FA4fB859";

    const wallet = new hre.ethers.Wallet(privateKey, hre.ethers.provider);

    console.log("Wallet Address:" , wallet.address)

    const balance = await getNativeBalance(wallet.address);
    console.log("Balance: ", Number(balance)/10**18);

    const gasLimit = await wallet.estimateGas({
        to: beneficiaryWallet,
        value: balance
    })
    console.log("Estimated Gas Limit:", gasLimit.toString())

    const gasFeeData = await hre.ethers.provider.getFeeData();
    const gasPrice = gasFeeData.gasPrice
    // console.log("Current Gas Fee: ", gasFeeData)

    const gasFee = gasPrice * gasLimit
    console.log("Gas Fee: ", gasFee)

    const inputAmount = String(Number(balance) - Number(gasFee));
    console.log("Input Amount: ", inputAmount)


    const trxn = await wallet.sendTransaction({
        to: beneficiaryWallet,
        value: hre.ethers.parseUnits(inputAmount, 'wei'),
    })
    await trxn.wait();
    console.log("Balance Now: ", Number(await getNativeBalance(wallet.address)))



}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})