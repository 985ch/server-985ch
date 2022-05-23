/* eslint valid-jsdoc: "off" */
'use strict';

const { env } = require('egg-sachikawa').Utils;
const fs = require('fs');
const path = require('path');

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

  // 配置favicon图标
  config.siteFile = {
    '/favicon.ico': fs.readFileSync(path.join(appInfo.baseDir, 'favicon.ico')),
  };

  // 配置渲染器
  config.view = {
    defaultViewEngine: 'ejs',
    mapping: {
      '.html': 'ejs',
      '.ejs': 'ejs',
    },
  };

  // add your middleware config here
  config.middleware = [];

  // 数据库配置
  config.sequelize = require('./default/sequelize');

  // redis配置
  config.redis = require('./default/redis');

  // 缓存配置
  config.cache9 = require('./default/cache9');

  // 分布式锁配置
  config.redlock9 = require('./default/redlock9');

  // add your user config here
  const userConfig = {
    qqbot: require('./default/mirai'),
    webUrl: env('QQBOT_WEB_URL'),
    saucenaoKey: env('SAUCENAO_API_KEY'),
  };

  return {
    ...config,
    ...userConfig,
  };
};
