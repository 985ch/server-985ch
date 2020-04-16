/**
 *修改作品喜欢状态
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', minimum: 0 }, // 作品ID
      like: { type: 'integer', enum: [ 0, 1, 2, 3 ] }, // like状态
    },
    userdata: { permission: 'editor' },
    async controller() {
      const userid = this.state.userdata.userid;
      const { id, like } = this.state.params;
      const result = await this.service.resource.note.save({ typeid: 0, userid, titleid: id, like });
      this.success(result);
    },
  };
};
