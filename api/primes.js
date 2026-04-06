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

  // Sieve of Eratosthenes for speed — estimate upper bound using prime number theorem
  function sievePrimes(count) {
    if (count < 6) {
      const small = [2, 3, 5, 7, 11, 13];
      return small.slice(0, count);
    }
    // Upper bound: p_n < n * (ln(n) + ln(ln(n))) for n >= 6
    let upper = Math.ceil(count * (Math.log(count) + Math.log(Math.log(count)))) + 100;
    upper = Math.max(upper, 100);

    const sieve = new Uint8Array(upper + 1); // 0 = prime, 1 = composite
    sieve[0] = 1;
    sieve[1] = 1;
    for (let i = 2; i * i <= upper; i++) {
      if (sieve[i] === 0) {
        for (let j = i * i; j <= upper; j += i) {
          sieve[j] = 1;
        }
      }
    }

    const primes = [];
    for (let i = 2; i <= upper && primes.length < count; i++) {
      if (sieve[i] === 0) primes.push(i);
    }
    return primes;
  }

  const allPrimes = sievePrimes(limit);

  // Stream in batches
  const batchSize = 100;
  for (let i = 0; i < allPrimes.length; i += batchSize) {
    const batch = allPrimes.slice(i, i + batchSize);
    res.write(`data: ${JSON.stringify({ primes: batch, done: false })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ primes: [], done: true, total: allPrimes.length })}\n\n`);
  res.end();
}
