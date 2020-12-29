<template>
  <div>
    <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
          <p class="modal-card-title">
            Modifica utente<br>
            <span style="font-size:15px">#{{ updated.id }}: {{ updated.address }}</span>
          </p>
        </header>
        <section class="modal-card-body">
          <b-field label="Nome">
              <b-input
                  type="text"
                  v-model="updated.name"
                  required>
              </b-input>
          </b-field>
          <b-field label="Tipologia">
            <b-select placeholder="Tipologia" v-model="updated.filter" required>
                <option
                    v-for="option in tipologie"
                    :value="option"
                    :key="option">
                    {{ option }}
                </option>
            </b-select>
          </b-field>
          <b-field label="Identificativo">
              <b-input
                  type="text"
                  v-model="updated.identifier"
                  required>
              </b-input>
          </b-field>
          <b-field label="Componenti nucleo familiare">
              <b-input
                  type="text"
                  v-model="updated.nucleo"
                  required>
              </b-input>
          </b-field>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" v-on:click="saveUser" style="width:100%">Salva utente</button>
        </footer>
    </div>
  </div>
</template>

<script>
  let ScryptaCore = require("@scrypta/core")
  import ScryptaDB from '../libs/db.js'

  export default {
    name: 'UserForm',
    props: ['user'],
    data() {
      return {
        db: new ScryptaDB(true, ['users', 'settings']),
        scrypta: new ScryptaCore(true),
        tipologie: ["CITTADINO", "ESERCENTE", "FARMACIA"],
        updated: {}
      }
    },
    mounted(){
      const app = this
      app.updated = app.user
    },
    methods: {
      async saveUser(){
        const app = this
        await app.db.update('users','address', app.updated.address,app.updated)
        app.$buefy.toast.open({
          message: "Utente aggiornato correttamente.",
          type: "is-success"
        })
        app.$parent.close()
      }
    }
  }
</script>
