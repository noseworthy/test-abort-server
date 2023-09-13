async function main() {
  console.log('starting client');

  const [_, __, timeoutInSeconds] = process.argv;
  if (timeoutInSeconds) {
    console.log(`Waiting ${timeoutInSeconds} seconds before aborting`);
    setTimeout(() => {
      abortController.abort('timeout');
    }, timeoutInSeconds * 1000);
  }

  const abortController = new AbortController();


  const response = await fetch('http://localhost:3030/test', {
    signal: abortController.signal,
    method: 'GET',
  })

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let chunk = await reader.read();
  while (!chunk.done) {
    const text = decoder.decode(chunk.value);
    console.log(text);
    chunk = await reader.read();
  }
  console.log('finished client');
}

await main();
