const hre = require('hardhat');
const { getAccounts, printBalances, printBalancesETH } = require('../utils/helper');
const { swap_freya_to_weth } = require('../utils-eth/swap/swap_freya_to_weth');
const { swap_weth_to_freya } = require('../utils-eth/swap/swap_weth_to_freya');
const { uniswapAddresses } = require('../utils/constants');

async function main(){

    let txnCount = 0;
    const wallets = getAccounts();
    let inputAmountFREYAmin = 100;
    let inputAmountFREYAmax = 200;

    let inputAmountWETHmin = 0.005;
    let inputAmountWETHmax = 0.01;


    let totalSold = [0,0] //WETH. FREYA
    let totalRecieved = [0,0] // WETH, FREYA
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
            console.log("SWAPPING WETH TO FREYA")
            const inputAmountWETH = String(Number(Math.random() * (inputAmountWETHmax - inputAmountWETHmin) + inputAmountWETHmin))
            const swapToFREYA = await swap_weth_to_freya(swappingWallet, inputAmountWETH);
            totalSold[0] += Number(inputAmountWETH);
            totalRecieved[1] += swapToFREYA
            swapType = Math.floor(Math.random() * 2);
        } else if (swapType == 1){
            console.log("SWAPPING FREYA TO WETH")
            const inputAmountFREYA = String(Math.floor(Math.random() * (inputAmountFREYAmax - inputAmountFREYAmin)) + inputAmountFREYAmin)
            const swapToWETH = await swap_freya_to_weth(swappingWallet, inputAmountFREYA);
            totalSold[1] += Number(inputAmountFREYA);
            totalRecieved[0] += swapToWETH;
            swapType = Math.floor(Math.random() * 2);
        }

        console.log("Pool Balance");
        printBalancesETH(uniswapAddresses.freyaWETHPoolAddress)
        console.log("Assets Sold - WETH: ", totalSold[0], "TOKEN: ", totalSold[1]);
        console.log("Assets Recieved - WETH: ", totalRecieved[0], "TOKEN: ", totalRecieved[1]);
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


    // const swapToFREYA =await swap_usdc_to_freya(swappingWallet, inputAmountWETH);

    // const swapToUSDC = await swap_freya_to_usdc(swappingWallet, inputAmountFREYA);
    


    

}


main().catch((error)=>{
    console.log(error);
    process.exitCode = 1;
})
