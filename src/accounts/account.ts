export class Account {
    constructor(address: string = '', amount: number) {
        this.address = address;
        this.amount = amount;
    }

    address: string;
    amount: number;
}
