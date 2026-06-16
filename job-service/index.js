require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
//const { v4: uuidv4 } = require('uuid');
//const { v4: uuidv4 } = require('uuid');
const redis = require('./redis');
const { connectRabbitMQ, getChannel, QUEUE_NAME } = require('./rabbitmq');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // allow CORS for all origins

app.get('/', (req, res) => {
  res.send('Job service is running!');
});

app.post('/jobs', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const jobId = uuidv4();

  // 1. Save job status to Redis as pending
  await redis.set(
    `job:${jobId}`,
    JSON.stringify({ status: 'pending', prompt })
  );

  // 2. Push job to RabbitMQ queue
  const channel = getChannel();
  channel.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify({ jobId, prompt })),
    { persistent: true }
  );

  console.log(`Job ${jobId} saved to Redis and pushed to RabbitMQ`);

  res.status(201).json({ jobId, status: 'pending' });
});

app.get('/jobs/:id', async (req, res) => {
  const jobId = req.params.id;
  const data = await redis.get(`job:${jobId}`);

  if (!data) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(JSON.parse(data));
});

// Start server only after connecting to RabbitMQ
async function start() {
  await connectRabbitMQ();
  app.listen(3000, () => {
    console.log('Server listening on http://localhost:3000');
  });
}

start();