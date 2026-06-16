const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = 'media-jobs';

let channel = null;

async function connectRabbitMQ() {
  const connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  console.log('Connected to RabbitMQ!');
  return channel;
}

function getChannel() {
  return channel;
}

module.exports = { connectRabbitMQ, getChannel, QUEUE_NAME };