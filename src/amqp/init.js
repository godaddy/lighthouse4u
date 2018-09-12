module.exports = async (config, amqpclient) => {
  const conn = await amqpclient;
  const ch = await conn.createChannel();
  await ch.assertQueue(config.amqp.queue.name, config.amqp.queue.options);
  console.log('AMQP queue is ready:', config.amqp.queue.name);
};
