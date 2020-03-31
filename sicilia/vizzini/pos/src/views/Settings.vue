<template>
  <div class="settings">
    <b>La tua identità</b><br><br>
    <v-gravatar :email="address" style="width:50%" /><br>
    <span style="font-size:12px">{{ address }}</span>
    <hr>
    <b-field label="Seleziona valuta digitale">
        <b-select v-model="chain" placeholder="Seleziona una valuta">
            <option
                v-for="option in assets"
                :value="option.chain"
                :key="option.chain">
                {{ option.name }} {{ option.ticker }}
            </option>
        </b-select>
    </b-field>

    <b-field label="Seleziona valuta locale">
        <b-select v-model="currency" placeholder="Seleziona una valuta">
            <option
                v-for="option in currencies"
                :value="option"
                :key="option">
                {{ option.toUpperCase() }}
            </option>
        </b-select>
    </b-field>
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
      wallet: "",
      axios: axios,
      currency: 'eur',
      chain: '6RQ54yHx2dARWkN8Biiw3gDjb4sB5hSHSH',
      assets: [],
      currencies: ["eur", "usd", "gbp"]
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

    if (app.wallet.length > 0) {
      let SIDS = app.wallet.split(":");
      app.address = SIDS[0];
      let identity = await app.scrypta.returnIdentity(app.address);
      app.wallet = identity;
      app.isLogging = false;
      /* app.assets = [
        {
          chain: "main",
          ticker: "LYRA",
          name: "Scrypta"
        }
      ]*/ 
      let sidechains = await app.scrypta.get('/sidechain/list')
      for(let x in sidechains.data){
        let sidechain = sidechains.data[x]
        app.assets.push({
          chain: sidechain.address,
          ticker: sidechain.genesis.symbol,
          name: sidechain.genesis.name.toUpperCase()
        })
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