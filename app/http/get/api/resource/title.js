/**
 *获取作品数据
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', minimum: 0 }, // 作品ID
    },
    compress: true,
    userdata: { permission: true },
    async controller() {
      const { id } = this.state.params;
      const result = await this.service.resource.titles.getData(id);
      if (result.base.nsfw && this.state.userdata.roles.indexOf('adult') < 0) {
        this.fail('没有访问权限', this.app.app.errCode.INVAILD_PERMISSIONS);
      } else {
        this.success(result);
      }
    },
  };
};
