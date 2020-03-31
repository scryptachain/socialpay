module.exports = class ScryptaDB {
    constructor(isBrowser = false, collections = []){
        const db = this 
        db.isBrowser = isBrowser
        db.data = {}
        db.dir = './db'
        db.collections = collections
        if(!isBrowser){
            db.fs = require('fs')
            if (!db.fs.existsSync(db.dir)) {
                db.fs.mkdirSync(db.dir)
            }
        }
    }

    loadBrowserDB(){
        const db = this
        return new Promise(response => {
            const collections = db.collections
            for(let x in collections){
                if (localStorage.getItem(collections[x]) !== null) {
                    db.data[collections[x]] = JSON.parse(localStorage.getItem(collections[x]))
                }else{
                    db.data[collections[x]] = []
                    localStorage.setItem(collections[x], JSON.stringify([]))
                }
            }
            response(true)
        })
    }

    loadNodeDB(){
        const db = this
        return new Promise(response => {
            db.dir = './db';
            const collections = db.collections
            if (!db.fs.existsSync(db.dir)){
                db.fs.mkdb.dirSync(db.dir)
            }
            for(let x in collections){
                if (db.fs.existsSync(db.dir + '/' + collections[x] + '.bson')) {
                    db.data[collections[x]] = JSON.parse(db.fs.readFileSync(db.dir + '/' + collections[x] + '.bson'))
                }else{
                    db.data[collections[x]] = []
                    db.fs.writeFileSync(db.dir + '/' + collections[x] + '.bson', '[]')
                }
            }
            response(true)
        })
    }

    async put(collection, doc){
        const db = this
        if(db.isBrowser){
            await db.loadBrowserDB()
            let found = false
            for(let x in db.data[collection]){
                if(JSON.stringify(doc) === JSON.stringify(db.data[collection][x])){
                    found = true
                }
            }
            if(!found){
                db.data[collection].push(doc)
                localStorage.setItem(collection, JSON.stringify(db.data[collection]))
            }
            return true
        }else{
            await db.loadNodeDB()
            let found = false
            for(let x in db.data[collection]){
                if(JSON.stringify(doc) === JSON.stringify(db.data[collection][x])){
                    found = true
                }
            }
            if(!found){
                db.data[collection].push(doc)
                db.fs.writeFileSync(db.dir + '/' + collection + '.bson', JSON.stringify(db.data[collection]))
            }
            return true
        }
    }

    async get(collection, selector = '', id = ''){
        const db = this
        if(db.isBrowser){
            await db.loadBrowserDB()
        }else{
            await db.loadNodeDB()
        }
        if(selector !== '' && id !== ''){
            let found = false
            let doc
            for(let x in db.data[collection]){
                if(!found){
                    if(db.data[collection][x][selector] === id){
                        found = true
                        doc = db.data[collection][x]
                    }
                }
            }

            if(found){
                return doc
            }else{
                return false
            }
        }else{
            return db.data[collection]
        }
    }

    async update(collection, selector, id, doc){
        const db = this
        if(db.isBrowser){
            await db.loadBrowserDB()
        }else{
            await db.loadNodeDB()
        }

        let found = false
        for(let x in db.data[collection]){
            if(!found){
                if(db.data[collection][x][selector] === id){
                    found = true
                    db.data[collection][x] = doc
                }
            }
        }

        if(found){
            if(db.isBrowser){
                localStorage.setItem(collection, JSON.stringify(db.data[collection]))
            }else{
                db.fs.writeFileSync(db.dir + '/' + collection + '.bson', JSON.stringify(db.data[collection]))
            }
            return doc
        }else{
            return false
        }
    }

    async delete(collection, selector, id){
        const db = this
        if(db.isBrowser){
            await db.loadBrowserDB()
        }else{
            await db.loadNodeDB()
        }

        let found = false
        let updated = []
        for(let x in db.data[collection]){
            if(db.data[collection][x][selector] === id){
                found = true
            }else{
                updated.push(db.data[collection][x])
            }
        }
        
        if(found){
            if(db.isBrowser){
                localStorage.setItem(collection, JSON.stringify(updated))
            }else{
                db.fs.writeFileSync(db.dir + '/' + collection + '.bson', JSON.stringify(updated))
            }
            return true
        }else{
            return false
        }
    }

    async destroy(collection){
        const db = this
        db.data[collection] = []
        if(db.isBrowser){
            await db.loadBrowserDB()
            localStorage.setItem(collection, '[]')
        }else{
            await db.loadNodeDB()
            db.fs.writeFileSync(db.dir + '/' + collection + '.bson', '[]')
        }
        return true
    }
}