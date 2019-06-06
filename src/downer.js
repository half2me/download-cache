import { set, keys } from 'idb-keyval';

export default async ({url, blockSize, signal}) => {
  console.log("Starting download");
  const head = await fetch(url, {method: 'HEAD', signal});
  const size = parseInt(head.headers.get('Content-Length'));
  const chunks = chunkGen(size, blockSize * 2**20);
  let cached = await keys();
  console.log(`Fetching ${size} bytes in ${chunks.length} chunks. Chunk size: ${blockSize}MB`);

  let results = await Promise.all(chunks
    .filter(([low, high]) => !cached.includes(hash(url, low, high)))
    .map(([low, high]) => fetch(url, {
      headers: {Range: `bytes=${low}-${high}`},
      cache: 'no-cache',
      signal,
    }).then(async res => {
      const key = hash(url, low, high);
      const data = new Uint8Array(await res.arrayBuffer());
      await set(key, data);
      console.log('Caching ' + key);
    })));

  await Promise.all(results); // await caching op
}

const chunkGen = (num, chunkSize) => {
  const ret = [];
  // chunk calculation
  for(let i=0; i<num;) {
    let high = i + chunkSize;
    if (high > num) {
      high = num;
    }
    ret.push([i, high-1]);
    i = high;
  }
  return ret;
};

const pick = (O, ...K) => K.reduce((o, k) => (o[k]=O[k], o), {});
const hash = (url, from, to) => `${url}[${from}-${to}]`;