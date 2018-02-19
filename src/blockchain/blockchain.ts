import { Block } from './block';
import * as fs from 'fs';

const DATA_PATH: string = 'data/ckn_';

export class Blockchain {
    constructor() {
        this.height = this.getHeight();
        this.init();
    }

    height: number;

    init(): void {
        let prevBlock = null;
  
        for (let height = 0; height < this.height; height++) {
            let curBlock = this.getBlock(height + 1);

            if (prevBlock !== null) {
                if (curBlock.prevHash !== prevBlock.hash) {
                    console.log('*** Blockchain is corrupted. ***');
                    return;
                }
            }

            prevBlock = curBlock;
        }
    }

    getHeight(): number {
        let height = 0;

        while (fs.existsSync(DATA_PATH + (height + 1).toString())) {
            height++;
        }

        return height;
    }

    getBlock(height: number): Block {
        if (!fs.existsSync(DATA_PATH + height.toString())) {
            return null;
        }

        let rawData = fs.readFileSync(DATA_PATH + height.toString(), 'utf8');
        let jsonData: any = JSON.parse(rawData);

        let block = new Block(
            jsonData.timestamp,
            jsonData.coinbase,
            jsonData.transactions,
            jsonData.prevHash
        );
        block.nonce = jsonData.nonce;
        block.hash = jsonData.hash;

        return block;
    }

    pushBlock(block: Block): void {
        this.height++;

        let pathToWrite = (DATA_PATH + this.height).toString();
        fs.writeFileSync(pathToWrite, JSON.stringify(block));
        
        console.log('+ Block added to chain.', block);
    }
}
