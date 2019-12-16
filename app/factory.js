'use strict';
const { RouterFactory } = require('egg-sachikawa');

class MyFactory extends RouterFactory {
  // 根据配置把中间件添加到参数
  setMiddlewares(obj, args) {
    const app = this.app;
    if (obj.userdata) args.push(app.middlewares.userdata(obj.userdata)); // 启用用户身份信息中间件
    if (obj.clientauth) args.push(app.middlewares.clientauth()); // 启用客户端来源校验中间件
    super.setMiddlewares(obj, args);
  }
}

module.exports = MyFactory;
