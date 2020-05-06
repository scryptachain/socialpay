# SocialPay

SocialPay si propone come soluzione per la rapida erogazione da parte dei comuni nei contronti dei cittadini aventi diritto ai buoni spesa, a seguito della situazione di emergenza generata dal COVID19.


L'intero progetto è open-source, questo significa che puoi generare tutto l'occorrente per emettere e gestire i buoni spesa per il tuo comune. Questo repository è diviso per regioni e comuni e all'interno troverai i file che generano due tipi di progetti:

1) Admin: questo progetto è una personalizzazione del software di gestione Scrypta Planum Admin, che serve a gestire le sidechain.
2) Pos: questo progetto serve a generare il front-end per i commercianti e che permette di spendere i buoni
3) Card: questo progetto serve a generare le card wallet stampabili in formato QR code per distribuirle ai cittadini

Una cartella generica chiamata `documentazione` contiene tutte le presentazioni, i sorgenti grafici delle card e i prestampati legali per la convenzione con il comune.

## Come contirubire al progetto

Se vuoi contribuire al progetto puoi creare, in accordo con la volontà comunale, una copia del progetto e richiedere l'inserimento del codice tramite Pull Request.
All'interno delle cartelle troverai un file `config.json` che ti permette di configurare i parametri di base. Questi comprendono principalmente le modifiche grafiche, di titoli e, chiaramente, permettono di collegare la sidechain tramite indrizzo univoco.

Si consiglia di forkare questo progetto e aggiungere il proprio comune così da darne evidenza a tutti i contributori del progetto. Qualora non trovassi la cartella della tua regione, dovrai crearla tu stesso.

Alla fine del processo di aggiunta e creazione del progetto per il tuo comune potrai richiedere l'aggiunta nel repository ufficiale tramite pull request.

## Operazioni preliminari per impostare il progetto

Si consiglia di scaricare le cartelle di base aggiornate dal branch di svilppo: https://github.com/scryptachain/socialpay/tree/development

Dopo aver scaricato le cartelle si dovrà installare tutte le dipendenze attraverso il comando `npm install` all'interno di ogni sottocartella (`admin`, `card`, `pos`).

## Creazione della sidechain

La creazione della rappresentazione digitale di valore avviene attraverso la tecnologia Sidechain di Planum. Ci sono quindi delle operazioni preliminari da effettuare prima di poter iniziare a compilare i progetti:

1) Vai su https://web.manent.app e crea un nuovo account Scrypta, inserisci una password forte, perchè questo account sarà l'account proprietario della sidechain. Effettua il backup del file .sid e del paper wallet per sicurezza, custodisci questi file gelosamente e offline.

2) Ti serviranno almeno 1.001 LYRA per far partire la sidechain e dovrai versare almeno 0.1 LYRA per ogni account cittadino o esercente, se non dovessi esserne in possesso ti invitiamo ad effettuare una richiesta ufficiale all'email `info@scrypta.foundation`.

3) Collegati su https://planum.dev e crea una nuova sidechain attraverso l'apposito tool di creazione. Rimandiamo ad una guida più dettagliata per eventuale supporto: https://medium.com/@scryptachain/scrypta-lancia-planum-un-sidechain-layer-per-lemissione-di-tokenized-asset-ee156d300f4d. I parametri consigliati per la creazione sono i seguenti: 
```
nome: SocialPay - Comune di ...
ticker: sEUR
decimals: 2
supply: Quantità da assegnare
reissuable: true
burnable: true
```

4) Dopo che avrai generato la sidechain dovrai appuntarti l'indirizzo univoco, che ti servirà per collegare le applicazioni alla tua sidechain. Questo indirizzo puoi trovarlo sempre su https://planum.dev/#/explorer alla riga corrispondente, sotto la colonna `address`.


## Come compilare la parte di amministrazione

Il software di amministrazione è un progetto electron e dovrai modificare il file sotto `admin/config.json` inserendo i parametri richiesti e dovrai inserire i loghi del comune di riferimento nella cartella `admin/public`.

Dopo aver modificato tutto il necessario è possibile provare in anteprima il software attraverso il comando `npm run electron:serve` oppure creare la build vera e propria con il comando `npm run electron:build`.

## Come compilare il web PoS

Il web PoS è un progetto VueJS e dovrai modificare il file sotto `admin/config.json` inserendo i parametri richiesti e dovrai inserire i loghi del comune di riferimento nella cartella `admin/public`.

Dopo aver modificato tutto il necessario è possibile provare in anteprima il software attraverso il comando `npm run serve` oppure creare la build vera e propria con il comando `npm run build`.

La cartella di distribuzione `dist` dovrà essere pubblicata all'interno di un server Apache. E' fondamentale che venga installato un certificato SSL, consigliamo il servizio gratuito https://letsencrypt.org/ che potrà fornire un certificato SSL gratuito.

## Come creare le card wallet

Le card wallet vengono create attraverso lo script NodeJS presente nella cartella `card`. E' necessario modificare i file grafici nella cartella `assets/` al fine di personalizzare le card per il vostro comune. Il progetto genererà sotto la cartella `prints/` il numero di card richieste ed il solo QR Code ad mandare eventualmente alla tipografia.

Un altro file `out.csv` verrà creato e conterrà tutti i PIN necessari a sbloccare le card. Questo file dovrà essere conservato gelosamente offline e servirà per importare le anagrafiche all'interno del software di amministrazione. Per caricare le anagrafiche si dovrà eliminare la seconda colonna.

Il file `import.csv` verrà generato per agevolare il processo di importazione delle anagrafiche all'interno del software.

Per generare le card e il documento PIN accompagnatorio si deve modificare il file `config.json` inserendo i riferimenti necessari e dare il seguente comando ```node index.js -g=100```. Per modificare la quantità ènecessario modificare il numero `100` con la quantità desiderata. E' molto importante fare un backup della cartella `prints` e del file `out.csv` in quanto questi file vengono cancellati ad ogni nuova generazione.

## Richieste di aiuto

Se hai bisogno di aiuto per integrare il progetto o trovi bug da risolvere puoi aprire una issue o scrivere a `info@scrypta.foundation`, ti risponderemo al più presto.
