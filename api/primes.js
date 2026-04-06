export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const limit = Math.min(parseInt(req.query.limit) || 10000, 100000);

  function isPrime(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  let count = 0;
  let n = 2;
  const batchSize = 50;
  let batch = [];

  function sendBatch() {
    while (count < limit && n < 2000000) {
      if (isPrime(n)) {
        batch.push(n);
        count++;
        if (batch.length >= batchSize) {
          res.write(`data: ${JSON.stringify({ primes: batch, done: false })}\n\n`);
          batch = [];
          n++;
          setImmediate(sendBatch);
          return;
        }
      }
      n++;
    }
    if (batch.length > 0) {
      res.write(`data: ${JSON.stringify({ primes: batch, done: false })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ primes: [], done: true, total: count })}\n\n`);
    res.end();
  }

  sendBatch();
}
