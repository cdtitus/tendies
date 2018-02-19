
// chris
// privkey: f2451334ae17fd0fce262a67be3c6eeb6ecc16334283a786eef78e4c466c04cb
//  pubkey: 040544ef969326d29ebcb0f3654892f6792a8a5aa9dae452a3f248bc8fc2cd7030cef5ee9a0b68e4f3a5c790d0042ef3b3d9a492286978079a8c64ac8e4ba593b0
// address: c05cf8134f544fcac55fe77578651d773506219fd03e245d65696419294a985b

// jon
// privkey: b4cd7d1c27d891befbac4495a5b18bb907dd7a6ff097a8f955f557c2491e131d
//  pubkey: 04260a7c01342b33c6aadde10aa26eca5d8667261b77a7327a5ba3c8d0a79b788fe58fa303e34fda26a67ee9b1e9aaa372d6b5edc63cdf396278c867b000344413
// address: a96d9ec7f6e1ef6b2f71bfcf5886007bad307ccb1a57f9ddba027b7325213eed

import * as express from 'express';
import { createServer, Server } from 'http';
import { RestApi } from './api/rest-api';
import { Blockchain } from './blockchain/blockchain';
import { Block } from './blockchain/block';
import { Transaction } from './blockchain/transaction';
import { AccountsDb } from './accounts/accounts-db';
import { BlockValidator } from './validation/block-validator';
import { SocketServer } from './sockets/socket-server';
import { SocketClient } from './sockets/socket-client';
import * as clientIo from 'socket.io-client';
let DEFAULT_PORT = 3000;
const MINE_REWARD: number = 50;

export class ChickenTendiesNode {
    constructor() {
        this.createServer();
        this.initRestApi();
        this.initSocketEvents();
        this.initBlockchain();
        this.listen();
    }

    app: express.Application;
    server: Server;
    socketServer: SocketServer;
    seedNode: string = 'http://10.0.0.94:3000';
    peers: Array<string> = [];
    blockchain: Blockchain = new Blockchain();
    accounts: AccountsDb;
    difficulty: number = 6;
    unconfirmedTransactions: Transaction[] = [];
    test;

    private createServer(): void {
        this.app = express();
        this.server = createServer(this.app);
    }

    private initRestApi(): void {
        new RestApi(this.app, this);
    }

    private initSocketEvents(): void {
        this.socketServer = new SocketServer(this.server, this);
    }

    private initBlockchain(): void {
        this.blockchain = new Blockchain();
        this.accounts = new AccountsDb(this.blockchain);
    }

    private listen(): void {
        this.server.listen(DEFAULT_PORT, () => {
            this.console('ChickenTendies server listening on port %s.', DEFAULT_PORT);
            // console.log('* Connecting to seed node on port %s.', DEFAULT_PORT);
            // this.connectToNode(this.seedNode);
        });
    }

    connectToPeer(uri: string): void {
        new SocketClient(uri, this.socketServer.socketIOServer, this);
    }

    addToPeerList(socket: SocketIO.Socket): void {
        let address = this.extractIpAddress(socket.handshake.address);

        if (this.peers.indexOf(address) < 0) {
            this.peers.push(address);
        }
    }

    removeFromPeerList(socket: SocketIO.Socket): void {
        let address = this.extractIpAddress(socket.handshake.address);

        this.peers.forEach((peer: any) => {
            let index = this.peers.indexOf(address, 0);

            if (index > -1) {
                this.peers.splice(index, 1);
            }
        });
    }

    async submitBlock(block: Block): Promise<void> {
        let isValid = new BlockValidator(this.difficulty).validate(block);
        let currentBlock = this.blockchain.getBlock(this.blockchain.height);
        block.prevHash = currentBlock.hash;
        
        // verify tx amounts somewhere

        if (isValid) {
            this.blockchain.pushBlock(block);
            await this.accounts.saveCoinbase(block);
            await this.accounts.saveTransactions(block);
            this.removeConfirmedTransactions(block);
            this.socketServer.broadcastBlock(block);
        }
    }

    submitTransaction(json: Transaction): void {
        let tx = new Transaction().fromJson(JSON.stringify(json));

        this.accounts.getBalance(tx.addressFrom).subscribe((balance: Number) => {
            let fundsAvailable, isValid;

            balance >= tx.amount ? fundsAvailable = true : fundsAvailable = false;
            
            if (fundsAvailable && tx.isValid()) {
                this.unconfirmedTransactions.push(tx);
                this.socketServer.broadcastTransaction(tx);
            }
        });
    }

    removeConfirmedTransactions(block: Block) {
        this.unconfirmedTransactions.forEach((utx: Transaction) => {
            block.transactions.forEach((tx: Transaction) => {
                if (JSON.stringify(utx) == JSON.stringify(tx)) {
                    let index = this.unconfirmedTransactions.indexOf(utx, 0);
                    
                    if (index > -1) {
                        this.unconfirmedTransactions.splice(index, 1);
                    }
                }
            });
        });
    }

    extractIpAddress(string: string): string {
        let regEx = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        return string.match(regEx)[0];
    }

    console(message: string, object: any = null): void {
        let date = new Date();
        let timestamp = '[' + date.toLocaleTimeString() + '] - ';

        if (object) {
            console.log(timestamp + message, object);
        } else {
            console.log(timestamp + message);
        }
    }
}

let chickenTendies = new ChickenTendiesNode();
