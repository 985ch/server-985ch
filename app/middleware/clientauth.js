/**
* 来源校验中间件，通过key和ip校验请求来源是否合法
*/
'use strict';

module.exports = () => {
  return async function(ctx, next) {
    const { body, query } = ctx.request;
    const key = body.key || query.key;
    const cli = await ctx.service.system.client.info(key);
    if (!cli) {
      return ctx.fail('invalid client', ctx.app.errCode.INVAILD_PERMISSIONS);
    }
    ctx.state.clientInfo = cli;
    await next();
  };
};
