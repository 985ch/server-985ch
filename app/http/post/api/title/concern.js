/**
 *修改作品关注状态
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', minimum: 0 }, // 作品ID
      concern: { type: 'integer', enum: [ 0, 1 ] }, // 关注状态
    },
    userdata: { permission: 'editor' },
    async controller() {
      const userid = this.state.userdata.userid;
      const { id, concern } = this.state.params;
      const result = await this.service.resource.note.save({ typeid: 0, userid, titleid: id, concern });
      this.success(result);
    },
  };
};
