/**
 *修改作品备注
*/
'use strict';

module.exports = () => {
  return {
    params: {
      id: { type: 'integer', minimum: 0 }, // 作品ID
      note: { type: 'string' }, // 备注内容
    },
    userdata: { permission: 'editor' },
    async controller() {
      const userid = this.state.userdata.userid;
      const { id, note } = this.state.params;
      const result = await this.service.resource.note.save({ typeid: 0, userid, titleid: id, note });
      this.success(result);
    },
  };
};
