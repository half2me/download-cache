import down from './downer';

export default {
  init({sw = 'sw.js', blockSize = 16, prefix = '/dwn-cache'} = {}) {
    this.blockSize = blockSize;
    this.prefix = prefix;
    return navigator.serviceWorker.register(sw);
  },
  download({url, blockSize = this.blockSize}) {
    const controller = new AbortController();

    return {
      abort() {controller.abort()},
      promise: down({url, blockSize, signal: controller.signal})
        .then(() => {
          const link = document.createElement('a');
          link.href = this.prefix + url;
          //link.download = url.substring(url.lastIndexOf('/')+1);
          const e = document.createEvent('MouseEvents');
          e.initEvent('click', true, true);
          link.dispatchEvent(e);
        })
    };
  },
}