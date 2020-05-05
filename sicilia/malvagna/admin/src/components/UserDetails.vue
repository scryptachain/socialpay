<template>
  <div>
    <div class="modal-card" style="width: auto; height: 100vh">
        <header class="modal-card-head">
          <p class="modal-card-title">
            Visualizza utente<br>
            <span style="font-size:15px">#{{ user.id }}: {{ user.address }}</span>
          </p>
        </header>
        <section class="modal-card-body">
          <div class="columns">
            <div class="column">
              <h1>Nome: <span style="font-weight:normal">{{ user.name }}</span></h1>
              <h1>Tipologia: <span style="font-weight:normal">{{ user.filter }}</span></h1>
              <h1>Identificativo: <span style="font-weight:normal">{{ user.identifier }}</span></h1>
              <h1>Componenti nucleo familiare: <span style="font-weight:normal">{{ user.nucleo }}</span></h1>
              <h1>Bilancio {{ owner.owner[owner.chain].genesis.symbol }}: <span style="font-weight:normal">{{ assetBalance }} {{ owner.owner[owner.chain].genesis.symbol }}</span></h1>
              <h1>Bilancio Lyra: <span style="font-weight:normal">{{ lyraBalance }} LYRA</span></h1>
              <h1 v-if="totRimborsi > 0">Totale rimborsi: <span style="font-weight:normal">{{ totRimborsi }} EUR</span></h1>
            </div>
            <div class="column">
              <b-tabs v-model="activeTab" :animated="false">
                <b-tab-item label="Invia fondi">
                  <h1>Invia fondi all'utente</h1>
                  <b-field label="Inserisci quantità di LYRA da inviare">
                      <b-input
                          type="text"
                          v-model="amountLyra"
                          required>
                      </b-input>
                  </b-field>
                  <b-field :label="'Inserisci quantità di ' + owner.owner[owner.chain].genesis.symbol + ' da inviare'">
                      <b-input
                          type="text"
                          v-model="amountAsset"
                          required>
                      </b-input>
                  </b-field>
                  <button class="button is-primary" v-if="!isSending" v-on:click="sendAssetToUser">INVIA ORA</button>
                  <div v-if="isSending">Invio in corso...</div>
                </b-tab-item>
                <b-tab-item label="Preleva fondi">
                  <h1>Preleva fondi</h1>
                  <b-field :label="'Inserisci quantità di ' + owner.owner[owner.chain].genesis.symbol + ' da prelevare'">
                      <b-input
                          type="text"
                          v-model="amountWithdraw"
                          required>
                      </b-input>
                  </b-field>
                  <button class="button is-primary" v-if="!isSending" v-on:click="withdrawAssetFromUser">PRELEVA ORA</button>
                  <div v-if="isSending">Invio in corso...</div><br><br>
                  <span style="color:#f00">
                    Attenzione, verrà richiesto di inserire il PIN della card associata e non quello dell'utente amministratore. 
                    I fondi verranno inviati all'indirizzo dell'utente amministratore e saranno disponibili al primo blocco successivo.
                  </span>
                </b-tab-item>
              </b-tabs>
            </div>
          </div>
          <hr>
          <h1>Storico transazioni</h1>
          <b-table
            v-if="transactions.length > 0"
            :data="transactions"
            :paginated="isPaginated"
            :per-page="perPage"
            :current-page.sync="currentPage"
            :pagination-simple="isPaginationSimple"
            :pagination-position="paginationPosition"
            :default-sort-direction="defaultSortDirection"
            :sort-icon="sortIcon"
            :sort-icon-size="sortIconSize"
            default-sort="user.first_name"
            aria-next-label="Next page"
            aria-previous-label="Previous page"
            aria-page-label="Page"
            aria-current-label="Current page">

            <template slot-scope="props">

                <b-table-column field="from" label="Indirizzo di partenza" width="40" sortable searchable>
                  <span v-if="props.row.from === owner.identity.address">
                    AMMINISTRATORE
                  </span>
                  <span v-if="props.row.from === user.address">
                    <span v-if="user.name !== ''">{{ user.name }}</span>
                    <span v-if="user.name === ''">Utente</span>
                  </span>
                  <span v-if="props.row.from !== owner.identity.address && props.row.from !== user.address">
                    {{ props.row.from }}
                  </span>
                </b-table-column>

                <b-table-column field="to" label="Indirizzo di destinazione" searchable sortable>
                  <span v-if="props.row.to === owner.identity.address">
                    AMMINISTRATORE
                  </span>
                  <span v-if="props.row.to === user.address">
                    <span v-if="user.name !== ''">{{ user.name }}</span>
                    <span v-if="user.name === ''">Utente</span>
                  </span>
                  <span v-if="props.row.to !== owner.identity.address && props.row.to !== user.address">
                    {{ props.row.to }}
                  </span>
                </b-table-column>

                <b-table-column label="Ammontare" sortable>
                    {{ props.row.amount }} {{ owner.owner[owner.chain].genesis.symbol }}
                </b-table-column>

                <b-table-column field="sxid" label="Identificativo transazione" searchable sortable>
                    {{ props.row.sxid }}
                </b-table-column>

                <b-table-column label="Data" sortable>
                    {{ props.row.data }}
                </b-table-column>
            </template>
          </b-table>

          <div v-if="refunds.length > 0">
            <h1>Storico rimborsi</h1>
            <b-table :data="refunds" :columns="columns"></b-table>
          </div>
          <p v-if="transactions.length === 0">Questo utente non ha ancora transazioni.</p>
        </section>
    </div>
  </div>
</template>

<script>
  let ScryptaCore = require("@scrypta/core")
  import ScryptaDB from '../libs/db.js'
  import User from '../libs/user.js'
  let config = require('../config.json')
  var LZUTF8 = require('lzutf8')

  export default {
    name: 'UserForm',
    props: ['user'],
    data() {
      return {
        db: new ScryptaDB(true, ['users', 'settings']),
        scrypta: new ScryptaCore(true),
        assetBalance: 0,
        lyraBalance: 0,
        amountLyra: 0.1,
        amountAsset: 0,
        totRimborsi: 0,
        isSending: false,
        transactions: [],
        refunds: [],
        users: [],
        columns: [
            {
                field: 'txid',
                label: 'Rif.',
            },
            {
                field: 'data',
                label: 'Data',
            },
            {
                field: 'importo',
                label: 'Importo',
            },
            {
                field: 'note',
                label: 'Note'
            }
        ],
        parsedUsers: [],
        isPaginated: true,
        isPaginationSimple: false,
        paginationPosition: 'bottom',
        defaultSortDirection: 'asc',
        sortIcon: 'arrow-up',
        sortIconSize: 'is-small',
        currentPage: 1,
        config: config,
        perPage: 15,
        amountWithdraw: 0,
        activeTab: 0,
        owner: {
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
        },
      }
    },
    async mounted() {
      const app = this
      app.owner = await User.auth()
      app.fetchUserDetails()
      setInterval(function(){
        app.fetchUserDetails()
      },15000)
    },
    methods: {
      async fetchUserDetails(){
        const app = this
        let assetBalance = await app.scrypta.post('/sidechain/balance', { dapp_address: app.user.address, sidechain_address: app.owner.chain })
        app.assetBalance = assetBalance.balance
        let lyraBalance = await app.scrypta.get('/balance/' + app.user.address)
        app.lyraBalance = lyraBalance.balance

        app.users = await app.db.get('users')
        app.parsedUsers[app.owner.identity.address] = 'AMMINISTRATORE'
        for(let x in app.users){
          let uu = app.users[x]
          if(uu.name !== ''){
            app.parsedUsers[uu.address] = uu.name 
          }else{
            app.parsedUsers[uu.address] = uu.address 
          }
        }
        let refundrequests = {}
        let transactions = await app.scrypta.post('/sidechain/transactions', { dapp_address: app.user.address, sidechain_address: app.owner.chain })
        app.transactions = transactions.transactions
        for(let x in app.transactions){
          if(app.parsedUsers[app.transactions[x].from] !== undefined && app.parsedUsers[app.transactions[x].from] !== app.transactions[x].from){
            app.transactions[x].from = app.parsedUsers[app.transactions[x].from]
          }
          if(app.parsedUsers[app.transactions[x].to] !== undefined && app.parsedUsers[app.transactions[x].to] !== app.transactions[x].to){
            app.transactions[x].to = app.parsedUsers[app.transactions[x].to]
          }
          if(app.transactions[x].to === app.owner.chain){
            app.transactions[x].to = 'RICHIESTA RIMBORSO'
          }
          refundrequests[app.transactions[x].sxid] = app.transactions[x].amount
        }

        let received = await app.scrypta.post('/received', { address: app.user.address })
        for(let x in received.data){
          let tx = received.data[x]
          let data = tx.data.split(':')
          if(data[0] === 'REFUND'){
            let rimborso = tx
            let transactions = await app.scrypta.get('/transactions/' + app.owner.identity.address)
            for(let y in transactions.data){
              let txx = transactions.data[y]
              if(txx.txid === tx.txid){
                var date = new Date(txx.time * 1000)
                var year = date.getFullYear()
                var month = date.getMonth() + 1
                var day = date.getDate()
                var hours = date.getHours()
                var minutes = "0" + date.getMinutes()
                var formattedTime = day + '/' + month + '/' + year +' alle ' + hours + ':' + minutes.substr(-2)
                rimborso.data = formattedTime
                rimborso.note = LZUTF8.decompress(data[2], { inputEncoding: 'Base64' })
                rimborso.importo = refundrequests[data[1]] * -1 
                app.totRimborsi += rimborso.importo
                rimborso.importo = rimborso.importo + " EUR"
                app.refunds.push(rimborso)
              }
            }
          }
        }
      },
      async sendAssetToUser(){
        const app = this
        if(app.amountLyra > 0 || app.amountAsset > 0){
          app.$buefy.dialog.prompt({
          message: `Inserisci la password del wallet`,
          inputAttrs: {
            type: "password"
          },
          trapFocus: false,
          onConfirm: async password => {
            let key = await app.scrypta.readKey(password, app.owner.identity.wallet);
            if (key !== false) {
              // INVIO LYRA
              app.isSending = true
              let amountLyraFixed = parseFloat(parseFloat(app.amountLyra).toFixed(8))
              if(amountLyraFixed > 0){
                let ownerBalance = await app.scrypta.get('/balance/' + app.owner.identity.address)
                if(ownerBalance.balance >= amountLyraFixed){
                  let sendsuccess = false
                  let valid = false
                  let yy = 0
                  while(sendsuccess === false){
                    let txid = await app.scrypta.send(app.owner.identity.wallet, password, app.user.address, amountLyraFixed)
                    if(txid !== undefined && txid !== null && txid.length === 64){
                      sendsuccess = true
                      valid = true
                    }
                    if(yy > 19){
                      valid = false
                      sendsuccess = true
                    }
                    yy++
                  }
                  if(valid){
                    app.amountLyra = 0
                    app.$buefy.toast.open({
                      message: "Lyra inviate correttamente",
                      type: "is-success"
                    })
                  }else{
                    app.$buefy.toast.open({
                      message: "Invio fallito, si prega di riprovare",
                      type: "is-danger"
                    })
                  }
                }else{
                  app.$buefy.toast.open({
                    message: "Non hai abbastanza fondi!",
                    type: "is-danger"
                  });
                }
              }

              // INVIO ASSET
              let amountAssetFixed = parseFloat(parseFloat(app.amountAsset).toFixed(app.owner.owner[app.owner.chain].genesis.decimals))
              if(amountAssetFixed > 0){
                let ownerBalance = await app.scrypta.post('/sidechain/balance', { dapp_address: app.owner.identity.address, sidechain_address: app.owner.chain })
                if(ownerBalance.balance >= amountAssetFixed){
                  let sendsuccess = false
                  let valid = false
                  let yy = 0
                  while(sendsuccess === false){
                    app.scrypta.usePlanum(app.owner.chain)
                    let send = await app.scrypta.sendPlanumAsset(app.owner.identity.wallet, password, app.user.address, amountAssetFixed)
                    if(send !== false){
                      sendsuccess = true
                      valid = true
                    }
                    if(yy > 19){
                      valid = false
                      sendsuccess = true
                    }
                    yy++
                  }
                  if(valid){
                    app.amountAsset = 0
                    app.$buefy.toast.open({
                      message: "Asset inviati correttamente",
                      type: "is-success"
                    })
                  }else{
                    app.$buefy.toast.open({
                      message: "Invio fallito, si prega di riprovare",
                      type: "is-danger"
                    })
                  }
                  app.isSending = false
                }else{
                  app.$buefy.toast.open({
                    message: "Non hai abbastanza fondi!",
                    type: "is-danger"
                  });
                  app.isSending = false
                }
              }
            } else {
              app.$buefy.toast.open({
                message: "Password errata!",
                type: "is-danger"
              });
            }
          }
        });
        }else{
          app.$buefy.toast.open({
            message: "L'ammontare di Lyra o di asset deve essere maggiore di zero.",
            type: "is-danger"
          })
        }
      },
      async withdrawAssetFromUser(){
        const app = this
        if(app.amountWithdraw > 0){
          app.$buefy.dialog.prompt({
          message: `Inserisci la password del wallet`,
          inputAttrs: {
            type: "password"
          },
          trapFocus: false,
          onConfirm: async password => {
            let key = await app.scrypta.readKey(password, app.user.sid);
            if (key !== false) {
              // PRELEVO ASSET
              let amountAssetFixed = parseFloat(parseFloat(app.amountWithdraw).toFixed(app.owner.owner[app.owner.chain].genesis.decimals))
              if(amountAssetFixed > 0){
                app.isSending = true
                let userBalance = await app.scrypta.post('/sidechain/balance', { dapp_address: app.user.address, sidechain_address: app.owner.chain })
                if(userBalance.balance >= amountAssetFixed){
                  let sendsuccess = false
                  let valid = false
                  let yy = 0
                  while(sendsuccess === false){
                    app.scrypta.usePlanum(app.owner.chain)
                    let send = await app.scrypta.sendPlanumAsset(app.user.sid, password, app.owner.identity.address, amountAssetFixed)
                    if(send !== false){
                      sendsuccess = true
                      valid = true
                    }
                    if(yy > 19){
                      valid = false
                      sendsuccess = true
                    }
                    yy++
                  }
                  app.isSending = false
                  if(valid){
                    app.amountWithdraw = 0
                    app.$buefy.toast.open({
                      message: "Asset inviati correttamente",
                      type: "is-success"
                    })
                  }else{
                    app.$buefy.toast.open({
                      message: "Invio fallito, si prega di riprovare",
                      type: "is-danger"
                    })
                  }
                }else{
                  app.$buefy.toast.open({
                    message: "Non hai abbastanza fondi!",
                    type: "is-danger"
                  });
                }
              }
            } else {
              app.$buefy.toast.open({
                message: "Password errata!",
                type: "is-danger"
              });
            }
          }
        });
        }else{
          app.$buefy.toast.open({
            message: "L'ammontare asset da prelevare deve essere maggiore di zero.",
            type: "is-danger"
          })
        }
      }
    }
  }
</script>
