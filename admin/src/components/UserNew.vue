<template>
  <div>
    <div class="modal-card" style="width: auto">
        <header class="modal-card-head">
          <p class="modal-card-title">
            Crea nuovo utente
          </p>
        </header>
        <section class="modal-card-body">
          <b-field label="PIN carta">
              <b-input
                  type="text"
                  v-model="pin"
                  required>
              </b-input>
          </b-field>
          <b-field label="Nome">
              <b-input
                  type="text"
                  v-model="user.name"
                  required>
              </b-input>
          </b-field>
          <b-field label="Tipologia">
            <b-select placeholder="Tipologia" v-model="user.filter" required>
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
                  v-model="user.identifier"
                  required>
              </b-input>
          </b-field>
          <b-field label="Componenti nucleo familiare">
              <b-input
                  type="text"
                  v-model="user.nucleo"
                  required>
              </b-input>
          </b-field>
          <span style="color: #f00; font-size:14px">Attezione, al termine della creazione verra generato un PDF<br> contenente il PIN dell'utente. 
          Questo PIN non verrà memorizzato<br>all'interno del software, si prega di stampare il PDF<br>o conservarlo in un posto sicuro.</span>
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
    name: 'UserNew',
    data() {
      return {
        db: new ScryptaDB(true, ['users', 'settings']),
        scrypta: new ScryptaCore(true),
        tipologie: ["CITTADINO", "ESERCENTE", "FARMACIA"],
        users: [],
        user: {
          id: 0,
          address: '',
          sid: '',
          filter: '',
          name: '',
          identifier: '',
          nucleo: ''
        },
        pin: ''
      }
    },
    async mounted(){
      const app = this
      app.users = await app.db.get('users')
      if(app.users.length > 0){
        app.user.id = app.users.length + 1
      }
    },
    methods: {
      async saveUser(){
        const app = this
        if(app.pin !== ''){
          let address = await app.scrypta.createAddress('dodododo', false)
          app.user.address = address.pub
          app.user.sid = address.walletstore
          await app.db.put('users', app.user)
          app.user.pin = app.pin
          app.$buefy.toast.open({
            message: "Utente inserito correttamente.",
            type: "is-success"
          })
          app.$parent.close()
          app.$emit('userInserted', app.user)
        }else{
          app.$buefy.toast.open({
            message: "Si prega di inserire un PIN.",
            type: "is-danger"
          })
        }
      }
    }
  }
</script>
