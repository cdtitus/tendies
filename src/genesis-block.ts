import { Block } from './blockchain/block';
import { Account } from './accounts/account';
import { BlockValidator } from './validation/block-validator';

export class GenesisBlock {
    create(difficulty: number): Block {
        let date = new Date();
        let timestamp = date.getTime();
        let address = 'c05cf8134f544fcac55fe77578651d773506219fd03e245d65696419294a985b';
        let block = new Block(
            timestamp.toString(),
            new Account(address, 8400000),
            [],
            ''
        );

        console.log('% Calculating hash for genesis block...');
        let validator = new BlockValidator(difficulty);

        block.hash = validator.calculateHash(block);
        while (block.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
            block.nonce++;
            block.hash = validator.calculateHash(block);
        }

        console.log('+ Genesis block created.');
        return block;
    }
}
