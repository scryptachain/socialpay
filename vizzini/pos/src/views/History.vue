<template>
  <div class="settings">
    <b>Il tuo bilancio</b><br><br>
    <h3 class="title is-3">{{ userBalance }} {{ ticker }}</h3>
    <hr>
    <div v-if="transactions.unconfirmed.length > 0">
      <b>Transazioni in attesa</b><br><br>
      <div class="card" v-for="tx in transactions.unconfirmed" v-bind:key="tx.sxid">
        <div class="card-content">
          <div class="media">
          <div class="media-left">
            <figure class="image is-48x48">
              <v-gravatar :email="tx.from" />
            </figure>
          </div>
            <div class="media-content">
              <p class="title is-4"><span v-if="tx.amount > 0">+</span> {{ tx.amount }} {{ ticker }}</p>
              <p class="subtitle is-6">da <b>{{ tx.from.substr(0,3) }}...{{ tx.from.substr(-3) }}</b></p>
            </div>
          </div>
        </div>
      </div>
      <br>
    </div>
    <div v-if="transactions.confirmed.length > 0">
      <b>Transazioni confermate</b><br><br>
      <div class="card" v-for="tx in transactions.confirmed" v-bind:key="tx.sxid">
        <div class="card-content">
          <div class="media">
          <div class="media-left">
            <figure class="image is-48x48">
              <v-gravatar :email="tx.from" />
            </figure>
          </div>
            <div class="media-content">
              <p class="title is-4"><span v-if="tx.amount > 0">+</span>{{ tx.amount }} {{ ticker }}</p>
              <p class="subtitle is-6">al blocco <b>{{ tx.block }}</b> da <b>{{ tx.from.substr(0,3) }}...{{ tx.from.substr(-3) }}</b></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const ScryptaCore = require("@scrypta/core");
const axios = require('axios')
export default {
  data() {
    return {
      scrypta: new ScryptaCore(true),
      address: "",
      ticker: "",
      wallet: "",
      axios: axios,
      currency: 'eur',
      chain: '6RQ54yHx2dARWkN8Biiw3gDjb4sB5hSHSH',
      transactions: {
        confirmed: [],
        unconfirmed: []
      },
      userBalance: 0
    };
  },
  async mounted() {
    const app = this;
    app.wallet = await app.scrypta.importBrowserSID();
    app.wallet = await app.scrypta.returnDefaultIdentity();
    
    if(localStorage.getItem('currency') !== null){
      app.currency = localStorage.getItem('currency')
    }

    if(localStorage.getItem('chain') !== null){
      app.chain = localStorage.getItem('chain')
    }

    if(app.chain !== 'main'){
      let sidechains = await app.scrypta.get('/sidechain/list')
      for(let x in sidechains.data){
        let sidechain = sidechains.data[x]
        if(sidechain.address === app.chain){
          app.ticker = sidechain.genesis.symbol
        }
      }
    }

    let exp = app.wallet.split(':')
    let balance = await app.scrypta.post('/sidechain/balance',{
      dapp_address: exp[0],
      sidechain_address: app.chain
    })
    app.userBalance = balance.balance

    if (app.wallet.length > 0) {
      let SIDS = app.wallet.split(":");
      app.address = SIDS[0];
      let identity = await app.scrypta.returnIdentity(app.address);
      app.wallet = identity;
      app.isLogging = false;
      app.transactions = {
        confirmed: [],
        unconfirmed: []
      }
      let transactions = await app.scrypta.post('/sidechain/transactions',{
        dapp_address: app.address,
        sidechain_address: app.chain
      })
      for(let x in transactions.transactions){
        let tx = transactions.transactions[x]
        if(tx.block === null){
          app.transactions.unconfirmed.push(tx)
        }else{
          app.transactions.confirmed.push(tx)
        }
      }
    } else {
      app.isLogging = false;
    }
  },
  methods: {
    saveCurrency(){
      const app = this
      localStorage.setItem('currency',app.currency)
    },
    saveChain(){
      const app = this
      localStorage.setItem('chain',app.chain)
    }
  },
  watch: {
      currency: function() {
        const app = this
        app.saveCurrency()
      },
      chain: function() {
        const app = this
        app.saveChain()
      }
  }
};
</script>