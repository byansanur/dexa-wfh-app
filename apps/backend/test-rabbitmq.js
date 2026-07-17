const amqp = require('amqplib');

async function spamRabbitMQ() {
  try {
    console.log('Menghubungkan ke RabbitMQ...');
    const connection = await amqp.connect('amqp://localhost:5672');
    const channel = await connection.createChannel();
    
    // Nama antrean harus sama dengan yang digunakan di backend NestJS
    const queue = 'audit_logs_queue';
    await channel.assertQueue(queue, { durable: true });

    const totalMessages = 500;
    console.log(`Mengirim ${totalMessages} pesan percobaan (Spam) ke RabbitMQ...`);

    for (let i = 1; i <= totalMessages; i++) {
      // NestJS Microservices ClientProxy.emit() format:
      const messageFormat = {
        pattern: 'ProfileUpdated', 
        data: {
          userId: `stress-test-user-${i}`,
          action: 'UPDATE_PROFILE',
          changes: { note: `Stress test ke-${i}` },
          timestamp: new Date().toISOString(),
        }
      };

      channel.sendToQueue(queue, Buffer.from(JSON.stringify(messageFormat)));
      
      // Kasih sedikit log visual tiap 100 pesan
      if (i % 100 === 0) {
        console.log(`Terkirim ${i} pesan...`);
      }
    }

    console.log('✅ Semua pesan berhasil didorong ke antrean (Queue) RabbitMQ!');
    console.log('Silakan cek halaman MongoDB Audit Logs di aplikasi Admin Anda.');
    
    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);

  } catch (error) {
    console.error('Gagal terhubung ke RabbitMQ:', error);
  }
}

spamRabbitMQ();
