/**
 *修改作品数据
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', minimum: 0 }, // 作品ID
      typeid: { type: 'integer', minimum: 1 }, // 作品类型
      names: 'string', // 作品名称
      releaseTime: 'string', // 发布时间
      pic: 'string', // 图片链接
      info: 'string', // 信息
      nsfw: { type: 'integer', enum: [ 0, 1 ] },
    },
    userdata: { permission: 'editor' },
    async controller() {
      const userid = this.state.userdata.userid;
      const result = await this.service.resource.titles.save(userid, this.state.params);
      this.success(result);
    },
  };
};
