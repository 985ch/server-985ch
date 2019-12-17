/**
* 用户身份验证中间件
* @description options={
    permission:需要的权限。若其为false，则无论是否登陆都可访问接口；若其为true，则必须登陆；若其为字符串，则用户必须具备对应权限
}
*/
'use strict';

module.exports = options => {
  return async function(ctx, next) {
    const errCode = ctx.app.errCode;
    const user = ctx.service.user;
    const { permission } = options;
    const token = ctx.get('Token');
    if (permission && !token) return ctx.fail('缺少登陆信息', errCode.INVAILD_TOKEN);
    const data = await user.cache.getByToken(token);
    if (permission && data.userid === -1) return ctx.fail('无效的登陆信息', errCode.INVAILD_TOKEN);
    if (!user.data.checkPermission(data.roles, permission)) {
      return ctx.fail('没有访问权限', errCode.INVAILD_PERMISSIONS);
    }
    ctx.state.userdata = data;
    await next();
  };
};
