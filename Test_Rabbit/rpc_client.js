var amqp = require("amqplib/callback_api");

// Colas Persistentes
var q_conexion = "conectoMesa";
var q_votos = "atencionMesas"; //A esta cola se envía el mensaje para votar con los datos Ej. "codSitio,Mio Cid"

// Colas Temporales
var q_canciones = "canciones";
var q_test = makeid();

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

function createNewQueue(conn) {
  conn.createChannel(function(err, ch) {
    ch.assertQueue(q_test, { exclusive: true }, function(err, q) {
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

function temporalQueueOperations(conn, receiverQueue) {
  var ok = conn.createChannel(on_open);
  function on_open(err, ch) {
    var q1 = createNewQueue(conn);
    if (err != null) bail(err);
    // Creamos la cola temporal "q" la cual contendrá la respuesta para el sitio.
    ch.assertQueue("", { exclusive: true }, function(err, q) {
      console.log(
        " [*] Waiting for messages in %s. To exit press CTRL+C",
        q.queue
      );
      // Enviamos la información a la cola indicada y pedimos que se nos responda a "q.queue".
      ch.sendToQueue(receiverQueue, new Buffer("wZ0Key" + "," + q_test), {
        replyTo: q.queue
      });
      console.log(q.queue, q_test);
      // Consumimos los datos recibidos para administrarlos.
      ch.consume(q.queue, function(msg) {
        if (msg !== null) {
          msg = msg.content.toString();
          //var obj = JSON.parse(msg);
          console.log(msg);
          //console.log(obj);
        }
      });
      // Consumimos la cola en la cual se reciben las canciones.
      ch.consume(q_test, function(msg) {
        if (msg !== null) {
          msg = msg.content.toString();
          //console.log(msg);
          msg = msg.split("|||");
          console.log(msg[0]);
          var song1 = JSON.parse(msg[0]);
          //var song2 = JSON.parse(msg[1]);
          //var song3 = JSON.parse(msg[2]);
          //console.log(msg);
          console.log(song1);
        } else {
          console.log("Message Error...");
        }
      });
    });
  }
}

amqp.connect(
  "amqp://www.nidal.online",
  function(err, conn) {
    if (err != null) bail(err);
    // Recibimos la respuesta del servidor por medio de las colas persistentes.
    //persistentQueueOperations(conn, q_conexion);
    //persistentQueueOperations(conn, q_votos);
    // Recibimos la respuesta del servidor por medio de las colas temporales.
    temporalQueueOperations(conn, q_conexion);
  }
);
