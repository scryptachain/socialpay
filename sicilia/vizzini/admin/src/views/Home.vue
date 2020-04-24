<template>
  <div class="main">
    <div class="container">
      <div v-if="user.chain !== '-' && user.owner[user.chain] !== undefined">
        <h1>Dashboard</h1>
        <h3>{{ user.owner[user.chain].genesis.name }} ({{ user.owner[user.chain].genesis.symbol }})</h3>
        <hr>
      </div>
      <div class="columns">
        <div class="column">
          <div class="card">
            <div class="card-content">
              <p class="title">
                {{ totalUsers }}
              </p>
              <p class="subtitle">
                utenti totali
              </p>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="card">
            <div class="card-content">
              <p class="title">
                {{ users.length }}
              </p>
              <p class="subtitle">
                Utenti censiti
              </p>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="card">
            <div class="card-content">
              <p class="title">
                {{ activeUsers.length }}
              </p>
              <p class="subtitle">
                di cui attivi
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="columns">
        <div class="column">
          <div class="card">
            <div class="card-content">
              <p class="title">
                {{ last24HUsers.length }}
              </p>
              <p class="subtitle">
                attivi ultime 24 ore
              </p>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="card">
            <div class="card-content">
              <p class="title">
                {{ last1WUsers.length }}
              </p>
              <p class="subtitle">
                attivi ultima settimana
              </p>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="card">
            <div class="card-content">
              <p class="title">
                {{ last1MUsers.length }}
              </p>
              <p class="subtitle">
                attivi ultimo mese
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="columns">
        <div class="column">
          <div class="card">
            <div class="card-content">
              <p class="title">
                {{ totalSupply }}
              </p>
              <p class="subtitle">
                {{ user.owner[user.chain].genesis.symbol }} in totale
              </p>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="card">
            <div class="card-content">
              <p class="title">
                {{ circularSupply }}
              </p>
              <p class="subtitle">
                {{ user.owner[user.chain].genesis.symbol }} in circolazione
              </p>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="card">
            <div class="card-content">
              <p class="title">
                {{ burnedSupply }}
              </p>
              <p class="subtitle">
                {{ user.owner[user.chain].genesis.symbol }} bruciati
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
let ScryptaCore = require("@scrypta/core")
import User from '../libs/user.js'
import ScryptaDB from '../libs/db.js'

export default {
  name: 'Home',
  data() {
    return {
      db: new ScryptaDB(true, ['users', 'settings']),
      scrypta: new ScryptaCore(true),
      users: [],
      transactions: [],
      activeUsers: [],
      parsedUsers: {},
      totalUsers: 0,
      last24HUsers: [],
      last1WUsers: [],
      last1MUsers: [],
      totalSupply: 0,
      circularSupply: 0,
      burnedSupply: 0,
      user: {
        owner: {
          '-': {
            genesis: {
              name: '-',
              symbol: '-'
            }
          }
        },
        chain: '-',
        identity: {
          address: '',
          wallet: ''
        }
      }
    };
  },
  async mounted() {
    const app = this;
    app.user = await User.auth()
    app.users = await app.db.get('users')
    for(let x in app.users){
      let uu = app.users[x]
      if(uu.name !== ''){
        app.parsedUsers[uu.address] = uu.name 
      }else{
        app.parsedUsers[uu.address] = uu.address 
      }
    }
    let response = await app.scrypta.post('/sidechain/scan', { sidechain_address: app.user.chain })
    let lastblock = await app.scrypta.get('/block/last')
    let transactions = [];
    for (let x in response.data) {
      let value = 0;
      let to = "";
      for (let y in response.data[x].transaction.outputs) {
        if (y != response.data[x]["address"]) {
          value += response.data[x].transaction.outputs[y];
          to = y;
        }
      }
      if(to === ""){
        for (let y in response.data[x].transaction.outputs) {
          value += response.data[x].transaction.outputs[y];
          to = y;
        }
      }
      let from = "";
      if (response.data[x].transaction["inputs"][0]['vout'] === 'genesis') {
        from = 'GENESIS'
      }else if(response.data[x].transaction["inputs"][0]['vout'] === 'reissue') {
        from = 'REISSUE'
      }else{
        from = response.data[x]["address"]
      }
      if(from !== undefined){
        let block
        if(response.data[x].block > 0){
          block = response.data[x].block
        }else{
          block = 'unconfirmed'
        }

        let transaction = {
          sxid: response.data[x].sxid,
          amount: value,
          from: from,
          to: to,
          block: block
        };
        let last = lastblock.data.height
        let last24H = last - 1440
        let last1W = last - 10080
        let last1M = last - 43200

        if(block >= last24H){
          if(app.last24HUsers.indexOf(to) === -1 && app.parsedUsers[to] !== undefined){
            app.last24HUsers.push(to)
          }
        }

        if(block >= last1W){
          if(app.last1WUsers.indexOf(to) === -1 && app.parsedUsers[to] !== undefined){
            app.last1WUsers.push(to)
          }
        }

        if(block >= last1M){
          if(app.last1MUsers.indexOf(to) === -1 && app.parsedUsers[to] !== undefined){
            app.last1MUsers.push(to)
          }
        }

        transactions.push(transaction)
      }
    }
    let shares = await app.scrypta.post('/sidechain/shares', { sidechain_address: app.user.chain })
    app.totalSupply = parseFloat(shares.cap.toFixed(app.user.owner[app.user.chain].genesis.decimals)) - parseFloat(app.burnedSupply)
    app.totalSupply = app.totalSupply.toFixed(app.user.owner[app.user.chain].genesis.decimals)
    app.totalUsers = Object.keys(shares.shares).length - 2
    app.circularSupply = app.totalSupply - shares.shares[app.user.chain].balance - shares.shares[app.user.identity.address].balance
    app.burnedSupply = shares.shares[app.user.chain].balance
    app.burnedSupply = parseFloat(app.burnedSupply).toFixed(app.user.owner[app.user.chain].genesis.decimals)
    app.circularSupply = parseFloat(app.circularSupply).toFixed(app.user.owner[app.user.chain].genesis.decimals)
    app.transactions = transactions
  }
};
</script>