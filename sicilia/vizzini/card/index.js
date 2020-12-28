var CoinKey = require('coinkey')
var crypto = require('crypto')
var argv = require('minimist')(process.argv.slice(2));
const format = require('biguint-format');
const ScryptaCore = require('@scrypta/core')
const scrypta = new ScryptaCore
var QRCode = require('qrcode')
const PDFDocument = require('pdfkit');
const fs = require('fs')

function randomC (qty) {
    var x= crypto.randomBytes(qty);
    return format(x, 'dec');
}
function random (low, high) {
    return randomC(4)/Math.pow(2,4*8-1) * (high - low) + low;
}

var number = 1
if(argv.g !== undefined){
    number = argv.g
}

var index = 0
if(argv.s !== undefined){
    index = argv.s
    console.log('STARTING FROM ' + index)
}

var cache = []
var addresses = []

async function generate(){
    var password = random(10000,99999).toFixed(0)
    let address = await scrypta.createAddress(password, false)
    cache.push(
        {
            key: index,
            sid: address.walletstore,
            password: password
        }
    )
    index++
}

async function savePdf(index, sid, password){
    return new Promise(response => {
        let exp = sid.split(':')
        let public = exp[0]
        let front = new PDFDocument({ layout: 'landscape', size: [558.66,880], margin:0}).font('Courier').fontSize(18).fillColor('#163457')
        console.log('GENERATING PDF FOR #'+index+' - ' + public)
        QRCode.toDataURL(public,{ errorCorrectionLevel: 'H', margin: 1 }, function (err, publicImage) {
            front.pipe(fs.createWriteStream('./prints/'+index+'_front.pdf'))
            front.image('./assets/front.png', 0, 0, {width: 880, height: 558.66})
            front.text(index, 800, 482)
            front.end()
            let back = new PDFDocument({ layout: 'landscape', size: [558.66,880]}).font('Courier')
            QRCode.toDataURL(sid,{ errorCorrectionLevel: 'M', margin: 1}, function (err, sidImage) {
                back.pipe(fs.createWriteStream('./prints/'+index+'_back.pdf'))
                back.image('./assets/back.png', 0, 0, {width: 880, height: 558.66})
                back.image(sidImage, 105, 97, {width: 370})
                back.end()
                let qr = new PDFDocument({ layout: 'landscape', size: [500,500]}).font('Courier')
                QRCode.toDataURL(sid,{ errorCorrectionLevel: 'M', margin: 1}, function (err, sidImage) {
                    qr.pipe(fs.createWriteStream('./prints/'+index+'_qr.pdf'))
                    qr.image(sidImage, 0, 0, {width: 500, height: 500})
                    qr.end()
                    setTimeout(function(){
                        response(true)
                    },500)
                })
            })
        })

    })
}

async function init(){
    for(let i = 1; i <= number; i++){
        await generate()
    }
    for(let k in cache){
        let address = cache[k]
        let check = await scrypta.readKey(address.password, address.sid)
        if(check !== false){
            addresses.push(address)
            await savePdf(address.key, address.sid, address.password)
        }
    }

    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({
        path: 'out.csv',
        header: [
            {id: 'key', title: 'Key'},
            {id: 'password', title: 'Password'},
            {id: 'sid', title: 'SID'},
        ]
    });
    csvWriter.writeRecords(addresses).then(()=> console.log('The CSV file was written successfully with ' + number + ' sid.'))

}

init()