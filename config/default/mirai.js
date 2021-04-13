// 连接到mirai服务器的配置
'use strict';

const { env } = require('egg-sachikawa').Utils;

module.exports = {
  url: env('QQBOT_MIRAI_URL'),
  authKey: env('QQBOT_MIRAI_KEY'),
  qq: env('QQBOT_MIRAI_QQ'),
  admin: env('QQBOT_MIRAI_ADMIN'),
  plugins: [
    'base',
    'nick',
    'responderCmd',
    'responderReply',
  ],
};
