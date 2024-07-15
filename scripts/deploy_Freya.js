const hre = require('hardhat');
const fs = require('fs');
const readlineSync = require('readline-sync')




async function main(){
    let accounts = [];

    // FOR MAINNET - use this line
    // const accounts = await hre.ethers.getSigners();
    
    // FOR FORKED IMPERSONATE - use this line
    accounts[0] = await ethers.getImpersonatedSigner("0x4838B106FCe9647Bdf1E7877BF73cE8B0BAD5f97");


    const accountsBalance = await hre.ethers.provider.getBalance(accounts[0])
    console.log("Accounts: ", accounts[0].address, " Balance: ", Number(accountsBalance)/ 10**18)


    

    // GET WALLETS FROM FILE
    const walletsAddress= []
    const data = fs.readFileSync('./wallets.json', 'utf-8');
    const wallets = JSON.parse(data);

    // GET WALLET ADDRESS LIST
    for (let index = 0; index < wallets.length; index++) {
        walletsAddress.push(wallets[index].address);
    }
    console.log("Addresses to mint Freya:", walletsAddress)

    // TOTAL FREYA TO MINT AND DISTRIBUTE AMONG ADDRESSES RANDOMLY
    const input = readlineSync.question("How many FREYA to mint (total supply, e.g. 10 million) : ")
    const parsedInput = parseInt(input, 10);

    // Randomly divide mint amount among wallet addresses with input as total mint amount
    const mintAmount = divideNumberRandomly(parsedInput, wallets.length);
    console.log("Random Amount of tokens to mint for wallets: ", mintAmount)

    
    // DEPLOY TOKEN CONTRACT
    const freya = await hre.ethers.deployContract("FreyaMemeCoin", [walletsAddress, mintAmount], accounts[0]);
    console.log("FREYA TOKEN CONTRACT ADDRESS:" , freya.target)

    const totalFreyaSupply = await freya.totalSupply();
    const freyaOwner = await freya.owner();
    console.log("FREYA => ", totalFreyaSupply);
    console.log("FREYA OWNER: ", freyaOwner)

    for (let index = 0; index < wallets.length; index++) {
        const balance = await freya.balanceOf(walletsAddress[index]);
        console.log("FREYA BALANCE: ", Number(balance)/10**18)
    }




}

main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})


function divideNumberRandomly(inputNumber, numberOfParts) {
    if (numberOfParts <= 0) {
        throw new Error('Number of parts must be greater than zero.');
    }

    // Generate (numberOfParts - 1) random integers that sum to less than inputNumber
    const randomNumbers = Array.from({ length: numberOfParts - 1 }, () => Math.floor(Math.random() * inputNumber));

    // Sort the random numbers
    randomNumbers.sort((a, b) => a - b);

    // Add boundaries at 0 and inputNumber
    randomNumbers.unshift(0);
    randomNumbers.push(inputNumber);

    // Calculate the integer segments
    const parts = [];
    for (let i = 1; i < randomNumbers.length; i++) {
        parts.push(randomNumbers[i] - randomNumbers[i - 1]);
    }

    // Ensure all parts are integers and sum up to the inputNumber
    const sum = parts.reduce((acc, part) => acc + part, 0);
    if (sum !== inputNumber) {
        throw new Error('The sum of parts does not equal the input number.');
    }

    return parts;
}
