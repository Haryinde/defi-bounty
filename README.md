<img width="900" alt="30 Jul - Navigating the DeFi Ecosystem" src="https://github.com/user-attachments/assets/f4166974-50f5-400f-b084-5b95428f48ed">

# Bounty - DeFi Script 🦄

## Overview
This script automates a sequence of operations across multiple DeFi protocols on the Ethereum Sepolia testnet, specifically focusing on token swapping and lending. The main steps include:

- Token Approval: Approving the use of USDC for a swap via a decentralized exchange (DEX).
- Token Swap: Swapping USDC for DAI using a swap router contract.
- AAVE Interaction: Approving DAI for AAVE and subsequently supplying the swapped DAI to the AAVE lending pool.
The script leverages the following smart contracts:

- Uniswap Factory Contract: To fetch the liquidity pool address for the swap.
- Uniswap Swap Router: To perform the token swap.
- AAVE Lending Pool: To supply the swapped DAI for earning interest.

## Diagram Illustration 📈📈
<img width="500" alt="illustration" src="https://github.com/user-attachments/assets/ae018475-9fe6-486c-aeb9-9aa811fbb7f3"> 

## Code Explanation
The script focus on swapping 1 USDC to DAI using Uniswap Router, then proceeds to supply the DAI gotten on AAVE Pool to earn interests.

### Key Functions:
1. **Token Configuration**: Defines the token metadata for USDC and DAI. This includes their contract addresses, decimal places, and other relevant details.
```javascript
const USDC = {
  chainId: 11155111,
  address: "0x1c7D4B196Cb0C7
B01d743Fbc6116a902379C7238",
  decimals: 6,
  symbol: "USDC",
  name: "USD//C",
  isToken: true,
  isNative: true,
  wrapped: false,
};

const DAI = {
  chainId: 11155111,
  address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
  decimals: 18,
  symbol: "DAI",
  name: "DAI",
  isToken: true,
  isNative: true,
  wrapped: false,
};
```
2. **Approve Token Function**: The approveToken function approves the Swap Router contract to spend a specified amount of USDC on behalf of the user. It handles the transaction creation and broadcasting to the network.
```javascript
async function approveToken(tokenAddress, tokenABI, amount, wallet) { ... }
```
3. **Get Pool Info Function**: The getPoolInfo function fetches the address of the liquidity pool that pairs USDC and DAI. It also retrieves other data like token addresses and the fee tier of the pool.
```javascript
async function getPoolInfo(factoryContract, tokenIn, tokenOut) { ... }
```
4. **Prepare Swap Params Function**: Prepares the necessary parameters for executing a token swap. These parameters are required by the Swap Router contract.
```javascript
async function prepareSwapParams(poolContract, signer, amountIn) { ... }
```
5. **Execute Swap Function**: Executes the token swap and calculates the amount of DAI received. The function also logs the transaction and retrieves the balance before and after the swap to determine the exact amount swapped.
```javascript
async function executeSwap(swapRouter, params, signer) { ... }
```
6. **Get DAI Balance**: Fetches the DAI balance of the wallet to calculate the amount received after the swap.
```javascript
async function getDAIBalance(tokenAddress, wallet) { ... }
```
7. **Approve DAI for AAVE**: Similar to the initial token approval, this function allows the AAVE Pool contract to spend the swapped DAI.
```javascript
async function approveDAIToken(tokenAddress, tokenABI, amount, wallet) { ... }
```
8. **Supply DAI to AAVE**: Supplies the swapped DAI to AAVE's lending pool, allowing the user to earn interest on the deposited amount.
```javascript
async function supplyToAave(amount) { ... }
```
9. **Main Function**: The main function handles the entire process:
- Approving the Swap Router to spend USDC.
- Swapping USDC for DAI.
- Approving AAVE to spend DAI.
- Supplying DAI to AAVE.
```javascript
async function main(swapAmount) {
  const inputAmount = swapAmount;
  const amountIn = ethers.parseUnits(inputAmount.toString(), USDC.decimals);

  try {
    await approveToken(USDC.address, TOKEN_IN_ABI, inputAmount, signer);
    const { poolContract } = await getPoolInfo(factoryContract, USDC, DAI);
    const params = await prepareSwapParams(poolContract, signer, amountIn);
    const swapRouter = new ethers.Contract(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      SWAP_ROUTER_ABI,
      signer
    );
    const swappedDAI = await executeSwap(swapRouter, params, signer);

    //Approve pool contract to spend DAI
    await approveDAIToken(DAI.address, TOKEN_IN_ABI, swappedDAI, signer);

    // Supply to AAVE
    await supplyToAave(swappedDAI);
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}
```
10. **Usage**: To initiate the process, simply call the main function with the desired swap amount:
```javascript
main(1);
```
This example swaps 1 USDC for DAI and supplies the resulting DAI to AAVE.

## Project Setup ⚙️

1. Clone the repository
```bash
git clone https://github.com/clement-stackup/token_swap.git
```

2. Navigate to the project directory:
```bash
cd token_swap
```

3. Install the necessary dependencies & libraries
```bash
npm install --save
```
4. Run the script
```bash
node index.js
```
## Output 
<img width="677" alt="swap_output" src="https://github.com/user-attachments/assets/a947e0b2-55dc-4a13-8bb6-830ba03db36c">


