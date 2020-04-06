<template>
  <div>
    <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">
            Gestisci rimborso
          </p>
        </header>
        <section class="modal-card-body">
          <div v-if="isChecked && !contabilizzato">
            <b-field label="Note aggiunte per il richiedente (facoltativo)">
                <b-input
                    type="textarea"
                    v-model="refundNotes">
                </b-input>
            </b-field>
            <span style="color:#f00">
              <b>Attenzione:</b> queste note vanno in chiaro all'interno della blockchain e saranno pubbliche per sempre. Non inserire per alcun motivo informazioni sensibili o riservate.
            </span><br><br>
            <b-button style="width:100%" v-if="!isSending" type="is-primary" v-on:click="notifyRefund" size="is-medium">CONTABILIZZA RIMBOSO</b-button>
            <div v-if="isSending">Invio transazione in corso...</div>
          </div>
          <div v-if="!isChecked" style="text-align:center">Controllo se è stato emesso il rimborso...</div>
          <div v-if="isChecked && contabilizzato && confirmed" style="text-align:left">
            <b>Data:</b> {{ rimborso.data }}<br>
            <b>Riferimento:</b> {{ rimborso.txid.substr(0,8) }}...{{ rimborso.txid.substr(-8) }}<br>
            <b>Importo:</b> {{ refund.amount }} EUR<br>
            <b v-if="rimborso.note">Note:</b> {{ rimborso.note }}
          </div>
          <div v-if="isChecked && contabilizzato && !confirmed" style="text-align:center">
            Rimborso inviato, ma non confermato, si prega di attendere qualche minuto.
          </div>
        </section>
    </div>
  </div>
</template>

<script>
  let ScryptaCore = require("@scrypta/core")
  import ScryptaDB from '../libs/db.js'
  import User from '../libs/user.js'
  var LZUTF8 = require('lzutf8')

  export default {
    name: 'RefundDetails',
    props: ['refund'],
    data() {
      return {
        db: new ScryptaDB(true, ['users', 'settings']),
        scrypta: new ScryptaCore(true),
        lyraBalance: 0,
        refundNotes: '',
        rimborso: {},
        isChecked: false,
        confirmed: false,
        contabilizzato: false,
        isSending: false,
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
      let received = await app.scrypta.post('/received', { address: app.refund.address })
      for(let x in received.data){
        let tx = received.data[x]
        let data = tx.data.split(':')
        if(data[0] === 'REFUND' && data[1] === app.refund.sxid){
          app.contabilizzato = true
          app.rimborso = tx
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
              app.rimborso.data = formattedTime
              app.rimborso.note = LZUTF8.decompress(data[2], { inputEncoding: 'Base64' })
              app.isChecked = true
              app.confirmed = true
            }
          }
        }
      }
      app.isChecked = true
    },
    methods: {
      async notifyRefund(){
        const app = this
        app.$buefy.dialog.prompt({
        message: `Inserisci la password del wallet`,
        inputAttrs: {
          type: "password"
        },
        trapFocus: false,
        onConfirm: async password => {
          let key = await app.scrypta.readKey(password, app.owner.identity.wallet)
          if (key !== false) {
            let amountneeded = 0.002
            let ownerBalance = await app.scrypta.get('/balance/' + app.owner.identity.address)
            if(ownerBalance.balance >= amountneeded){
              let sendsuccess = false
              let valid = false
              let yy = 0
              app.isSending = true
              let compressed = LZUTF8.compress(app.refundNotes,{outputEncoding: 'Base64'})
              let messageToSend = 'REFUND:' + app.refund.sxid + ':' + compressed

              while(sendsuccess === false){
                let send = await app.scrypta.post('/send',{
                  from: app.owner.identity.address,
                  to: app.refund.address,
                  amount: 0.001,
                  private_key: key.prv,
                  message: messageToSend
                })
                if(send.data.txid !== undefined && send.data.txid !== null && send.data.txid.length === 64){
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
                app.$buefy.toast.open({
                  message: "Rimborso contabilizzato correttamente",
                  type: "is-success"
                })
                app.$parent.close()
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
              })
            }
          } else {
            app.$buefy.toast.open({
              message: "Password errata!",
              type: "is-danger"
            })
          }
        }
      })
      }
    }
  }
</script>
