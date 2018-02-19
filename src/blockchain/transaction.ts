import { SHA256 } from 'crypto-js';
import * as KJUR from 'jsrsasign';

export class Transaction {
    constructor(addressFrom: string = '', addressTo: string = '', amount: number = 0, publicKey: string = '') {
        this.addressFrom = addressFrom;
        this.addressTo = addressTo;
        this.amount = amount;
        this.publicKey = publicKey;
    }

    hash: string;
    addressFrom: string;
    addressTo: string;
    amount: number;
    publicKey: string;
    signature: string;

    sign(privateKey: string): void {
        let algorithm = {'alg': 'SHA256withECDSA'};
        let signature = new KJUR.crypto.Signature(algorithm);
        
        signature.init({'d': privateKey, 'curve': 'secp256k1'});
        signature.updateString(JSON.stringify(this));

        this.signature = signature.sign();
        this.hash = this.getHash();
    }

    getHash(): string {
        return SHA256(
            this.addressFrom +
            this.addressTo +
            this.amount +
            this.publicKey +
            this.signature
        ).toString();
    }

    isValid(): boolean {
        let algorithm = {'alg': 'SHA256withECDSA', 'prov': 'cryptojs/jsrsa'};
        let config = {'xy': this.publicKey, 'curve': 'secp256k1'};
        let tx = new Transaction(this.addressFrom, this.addressTo, this.amount, this.publicKey);
        let signature = new KJUR.crypto.Signature(algorithm);

        signature.init(config);
        signature.updateString(JSON.stringify(tx));

        return signature.verify(this.signature);
    }

    fromJson(json: string): Transaction {
        let jsonObject = JSON.parse(json);
        let tx = new Transaction();

        tx.addressFrom = jsonObject.addressFrom;
        tx.addressTo = jsonObject.addressTo;
        tx.amount = jsonObject.amount;
        tx.publicKey = jsonObject.publicKey;
        tx.signature = jsonObject.signature;
        tx.hash = jsonObject.hash;
        
        return tx;
    }
}
