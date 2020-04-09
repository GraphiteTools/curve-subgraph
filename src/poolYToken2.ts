import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";

import { TokenExchangeUnderlying, TokenExchange, AddLiquidity, RemoveLiquidity, RemoveLiquidityImbalance } from "../generated/yToken Pool/poolYToken";
import { yToken as yTokenContract } from "../generated/yToken Pool/yToken";
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
		Bytes.fromHexString('0xC2cB1040220768554cf699b0d863A3cd4324ce32') as Bytes,
		Bytes.fromHexString('0x26EA744E5B887E5205727f55dFBE8685e3b21951') as Bytes,
		Bytes.fromHexString('0xE6354ed5bC4b393a5Aad09f21c46E101e692d447') as Bytes,
		Bytes.fromHexString('0x04bC0Ab673d88aE9dbC9DA2380cB6B79C4BCa9aE') as Bytes,
	];
	pool.assets = assets;
	let amounts: Array<BigInt> = [
		new BigInt(0),
		new BigInt(0),
		new BigInt(0),
		new BigInt(0),
	];
	pool.amounts = amounts;
	pool.totalAmount = new BigInt(0);
	pool.save();
}

function _getRates(): Array<BigInt> {
	let yTokenList: Array<Address> = [
		Address.fromHexString('0xC2cB1040220768554cf699b0d863A3cd4324ce32') as Address,
		Address.fromHexString('0x26EA744E5B887E5205727f55dFBE8685e3b21951') as Address,
		Address.fromHexString('0xE6354ed5bC4b393a5Aad09f21c46E101e692d447') as Address,
		Address.fromHexString('0x04bC0Ab673d88aE9dbC9DA2380cB6B79C4BCa9aE') as Address,
	];
	let rates: Array<BigInt> = [];
	for (let i = 0; i < yTokenList.length; i++) {
		let yTokenAddress = yTokenList[i];
		if (yTokenAddress != nullAddress) {
			let yToken = yTokenContract.bind(yTokenAddress);
			let rate = yToken.getPricePerFullShare();
			rates.push(rate);
		} else {
			rates.push(multiplier);
		}
	}
	return rates;
}
