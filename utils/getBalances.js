const hre = require('hardhat');
const { ERC20_ABI } = require('./constants');

async function getNativeBalance(address){
    return await hre.ethers.provider.getBalance(address)
}

async function getTokenBalance(tokenAddress, address){
    const TokenContract = new hre.ethers.Contract(tokenAddress, ERC20_ABI, hre.ethers.provider );
    return await TokenContract.balanceOf(address)
}

module.exports = {
    getNativeBalance,
    getTokenBalance
}