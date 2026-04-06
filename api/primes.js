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

    // Stream counts in batches (no need to send actual prime values)
    let count = 0;
    const batchSize = 1000;
    let batchCount = 0;

    for (let i = 2; i <= upper && count < target; i++) {
      if (sieve[i] === 0) {
        count++;
        batchCount++;
        if (batchCount >= batchSize) {
          res.write(`data: ${JSON.stringify({ count, done: false })}\n\n`);
          batchCount = 0;
        }
      }
    }

    return count;
  }

  const total = sieveCount(limit);

  res.write(`data: ${JSON.stringify({ count: total, done: true })}\n\n`);
  res.end();
}
