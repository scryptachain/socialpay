<template>
  <div class="main">
    <div class="container">
      <h1>Storico transazioni</h1>
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

            <template>

                <b-table-column field="from" label="Indirizzo di partenza" width="40" sortable searchable v-slot="props">
                  {{ props.row.from }}
                </b-table-column>

                <b-table-column field="to" label="Indirizzo di destinazione" searchable sortable v-slot="props">
                  {{ props.row.to }}
                </b-table-column>

                <b-table-column label="Ammontare" sortable v-slot="props">
                    {{ props.row.amount }} {{ user.owner[user.chain].genesis.symbol }}
                </b-table-column>

                <b-table-column field="sxid" label="Identificativo transazione" searchable sortable v-slot="props">
                    {{ props.row.sxid.substr(0,4) }}...{{ props.row.sxid.substr(-4) }}
                </b-table-column>

                <b-table-column label="Data" sortable v-slot="props">
                    {{ props.row.data }}
                </b-table-column>
            </template>
          </b-table>
          <p v-if="transactions.length === 0">Non ci sono ancora transazioni.</p>
          <vue-csv-downloader
            :data="transactions"
            :fields="fields"
          > 
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

export default {
  components: {
      VueCsvDownloader,
  },
  data() {
    return {
      db: new ScryptaDB(true, ['users', 'settings']),
      scrypta: new ScryptaCore(true),
      users: [],
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
      fields: ['sxid', 'from', 'to', 'amount', 'data'],
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
    app.scrypta.staticnodes = true
    app.user = await User.auth()
    app.users = await app.db.get('users')
    app.parsedUsers[app.user.identity.address] = 'AMMINISTRATORE'
    for(let x in app.users){
      let uu = app.users[x]
      if(uu.name !== ''){
        app.parsedUsers[uu.address] = uu.name 
      }else{
        app.parsedUsers[uu.address] = uu.address 
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
      if (response.data[x].transaction["inputs"][0]['vout'] === 'genesis') {
        from = 'GENESIS'
      }else if(response.data[x].transaction["inputs"][0]['vout'] === 'reissue') {
        from = 'REISSUE'
      }else{
        from = response.data[x]["address"]
      }
      if(from !== undefined){
        let block
        if(response.data[x].block > 0){
          block = response.data[x].block
        }else{
          block = 'unconfirmed'
        }
        if(app.parsedUsers[from] !== undefined && app.parsedUsers[from] !== from){
          from = app.parsedUsers[from]
        }
        if(app.parsedUsers[to] !== undefined && app.parsedUsers[to] !== to){
          to = app.parsedUsers[to]
        }
        let date = new Date(response.data[x].transaction.time)
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()
        let hours = date.getHours()
        let minutes = "0" + date.getMinutes()
        let formattedTime = day + '/' + month + '/' + year +' alle ' + hours + ':' + minutes.substr(-2)

        if(to !== app.user.chain){
          let transaction = {
            sxid: response.data[x].sxid,
            amount: value,
            from: from,
            to: to,
            block: block,
            data: formattedTime
          };
          transactions.push(transaction);
        }
      }
    }
    app.transactions = transactions;
  }
};
</script>