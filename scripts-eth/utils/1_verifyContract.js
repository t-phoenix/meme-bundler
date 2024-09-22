const hre = require('hardhat');

async function main(){
    const accounts = await hre.ethers.getSigners();
    const contractAddressToVerify = "0xeC24994f6e5B2DedB0B83653d03F69ED303A861a";

    const contructorArgsArray = [['0x9EC36CBE10045EfBf7e389396a7be7e2d70412B2', '0x0D77aE893f3d697fcD3d9D4A87566D4279Ed92AC'], 69000000n]

    const verifyGeneralIndex = await run("verify:verify", {
        address: contractAddressToVerify,
        constructorArguments: []
      })

}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})