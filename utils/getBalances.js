const hre = require('hardhat');
const { ERC20_ABI } = require('./constants');

async function getNativeBalance(address){
    return await hre.ethers.provider.getBalance(address)
}



module.exports = {
    getNativeBalance,
}