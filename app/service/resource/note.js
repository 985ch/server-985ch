// 管理用户备注数据
'use strict';

module.exports = app => {
  const db = app.resDB;
  class MyService extends app.Service {
    // 获取单个作品备注
    async getNote(typeid, titleid) {
      const { userdata } = this.ctx.state;
      if (userdata) {
        const result = await db.Notes.simpleFindOne({ typeid, titleid, userid: userdata.userid });
        if (result) return result;
      }
      const userid = userdata ? userdata.userid : 0;
      return {
        typeid,
        titleid,
        userid,
        note: null,
        update_time: new Date(),
        like: 0,
        concern: 0,
      };
    }
    // 更新或写入数据
    async save(data) {
      await db.Notes.upsert(data);
    }
  }
  return MyService;
};
