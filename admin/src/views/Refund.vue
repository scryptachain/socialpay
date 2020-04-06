<template>
  <div class="main">
    <div class="container">
      <h1>Gestione rimborsi</h1>
      <hr>
      <div class="columns">
        <div class="column">
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
                  {{ props.row.from }}
                </b-table-column>

                <b-table-column field="to" label="Indirizzo di destinazione" searchable sortable>
                  {{ props.row.to }}
                </b-table-column>

                <b-table-column label="Ammontare" sortable>
                    {{ props.row.amount }} {{ user.owner[user.chain].genesis.symbol }}
                </b-table-column>

                <b-table-column field="sxid" label="Identificativo transazione" searchable sortable>
                    {{ props.row.sxid.substr(0,4) }}...{{ props.row.sxid.substr(-4) }}
                </b-table-column>

                <b-table-column label="Blocco" sortable>
                    {{ props.row.block }}
                </b-table-column>
                
                <b-table-column width="90" style="text-align: center" label="Rimborsato" sortable>
                  <span v-if="contabilizzati.indexOf(props.row.sxid) === -1">NO</span>
                  <span v-if="contabilizzati.indexOf(props.row.sxid) !== -1">SI</span>
                </b-table-column>

                <b-table-column width="40" style="text-align:center" label="Azioni" sortable>
                  <b-button type="is-primary" v-on:click="editRefund(props.row)" size="is-small">
                    <b-icon
                        pack="fas"
                        icon="pen">
                    </b-icon>
                  </b-button>
                </b-table-column>
            </template>
          </b-table>

          <p v-if="transactions.length === 0">Non ci sono ancora richieste di rimborso.</p>
          <vue-csv-downloader :data="transactions" :fields="fields"> 
            <b-button v-if="transactions.length > 0" type="is-primary" style="float:left; margin-top:-60px;" size="is-normal">SCARICA BACKUP</b-button>
          </vue-csv-downloader>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
let ScryptaCore = require("@scrypta/core")
import User from '../libs/user.js'
import ScryptaDB from '../libs/db.js'
import VueCsvDownloader from 'vue-csv-downloader';
import RefundDetails from '../components/RefundDetails.vue'

export default {
  components: {
      VueCsvDownloader,
  },
  data() {
    return {
      db: new ScryptaDB(true, ['users', 'settings']),
      scrypta: new ScryptaCore(true),
      users: [],
      esercenti: [],
      contabilizzati: [],
      parsedUsers: {},
      isPaginated: true,
      isPaginationSimple: false,
      paginationPosition: 'bottom',
      defaultSortDirection: 'asc',
      sortIcon: 'arrow-up',
      sortIconSize: 'is-small',
      currentPage: 1,
      perPage: 15,
      transactions: [],
      fields: ['sxid', 'from', 'to', 'amount', 'block'],
      user: {
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
      }
    };
  },
  async mounted() {
    const app = this;
    app.user = await User.auth()
    app.users = await app.db.get('users')
    app.parsedUsers[app.user.identity.address] = 'AMMINISTRATORE'
    for(let x in app.users){
      let uu = app.users[x]
      if(uu.name !== '' && uu.filter === 'ESERCENTE'){
        app.parsedUsers[uu.address] = uu.name 
      }
    }
    let response = await app.scrypta.post('/sidechain/scan', { sidechain_address: app.user.chain })
    let transactions = [];
    for (let x in response.data) {
      let value = 0;
      let to = "";
      for (let y in response.data[x].transaction.outputs) {
        if (y != response.data[x]["address"]) {
          value += response.data[x].transaction.outputs[y];
          to = y;
        }
      }
      if(to === ""){
        for (let y in response.data[x].transaction.outputs) {
          value += response.data[x].transaction.outputs[y];
          to = y;
        }
      }
      let from = "";
      let address
      if (response.data[x].transaction["inputs"][0]['vout'] === 'genesis') {
        from = 'GENESIS'
      }else if(response.data[x].transaction["inputs"][0]['vout'] === 'reissue') {
        from = 'REISSUE'
      }else{
        from = response.data[x]["address"]
        address = from
      }
      if(from !== undefined){
        let block
        if(response.data[x].block > 0){
          block = response.data[x].block
        }else{
          block = 'unconfirmed'
        }
        if(to === app.user.chain && from !== 'AMMINISTRATORE' && app.parsedUsers[from] !== undefined && from !== app.user.identity.address){
          to = 'RICHIESTA DI RIMBORSO'
          from = app.parsedUsers[from]
          if(app.esercenti.indexOf(address) === -1){
            app.esercenti.push(address)
          }
          let transaction = {
            sxid: response.data[x].sxid,
            amount: value,
            from: from,
            to: to,
            address: address,
            block: block
          }
          transactions.push(transaction)
        }
      }
    }
    app.transactions = transactions;
    for(let x in app.esercenti){
      let esercente = app.esercenti[x]
      let received = await app.scrypta.post('/received', { address: esercente })
      for(let x in received.data){
        let tx = received.data[x]
        let data = tx.data.split(':')
        if(data[0] === 'REFUND'){
          app.contabilizzati.push(data[1])
        }
      }
    }
  },
  methods: {
    async editRefund(refund){
      this.$buefy.modal.open({
          parent: this,
          component: RefundDetails,
          hasModalCard: true,
          trapFocus: false,
          props: {refund: refund}
      })
    }
  }
};
</script>