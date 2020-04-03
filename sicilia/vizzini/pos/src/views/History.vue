<template>
  <div class="settings">
    <br><b>Il tuo bilancio</b><br><hr>
    <h3 class="title is-3">{{ userBalance }} {{ ticker }}</h3>
    <div v-if="userBalance > 0">
      <b-button v-on:click="askRefund" type="is-success">RICHIEDI RIMBORSO</b-button>
    </div>
    <br>
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
            <figure class="image is-100x1">
              <v-gravatar :email="tx.from" />
            </figure>
          </div>
            <div class="media-content">
              <p class="title is-4"><span v-if="tx.amount > 0">+</span>{{ tx.amount }} {{ ticker }}</p>
              <p v-if="tx.to !== chain" style="margin-bottom:0" class="subtitle is-6">da <b>{{ tx.from.substr(0,5) }}...{{ tx.from.substr(-5) }}</b></p>
              <p style="margin-top:3px">{{ tx.data }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="transactions.confirmed.length === 0 && transactions.unconfirmed.length === 0">
      Nessuna transazione.
    </div>
  </div>
</template>

<script>
const ScryptaCore = require("@scrypta/core");
const axios = require('axios')
let config = require('../config.json')
export default {
  data() {
    return {
      scrypta: new ScryptaCore(true),
      address: "",
      ticker: "",
      wallet: "",
      config: config,
      axios: axios,
      chain: config.sidechain,
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
        if(tx.to !== app.chain){
          let date = new Date(tx.time)
          let year = date.getFullYear()
          let month = date.getMonth() + 1
          let day = date.getDate()
          let hours = date.getHours()
          let minutes = "0" + date.getMinutes()
          let formattedTime = day + '/' + month + '/' + year +' alle ' + hours + ':' + minutes.substr(-2)
          tx.data = formattedTime
          if(tx.block === null){
            app.transactions.unconfirmed.push(tx)
          }else{
            app.transactions.confirmed.push(tx)
          }
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
    },
    askRefund(){
      const app = this
      app.$buefy.dialog.prompt({
        message: `Inserisci pin card`,
        inputAttrs: {
          type: "password"
        },
        trapFocus: false,
        onConfirm: async password => {
          let key = await app.scrypta.readKey(password, app.wallet.wallet);
          if (key !== false) {
            let sendsuccess = false
            let yy = 0
            let valid = false
            while(sendsuccess === false){
              let send = await app.scrypta.post('/sidechain/send',{
                  from: app.address, 
                  sidechain_address: app.chain,
                  private_key: key.prv,
                  pubkey: key.key,
                  to: app.chain,
                  amount: app.userBalance
              })
              if(send.uuid !== undefined && send.txs.length === 1 && send.txs[0].length === 64){
                sendsuccess = true
                valid = true
              }
              yy++
              if(yy > 4){
                sendsuccess = true
                valid = false
              }
            }
            if(valid){
              setTimeout(async function(){
                let exp = app.wallet.wallet.split(':')
                let balance = await app.scrypta.post('/sidechain/balance',{
                  dapp_address: exp[0],
                  sidechain_address: app.chain
                })
                app.userBalance = balance.balance
              },5000)
              app.$buefy.toast.open({
                duration: 5000,
                message: `Invio riuscito correttamente.`,
                position: 'is-bottom',
                type: 'is-success'
              })
              app.showUnlock = false
            }else{
              app.$buefy.toast.open({
                duration: 5000,
                message: `Invio non riuscito si prega di riprovare.`,
                position: 'is-bottom',
                type: 'is-danger'
              })
            }
          }else{
            app.$buefy.toast.open({
              message: "Pin errato!",
              type: "is-danger"
            });
          }
        }
      })
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