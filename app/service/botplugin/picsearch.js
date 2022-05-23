// 基础插件
'use strict';

module.exports = app => {
  const redis = app.redis.get('main');
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, user, group }, message) {
      const key = group ? 'g' + group.id : user.qq;
      switch (cmd.cmd) {
        case '识图':
        {
          return await this.searchPic(cmd.params[0], key, message);
        }
        default:
          break;
      }
      return null;
    }
    // 心跳事件
    async onBeat() {
      return null;
    }
    // 从saucenao搜索图片
    async searchPic(dbName, key, message) {
      // 超时限制
      const lock = await redis.get('qqbot:picsearch:' + key);
      if (lock) return { quote: true, reply: '一分钟内最多执行识图一次。' };
      await redis.setex('qqbot:picsearch:' + key, 60, '1');

      // 获取图片信息
      const info = this.getMessageInfo(message);
      if (!info) return { quote: true, reply: '图呢，图在哪儿？' };

      // 搜索并返回图片信息
      dbName = dbName || 'all';
      const results = await this.service.rpc.saucenao.searchPicture(info.url, dbName.toLowerCase());
      if (results.fail) {
        return { quote: true, reply: results.msg };
      }
      return { quote: true, reply: this.resultToMessage(dbName, results.long_limit, results.datas) };
    }
    // 获取引用及图片链接
    getMessageInfo(message) {
      const pic = message[1];
      if (pic && pic.type === 'Image') {
        return { imageId: pic.imageId, url: pic.url };
      }
      return null;
    }
    // 将查找结果拼接为字符串以返回
    resultToMessage(dbName, limit, datas) {
      let text = `从${dbName.toLowerCase() === 'all' ? '全部数据库' : dbName}中搜索到的结果有:\n`;
      for (let i = 0; i < datas.length; i++) {
        const { from, similarity, title, author, url } = datas[i];
        text += `\n${i + 1}\n 来源:${from} 相似度${similarity}\n`;
        if (title) text += `${title}${author ? ' [' + author + ']' : ''}\n`;
        text += url;
      }
      text += '\n24小时内剩余查询次数：' + limit;
      return text;
    }
  }
  return MyService;
};
