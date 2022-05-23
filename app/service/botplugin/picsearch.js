// 基础插件
'use strict';

module.exports = app => {
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd }, message) {
      switch (cmd.cmd) {
        case '识图':
        {
          return await this.searchPic(cmd.params[0], message);
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
    async searchPic(dbName, message) {
      const info = this.getMessageInfo(message);
      if (!info) return { quote: true, reply: '图呢，图在哪儿？' };
      dbName = dbName || 'all';
      const results = await this.service.rpc.saucenao.searchPicture(info.url, dbName.toLowerCase());
      if (results.fail) {
        return { quote: true, reply: results.msg };
      }
      return { quote: true, reply: this.resultToMessage(dbName, results.datas) };
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
    resultToMessage(dbName, datas) {
      let text = `从${dbName.toLowerCase() === 'all' ? '全部数据库' : dbName}中搜索到的结果有:\n`;
      for (let i = 0; i < datas.length; i++) {
        const { from, similarity, title, author, url } = datas[i];
        text += `\n${i + 1}\n 来源:${from} 相似度${similarity}\n`;
        if (title) text += `${title}${author ? ' [' + author + ']' : ''}\n`;
        text += url;
      }
      return text;
    }
  }
  return MyService;
};
