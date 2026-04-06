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

  // Sieve of Eratosthenes — estimate upper bound via prime number theorem
  function sieveCount(target) {
    if (target < 6) return { total: Math.min(target, 4) }; // 2,3,5,7

    let upper = Math.ceil(target * (Math.log(target) + Math.log(Math.log(target)))) + 100;
    upper = Math.max(upper, 100);

    const sieve = new Uint8Array(upper + 1);
    sieve[0] = 1;
    sieve[1] = 1;
    for (let i = 2; i * i <= upper; i++) {
      if (sieve[i] === 0) {
        for (let j = i * i; j <= upper; j += i) {
          sieve[j] = 1;
        }
      }
    }

    // Stream count updates every ~1 second
    let count = 0;
    let lastReport = Date.now();

    for (let i = 2; i <= upper && count < target; i++) {
      if (sieve[i] === 0) {
        count++;
        const now = Date.now();
        if (now - lastReport >= 1000) {
          res.write(`data: ${JSON.stringify({ count, done: false })}\n\n`);
          lastReport = now;
        }
      }
    }

    return count;
  }

  const total = sieveCount(limit);

  res.write(`data: ${JSON.stringify({ count: total, done: true })}\n\n`);
  res.end();
}
