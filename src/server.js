import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import express from 'express';

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function* sendData(){
  for( let i = 0; i < 5; i++) {
    await sleep(1000);
    if (i % 3 === 0) {
      throw new Error('BAD TIMES, MAN');
    }
    console.log(`sending chunk ${i}`);
    yield `data: chunk ${i}\n\n`;
  }
  yield 'data: end\n\n';
}

const app = express();
const router = express.Router();

router.get('/test', async (req, res, next) => {
    try {
      console.log('starting test handler');
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.flushHeaders();

      const abortController = new AbortController();
      req.on('close', () => {
        if (!res.writableEnded) {
          console.log('request aborted!');
          abortController.abort('request closed');
        } else {
          console.log('request finished normally');
        }
      });

      console.log('sending data');
      const stream = Readable.from(sendData(abortController.signal));
      stream.pipe(res);
      await finished(stream, {signal: abortController.signal});

      res.end();
    } catch (error) {
      console.log('test handler error', error);
      next(error);
    } finally {
      console.log('test handler finished');
    }

})

app.use(router);

app.listen(3030, () => {
  console.log('Server running on port 3030');
})
