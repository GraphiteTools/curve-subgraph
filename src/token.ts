import { BigInt } from "@graphprotocol/graph-ts";

import { Transfer } from "../generated/USDC-DAI Pool Token/erc20";
import { User, Balance } from "../generated/schema";

export function handleTransfer(event: Transfer): void {
	let address = event.address;
	let from = event.params.from;
	let to = event.params.to;
	let amount = event.params.value;

	let fromUserId = from.toHexString();
	let fromUser = User.load(fromUserId);
	if (!fromUser) {
		fromUser = new User(fromUserId);
		fromUser.save();
	}
	let toUserId = to.toHexString();
	let toUser = User.load(toUserId);
	if (!toUser) {
		toUser = new User(toUserId);
		toUser.save();
	}

	let poolAddress = _getTokenPool(address.toHexString());
	let fromUserBalanceId = fromUserId + '-' + poolAddress;
	let fromUserBalance = Balance.load(fromUserBalanceId);
	if (!fromUserBalance) {
		fromUserBalance = new Balance(fromUserBalanceId);
		fromUserBalance.user = fromUserId;
		fromUserBalance.pool = poolAddress;
		fromUserBalance.amount = BigInt.fromI32(0);
	}
	fromUserBalance.amount -= amount;
	fromUserBalance.save();
	let toUserBalanceId = toUserId + '-' + poolAddress;
	let toUserBalance = Balance.load(toUserBalanceId);
	if (!toUserBalance) {
		toUserBalance = new Balance(toUserBalanceId);
		toUserBalance.user = toUserId;
		toUserBalance.pool = poolAddress;
		toUserBalance.amount = BigInt.fromI32(0);
	}
	toUserBalance.amount += amount;
	toUserBalance.save();
}

function _getTokenPool(tokenAddress: String): String {
	if (tokenAddress == '0x3740fb63ab7a09891d7c0d4299442a551d06f5fd') {
		return '0x2e60cf74d81ac34eb21eeff58db4d385920ef419';
	}
	if (tokenAddress == '0x845838df265dcd2c412a1dc9e959c7d08537f8a2') {
		return '0xa2b47e3d5c44877cca798226b7b8118f9bfb7a56';
	}
	if (tokenAddress == '0x9fc689ccada600b6df723d9e47d84d76664a1f23') {
		return '0x52ea46506b9cc5ef470c5bf89f17dc28bb35d85c';
	}
	if (tokenAddress == '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8') {
		return '0x45f783cce6b7ff23b2ab2d70e416cdb7d6055f51';
	}
	if (tokenAddress == '0x3b3ac5386837dc563660fb6a0937dfaa5924333b') {
		return '0x79a8c46dea5ada233abaffd40f3a0a2b1e5a4f27';
	}
	if (tokenAddress == '0xc25a3a3b969415c80451098fa907ec722572917f') {
		return '0xa5407eae9ba41422680e2e00537571bcc53efbfd';
	}
	if (tokenAddress == '0xd905e2eaebe188fc92179b6350807d8bd91db0d8') {
		return '0x06364f10b501e868329afbc005b3492902d6c763';
	}
	return '';
}
