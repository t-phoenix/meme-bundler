# MEME BUNDLER FOR FREYA

This project helps deploy a meme coin and artificially create the market for it.

We used Openzeppelin Contracts version@5 which supports solidity@0.8.29.

## Concept

- Create Multiple Wallets and Fund them with ETH using Original Account.
- Deploy ERC20 Meme token with inputs as whitelisted members/ wallets to mint random amount of tokens
- Total Meme tokens minted will be equal to input given by deployer.
- No tokens can be minted afterwards.
- [Development]- automated script to use the wallets and trade Meme coin on uniswap v3 Dex.

## Steps to run the project.

` yarn install`
to install the dependencies/ packages necessary to run the software. Can use npm too.

### Supported Networks

- `hardhat.config.js` file contains network and other EVM configurations.

- `--network hardhat` tag will use the forked Ethereum mainchain to run the scripts

- `--network mainnet` tag will run the script on Ethereum mainnet.

Supports `goerli`, `polygon` and `mumbai` networks too.
Must use right Impersonate Address in `./scripts` to work with corresponsin network.

### Add your Keys To .env file (only for Production)

Create a `.env` file at the root of your project if not already present.

Add `PRIVATE_KEY` variable for deploying on Mainnet.
Else you can remove the `process.env.PRIVATE_KEY` inside hardhat.config.js

### Deployment Scripts

Run the following command in your terminal

`yarn hardhat run --network [networkname] scripts/[filename].js`

- scripts/create_wallet.js --> Use impersonate wallet with address to run the script on forked network `hardhat` or getSigners() to use the PRIVATE_KEY account while in production `mainnet`.

  - User will be asked to input the number of wallets to create.
  - This will create and store your multiple wallets and their `PRIVATE KEY` in a file wallets.json.
    Make sure to keep this file safe, and do not commit this on github.
  - User will be asked to input the Amount of ETH to fund each wallet.

- scripts/deploy_Freya.js --> Make sure to use the correct method and address based on selected network.
  - User will be asked How much FREYA meme token to minted in total (e.g. 10million should input like 10000000). Decimals are taken care inside contract.
  - Mints random number of FREYA token to all the wallets found in wallets.json file totalling upto input amount.
