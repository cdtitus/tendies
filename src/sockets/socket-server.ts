import { Server } from 'http';
import { ChickenTendiesNode } from '../server';
import { Block } from '../blockchain/block';
import { Transaction } from '../blockchain/transaction';

import * as io from 'socket.io';

export class SocketServer {
    constructor(httpServer: Server, node: ChickenTendiesNode) {
        this.socketIOServer = io(httpServer);
        this.node = node;
        this.initEventListeners();
    }

    socketIOServer: SocketIO.Server;
    node: ChickenTendiesNode;

    private initEventListeners(): void {
        this.socketIOServer.on('connect', (socket: any) => {
            this.node.console('SocketServer.EventListener<connect>: %s has connected.', socket.id);
            this.node.addToPeerList(socket);
            this.node.connectToPeer(this.node.extractIpAddress(socket.handshake.address));
            
            socket.join('ChickenTendies', () => {
                this.socketIOServer.to('ChickenTendies').emit('message', 'test');
            });

            socket.on('getPeers', () => {
                socket.emit('peers', this.node.peers);
            });

            socket.on('getBlock', (height: number) => {
                socket.emit('block', this.node.blockchain.getBlock(height));
            });

            socket.on('getLatestBlock', () => {
                let height = this.node.blockchain.height;
                socket.emit('latestBlock', this.node.blockchain.getBlock(height));
            });

            socket.on('getUnconfirmedTransactions', () => {
                socket.emit('unconfirmedTransactions', this.node.unconfirmedTransactions);
            });

            socket.on('getDifficulty', () => {
                socket.emit('difficulty', this.node.difficulty);
            });

            socket.on('getHeight', () => {
                socket.emit('height', this.node.blockchain.height);
            });

            socket.on('disconnect', () => {
                this.node.console('SocketServer.EventListener<disconnect>: %s has disconnected.', socket.id);
                this.node.removeFromPeerList(socket);
            });
        });
    }

    broadcastBlock(block: Block): void {
        this.node.console('SocketServer.EventEmitter<block>: Broadcasting block with hash %s.', block.hash);
        this.socketIOServer.to('ChickenTendies').emit('block', block);
    }

    broadcastTransaction(tx: Transaction): void {
        this.node.console('SocketServer.EventEmitter<transaction>: Broadcasting transaction with hash %s.', tx.hash);
        this.socketIOServer.to('ChickenTendies').emit('transaction', tx);
    }
}
