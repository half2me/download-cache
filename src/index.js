import { get, set, del } from 'idb-keyval';

const exp = /\.bin$/;
const blockSize = 64;

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if(e.request.method !== 'GET' || !exp.test(url)) {
    return;
  }

  e.respondWith(fetch(e.request.url, {method: 'HEAD', cache: "no-store"}).then(headRes => {
    const size = parseInt(headRes.headers.get('Content-length'));

    // Setup streams
    let rStream = new ReadableStream({
      async start(controller) {
        let i=0;
        let bytesProcessed = 0;
        this.ctr = new AbortController();

        async function wipeCache() {
          console.log("Wiping cache");
          for (let j=0; j<i; j++) {
            //await del(hash(url, j));
          }
        }

        while(true) {
          if (bytesProcessed === size) {
            console.log("Entire file served from cache");
            await wipeCache();
            controller.close();
            return true;
          }

          let chunk = await get(hash(url, i));
          if (chunk) {
            // Chunk is already cached, serve and get next chunk
            console.log(`Serving chunk ${i} from cache`);
            chunk.forEach(blk => {
              bytesProcessed += blk.length;
              controller.enqueue(blk)
            });
            i++;
          } else {
            // chunk is not cached, download as usual
            break;
          }
        }

        // Fetch resource with correct range set
        console.log("Fetching range: ", bytesProcessed, '-', size-1);
        const res = await fetch(url, {
          signal: this.ctr.signal,
          headers: {Range: `bytes=${bytesProcessed}-${size-1}`},
          cache: "no-store",
        });
        const reader = res.body.getReader();

        let buf = [];

        const flushBuf = async () => {
          if (buf.length > 0) {
            console.log(`Caching chunk ${i}`);
            await set(hash(url, i), buf);
            buf = [];
            i++;
          }
        };

        while(true) {
          let {done, value} = await reader.read();
          if (done) {
            console.log("Stream closing");
            await flushBuf(); // if we are wiping cache on completion, we don't need this
            await wipeCache();
            controller.close();
            return true;
          }

          bytesProcessed += value.length;
          controller.enqueue(value); // push new data through
          buf.push(value); // but also keep in our buffer
          // Clear buf if full
          if (buf.length === blockSize) {
            await flushBuf();
          }
        }
      },
      pull(controller) {
        console.log("pull method used on stream");
      },
      cancel(reason) {
        this.ctr.abort();
        console.log("Stream cancelled!");
      },
    });

    // Send back the response
    return new Response(rStream, pick(headRes,'status', 'statusText', 'headers'));
  }));
});

const pick = (O, ...K) => K.reduce((o, k) => (o[k]=O[k], o), {});
const hash = (url, block) => url + block;