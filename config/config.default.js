/* eslint valid-jsdoc: "off" */
'use strict';

const { env } = require('egg-sachikawa').Utils;

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1562342251296_1465';

  // 加密设置
  config.security = {
    csrf: false,
    ctoken: false,
    domainWhiteList: [ 'localhost:9527' ], // 允许跨域的白名单,为false时不限制跨域
  };

  config.view = {
    defaultViewEngine: 'ejs',
    mapping: {
      '.html': 'ejs',
      '.ejs': 'ejs',
    },
  };

  // add your middleware config here
  config.middleware = [];

  // 配置渲染模板
  config.view = {
    defaultViewEngine: 'ejs',
    mapping: {
      '.html': 'ejs',
    },
  };

  // 数据库配置
  config.sequelize = require('./default/sequelize');

  // redis配置
  config.redis = require('./default/redis');

  // 缓存配置
  config.cache9 = require('./default/cache9');

  // add your user config here
  const userConfig = {
    qqbot: {
      host: env('QQBOT_API_URL'),
      ip: env('QQBOT_API_IP'),
      plugins: [
        'base',
        'nick',
        'responderCmd', 'responderReply',
      ],
    },
    webUrl: env('QQBOT_WEB_URL'),
  };

  return {
    ...config,
    ...userConfig,
  };
};
