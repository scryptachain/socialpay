<template>
  <div>
    <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
          <p class="modal-card-title">
            Modifica utente<br>
            <span style="font-size:15px">#{{ user.id }}: {{ user.address }}</span>
          </p>
        </header>
        <section class="modal-card-body">
          <b-field label="Nome">
              <b-input
                  type="text"
                  v-model="user.name"
                  required>
              </b-input>
          </b-field>
          <b-field label="Filtro">
              <b-input
                  type="text"
                  v-model="user.filter"
                  required>
              </b-input>
          </b-field>
          <b-field label="Identificativo">
              <b-input
                  type="text"
                  v-model="user.identifier"
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
        scrypta: new ScryptaCore(true)
      }
    },
    methods: {
      async saveUser(){
        const app = this
        await app.db.update('users','address',app.user.address,app.user)
        app.$buefy.toast.open({
          message: "Utente aggiornato correttamente.",
          type: "is-success"
        })
        app.$parent.close()
      }
    }
  }
</script>
