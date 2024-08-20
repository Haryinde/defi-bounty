import { ethers } from "ethers";
import FACTORY_ABI from "./abis/factory.json" assert { type: "json" };
import SWAP_ROUTER_ABI from "./abis/swaprouter.json" assert { type: "json" };
import POOL_ABI from "./abis/pool.json" assert { type: "json" };
import TOKEN_IN_ABI from "./abis/token.json" assert { type: "json" };
import AAVE_POOL_ABI from "./abis/aavepool.json" assert { type: "json" };

import dotenv from "dotenv";
dotenv.config();

const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x0227628f3F023bb0B980b67D528571c95c6DaC1c";
const SWAP_ROUTER_CONTRACT_ADDRESS =
  "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
const AAVE_POOL_ADDRESS = 
  "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const factoryContract = new ethers.Contract(
  POOL_FACTORY_CONTRACT_ADDRESS,
  FACTORY_ABI,
  provider
);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

//Part A - Input Token Configuration
const USDC = {
  chainId: 11155111,
  address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
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

//Part B - Write Approve Token Function
async function approveToken(tokenAddress, tokenABI, amount, wallet) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
    const approveAmount = ethers.parseUnits(amount.toString(), USDC.decimals);
    const approveTransaction = await tokenContract.approve.populateTransaction(
      SWAP_ROUTER_CONTRACT_ADDRESS,
      approveAmount
    );
    const transactionResponse = await wallet.sendTransaction(
      approveTransaction
    );
    console.log(`-------------------------------`);
    console.log(`Sending Approval Transaction...`);
    console.log(`-------------------------------`);
    console.log(`Transaction Sent: ${transactionResponse.hash}`);
    console.log(`-------------------------------`);
    const receipt = await transactionResponse.wait();
    console.log(`Approval Transaction Confirmed! https://sepolia.etherscan.io/txn/${receipt.hash}`);
  } catch (error) {
    console.error("An error occurred during token approval:", error);
    throw new Error("Token approval failed");
  }
}

//Part C - Write Get Pool Info Function
async function getPoolInfo(factoryContract, tokenIn, tokenOut) {
  const poolAddress = await factoryContract.getPool(
    tokenIn.address,
    tokenOut.address,
    3000
  );
  if (!poolAddress) {
    throw new Error("Failed to get pool address");
  }
  const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);
  return { poolContract, token0, token1, fee };
}

//Part D - Write Prepare Swap Params Function
async function prepareSwapParams(poolContract, signer, amountIn) {
  return {
    tokenIn: USDC.address,
    tokenOut: DAI.address,
    fee: await poolContract.fee(),
    recipient: signer.address,
    amountIn: amountIn,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0,
  };
}

//Part E - Write Execute Swap Function
async function executeSwap(swapRouter, params, signer) {
  // Get DAI Token Balance before the swap
  const daiBalanceBefore = await getDAIBalance(DAI.address, signer);
  const transaction = await swapRouter.exactInputSingle.populateTransaction(
    params
  );
  const receipt = await signer.sendTransaction(transaction);
  console.log(`-------------------------------`);
  console.log(`Receipt: https://sepolia.etherscan.io/tx/${receipt.hash}`);
  await receipt.wait();
  console.log(`-------------------------------`);
  // Get the DAI balance after the swap
  const daiBalanceAfter = await getDAIBalance(DAI.address, signer);

  // Calculate the swapped amount
  const swappedDAI = daiBalanceAfter - daiBalanceBefore;
  console.log(`DAI Amount: ${swappedDAI}`);

  return swappedDAI;
}

// Get Token Balance
async function getDAIBalance(tokenAddress, wallet) {
  const tokenContract = new ethers.Contract(tokenAddress, TOKEN_IN_ABI, wallet);
  const balance = await tokenContract.balanceOf(wallet.address);
  return ethers.formatUnits(balance, DAI.decimals);
}

// Approve DAI token
async function approveDAIToken(tokenAddress, tokenABI, amount, wallet) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
    const approveAmount = ethers.parseUnits(amount.toString(), DAI.decimals);
    const approveTransaction = await tokenContract.approve.populateTransaction(
      AAVE_POOL_ADDRESS,
      approveAmount
    );
    const transactionResponse = await wallet.sendTransaction(
      approveTransaction
    );
    console.log(`-------------------------------`);
    console.log(`Sending DAI Approval Transaction...`);
    console.log(`-------------------------------`);
    console.log(`Transaction Sent: ${transactionResponse.hash}`);
    console.log(`-------------------------------`);
    const receipt = await transactionResponse.wait();
    console.log(`DAI Approval Transaction Confirmed! https://sepolia.etherscan.io/txn/${receipt.hash}`);
  } catch (error) {
    console.error("An error occurred during token approval:", error);
    throw new Error("Token approval failed");
  }
}

// Supply DAI to AAVE
async function supplyToAave(amount) {
  const aavePool = new ethers.Contract(
    AAVE_POOL_ADDRESS,
    AAVE_POOL_ABI,
    signer
  );
  const supplyAmmount = ethers.parseUnits(amount.toString(), DAI.decimals);
  const supplyTx = await aavePool.supply(
    DAI.address,
    supplyAmmount,
    signer.address,
    0,
    {
      gasLimit: 500000,
    }
  );
  await supplyTx.wait();
  console.log(`Supply successful https://sepolia.etherscan.io/tx/${supplyTx.hash}`);
}

//Part F - Write Main Function
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

// Enter Swap Amount
main(1);