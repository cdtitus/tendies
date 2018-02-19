import { Block } from '../blockchain/block';
import { SHA256 } from 'crypto-js';

export class BlockValidator {
    constructor(difficulty: number) {
        this.difficulty = difficulty;
    }

    difficulty: number;

    validate(block: Block): boolean {
        if (!this.validateHash(block)) {
            return false;
        }
        return true;
    }

    validateHash(block: Block): boolean {
        block.hash = this.calculateHash(block);

        if (block.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
            return false;
        } else {
            return true;
        }
    }

    calculateHash(block: Block): string {
        return SHA256(
            block.nonce +
            block.timestamp + 
            block.coinbase + 
            JSON.stringify(block.transactions) +
            block.prevHash
        ).toString();
    }
}
