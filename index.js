"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Importing crypto to use cryptographic functions
 */
const crypto = __importStar(require("crypto"));
/**
 * Transaction class to define the transferring of funds from one party to another
 */
class Transaction {
    constructor(amount, payer, //public key
    payee //public key
    ) {
        this.amount = amount;
        this.payer = payer;
        this.payee = payee;
    }
    //Used to serialize cryptographic objects as strings to make them easier to work with
    toString() {
        return JSON.stringify(this);
    }
}
/**
 * A Block is a container for multiple transactions, similar to an element in a linked-list
 *
 * The hash cannot reconstruct a value but can be used to compare two values
 */
class Block {
    constructor(previousHash, transaction, timestamp = Date.now()) {
        this.previousHash = previousHash;
        this.transaction = transaction;
        this.timestamp = timestamp;
        //Onetime use random number
        this.nonce = Math.round(Math.random() * 999999999);
    }
    get hash() {
        const str = JSON.stringify(this);
        //Specify the hashing algorithm to be used
        const hash = crypto.createHash('SHA256');
        //hash the string version of the block then return the hash digest
        hash.update(str).end();
        return hash.digest('hex');
    }
}
/**
 * A chain will contain all of our Blocks. We only want one chain so we will setup a Singleton instance
 */
class Chain {
    constructor() {
        //Define the genesis block
        this.chain = [new Block("", new Transaction(100, 'genesis', 'Brandon'))];
    }
    //We will often need to grab the last block in the chain
    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }
    //Will attempt to find anumber that, when added to the nonce, creates a hash starting with 0000
    mine(nonce) {
        let solution = 1;
        console.log("** MINING **");
        //The only real way to figure out the value is by brute force
        while (true) {
            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();
            const attempt = hash.digest('hex');
            if (attempt.substr(0, 4) === '0000') {
                console.log(`Solved: ${solution}`);
                return solution;
            }
            solution += 1;
        }
    }
    //Define a method to add a block to the chain
    addBlock(transaction, senderPublicKey, signature) {
        const newBlock = new Block(this.lastBlock.hash, transaction);
        this.chain.push(newBlock);
        const verifier = crypto.createVerify('SHA256');
        verifier.update(transaction.toString());
        const isValid = verifier.verify(senderPublicKey, signature);
        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            //Basic proof of work 
            this.mine(newBlock.nonce);
            this.chain.push(newBlock);
        }
    }
}
Chain.instance = new Chain();
/**
 * A wallet is a wrapper for a public key and a private key to ensure the validity of transactions
 */
class Wallet {
    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        this.publicKey = keypair.publicKey;
        this.privateKey = keypair.privateKey;
    }
    sendMoney(amount, payeePublickey) {
        const transaction = new Transaction(amount, this.publicKey, payeePublickey);
        const sign = crypto.createSign('SHA256');
        sign.update(transaction.toString()).end();
        //Similar to an OTP
        const signature = sign.sign(this.privateKey);
        //Add the transaction to the blockchain
        Chain.instance.addBlock(transaction, this.publicKey, signature);
    }
}
//Example usage
const Brandon = new Wallet();
const Bob = new Wallet();
const John = new Wallet();
Brandon.sendMoney(50, Bob.publicKey);
Bob.sendMoney(20, Brandon.publicKey);
John.sendMoney(5, Brandon.publicKey);
console.log(Chain.instance);
