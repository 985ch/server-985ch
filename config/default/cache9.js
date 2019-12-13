'use strict';
module.exports = {
  default: {
    ttl: 300,
  },
  clients: {
    mem: {
      class: 'memory',
      pubRedis: 'cachePub', // app.redis.get('cachePub')
      subRedis: 'cacheSub', // app.redis.get('cacheSub')
      ttl: 1800,
    },
    http: {
      class: 'redis',
      redis: 'main',
      channel: 'http',
      ttl: 900,
    },
    main: {
      class: 'redis',
      redis: 'main',
      channel: 'cache',
      ttl: 1800,
    },
  },
};
