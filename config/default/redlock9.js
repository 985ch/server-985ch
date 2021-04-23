'use strict';

module.exports = {
  client: 'locker', // 在这里配置对应的redis客户端，也可用client来配置单个客户端，若egg-redis没有配置clients可以省略该配置
  options: { // redlock自带选项
    driftFactor: 0.01,
    retryCount: 5,
    retryDelay: 200,
    retryJitter: 50,
  },
};
