import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { TokenExchangeUnderlying, TokenExchange, AddLiquidity, RemoveLiquidity, RemoveLiquidityImbalance } from "../generated/USDC-DAI-USDT Pool/poolUsdcDaiUsdt";
import { cToken as cTokenContract } from "../generated/USDC-DAI-USDT Pool/cToken";
import { Pool } from "../generated/schema";

let nullAddress = Address.fromHexString('0x0000000000000000000000000000000000000000') as Address;

let halfMultiplier = BigInt.fromI32(1000000000);
let multiplier = halfMultiplier * halfMultiplier;

export function handleAddLiquidity(event: AddLiquidity): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let newSupply = event.params.token_supply;

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

export function handleRemoveLiquidity(event: RemoveLiquidity): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let newSupply = event.params.token_supply;

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

export function handleRemoveLiquidityImbalance(event: RemoveLiquidityImbalance): void {
	let address = event.address;
	let userAddress = event.params.provider;
	let amounts = event.params.token_amounts;
	let fees = event.params.fees;
	let newSupply = event.params.token_supply;

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

	let rates = _getRates();

	let poolAmounts = pool.amounts;
	poolAmounts[soldId] += tokensSold * multiplier / rates[soldId];
	poolAmounts[boughtId] -= tokensBought * multiplier / rates[boughtId];
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

function _initPool(address: Address): void {
	let pool = new Pool(address.toHexString());
	let assets: Array<Bytes> = [
		Bytes.fromHexString('0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643') as Bytes,
		Bytes.fromHexString('0x39AA39c021dfbaE8faC545936693aC917d5E7563') as Bytes,
		Bytes.fromHexString('0xdAC17F958D2ee523a2206206994597C13D831ec7') as Bytes,
	];
	pool.assets = assets;
	let amounts: Array<BigInt> = [
		new BigInt(0),
		new BigInt(0),
		new BigInt(0),
	];
	pool.amounts = amounts;
	pool.totalAmount = new BigInt(0);
	pool.save();
}

function _getRates(): Array<BigInt> {
	let cTokenList: Array<Address> = [
		Address.fromHexString('0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643') as Address,
		Address.fromHexString('0x39AA39c021dfbaE8faC545936693aC917d5E7563') as Address,
		nullAddress,
	];
	let rates: Array<BigInt> = [];
	for (let i = 0; i < cTokenList.length; i++) {
		let cTokenAddress = cTokenList[i];
		if (cTokenAddress != nullAddress) {
			let cToken = cTokenContract.bind(cTokenAddress);
			let rate = cToken.exchangeRateCurrent();
			rates.push(rate);
		} else {
			rates.push(multiplier);
		}
	}
	return rates;
}
