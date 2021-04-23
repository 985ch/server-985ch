// redis配置
'use strict';

const { env } = require('egg-sachikawa').Utils;

module.exports = {
  default: {
    port: 6379,
    password: env('MY_REDIS_PASSWORD'),
    host: env('MY_REDIS_URL'),
  },
  app: true,
  agent: false,
  clients: {
    main: {
      db: 1,
    },
    cacheSub: {
      db: 1,
    },
    cachePub: {
      db: 1,
    },
    locker: {
      db: 1,
    },
  },
};
