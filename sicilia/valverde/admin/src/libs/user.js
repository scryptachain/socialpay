let ScryptaCore = require("@scrypta/core")
const scrypta = new ScryptaCore(true)

export default {
    async auth() {
        let wallet = await scrypta.returnDefaultIdentity();
        let SIDS = wallet.split(":");
        let address = SIDS[0];
        let identity = await scrypta.returnIdentity(address);
        wallet = identity;
        let sidechains = await scrypta.get('/sidechain/list')
        let owner = {}
        let selected = ''
        for(let x in sidechains.data){
            let sidechain = sidechains.data[x]
            if(sidechain.genesis.owner === address){
                selected = sidechain.address
                owner[sidechain.address] = sidechain
            }
        }

        if(localStorage.getItem('chain') !== null){
            selected = localStorage.getItem('chain')
        }

        return {
            identity: wallet,
            owner: owner,
            chain: selected
        }
    }
}