module.exports = async (app, msg) => {
  const config = app.get('config');
  const amqp = app.get('amqp');

  // TODO: reuse connections in future, but this is good enough for now

  const conn = await amqp;
  const channel = await conn.createChannel();

  if (!channel.sendToQueue(config.amqp.queue.name, new Buffer(JSON.stringify(msg)))) {
    throw new Error('Failed to write to queue');
  }

  await channel.close();
};
