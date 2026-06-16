require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const NOTIFY_QUEUE = 'job-notifications';

const app = express();
const server = http.createServer(app);

// Attach socket.io to the HTTP server
const io = new Server(server, {
  cors: { origin: '*' } // allow all origins for development
});

// Keep track of connected users
// key = jobId, value = socket
const jobSockets = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Client tells us which jobId they are waiting for
  socket.on('watch-job', (jobId) => {
    console.log(`Socket ${socket.id} is watching job ${jobId}`);
    jobSockets[jobId] = socket;
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Listen to RabbitMQ for completed jobs
async function startNotificationListener() {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(NOTIFY_QUEUE, { durable: true });

  console.log('Notification service listening for completed jobs...');

  channel.consume(NOTIFY_QUEUE, (msg) => {
    const { jobId, status, resultUrl } = JSON.parse(msg.content.toString());
    console.log(`Job ${jobId} is done — notifying browser...`);

    // Find the socket waiting for this job and send notification
    const socket = jobSockets[jobId];
    if (socket) {
      socket.emit('job-done', { jobId, status, resultUrl });
      delete jobSockets[jobId]; // cleanup
    }

    channel.ack(msg);
  });
}

server.listen(4000, async () => {
  console.log('Notification service running on http://localhost:4000');
  await startNotificationListener();
});