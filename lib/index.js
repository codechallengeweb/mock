#!/usr/bin/env node

var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const db = require("./db.json");
const express = require("express");
const cors = require("cors");
const uuid_1 = require("uuid");

const encryptUser = (user) => crypto_1.createHash('sha256').update(JSON.stringify(user)).digest('base64');
const app = express();
// Automatically allow cross-origin requests
app.use(cors({ origin: true }));
app.use(express.json());
// Add middleware to authenticate requests
const auth = (req, res, next) => {
    var _a;
    const authorization = (_a = req.header('authorization')) === null || _a === void 0 ? void 0 : _a.replace(/bearer /i, '');
    const user = db.users.find(u => encryptUser(u) === authorization);
    if (authorization && user) {
        req.user = user;
        next();
    }
    else {
        res.status(401).end();
    }
};
function filterAndSort(req, transactions) {
    const sort = req.query.sort;
    const filter = req.query.description;
    let result = transactions;
    if (filter) {
        result = result.filter(t => { var _a; return (_a = t.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(filter.toLowerCase()); });
    }
    if (sort && ['asc', 'desc'].includes(sort)) {
        result = result
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (sort === 'desc') {
            result = result.reverse();
        }
    }
    return result;
}
app.get('/transactions', auth, (req, res) => {
    res.json(filterAndSort(req, db.transactions.filter(t => t.userId === req.user.id)));
});
app.get('/movements', (req, res) => {
    res.json(filterAndSort(req, db.transactions.map((_a) => {
        var { userId } = _a, movement = __rest(_a, ["userId"]);
        return movement;
    })));
});
app.post('/token', (req, res) => {
    const user = db.users.find(u => u.username === req.body.username && u.password === req.body.password);
    if (!user) {
        res.status(401).end();
    }
    else {
        res.json({
            accessToken: encryptUser(user)
        });
    }
});
app.post('/payments', (req, res) => {
    const personId = req.body.personId;
    const accountId = req.body.accountId;
    const amount = req.body.amount;
    const errorValidation = (!personId || !accountId || !amount);
    if (errorValidation) {
        res.status(400).end();
        return;
    }
    const randomResponse = Math.floor(Math.random() * 6);
    if (randomResponse === 0) {
        res.status(404).end();
        return;
    }
    if (randomResponse === 1) {
        res.status(422).end();
        return;
    }
    if (randomResponse > 1) {
        res.json({
            paymentId: uuid_1.v4()
        }).status(200).end();
    }
});

app.listen(8080, () => {
    console.log('Mock server running on port 8080');
})