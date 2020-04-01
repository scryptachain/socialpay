<template>
  <div class="settings">
    <b>La tua identità</b>
    <hr>
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
      wallet: "",
      axios: axios,
      config: config,
      chain: config.sidechain,
      assets: []
    };
  },
  async mounted() {
    const app = this;
    app.wallet = await app.scrypta.importBrowserSID();
    app.wallet = await app.scrypta.returnDefaultIdentity();
    
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