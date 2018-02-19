import { Account } from '../accounts/account';

export class Block {
    constructor(timestamp: string, coinbase: Account, transactions: any, prevHash: string) {
        this.timestamp = timestamp;
        this.coinbase = coinbase;
        this.transactions = transactions;
        this.prevHash = prevHash;
    }

    hash: string;
    nonce: number = 0;
    timestamp: string;
    coinbase: Account;
    transactions: any[];
    prevHash: string;
}
