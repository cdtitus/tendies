import { ChickenTendiesNode } from '../server';
import { Block } from '../blockchain/block';
import { Transaction } from '../blockchain/transaction';

import * as io from 'socket.io-client';

const PORT = 3000;

export class SocketClient {
    constructor(clientIpAddress: string, server: SocketIO.Server, node: ChickenTendiesNode) {
        this.client = io('http://' + clientIpAddress + ':' + PORT);
        this.server = server;
        this.node = node;
        this.clientIpAddress = clientIpAddress;
        this.initEventListeners();
    }

    client: SocketIOClient.Socket;
    server: SocketIO.Server;
    node: ChickenTendiesNode;
    clientIpAddress: string;

    initEventListeners(): void {
        this.client.on('connect', () => {
            this.node.console('SocketClient.EventListener<connect>: Connected to peer with ip address %s.', this.clientIpAddress);
        });

        this.client.on('peers', (peers: string[]) => {
            peers.forEach(peer => {
                if (!this.node.peers.includes(peer)) {
                    this.node.peers.push(peer);
                }
            });
        });

        this.client.on('transaction', (tx: Transaction) => {
            this.node.console('SocketClient.EventListener<submitTransaction>: Peer %s submitted transaction.', this.clientIpAddress);

            if (!this.node.unconfirmedTransactions.includes(tx)) {
                this.server.to('ChickenTendies').emit('transaction', tx);
                this.node.submitTransaction(tx);
            }
        });

        this.client.on('block', (block: Block) => {
            this.node.console('SocketClient.EventListener<submitBlock>: Peer %s submitted block.', this.clientIpAddress);
            this.node.submitBlock(block);
        });

        this.client.on('disconnect', () => {
            this.node.console('SocketClient.EventListener<disconnect>: Disconnected from peer with ip address %s.', this.clientIpAddress);
        });
    }
}
