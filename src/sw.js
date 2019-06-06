import { get, keys } from 'idb-keyval';

const exp = /\/dwn-cache(.+)$/;

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if(e.request.method !== 'GET' || !exp.test(url)) {
    return;
  }

  const origUrl = url.match(exp)[1];

  e.respondWith((async () => {
    // first get info about cached data and size
    const cachedBlocks = (await keys()).filter(k => k.startsWith(origUrl));
    const size = cachedBlocks.reduce((prev, cur) => {
      const num = cur.match(/\[\d+-(\d+)]$/)[1];
      return prev > num ? prev : num;
    }, 0);
    const firstBlock = cachedBlocks.find(b => /\[0-\d+]$/.test(b));

    return new Response(new ReadableStream({
        async start(controller) {
          for(
            let i = firstBlock;
            i;
            i = cachedBlocks.find(b => {
              const nextByte = parseInt(i.match(/\[\d+-(\d+)]$/)[1]) + 1;
              const exp = new RegExp(`\\[${nextByte}-\\d+]$`);
              return exp.test(b);
            })
            ) {
            console.log("serving from cache ", i);
            controller.enqueue(await get(i));
          }
          controller.close();
        },
        pull() {},
        cancel() {},
      }),
      {status: 200, statusText: 'OK', headers: new Headers({
          'Content-length': size,
          'Content-Disposition': 'attachment',
      })}
    )
  })());
});

const pick = (O, ...K) => K.reduce((o, k) => (o[k]=O[k], o), {});
const hash = (url, from, to) => `${url}[${from}-${to}]`;