dwn = ({
  sw = 'sw.js',
  pattern = '',
  blockSize = 512,
} = {}) => {
  return navigator.serviceWorker.register(sw)
    .then(reg => ({
      a: 'b',
    }));
};