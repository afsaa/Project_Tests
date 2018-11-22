var amqp = require("amqplib/callback_api");

// Colas Persistentes
var q_conexion = "conectoMesa";
var q_votos = "atencionMesas";

// Colas Temporales
var q_canciones = "canciones";

function bail(err) {
  console.error(err);
  process.exit(1);
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
      ch.sendToQueue(receiverQueue, new Buffer("AsRt67" + "," + q_canciones), {
        persistent: true,
        replyTo: q.queue
      });
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
    if (err != null) bail(err);
    // Creamos la cola temporal "q" la cual contendrá la respuesta para el sitio.
    ch.assertQueue("", { exclusive: true }, function(err, q) {
      console.log(
        " [*] Waiting for messages in %s. To exit press CTRL+C",
        q.queue
      );
      // Enviamos la información a la cola indicada y pedimos que se nos responda a "q.queue".
      ch.sendToQueue(receiverQueue, new Buffer("AsRt67" + "," + q_canciones), {
        replyTo: q.queue
      });
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

amqp.connect(
  "amqp://www.nidal.online",
  function(err, conn) {
    if (err != null) bail(err);
    // Recibimos la respuesta del servidor por medio de las colas persistentes.
    persistentQueueOperations(conn, q_conexion);
    persistentQueueOperations(conn, q_votos);
    // Recibimos la respuesta del servidor por medio de las colas temporales.
    temporalQueueOperations(conn, q_canciones);
  }
);
