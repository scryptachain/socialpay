const fs = require('fs')
const csv = require('fast-csv')
let request = require("request")
const axios = require('axios')
require('dotenv').config()

async function rpc(method, params = []) {
    return new Promise(response => {
        var rpcuser = process.env.RPCUSER
        var rpcpassword = process.env.RPCPASSWORD
        var rpcendpoint = 'http://localhost:42223'
        
        let req = {
            url: rpcendpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from(rpcuser + ":" + rpcpassword).toString("base64")
            },
            body: JSON.stringify({
                id: Math.floor((Math.random() * 100000) + 1),
                params: params,
                method: method
            })
        };
        request(req, function (err, res, body) {
            try {
                response(JSON.parse(body))
            } catch (err) {
                response(body)
            }
        });
    })
}

async function init(){
    fs.createReadStream('out.csv')
    .pipe(csv.parse({ headers: true }))
    .on('data', async row => {
        let wallet = row.SID.split(':')
        let amount = parseFloat(5)
        let balance = await axios.get('https://idanodejs01.scryptachain.org/balance/' + wallet[0]).catch(err => {
            console.log(err)
        })
        if(balance !== undefined){
            if(balance.data.balance === 0){
                let res = await rpc('sendtoaddress', [wallet[0], amount])
                console.log(res)
            }else{
                console.log('Address ' + wallet[0] + ' have ' + balance.data.balance + ' LYRA')
            }
        }
    })
}

init()
