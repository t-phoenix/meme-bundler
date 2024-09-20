const hre = require('hardhat');
const fs = require('fs');
const { printBalances, getAccounts } = require('../../utils/helper');

async function main(){

    // SIGNER ACCOUNT
    const SignerAccount = await hre.ethers.getSigners();
    console.log("SIGNER")
    await printBalances(SignerAccount[0].address);


    // GET WALLETS FROM FILE
    const accounts = getAccounts()
    console.log("WALLETS")
    for (let index = 0; index < accounts.length; index++) {
        await printBalances(accounts[index].address)
    }
   

}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})
