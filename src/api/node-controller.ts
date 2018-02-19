import { Request, Response, NextFunction } from 'express';
import { ChickenTendiesNode } from '../server';

export class NodeController {
    constructor(node: ChickenTendiesNode) {
        this.node = node;
    }

    node: ChickenTendiesNode;

    getBlock(req: Request, res: Response, next: NextFunction): void {
        let block = this.node.blockchain.getBlock(req.params.height);
        res.json(block);
    }

    getLatestHash(req: Request, res: Response, next: NextFunction): void {
        let block = this.node.blockchain.getBlock(this.node.blockchain.height);
        res.json(block.hash);
    }

    getUnconfirmedTransactions(req: Request, res: Response, next: NextFunction): void {
        res.json(this.node.unconfirmedTransactions);
    }

    getHeight(req: Request, res: Response, next: NextFunction): void {
        res.json(this.node.blockchain.height);
    }

    getDifficulty(req: Request, res: Response, next: NextFunction): void {
        res.json(this.node.difficulty);
    }

    getBalance(req: Request, res: Response, next: NextFunction): void {
        this.node.accounts.getBalance(req.params.address).subscribe((bal: number) => {
            res.json(bal);
        });
    }

    submitBlock(req: Request, res: Response, next: NextFunction): void {
        this.node.submitBlock(req.body);
        res.sendStatus(200);
    }

    submitTransaction(req: Request, res: Response, next: NextFunction): void {
        this.node.submitTransaction(req.body);
        res.sendStatus(200);
    }
}
