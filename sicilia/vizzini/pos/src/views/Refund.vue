<template>
  <div class="settings">
    <div v-if="!isLoading">
      <div v-if="refundrequests.length > 0">
        <br><b>Richieste di rimborso</b><br><hr>
        <div v-for="tx in refundrequests" v-bind:key="tx.sxid">
          <div class="card" v-if="torefund[tx.sxid] !== undefined">
            <div class="card-content">
              <div class="media">
                <div class="media-left">
                  <figure class="image is-100x1">
                    <v-gravatar :email="address" />
                  </figure>
                </div>
                <div class="media-content">
                  <p class="title is-4">{{ tx.amount * -1 }} EUR</p>
                  <p class="subtitle is-6">{{ tx.data }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br><b>Storico rimborsi</b><br><hr>
      <div v-if="refunds.length > 0">
        <div class="card" v-for="tx in refunds" v-bind:key="tx.sxid">
          <div class="card-content">
            <div class="media">
              <div class="media-left">
                <figure class="image is-100x1">
                  <v-gravatar :email="address" />
                </figure>
              </div>
              <div class="media-content">
                <p class="title is-4">{{ tx.importo }}</p>
                <p class="subtitle is-6">{{ tx.data }}</p>
                <p>{{ tx.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="refunds.length === 0">
        Nessun rimborso.
      </div>
    </div>
    <div v-if="isLoading">
      <br>Carico informazioni...
    </div>
  </div>
</template>

<script>
const ScryptaCore = require("@scrypta/core");
const axios = require('axios')
let config = require('../config.json')
const LZUTF8 = require('lzutf8')
export default {
  data() {
    return {
      scrypta: new ScryptaCore(true),
      address: "",
      ticker: "",
      isLoading: true,
      wallet: "",
      config: config,
      axios: axios,
      owner: '',
      refunds: [],
      refundrequests: [],
      torefund: [],
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
          app.owner = sidechain.genesis.owner
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

      let refundrequests = {}
      let transactions = await app.scrypta.post('/sidechain/transactions', { dapp_address: app.address, sidechain_address: app.chain })
      app.transactions = transactions.transactions
      for(let x in app.transactions){
        if(app.transactions[x].to === config.sidechain){
          let date = new Date(app.transactions[x].time)
          let year = date.getFullYear()
          let month = date.getMonth() + 1
          let day = date.getDate()
          let hours = date.getHours()
          let minutes = "0" + date.getMinutes()
          let formattedTime = day + '/' + month + '/' + year +' alle ' + hours + ':' + minutes.substr(-2)
          app.transactions[x].data = formattedTime
          refundrequests[app.transactions[x].sxid] = app.transactions[x].amount
          app.torefund[app.transactions[x].sxid] = app.transactions[x].amount
          app.refundrequests.push(app.transactions[x])
        }
      }

      let received = await app.scrypta.post('/received', { address: app.address })
      for(let x in received.data){
        let tx = received.data[x]
        let data = tx.data.split(':')
        if(data[0] === 'REFUND'){
          let rimborso = tx
          let transactions = await app.scrypta.get('/transactions/' + app.owner)
          for(let y in transactions.data){
            let txx = transactions.data[y]
            if(txx.txid === tx.txid){
              let date = new Date(txx.time * 1000)
              let year = date.getFullYear()
              let month = date.getMonth() + 1
              let day = date.getDate()
              let hours = date.getHours()
              let minutes = "0" + date.getMinutes()
              let formattedTime = day + '/' + month + '/' + year +' alle ' + hours + ':' + minutes.substr(-2)
              rimborso.data = formattedTime
              rimborso.note = LZUTF8.decompress(data[2], { inputEncoding: 'Base64' })
              rimborso.importo = refundrequests[data[1]] * -1 
              app.totRimborsi += rimborso.importo
              rimborso.importo = rimborso.importo + " EUR"
              app.refunds.push(rimborso)
              app.refundrequests[data[1]]
              delete app.torefund[data[1]]
            }
          }
        }
      }
      app.isLoading = false
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