require('dotenv').config();
const amqp = require('amqplib');
const Redis = require('ioredis');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = 'media-jobs';
const NOTIFY_QUEUE = 'job-notifications';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  //password: 'gPyTjT06OFJymz0LazQasM1odxJQwgRp',
});

function simulateWork(jobId) {
  return new Promise((resolve) => {
    console.log(`Processing job ${jobId}...`);
    setTimeout(() => {
      resolve(`https://placeholder.com/result-${jobId}.png`);
    }, 10000);
  });
}

async function start() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.assertQueue(NOTIFY_QUEUE, { durable: true });

  channel.prefetch(1);

  console.log('Worker is listening for jobs...');

  channel.consume(QUEUE_NAME, async (msg) => {
    const { jobId, prompt } = JSON.parse(msg.content.toString());
    console.log(`Picked up job ${jobId}: "${prompt}"`);

    const resultUrl = await simulateWork(jobId);

    // Update Redis
    await redis.set(
      `job:${jobId}`,
      JSON.stringify({ status: 'done', prompt, resultUrl })
    );

    // Notify the notification service via RabbitMQ
    channel.sendToQueue(
      NOTIFY_QUEUE,
      Buffer.from(JSON.stringify({ jobId, status: 'done', resultUrl })),
      { persistent: true }
    );

    console.log(`Job ${jobId} completed and notification sent!`);

    channel.ack(msg);
  });
}

start();