<template>
  <div id="app">
    <vue-headful :title="config.header" />
    <div v-if="wallet && userIsOnline">
      <b-navbar>
          <template slot="brand">
            <b-navbar-item v-on:click="navigate('home')">
              <img :src="'/' + config.logo" />
              <img :src="'/' + config.lettering" style="height:12px; margin-left: 10px;" />
            </b-navbar-item>
          </template>
          <template slot="start">
            <b-navbar-item v-on:click="navigate('users')">Gestione utenti</b-navbar-item>
            <b-navbar-item v-on:click="navigate('history')">Storico transazioni</b-navbar-item>
            <b-navbar-item v-on:click="navigate('refund')">Gestione rimborsi</b-navbar-item>
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
        <refund v-if="route==='refund'" />
    </div>
    <div class="container" v-if="!wallet && userIsOnline">
      <div class="text-center" style="margin-top:10vh">
        <img :src="'/' + config.completo" width="15%" /><br><br>
        <h1>Effettua il login con l'account proprietario.</h1><br>
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
    <div v-if="!userIsOnline" style="padding: 25vh; text-align:center">
      <img :src="'/' + config.completo" width="15%" /><br><br>
      <h1>Collegarsi a internet prima di continuare.</h1>
    </div>
    <div class="text-center">
      <hr>
      <br />SocialPay è un progetto
      <a
        href="https://github.com/scryptachain/socialpay"
        target="_blank"
      >open-source</a><br>donato alla comunità da
      <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
      <br />
      <br />
    </div>
  </div>
</template>

<script>
let ScryptaCore = require("@scrypta/core")
let config = require('./config.json')

export default {
  data() {
    return {
      scrypta: new ScryptaCore(true),
      address: "",
      userIsOnline: false,
      wallet: "",
      route: 'home',
      isLogging: false,
      file: [],
      isCreating: false,
      config: config
    };
  },
  async mounted() {
    const app = this;
    app.isOnline(async function(){
      app.userIsOnline = true
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
    })
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
              let exp = dataKey.split(':')
              let address = exp[0]
              let sidechain = await app.scrypta.post('/sidechain/get', { sidechain_address: app.config.sidechain })
              
              if(sidechain.sidechain[0].data.genesis.owner === address){
                app.scrypta.importPrivateKey(key.prv, password);
                localStorage.setItem("SID", dataKey);
                location.reload();
              }else{
                app.isLogging = false
                app.$buefy.toast.open({
                  message: "Sembra che tu non sia proprietario di questa sidechain!",
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
    },
    isOnline(user_callback){
      var message = function(){
          const {dialog} = require('electron').remote;

          return dialog.showMessageBox({
              title:"Non c'è internet!",
              message:"Il software necessita di Internet, collegarsi e riprovare.",
              type:'warning',
              buttons:["Riprova","Ignora"],
              defaultId: 0
          },function(index){
              // if clicked "Try again please"
              if(index == 0){
                  execute();
              }
          })
      };

      var execute = function(){
          if(navigator.onLine){
              // Execute action if internet available.
              user_callback();
          }else{
              // Show warning to user
              // And "retry" to connect
              message();
          }
      };

      // Verify for first time
      execute();
  }
  }
};
</script>