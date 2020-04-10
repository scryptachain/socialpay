<template>
  <div id="app">
    <vue-headful :title="config.header" />
    <div v-if="!isLogging && wallet">
      <b-navbar>
        <template slot="brand">
          <b-navbar-item tag="router-link" :to="{ path: '/' }">
            <img :src="'/' + config.logo" />
            <img :src="'/' + config.lettering" style="height:12px; margin-left: 10px;" />
          </b-navbar-item>
        </template>
        <template slot="start">
          <b-navbar-item href="/#/">Home</b-navbar-item>
          <b-navbar-item href="/#/card">Controlla card</b-navbar-item>
          <b-navbar-item href="/#/history">Storico transazioni</b-navbar-item>
          <b-navbar-item href="/#/refund">Storico rimborsi</b-navbar-item>
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
      <router-view />
    </div>
    <div class="fullscreen" v-if="showScanModal">
      <b-button v-on:click="hideScanModal" type="is-primary" style="width:50px; position:fixed; z-index:999; top:10px; right:10px;">X</b-button>
      <qrcode-stream @decode="onDecode"></qrcode-stream>
    </div>
    <div v-if="!wallet">
      <section class="hero">
        <div class="hero-body" style="padding: 0;">
          <div class="container" id="create" style="margin-top:50px;">
            <div class="">
              <div style="padding: 50px 20px;">
                <img src="/completo.png" width="55%"><br>
                <h1 class="title is-3">SocialPay</h1>
                <br />
                <h2 class="subtitle">
                  <b-button type="is-primary" size="is-large" v-on:click="showScan">SCANNERIZZA CARD</b-button>
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    <b-loading :is-full-page="true" :active.sync="isLogging" :can-cancel="false"></b-loading>
    <div v-if="updateExists" class="fullscreen">
      <div style="padding:30vh 30px; text-align:center">
        <h1 class="is-title is-1">Attenzione</h1>
        C'è un aggiornamento dell'applicativo,
        si prega di cliccare il pulsante sottostante per proseguire.<br><br>
        <b-button
          type="is-success"
          v-on:click="refreshApp"
        >
          Clicca qui per aggiornare
        </b-button>
      </div>
    </div>
    <hr>
    <div style="padding:0 10px">
      SocialPay è un progetto
      <a
        href="https://github.com/scryptachain/scrypta-planum-web-pos"
        target="_blank"
      >open-source</a><br>donato alla comunità da
      <a href="https://scrypta.foundation" target="_blank">Scrypta Foundation</a>.
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
      wallet: "",
      config: config,
      isLogging: true,
      showScanModal: false,
      refreshing: false,
      registration: null,
      updateExists: false
    };
  },
  created () {
    document.addEventListener('swUpdated', this.showRefreshUI, { once: true });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (this.refreshing) return;
      this.refreshing = true;
      window.location.reload();
    })
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
    showRefreshUI (e) {
      this.registration = e.detail;
      this.updateExists = true;
    },
    refreshApp () {
      this.updateExists = false;
      if (!this.registration || !this.registration.waiting) { return; }
      this.registration.waiting.postMessage('skipWaiting');
    },
    hideScanModal() {
      const app = this
      app.showScanModal = false
    },
    onDecode (decodedString) {
      const app = this
      app.showScanModal = false
      var dataKey = decodedString

      app.$buefy.dialog.prompt({
        message: `Inserisci pin card`,
        inputAttrs: {
          type: "password"
        },
        trapFocus: false,
        onConfirm: async password => {
          let key = await app.scrypta.readKey(password, dataKey);
          if (key !== false) {
            app.scrypta.importPrivateKey(key.prv, password);
            localStorage.setItem("SID", dataKey);
            location.reload();
          } else {
            app.$buefy.toast.open({
              message: "Pin errato!",
              type: "is-danger"
            });
          }
        }
      });
    },
    showScan(){
      const app = this
      app.showScanModal = true
    },
    logout() {
      localStorage.setItem("SID", "");
      location.reload();
    }
  }
};
</script>

<style>
  #app {
    font-family: "Sen";
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
  }

  #nav {
    padding: 30px;
  }

  #nav a {
    font-weight: bold;
    color: #2c3e50;
  }

  #nav a.router-link-exact-active {
    color: #42b983;
  }
</style>