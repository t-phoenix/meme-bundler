const hre = require('hardhat');
const fs = require('fs');
const {encodeSqrtRatioX96} = require("@uniswap/v3-sdk");
const { ERC20_ABI } = require('./ABI');
const { tokenAddresses } = require('./constants');
const { getNativeBalance } = require('./getBalances');
const { Wallet } = require('ethers');

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

async function printBalances(address){
    //CONTRACT INSTANCES
    const USDC_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.USDC_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.FREYA_Address);
    // console.log("Account: ", address);
    console.log("Account: ", address, "ETH Balance: ", Number(await getNativeBalance(address))/10**18, "FREYA BALANCE: ", Number(await FREYA_Contract.balanceOf(address))/10**18, "USDC Balance: ", Number(await USDC_Contract.balanceOf(address))/10**6);
}

async function printBalancesETH(address){
    //CONTRACT INSTANCES
    const WETH_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.WETH_Address)
    const FREYA_Contract = await hre.ethers.getContractAt(ERC20_ABI, tokenAddresses.FREYA_Address);
    // console.log("Account: ", address);
    console.log("Account: ", address, "ETH Balance: ", Number(await getNativeBalance(address))/10**18, "FREYA BALANCE: ", Number(await FREYA_Contract.balanceOf(address))/10**18, "WETH Balance: ", Number(await WETH_Contract.balanceOf(address))/10**18);
}


function getAccounts(){
    let wallets= []
    const walletsData = fs.readFileSync('./wallets.json', 'utf-8');
    const ParseData = JSON.parse(walletsData)
    for (let index = 0; index < ParseData.length; index++) {
        const key = ParseData[index].privateKey
        const wallet = new Wallet(key, hre.ethers.provider)
        wallets.push(wallet)
    }
    return wallets

}





// DOES NOT WORK
// USE UNISWAP_SDK FUNCTIONS TO CALCULATE PRECISELY

// function sqrtPriceX96ToPrice(sqrtPriceX96){
//   const sqrtPrice = sqrtPriceX96.toString() / (2 ** 96);
//   const price = sqrtPrice ** 2;
//   return price;

// }

// function priceToSqrtPriceX96(price) {
//     // Price should be a number
//     const sqrtPrice = Math.sqrt(price);
//     const sqrtPriceX96 = String(sqrtPrice * (2 ** 96));
//     return sqrtPriceX96;
//   }

//   function getSqrtPriceX96(price, decimalsA, decimalsB) {
//     const one = 10**(decimalsA);
//     const priceBN = Math.floor(price * 10 ** decimalsB);
//     const scaledPrice = priceBN * (one) / ((10)**(decimalsB));
//     const sqrtPrice = Math.sqrt(scaledPrice);
//     const sqrtPriceX96 = sqrtPrice*((2)**(96));
    
//     return sqrtPriceX96;
//   }

//   function getPriceFromTick(tick, decimalA, decimalsB){
//     const price = 1.0001**Number(tick);
//     const adjustedPrice = price * (10**decimalA)/(10**decimalsB);
//     return adjustedPrice
//   }

//   function getTickFromPrice(price, decimalA, decimalsB){
//     const adjustedPrice = price * (10**decimalsB)/(10**decimalA);
//     const logPrice = Math.log(adjustedPrice)/Math.log(1.0001);
//     const tick = Math.floor(logPrice);
//     return tick
//   }
  

module.exports = {
    divideNumberRandomly,
    printBalances,
    printBalancesETH,
    getAccounts
}