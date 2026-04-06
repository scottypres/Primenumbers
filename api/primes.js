export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const limit = Math.max(parseInt(req.query.limit) || 10000, 1);

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
  let lastReport = Date.now();

  function compute() {
    const batchEnd = count + 500;
    while (count < limit) {
      if (isPrime(n)) {
        count++;
      }
      n++;

      if (count >= batchEnd) break;
    }

    const now = Date.now();
    if (now - lastReport >= 1000 || count >= limit) {
      res.write(`data: ${JSON.stringify({ count, done: false })}\n\n`);
      lastReport = now;
    }

    if (count >= limit) {
      res.write(`data: ${JSON.stringify({ count, done: true })}\n\n`);
      res.end();
    } else {
      setImmediate(compute);
    }
  }

  compute();
}
