<template>
  <div id="app">
    <div v-if="wallet">
      <b-navbar>
          <template slot="brand">
            <b-navbar-item v-on:click="navigate('home')">
              <img src="/logo.png" />
            </b-navbar-item>
          </template>
          <template slot="start">
            <b-navbar-item v-on:click="navigate('users')">Gestione utenti</b-navbar-item>
            <b-navbar-item v-on:click="navigate('history')">Storico transazioni</b-navbar-item>
            <b-navbar-item v-on:click="navigate('settings')">Impostazioni</b-navbar-item>
          </template>

          <template slot="end">
            <b-navbar-item tag="div">
              <div class="buttons">
                <a v-on:click="logout" class="button is-primary">
                  <strong>Logout</strong>
                </a>
              </div>
            </b-navbar-item>
          </template>
        </b-navbar>
        <home v-if="route==='home'" />
        <users v-if="route==='users'" />
        <history v-if="route==='history'" />
        <settings v-if="route==='settings'" />
    </div>
    <div class="container" v-if="!wallet">
      <div class="text-center" style="margin-top:10vh">
        <img src="/planum.png" width="15%" /><br><br>
        <h1>Effettua il login con un account<br>proprietario di una sidechain Planum</h1><br>
        <p>Per poter amministrare una sidechain devi collegarti come proprietario</p>
        <b-upload v-model="file" v-on:input="loadWalletFromFile" v-if="!isLogging" drag-drop>
          <section class="section">
            <div class="content has-text-centered">
              <p>Trascina il tuo file .sid qui o clicca per caricare.</p>
            </div>
          </section>
        </b-upload>
        <div v-if="isLogging">
          Login in corso...
        </div>
      </div>
    </div>
    <div class="text-center">
      <hr>
      <br />Scrypta Planum Admin is an<br>
      <a
        href="https://github.com/scryptachain/scrypta-planum-admin"
        target="_blank"
      >open-source</a> project by
      <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
      <br />
      <br />
    </div>
  </div>
</template>

<script>
let ScryptaCore = require("@scrypta/core")

export default {
  data() {
    return {
      scrypta: new ScryptaCore(true),
      address: "",
      wallet: "",
      route: 'home',
      isLogging: false,
      showScanModal: false,
      file: [],
      isCreating: false,
      isUpdating: false,
      showCreateModal: false,
      password: "",
      passwordrepeat: ""
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
    navigate(page){
      const app = this
      app.route = page
    },
    loadWalletFromFile() {
      const app = this;
      const file = app.file;
      const reader = new FileReader();
      reader.onload = function() {
        var dataKey = reader.result;
        app.isLogging = true
        app.$buefy.dialog.prompt({
          message: `Inserisci la password del wallet`,
          inputAttrs: {
            type: "password"
          },
          trapFocus: false,
          onConfirm: async password => {
            let key = await app.scrypta.readKey(password, dataKey);
            if (key !== false) {
              let isOwner = false
              let exp = dataKey.split(':')
              let address = exp[0]
              let sidechains = await app.scrypta.get('/sidechain/list')
              for(let x in sidechains.data){
                let sidechain = sidechains.data[x]
                if(sidechain.genesis.owner === address){
                  isOwner = true
                }
              }
              if(isOwner){
                app.scrypta.importPrivateKey(key.prv, password);
                localStorage.setItem("SID", dataKey);
                location.reload();
              }else{
                app.isLogging = false
                app.$buefy.toast.open({
                  message: "Sembra che tu non sia proprietario di nessuna blockchain!",
                  type: "is-danger"
                });
              }
            } else {
              app.isLogging = false
              app.$buefy.toast.open({
                message: "Password errata!",
                type: "is-danger"
              });
            }
          }
        });
      };
      reader.readAsText(file);
    },
    logout() {
      localStorage.setItem("SID", "");
      location.reload();
    }
  }
};
</script>