import { Observable, Observer } from 'rxjs';
import { Account } from './account';
import { Block } from '../blockchain/block';
import { Transaction } from '../blockchain/transaction';
import { Blockchain } from '../blockchain/blockchain';
let levelup = require('levelup');
let leveldown = require('leveldown');
let rimraf = require('rimraf');

export class AccountsDb {
    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain;
        this.init();
    }

    blockchain: Blockchain;
    accounts: any;

    async init(): Promise<void> {
        await this.reset();

        let chainHeight = this.blockchain.height;
  
        for (let height = 0; height < chainHeight; height++) {
            let block = this.blockchain.getBlock(height + 1);

            await this.saveCoinbase(block);
            await this.saveTransactions(block);
        }
    }

    reset(): Promise<void> {
        return new Promise((resolve, reject) => {
            rimraf('./accounts-db', () => {
                this.accounts = levelup(leveldown('./accounts-db'));
                resolve();
            });
        });
    }

    saveCoinbase(block: Block) : Promise<void> {
        return new Promise((resolve, reject) => {
            this.updateBalance(block.coinbase).subscribe(() => {
                resolve();
            });
        });
    }

    saveTransactions(block: Block) : Promise<void> {
        return new Promise((resolve, reject) => {
            let accounts = this.convertToAccounts(block.transactions);

            this.updateBalances(accounts).subscribe(() => {
                resolve();
            });
        });
    }

    convertToAccounts(transactions: Transaction[]): Account[] {
        let accounts = [];

        transactions.forEach(tx => {
            let addressFromFound = false;
            let addressToFound = false;

            accounts.forEach(account => {
                if (account.address == tx.addressFrom) {
                    addressFromFound = true;
                    account.amount -= tx.amount;
                }

                if (account.address == tx.addressTo) {
                    addressToFound = true;
                    account.amount += tx.amount;
                }
            });

            if (!addressFromFound)
                accounts.push(new Account(tx.addressFrom, -(tx.amount)));

            if (!addressToFound)
                accounts.push(new Account(tx.addressTo, tx.amount));
        });

        return accounts;
    }

    getBalance(address: string): Observable<number> {
        return new Observable<number>((observer: Observer<number>) => {
            let balance = 0;

            this.accounts.get(address, (error, value: Buffer) => {
                if (!error) {
                    balance = Number(value);
                }

                observer.next(balance);
            });
        });
    }

    updateBalance(account: Account): Observable<void> {
        return new Observable<void>((observer: Observer<void>) => {
            let balance = 0;

            this.accounts.get(account.address, (error, value: Buffer) => {
                if (!error) {
                    balance = Number(value);
                }

                balance += account.amount;

                this.accounts.put(account.address, balance, (error) => {
                    if (error) console.log('I/O Error', error);
                    observer.next(null);
                });
            });
        });
    }

    updateBalances(accounts: any[]): Observable<void> {
        return new Observable<void>((observable: Observer<void>) => {
            this.accounts.createReadStream()
                .on('data', (data) => {
                    let account = new Account(data.key.toString(), Number(data.value));
                    accounts.push(account);
                })
                .on('error', (error) => {
                    console.log('LevelDb error!', error)
                })
                .on('end', () => {
                    accounts = this.mergeAccounts(accounts);
                    let dbElements = this.convertToDbElements(accounts);
    
                    this.accounts.batch(dbElements, (error) => {
                        if (error) console.log('I/O Error', error);
                        observable.next(null);
                    });
                });
        });
    }

    mergeAccounts(accounts: Account[]): Account[] {
        let found, mergedAccounts = [];

        accounts.forEach((account: Account) => {
            found = false;

            mergedAccounts.forEach((mergedAccount: Account) => {
                if (account.address == mergedAccount.address) {
                    found = true;
                    mergedAccount.amount += account.amount;
                }
            });

            if (!found) {
                mergedAccounts.push(account);
            }
        });

        return mergedAccounts;
    }

    convertToDbElements(accounts: Account[]): any {
        let dbElements = [];

        accounts.forEach(account => {
            let dbElement = {
                type: 'put',
                key: account.address,
                value: account.amount
            }
            
            dbElements.push(dbElement);
        });

        return dbElements;
    }
}
