<template>
  <div class="home">
    <div v-if="!showScan && !showWaiting && !showUnlock && !showSuccess">
      <div v-if="chain === 'main' && focus === 'lyra'" v-on:click="fixInputs('lyra')" class="display-number">
        {{ amountLyra }}
        <span style="position:absolute; top: 10px; right:10px;">LYRA</span>
      </div>
      <div v-if="chain === 'main' && focus === 'fiat'" v-on:click="fixInputs('fiat')" class="display-number">
        {{ amountFIAT }}
        <span style="position:absolute; top: 10px; right:10px;">{{ currency.toUpperCase() }}</span>
      </div>
      <div v-if="chain !== 'main'" v-on:click="fixInputs('sidechain')" class="display-number">
        {{ amountSidechain }}
        <span style="position:absolute; top: 5px; right:10px;">{{ ticker }}</span>
      </div>
      <div style="text-align: center;">
        <div v-on:click='addNumber(1)' class="pos-btn">1</div>
        <div v-on:click='addNumber(2)' class="pos-btn">2</div>
        <div v-on:click='addNumber(3)' class="pos-btn">3</div>
        <div v-on:click='addNumber(4)' class="pos-btn">4</div>
        <div v-on:click='addNumber(5)' class="pos-btn">5</div>
        <div v-on:click='addNumber(6)' class="pos-btn">6</div>
        <div v-on:click='addNumber(7)' class="pos-btn">7</div>
        <div v-on:click='addNumber(8)' class="pos-btn">8</div>
        <div v-on:click='addNumber(9)' class="pos-btn">9</div>
        <div v-on:click='addDot()' class="pos-btn">.</div>
        <div v-on:click='addNumber(0)' class="pos-btn">0</div>
        <div v-on:click='removeNumber()' class="pos-btn">C</div>
      </div>
      <div style="padding:5px 10px">
        <b-button type="is-primary" v-on:click="waitForPayment()" size="is-large">PAGA</b-button>
      </div>
    </div>
    <div v-if="showSuccess" style="padding:50px">
      <br><br>
      <img src="/conferma.png" width="100%"><br><br>
      Transazione confermata<br>
      Si prega di attendere qualche minuto prima di visualizzare l'accredito.<br><br>
      <b-button v-on:click="hideSuccess" type="is-danger">CHIUDI</b-button>
    </div>
    <div v-if="showWaiting">
      <h1 class="title is-1" style="margin:20vh 0" v-if="chain !== 'main'">{{ amountSidechain }} {{ ticker }}</h1>
      <div style="padding:10px">
        <b-button type="is-primary" v-on:click="showScanQR()" size="is-large">LEGGI CARTA</b-button>
      </div>
      <div style="padding:10px">
        <b-button type="is-danger" v-on:click="hidePaymnent()" size="is-large">ANNULLA PAGAMENTO</b-button>
      </div>
    </div>
    <div class="fullscreen" v-if="showScan">
      <b-button v-on:click="hideScanModal" type="is-primary" style="width:50px; position:fixed; z-index:999; top:10px; right:10px;">X</b-button>
      <qrcode-stream @decode="onDecode"></qrcode-stream>
    </div>
    <div class="fullscreen" v-if="showUnlock">
        <h1 style="margin-top:30px">Inserisci pin</h1>
        <div class="display-number">
          <span v-for="digit in guestpindigits" v-bind:key="digit">*</span>
        </div>  
        <div v-on:click='addPin(1)' class="pos-btn">1</div>
        <div v-on:click='addPin(2)' class="pos-btn">2</div>
        <div v-on:click='addPin(3)' class="pos-btn">3</div>
        <div v-on:click='addPin(4)' class="pos-btn">4</div>
        <div v-on:click='addPin(5)' class="pos-btn">5</div>
        <div v-on:click='addPin(6)' class="pos-btn">6</div>
        <div v-on:click='addPin(7)' class="pos-btn">7</div>
        <div v-on:click='addPin(8)' class="pos-btn">8</div>
        <div v-on:click='addPin(9)' class="pos-btn">9</div>
        <div v-on:click='removePin()' class="pos-btn">L</div>
        <div v-on:click='addPin(0)' class="pos-btn">0</div>
        <div v-on:click='cleanPin()' class="pos-btn">C</div>
        <div style="padding:5px 10px">
          <b-button type="is-success" v-on:click="payWithGuestWallet()" size="is-large">CONFERMA</b-button>
        </div>
    </div>
  </div>
</template>

<script>
const ScryptaCore = require("@scrypta/core")
const axios = require('axios')
let config = require('../config.json')
export default {
  data() {
    return {
      scrypta: new ScryptaCore(true),
      address: "",
      wallet: "",
      axios: axios,
      config: config,
      qrcode: "",
      ticker: "",
      amountLyra: 0,
      amountFIAT: 0,
      currency: 'eur',
      chains: {},
      amountSidechain: 0,
      focus: 'lyra',
      chain: config.sidechain,
      showScan: false,
      showSuccess: false,
      showWaiting: false,
      showUnlock: false,
      isWaiting: false,
      payment: {},
      interval: {},
      guestwallet: '',
      guestpin:'',
      guestpindigits: []
    };
  },
  async mounted() {
    const app = this;
    app.wallet = await app.scrypta.importBrowserSID()
    app.wallet = await app.scrypta.returnDefaultIdentity()

    let sidechains = await app.scrypta.get('/sidechain/list')
    for(let x in sidechains.data){
      let sidechain = sidechains.data[x]
      if(sidechain.address === app.chain){
        app.ticker = sidechain.genesis.symbol
      }
    }
    
    if (app.wallet.length > 0) {
      let SIDS = app.wallet.split(":");
      app.address = SIDS[0];
      let identity = await app.scrypta.returnIdentity(app.address);
      app.wallet = identity;
      app.isLogging = false;
    } else {
      app.isLogging = false;
    }
  },
  methods: {
    hideSuccess(){
      const app = this
      app.showSuccess = false
    },
    hideScanModal() {
      const app = this
      app.showScan = false
    },
    addNumber(number){
      const app = this
      if(app.focus === 'lyra'){
        if(parseFloat(app.amountLyra) === 0){
          app.amountLyra = ''
        }
        if(app.chain === 'main'){
          let display = app.amountLyra.toString()
          display = display.concat(number.toString())
          app.amountLyra = parseFloat(display)
        }else{
          let display = app.amountSidechain.toString()
          display = display.concat(number.toString())
          app.amountSidechain = parseFloat(display)
        }
      }else{
        if(parseFloat(app.amountFIAT) === 0){
          app.amountFIAT = ''
        }
        let display = app.amountFIAT.toString()
        display = display.concat(number.toString())
        app.amountFIAT = parseFloat(display)
      }
    },
    addDot(){
      const app = this
      if(app.focus === 'lyra'){
        if(app.chain === 'main'){
          let display = app.amountLyra.toString()
          let dot = display.split('.')
          if(!dot[1]){
            display = display.concat('.')
            app.amountLyra = display
          }
        }else{
          let display = app.amountSidechain.toString()
          let dot = display.split('.')
          if(!dot[1]){
            display = display.concat('.')
            app.amountSidechain = display
          }
        }
      }else{
        let display = app.amountFIAT.toString()
        let dot = display.split('.')
        if(!dot[1]){
          display = display.concat('.')
          app.amountFIAT = display
        }
      }
    },
    addPin(number){
      const app = this
      let display = app.guestpin.toString()
      display = display.concat(number.toString())
      app.guestpin = display
    },
    cleanPin(){
      const app = this
      app.guestpin = ''
    },
    removePin(){
      const app = this
      let display = app.guestpin.toString()
      let max = display.length - 1
      display = display.substr(0,max)
      app.guestpindigits = []
      if(display.length > 0){
        app.guestpin = display
        for(let i = 1; i <= app.guestpin.length; i++){
          app.guestpindigits.push('*')
        }
      }else{
        app.guestpin = ''
      }
    },  
    removeNumber(){
      const app = this
      if(app.focus === 'lyra'){
        if(app.chain === 'main'){
          let display = app.amountLyra.toString()
          let max = display.length - 1
          display = display.substr(0,max)
          if(display.length > 0){
            app.amountLyra = parseFloat(display)
          }else{
            app.amountLyra = 0
          }
        }else{
          let display = app.amountSidechain.toString()
          let max = display.length - 1
          display = display.substr(0,max)
          if(display.length > 0){
            app.amountSidechain = parseFloat(display)
          }else{
            app.amountSidechain = 0
          }
        }
      }else{
        let display = app.amountFIAT.toString()
        let max = display.length - 1
        display = display.substr(0,max)
        if(display.length > 0){
          app.amountFIAT = parseFloat(display)
        }else{
          app.amountFIAT = 0
        }
      }
    },  
    fixInputs(what){
      const app = this
      app.focus = what
      if(what === 'lyra'){
        if(app.amountFIAT === '' || app.amountFIAT === 'NaN'  || app.amountFIAT === null){
          app.amountFIAT = 0
        }
        if(app.amountLyra === '0.000'){
          app.amountLyra = 0
        }
      }else{
        if(app.amountLyra === '' || app.amountLyra === 'NaN'  || app.amountLyra === null || app.amountLyra === '0.0000'){
          app.amountLyra = 0
        }
      }
    },
    returnLyraPrice(){
      const app = this
      return new Promise(response => {
      
      let url = 'https://api.coingecko.com/api/v3/simple/price?ids=scrypta&vs_currencies=' + app.currency

      app.axios.get(url)
        .then(function (result) {
          let price = result.data.scrypta[app.currency]
          response(price)
        })
      })
    },
    async calculateFIAT() {
      const app = this
      if(app.focus === 'lyra'){
        if(app.amountLyra !== null){
          app.price = await this.returnLyraPrice()
          let calculate = parseFloat(app.amountLyra) * parseFloat(app.price)
          if(calculate.toString() !== "NaN"){
            app.amountFIAT = calculate.toFixed(2)
            this.calculateQRCode()
          }else{
            app.amountFIAT = 0
          }
        }else{
          app.amountFIAT = 0
        }
      }
    },
    async calculateLyra() {
      const app = this
      if(app.focus === 'fiat'){
        if(app.amountFIAT !== null){
          app.price = await this.returnLyraPrice()
          let calculate = parseFloat(app.amountFIAT) / parseFloat(app.price)
          if(calculate.toString() !== "NaN"){
            if(app.amountLyra > 0){
              app.amountLyra = calculate.toFixed(4)
            }else{
              app.amountLyra = calculate
            }
            this.calculateQRCode()
          }else{
            app.amountLyra = 0
          }
        }else{
          app.amountFIAT = 0
        }
      }
    },
    showScanQR(){
      const app = this
      app.showScan = true
    },
    hidePaymnent(){
      const app = this
      app.showWaiting = false
      app.amountSidechain = 0
      app.amountLyra = 0
      app.amountFIAT = 0
    },
    calculateQRCode() {
      const app = this
      if(app.chain === 'main'){
        if (app.amountLyra === 0) {
          app.qrcode = app.address
        } else if (app.amountLyra != 0) {
          app.qrcode = this.address + "?" + "amount=" + app.amountLyra
        }
      }
      if(app.chain !== 'main'){
        if (app.amountSidechain === 0) {
          app.qrcode = app.address
        } else if (app.amountSidechain != 0) {
          app.qrcode = this.address + "?" + "amount=" + app.amountSidechain
        }
      }
    },
    waitForPayment(){
      const app = this
      let valid = false
      if(app.chain === 'main' && app.amountLyra > 0){
        valid = true
      }
      if(app.chain !== 'main' && app.amountSidechain > 0){
        valid = true
      }
      if(valid){
        this.calculateQRCode()
        app.showWaiting = true
        app.isWaiting = true
        app.interval = setInterval(async function(){
          if(app.chain !== 'main'){
            let transactions = await app.scrypta.post('/sidechain/transactions',{
              dapp_address: app.address,
              sidechain_address: app.chain
            })
            for(let x in transactions.transactions){
              let tx = transactions.transactions[x]
              if(tx.amount === app.amountSidechain && tx.to === app.address && tx.block === null){
                let confirmed = true
                if(app.guestwallet === ''){
                  let exp = app.guestwallet.split(':')
                  if(app.from === exp[0]){
                    confirmed = true
                  }
                }
                if(confirmed){
                  if(app.guestwallet !== ''){
                    app.guestwallet = ''
                  }
                  app.amountSidechain = 0
                  app.showWaiting = false
                  clearInterval(app.interval)
                  app.$buefy.toast.open({
                      duration: 5000,
                      message: `Transazione ricevuta correttamente!`,
                      position: 'is-bottom',
                      type: 'is-success'
                  })
                }
              }
            }
          } //TODO: MAIN CHAIN
        },5000)
      }else{
        this.$buefy.toast.open({
            duration: 5000,
            message: `Inserisci un ammontare valido`,
            position: 'is-bottom',
            type: 'is-danger'
        })
      }
    },
    async onDecode (decodedString) {
      const app = this
      app.showScan = false
      app.guestwallet = decodedString
      let exp = app.guestwallet.split(':')
      let balance = await app.scrypta.post('/sidechain/balance', { dapp_address: exp[0], sidechain_address: app.chain})
      
      if(balance.balance >= app.amountSidechain){
        app.showUnlock = true
      }else{
        app.$buefy.toast.open({
            duration: 5000,
            message: `Mi dispiace non hai abbastanza fondi`,
            position: 'is-bottom',
            type: 'is-danger'
        })
        app.guestwallet = ''
      }
    },
    async payWithGuestWallet(){
      const app = this
      let exp = app.guestwallet.split(':')
      let guestpub = exp[0]
      if(app.guestpin.length > 0){
        let key = await app.scrypta.readKey(app.guestpin, app.guestwallet)
        if(key !== false){
          let sendsuccess = false
          let yy = 0
          let valid = false
          while(sendsuccess === false){
            let send = await app.scrypta.post('/sidechain/send',{
                from: guestpub, 
                sidechain_address: app.chain,
                private_key: key.prv,
                pubkey: key.key,
                to: app.address,
                amount: app.amountSidechain
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
            app.guestpin = ''
            app.showUnlock = false
            app.showSuccess = true
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
            duration: 5000,
            message: `Il pin è invalido.`,
            position: 'is-bottom',
            type: 'is-danger'
          })
        }
      }else{
        this.$buefy.toast.open({
            duration: 5000,
            message: `Inserisci il pin.`,
            position: 'is-bottom',
            type: 'is-danger'
        })
      }
    }
  },
  watch: {
      amountLyra: function() {
        const app = this
        app.calculateFIAT()
      },
      amountFIAT: function() {
        const app = this
        app.calculateLyra()
      },
      guestpin: function() {
        const app = this
        app.guestpindigits = []
        for(let i = 1; i <= app.guestpin.length; i++){
          app.guestpindigits.push('*')
        }
      }
  }
};
</script>