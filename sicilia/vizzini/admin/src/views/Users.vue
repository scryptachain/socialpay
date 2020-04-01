<template>
  <div class="main">
    <div class="container">
      <h1>Gestione utenti</h1>
      <hr>
      <div class="columns">
        <div class="column">
          <b-tabs :animated="false">
            <b-tab-item label="Elenco utenti">
              <b-table
                v-if="users.length > 0"
                :data="users"
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
                    <b-table-column field="id" label="ID" width="40" sortable numeric>
                        {{ props.row.id }}
                    </b-table-column>

                    <b-table-column field="filter" label="Tipologia" width="40" sortable searchable>
                        {{ props.row.filter }}
                    </b-table-column>

                    <b-table-column field="name" label="Nome" searchable sortable>
                        {{ props.row.name }}
                    </b-table-column>

                    <b-table-column field="address" label="Indirizzo" searchable sortable>
                        {{ props.row.address }}
                    </b-table-column>

                    <b-table-column field="user.identifier" label="Identificativo" searchable sortable>
                        {{ props.row.identifier }}
                    </b-table-column>

                    <b-table-column field="user.identifier" label="C. nuc. fam." searchable sortable>
                        {{ props.row.nucleo }}
                    </b-table-column>

                    <b-table-column width="130" label="Azioni" sortable>
                      <b-button type="is-primary" v-on:click="editUser(props.row)" size="is-small">
                        <b-icon
                            pack="fas"
                            icon="pen">
                        </b-icon>
                      </b-button>
                      <b-button type="is-primary" v-on:click="showUser(props.row)" style="margin-left:10px;" size="is-small">
                        <b-icon
                            pack="fas"
                            icon="eye">
                        </b-icon>
                      </b-button>
                      <b-button type="is-primary" v-on:click="deleteUser(props.row.id)" style="margin-left:10px;" size="is-small">
                        <b-icon
                            pack="fas"
                            icon="trash">
                        </b-icon>
                      </b-button>
                    </b-table-column>
                </template>
              </b-table>
              <div v-if="users.length === 0">
                <p>Nessun utente, si prega di importarli attraverso l'apposito tab.</p>
              </div>
            </b-tab-item>

            <b-tab-item label="Carica file .csv di origine">
              <p>
                Da questa sezione puoi caricare il file .csv di origine per inserire gli utenti dentro il pannello di amministrazione.<br>
                Dopo aver caricato il file tutti gli utenti verranno aggiunti al gestionale, se dovessero esserci doppioni questi verranno ignorati.<br><br>
                Il file .csv dovrà essere così composto:<br>
                <pre>SERIALE | WALLET | TIPOLOGIA | NOME | IDENTIFICATIVO | COMPONENTI NUCLEO FAMILIARE</pre>
                <br>
                I campi NOME, TIPOLOGIA, COMPONENTI NUCLEO FAMILIARE e IDENTIFICATIVO sono facoltativi, si prega di <span style="color:#f00">non inserire il campo con la password</span>.<br><br>
              </p>
              <b-upload v-model="file" v-on:input="loadCsvFromFile" v-if="!isImporting" drag-drop>
                <section class="section">
                  <div class="content has-text-centered">
                    <p>Trascina il tuo file .csv qui o clicca per caricare.</p>
                  </div>
                </section>
              </b-upload>
            </b-tab-item>
          </b-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
let ScryptaCore = require("@scrypta/core")
import User from '../libs/user.js'
import ScryptaDB from '../libs/db.js'
const parse = require("csv-parse")
import UserForm from '../components/UserForm.vue'
import UserDetails from '../components/UserDetails.vue'

export default {
  data() {
    return {
      db: new ScryptaDB(true, ['users', 'settings']),
      scrypta: new ScryptaCore(true),
      users: [],
      isPaginated: true,
      isPaginationSimple: false,
      paginationPosition: 'bottom',
      defaultSortDirection: 'asc',
      sortIcon: 'arrow-up',
      sortIconSize: 'is-small',
      currentPage: 1,
      perPage: 15,
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
      },
      file: [],
      isImporting: false
    };
  },
  async mounted() {
    const app = this;
    app.user = await User.auth()
    app.users = await app.db.get('users')
  },
  methods: {
    loadCsvFromFile() {
      const app = this;
      const file = app.file;
      const reader = new FileReader();
      reader.onload = function() {
        app.isImporting = true
        var csvFile = reader.result;
        parse(csvFile, async function(err, output){
          for(let x in output){
            let row = output[x]
            let insert = false
            while(insert === false){
              let doc = {
                id: row[0],
                sid: row[1]
              }
              if(row[2] !== undefined){
                doc.filter = row[2]
              }else{
                doc.filter = ''
              }
              if(row[3] !== undefined){
                doc.name = row[3]
              }else{
                doc.name = ''
              }
              if(row[4] !== undefined){
                doc.identifier = row[4]
              }else{
                doc.identifier = ''
              }
              if(row[5] !== undefined){
                doc.nucleo = row[5]
              }else{
                doc.nucleo = ''
              }
              let exp = row[1].split(':')
              doc.address = exp[0]
              insert = await app.db.put('users',doc)
            }
          }
          app.isImporting = false
          app.users = await app.db.get('users')
          app.$buefy.toast.open({
            message: "Importazione avvenuta con successo!",
            type: "is-success"
          })
        })
      };
      reader.readAsText(file);
    },
    editUser(user) {
      this.$buefy.modal.open({
          parent: this,
          component: UserForm,
          hasModalCard: true,
          trapFocus: false,
          props: {user: user}
      })
    },
    showUser(user) {
      this.$buefy.modal.open({
          parent: this,
          component: UserDetails,
          hasModalCard: true,
          fullScreen: true,
          trapFocus: false,
          customClass: 'fullscreen-modal',
          props: {user: user}
      })
    },
    deleteUser(id) {
      const app = this
      app.$buefy.dialog.prompt({
        message: `Inserisci la password del wallet`,
        inputAttrs: {
          type: "password"
        },
        trapFocus: false,
        onConfirm: async password => {
          let key = await app.scrypta.readKey(password, app.user.identity.wallet);
          if (key !== false) {
            await app.db.delete('users','id',id)
            app.$buefy.toast.open({
              message: "Utente eliminato correttamente!",
              type: "is-success"
            })
            app.users = await app.db.get('users')
          }else{
            app.$buefy.toast.open({
              message: "Password errata!",
              type: "is-danger"
            })
          }
        }
      })
    }
  }
};
</script>