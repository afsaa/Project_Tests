var amqp = require('amqplib/callback_api');

var cola_server = 'conectoMesa';
var enviar_votos='atencionMesas';

// Colas Temporales
var q_name = '';
var q_canciones='canciones';

function bail(err) {
  console.error(err);
  process.exit(1);
}

function consumer(conn) {
  var ok = conn.createChannel(on_open);
  function on_open(err, ch) {
    if (err != null) bail(err);
    ch.assertQueue('', { exclusive: true }, function (err, q) {
      console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q.queue);

    // ch.assertQueue('', { exclusive: true }, function (err, q2) {
    //   console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", q2.queue);

      ch.sendToQueue(cola_server, new Buffer('AsRt67'+','+q_canciones), {
        replyTo: q.queue
      });

      ch.consume(q.queue, function (msg) {
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

amqp.connect('amqp://www.nidal.online', function(err, conn) {
    if (err != null) bail(err);
    // Creamos el canal y enviamos el código del sitio.
    //conn.createChannel(function(err, ch) {
    
    // Recibimos la respuesta del servidor
    consumer(conn);
});
