/* eslint valid-jsdoc: "off" */

'use strict';

module.exports = () => {
  const config = exports = {};
  // 加密设置
  config.security = {
    csrf: false,
    ctoken: false,
    domainWhiteList: [ 'localhost:9527' ], // 允许跨域的白名单,为false时不限制跨域
  };

  return {
    ...config,
  };
};
