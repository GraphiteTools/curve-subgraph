import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { TokenExchangeUnderlying, TokenExchange } from "../generated/USDC-DAI Pool/twoTokenPool";
import { AddLiquidity as AddLiquidity2, AddLiquidity1 as AddLiquidity2Fees, RemoveLiquidity as RemoveLiquidity2, RemoveLiquidityImbalance as RemoveLiquidityImbalance2 } from "../generated/USDC-DAI Pool/twoTokenPool";
import { AddLiquidity as AddLiquidity3, RemoveLiquidity as RemoveLiquidity3, RemoveLiquidityImbalance as RemoveLiquidityImbalance3 } from "../generated/USDC-DAI-USDT Pool/threeTokenPool";
import { AddLiquidity as AddLiquidity4, RemoveLiquidity as RemoveLiquidity4, RemoveLiquidityImbalance as RemoveLiquidityImbalance4 } from "../generated/yToken Pool/fourTokenPool";
import { cToken as cTokenContract } from "../generated/USDC-DAI Pool/cToken";
import { yToken as yTokenContract } from "../generated/yToken Pool/yToken";
import { Pool } from "../generated/schema";

let nullAddress = Address.fromHexString('0x0000000000000000000000000000000000000000') as Address;

let halfMultiplier = BigInt.fromI32(1000000000);
let multiplier = halfMultiplier * halfMultiplier;

export function handleAddLiquidity2(event: AddLiquidity2): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let newSupply = event.params.token_supply;

	_handleAddLiquidity(address, userAddress, amounts, newSupply);
}

export function handleAddLiquidity2Fees(event: AddLiquidity2Fees): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let newSupply = event.params.token_supply;

	_handleAddLiquidity(address, userAddress, amounts, newSupply);
}

export function handleAddLiquidity3(event: AddLiquidity3): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let newSupply = event.params.token_supply;

	_handleAddLiquidity(address, userAddress, amounts, newSupply);
}

export function handleAddLiquidity4(event: AddLiquidity4): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let newSupply = event.params.token_supply;

	_handleAddLiquidity(address, userAddress, amounts, newSupply);
}

export function handleRemoveLiquidity2(event: RemoveLiquidity2): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let newSupply = event.params.token_supply;

	_handleRemoveLiquidity(address, userAddress, amounts, newSupply);
}

export function handleRemoveLiquidity3(event: RemoveLiquidity3): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let newSupply = event.params.token_supply;

	_handleRemoveLiquidity(address, userAddress, amounts, newSupply);
}

export function handleRemoveLiquidity4(event: RemoveLiquidity4): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let newSupply = event.params.token_supply;

	_handleRemoveLiquidity(address, userAddress, amounts, newSupply);
}

export function handleRemoveLiquidityImbalance2(event: RemoveLiquidityImbalance2): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let fees = event.params.fees;
	let newSupply = event.params.token_supply;

	_handleRemoveLiquidityImbalance(address, userAddress, amounts, fees, newSupply);
}

export function handleRemoveLiquidityImbalance3(event: RemoveLiquidityImbalance3): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let fees = event.params.fees;
	let newSupply = event.params.token_supply;

	_handleRemoveLiquidityImbalance(address, userAddress, amounts, fees, newSupply);
}

export function handleRemoveLiquidityImbalance4(event: RemoveLiquidityImbalance4): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let fees = event.params.fees;
	let newSupply = event.params.token_supply;

	_handleRemoveLiquidityImbalance(address, userAddress, amounts, fees, newSupply);
}

export function handleTokenExchangeUnderlying(event: TokenExchangeUnderlying): void {
	let logIndex = event.logIndex;
	let transactionHash = event.transaction.hash;
	let timestamp = event.block.timestamp;
	let address = event.address;
	let buyer = event.params.buyer;
	let soldId = event.params.sold_id.toI32();
	let tokensSold = event.params.tokens_sold;
	let boughtId = event.params.bought_id.toI32();
	let tokensBought = event.params.tokens_bought;

	let pool = Pool.load(address.toHexString());

	let assets = pool.assets;
	let soldAsset = assets[soldId];
	let boughtAsset = assets[boughtId];
	let soldAssetRate = _getRate(soldAsset);
	let boughtAssetRate = _getRate(boughtAsset);

	let poolAmounts = pool.amounts;
	poolAmounts[soldId] += tokensSold * multiplier / soldAssetRate;
	poolAmounts[boughtId] -= tokensBought * multiplier / boughtAssetRate;
	pool.amounts = poolAmounts;
	pool.save();
}

export function handleTokenExchange(event: TokenExchange): void {
	let logIndex = event.logIndex;
	let transactionHash = event.transaction.hash;
	let timestamp = event.block.timestamp;
	let address = event.address;
	let buyer = event.params.buyer;
	let soldId = event.params.sold_id.toI32();
	let tokensSold = event.params.tokens_sold;
	let boughtId = event.params.bought_id.toI32();
	let tokensBought = event.params.tokens_bought;

	let pool = Pool.load(address.toHexString());

	let poolAmounts = pool.amounts;
	poolAmounts[soldId] += tokensSold;
	poolAmounts[boughtId] -= tokensBought;
	pool.amounts = poolAmounts;
	pool.save();
}

function _handleAddLiquidity(address: Address, userAddress: Address, amounts: Array<BigInt>, newSupply: BigInt): void {
	let pool = Pool.load(address.toHexString());
	if (!pool) {
		_initPool(address);
		pool = Pool.load(address.toHexString());
	}
	let poolAmounts = pool.amounts;
	for (let i = 0; i < amounts.length; i++) {
		let amount = amounts[i];
		poolAmounts[i] += amount;
	}
	pool.amounts = poolAmounts;
	pool.totalAmount = newSupply;
	pool.save();
}

function _handleRemoveLiquidity(address: Address, userAddress: Address, amounts: Array<BigInt>, newSupply: BigInt): void {
	let pool = Pool.load(address.toHexString());
	let poolAmounts = pool.amounts;
	for (let i = 0; i < amounts.length; i++) {
		let amount = amounts[i];
		poolAmounts[i] -= amount;
	}
	pool.amounts = poolAmounts;
	pool.totalAmount = newSupply;
	pool.save();
}

function _handleRemoveLiquidityImbalance(address: Address, userAddress: Address, amounts: Array<BigInt>, fees: Array<BigInt>, newSupply: BigInt): void {
	let pool = Pool.load(address.toHexString());
	let poolAmounts = pool.amounts;
	for (let i = 0; i < amounts.length; i++) {
		let amount = amounts[i];
		poolAmounts[i] -= amount;
	}
	pool.amounts = poolAmounts;
	pool.totalAmount = newSupply;
	pool.save();
}

function _initPool(address: Address): void {
	let pool = new Pool(address.toHexString());
	pool.assets = _getAssets(address);
	pool.amounts = _getAmounts(address);
	pool.totalAmount = new BigInt(0);
	pool.save();
}

function _getAssets(address: Address): Array<Bytes> {
	let addressString = address.toHexString();
	if (addressString == '0x2e60cf74d81ac34eb21eeff58db4d385920ef419') {
		return [
			Bytes.fromHexString('0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643') as Bytes,
			Bytes.fromHexString('0x39AA39c021dfbaE8faC545936693aC917d5E7563') as Bytes,
		];
	}
	if (addressString == '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56') {
		return [
			Bytes.fromHexString('0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643') as Bytes,
			Bytes.fromHexString('0x39AA39c021dfbaE8faC545936693aC917d5E7563') as Bytes,
		];
	}
	if (addressString == '0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c') {
		return [
			Bytes.fromHexString('0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643') as Bytes,
			Bytes.fromHexString('0x39AA39c021dfbaE8faC545936693aC917d5E7563') as Bytes,
			Bytes.fromHexString('0xdAC17F958D2ee523a2206206994597C13D831ec7') as Bytes,
		];
	}
	if (addressString == '0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51') {
		return [
			Bytes.fromHexString('0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01') as Bytes,
			Bytes.fromHexString('0xd6aD7a6750A7593E092a9B218d66C0A814a3436e') as Bytes,
			Bytes.fromHexString('0x83f798e925BcD4017Eb265844FDDAbb448f1707D') as Bytes,
			Bytes.fromHexString('0x73a052500105205d34Daf004eAb301916DA8190f') as Bytes,
		];
	}
	if (addressString == '0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27') {
		return [
			Bytes.fromHexString('0xC2cB1040220768554cf699b0d863A3cd4324ce32') as Bytes,
			Bytes.fromHexString('0x26EA744E5B887E5205727f55dFBE8685e3b21951') as Bytes,
			Bytes.fromHexString('0xE6354ed5bC4b393a5Aad09f21c46E101e692d447') as Bytes,
			Bytes.fromHexString('0x04bC0Ab673d88aE9dbC9DA2380cB6B79C4BCa9aE') as Bytes,
		];
	}
	if (addressString == '0xa5407eae9ba41422680e2e00537571bcc53efbfd') {
		return [
			Bytes.fromHexString('0x6b175474e89094c44da98b954eedeac495271d0f') as Bytes,
			Bytes.fromHexString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') as Bytes,
			Bytes.fromHexString('0xdac17f958d2ee523a2206206994597c13d831ec7') as Bytes,
			Bytes.fromHexString('0x57ab1ec28d129707052df4df418d58a2d46d5f51') as Bytes,
		];
	}
	if (addressString == '0x06364f10b501e868329afbc005b3492902d6c763') {
		return [
			Bytes.fromHexString('0x99d1fa417f94dcd62bfe781a1213c092a47041bc') as Bytes,
			Bytes.fromHexString('0x9777d7e2b60bb01759d0e2f8be2095df444cb07e') as Bytes,
			Bytes.fromHexString('0x1be5d71f2da660bfdee8012ddc58d024448a0a59') as Bytes,
			Bytes.fromHexString('0x8e870d67f660d95d5be530380d0ec0bd388289e1') as Bytes,
		];
	}
	return [];
}

function _getAmounts(address: Address): Array<BigInt> {
	let addressString = address.toHexString();
	if (addressString == '0x2e60cf74d81ac34eb21eeff58db4d385920ef419') {
		return [
			BigInt.fromI32(0),
			BigInt.fromI32(0),
		];
	}
	if (addressString == '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56') {
		return [
			BigInt.fromI32(0),
			BigInt.fromI32(0),
		];
	}
	if (addressString == '0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c') {
		return [
			BigInt.fromI32(0),
			BigInt.fromI32(0),
			BigInt.fromI32(0),
		];
	}
	if (addressString == '0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51') {
		return [
			BigInt.fromI32(0),
			BigInt.fromI32(0),
			BigInt.fromI32(0),
			BigInt.fromI32(0),
		];
	}
	if (addressString == '0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27') {
		return [
			BigInt.fromI32(0),
			BigInt.fromI32(0),
			BigInt.fromI32(0),
			BigInt.fromI32(0),
		];
	}
	if (addressString == '0xa5407eae9ba41422680e2e00537571bcc53efbfd') {
		return [
			BigInt.fromI32(0),
			BigInt.fromI32(0),
			BigInt.fromI32(0),
			BigInt.fromI32(0),
		];
	}
	if (addressString == '0x06364f10b501e868329afbc005b3492902d6c763') {
		return [
			BigInt.fromI32(0),
			BigInt.fromI32(0),
			BigInt.fromI32(0),
			BigInt.fromI32(0),
		];
	}
	return [];
}

function _getRate(tokenAddress: Bytes): BigInt {
	let cTokenList: Array<Bytes> = [
		Bytes.fromHexString('0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643') as Bytes,
		Bytes.fromHexString('0x39AA39c021dfbaE8faC545936693aC917d5E7563') as Bytes,
	];
	let yTokenList: Array<Bytes> = [
		Bytes.fromHexString('0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01') as Bytes,
		Bytes.fromHexString('0xd6aD7a6750A7593E092a9B218d66C0A814a3436e') as Bytes,
		Bytes.fromHexString('0x83f798e925BcD4017Eb265844FDDAbb448f1707D') as Bytes,
		Bytes.fromHexString('0x73a052500105205d34Daf004eAb301916DA8190f') as Bytes,

		Bytes.fromHexString('0xc2cb1040220768554cf699b0d863a3cd4324ce32') as Bytes,
		Bytes.fromHexString('0x26ea744e5b887e5205727f55dfbe8685e3b21951') as Bytes,
		Bytes.fromHexString('0xe6354ed5bc4b393a5aad09f21c46e101e692d447') as Bytes,
		Bytes.fromHexString('0x04bc0ab673d88ae9dbc9da2380cb6b79c4bca9ae') as Bytes,

		Bytes.fromHexString('0x99d1fa417f94dcd62bfe781a1213c092a47041bc') as Bytes,
		Bytes.fromHexString('0x9777d7e2b60bb01759d0e2f8be2095df444cb07e') as Bytes,
		Bytes.fromHexString('0x1be5d71f2da660bfdee8012ddc58d024448a0a59') as Bytes,
	];
	if (cTokenList.includes(tokenAddress)) {
		let cToken = cTokenContract.bind(tokenAddress as Address);
		let rate = cToken.exchangeRateCurrent();
		return rate;
	}
	if (yTokenList.includes(tokenAddress)) {
		let yToken = yTokenContract.bind(tokenAddress as Address);
		let rate = yToken.getPricePerFullShare();
		return rate;
	}
	return multiplier;
}
