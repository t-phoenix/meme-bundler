const hre = require('hardhat');
const { getAccounts, printBalances } = require('../utils/helper');
const { swap_freya_to_usdc } = require('../utils/swap/swap_freya_to_usdc');
const { swap_usdc_to_freya } = require('../utils/swap/swap_usdc_to_freya');
const { uniswapAddresses } = require('../utils/constants');

async function main(){

    let txnCount = 0;
    const wallets = getAccounts();
    let inputAmountFREYAmin = 15589;
    let inputAmountFREYAmax = 31178;

    let inputAmountUSDCmin = 1;
    let inputAmountUSDCmax = 2;


    let totalSold = [0,0] //USDC. FREYA
    let totalRecieved = [0,0] // USDC, FREYA
    let swapType = 0;

    const minInterval = 60000; // 60 seconds
    const maxInterval = 300000; // 300 seconds
    let interval = 30000;

    let errorCount = 0;
    const maxErrors = 5;


    setInterval(async () => {
        txnCount++;
        interval = Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval
        console.log("TXN:", txnCount ,"Running Bot every Random Seconds, next interval: ", interval);
        try {
        // Your logic here
        const max = wallets.length;
        const randomInt = Math.floor(Math.random() * max);
        console.log("Random Wallet Number: ", randomInt);

        const swappingWallet =  wallets[randomInt];

        if (swapType == 0) {
            console.log("SWAPPING USDC TO FREYA")
            const inputAmountUSDC = String(Number(Math.random() * (inputAmountUSDCmax - inputAmountUSDCmin) + inputAmountUSDCmin).toFixed(1))
            const swapToFREYA = await swap_usdc_to_freya(swappingWallet, inputAmountUSDC);
            totalSold[0] += Number(inputAmountUSDC);
            totalRecieved[1] += swapToFREYA
            swapType = Math.floor(Math.random() * 2);
        } else if (swapType == 1){
            console.log("SWAPPING FREYA TO USDC")
            const inputAmountFREYA = String(Math.floor(Math.random() * (inputAmountFREYAmax - inputAmountFREYAmin)) + inputAmountFREYAmin)
            const swapToUSDC = await swap_freya_to_usdc(swappingWallet, inputAmountFREYA);
            totalSold[1] += Number(inputAmountFREYA);
            totalRecieved[0] += swapToUSDC;
            swapType = Math.floor(Math.random() * 2);
        }

        console.log("Pool Balance");
        printBalances(uniswapAddresses.freyaUsdcPoolAddress)
        console.log("Assets Sold - USDC: ", totalSold[0], "TOKEN: ", totalSold[1]);
        console.log("Assets Recieved - USDC: ", totalRecieved[0], "TOKEN: ", totalRecieved[1]);
        console.log("------------------------------------------------------------------")
        

        } catch (error) {
                errorCount++;
                console.error(`Error occurred: ${error.message} (Error count: ${errorCount})`);

                // Stop the interval if the error count exceeds the maximum allowed
                if (errorCount >= maxErrors) {
                  console.error("Too many errors, stopping the interval.");
                  clearInterval(interval);
                }
        }
        
      }, interval);// 60 seconds  


    // const swapToFREYA =await swap_usdc_to_freya(swappingWallet, inputAmountUSDC);

    // const swapToUSDC = await swap_freya_to_usdc(swappingWallet, inputAmountFREYA);
    


    

}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})
