var amqp = require("amqplib/callback_api");

// Objeto para almacenar las canciones mas adelante.
var songsObj;

var songsList;

// Colas Persistentes
var q_conexion = "conectoMesa";
var q_votos = "atencionMesas"; //A esta cola se envía el mensaje para votar con los datos Ej. "codSitio,Mio Cid"

// Colas Temporales
var q_canciones = "canciones";
var qSongsReceiver = makeid();
var qVotesReceiver = makeid();

function makeid() {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function bail(err) {
  console.error(err);
  process.exit(1);
}

function createNewQueue(conn, newQueue) {
  conn.createChannel(function(err, ch) {
    ch.assertQueue(newQueue, { exclusive: true }, function(err, q) {
      console.log(" [*] New queue %s created", q.queue);
    });
  });
}

function persistentQueueOperations(conn, receiverQueue) {
  var ok = conn.createChannel(on_open);
  function on_open(err, ch) {
    if (err != null) bail(err);
    // Creamos la cola persistente "q" la cual contendrá la respuesta para el sitio.
    ch.assertQueue("", { durable: true }, function(err, q) {
      console.log(
        " [*] Waiting for messages in %s. To exit press CTRL+C",
        q.queue
      );
      // Enviamos la información a la cola indicada y pedimos que se nos responda a "q.queue".
      ch.sendToQueue(
        receiverQueue,
        new Buffer("jIbcjR" + "," + createNewQueue(ch, q_songs)),
        {
          persistent: true,
          replyTo: q.queue
        }
      );
      // Consumimos los datos recibidos para administrarlos.
      ch.consume(q.queue, function(msg) {
        if (msg !== null) {
          msg = msg.content.toString();
          //var obj = JSON.parse(msg);
          console.log(msg);
          //console.log(obj);
        }
      });
    });
  }
}

function temporalQueueOperations(
  conn,
  messageReceiverQueue,
  dataReceiverQueue
) {
  var ok = conn.createChannel(on_open);
  function on_open(err, ch) {
    createNewQueue(conn, dataReceiverQueue);
    if (err != null) bail(err);
    // Creamos la cola temporal "q" la cual contendrá la respuesta para el sitio.
    ch.assertQueue("", { exclusive: true }, function(err, q) {
      console.log(
        " [*] Waiting for messages in %s. To exit press CTRL+C",
        q.queue
      );
      // Enviamos la información a la cola indicada.
      if (dataReceiverQueue === qSongsReceiver) {
        ch.sendToQueue(
          messageReceiverQueue,
          new Buffer("66Q5W6" + "," + dataReceiverQueue),
          {
            replyTo: q.queue
          }
        );
        console.log(
          "Message Receiver Queue -> " + q.queue,
          "Songs Receiver Queue -> " + dataReceiverQueue
        );
      } else {
        ch.sendToQueue(
          messageReceiverQueue,
          new Buffer("66Q5W6" + "," + "Mio Cid"),
          {
            replyTo: q.queue
          }
        );
        console.log(
          "Message Receiver Queue -> " + q.queue,
          "Song Voted -> " + "Mio Cid"
        );
      }
      // Consumimos los datos recibidos para administrarlos.
      ch.consume(q.queue, function(msg) {
        if (msg !== null) {
          msg = msg.content.toString();
          //var obj = JSON.parse(msg);
          console.log(msg);
          //console.log(obj);
        }
      });
      // Consumimos la cola en la cual se reciben las canciones o los votos.
      if (dataReceiverQueue === qSongsReceiver) {
        ch.consume(dataReceiverQueue, function(msg) {
          if (msg !== null) {
            msg = msg.content.toString();
            //console.log(msg);
            msg = msg.split("|||");
            //console.log(msg[0]);
            var song1 = JSON.parse(msg[0]);
            var song2 = JSON.parse(msg[1]);
            var song3 = JSON.parse(msg[2]);
            //console.log(msg);
            // Agregamos los datos de las canciones a una lista
            songsList[0] = song1[Object.keys(song1)[0]];
            songsList[1] = song2[Object.keys(song2)[0]];
            songsList[2] = song3[Object.keys(song3)[0]];

            songsObj = Object.keys(song1)[0];
            console.log(Object.keys(song1)[0]);
            // console.log(Object.keys(song2)[0]);
            // console.log(Object.keys(song3)[0]);
          } else {
            console.log("Troubles receiving the songs...");
          }
        });
      } else {
      }
    });
    //temporalQueueOperations(conn, q_votos, qVotesReceiver);
  }
}

function cargarDetalles() {
  document.getElementById("Detalle1").innerHTML = songsList[0].title;
}

amqp.connect(
  "amqp://www.nidal.online",
  function(err, conn) {
    if (err != null) bail(err);
    // Recibimos la respuesta del servidor por medio de las colas persistentes.
    //persistentQueueOperations(conn, q_conexion);
    //persistentQueueOperations(conn, q_votos);
    // Recibimos la respuesta del servidor por medio de las colas temporales.
    temporalQueueOperations(conn, q_conexion, qSongsReceiver);
    /*var delayInMilliseconds = 1000; //1 second

    setTimeout(function() {
      temporalQueueOperations(conn, q_votos, qVotesReceiver);
    }, delayInMilliseconds);*/
  }
);
