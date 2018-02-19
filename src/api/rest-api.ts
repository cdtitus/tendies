import { ChickenTendiesNode } from '../server';
import { NodeController } from '../api/node-controller';
import * as express from 'express';
import * as bodyParser from 'body-parser';

export class RestApi {
    constructor(app: express.Application, node: ChickenTendiesNode) {
        this.app = app;
        this.node = node;
        
        this.config();
        this.createRoutes();
    }

    app: express.Application;
    node: ChickenTendiesNode;

    config(): void {
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
    }

    createRoutes(): void {
        let controller = new NodeController(this.node);

        this.app.route("/api/getBlock/:height").get(controller.getBlock.bind(controller));
        this.app.route("/api/getLatestHash").get(controller.getLatestHash.bind(controller));
        this.app.route("/api/getUnconfirmedTransactions").get(controller.getUnconfirmedTransactions.bind(controller));
        this.app.route("/api/getDifficulty").get(controller.getDifficulty.bind(controller));
        this.app.route("/api/getHeight").get(controller.getHeight.bind(controller));
        this.app.route("/api/getBalance/:address").get(controller.getBalance.bind(controller));

        this.app.route("/api/submitBlock").post(controller.submitBlock.bind(controller));
        this.app.route("/api/submitTransaction").post(controller.submitTransaction.bind(controller));
    }
}
