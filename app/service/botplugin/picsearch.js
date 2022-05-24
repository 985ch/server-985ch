// 基础插件
'use strict';

const sauceUrl = url => `在sauceNao查看结果：https://saucenao.com/search.php?db=999&url=${encodeURI(url)}`;
const traceUrl = url => `在traceMoe查看结果：https://trace.moe/?url=${encodeURI(url)}`;

module.exports = app => {
  const redis = app.redis.get('main');
  class MyService extends app.Service {
    // 处理消息
    async onMessage({ cmd, user, group }, message) {
      const key = group ? 'g' + group.id : user.qq;
      switch (cmd.cmd) {
        case '识图':
          return await this.searchPic(cmd.params[0], key, message);
        case '认片':
          return await this.searchAnime(cmd.params[0] === '去黑边', key, message);
        case '图片地址':
          return this.getPicUrl(message);
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
      // 获取图片信息
      const info = this.getMessageInfo(message);
      if (!info) return { quote: true, reply: '图呢，图在哪儿？' };

      // 超时限制
      const lock = await redis.get('qqbot:picsearch:p' + key);
      if (lock) return { quote: true, reply: '一分钟内最多执行识图一次。\n ' + sauceUrl(info.url) };
      await redis.setex('qqbot:picsearch:p' + key, 60, '1');

      // 搜索并返回图片信息
      dbName = dbName || 'all';
      const results = await this.service.rpc.saucenao.searchPicture(info.url, dbName.toLowerCase());
      if (results.fail) {
        return { quote: true, reply: `${results.msg}\n${sauceUrl(info.url)}` };
      }
      return { quote: true, reply: this.picResultMsg(dbName, results.long_limit, results.datas) };
    }
    // 从trace.moe搜索动画
    async searchAnime(cutBorders, key, message) {
      // 获取图片信息
      const info = this.getMessageInfo(message);
      if (!info) return { quote: true, reply: '图呢，图在哪儿？' };

      // 超时限制
      const lock = await redis.get('qqbot:picsearch:a' + key);
      if (lock) return { quote: true, reply: '一分钟内最多识别动画一次。\n' + traceUrl(info.url) };
      await redis.setex('qqbot:picsearch:a' + key, 60, '1');

      // 搜索并返回动画信息
      const results = await this.service.rpc.tracemoe.searchAnime(info.url, cutBorders);
      if (results.fail) {
        return { quote: true, reply: `${results.msg}\n${traceUrl(info.url)}` };
      }
      return { quote: true, reply: this.aniResultMsg(results.left, results.datas, info.url) };
    }
    // 获取图片地址
    getPicUrl(message) {
      // 获取图片信息
      const info = this.getMessageInfo(message);
      if (!info) return { quote: true, reply: '图呢，图在哪儿？' };

      return { quote: true, reply: '群图片地址已解析：' + info.url };
    }
    // 获取引用及图片链接
    getMessageInfo(message) {
      const pic = message[1];
      if (pic && pic.type === 'Image') {
        return { imageId: pic.imageId, url: pic.url };
      }
      return null;
    }
    // 将图片查找结果拼接为字符串返回
    picResultMsg(dbName, limit, datas, url) {
      let text = `从${dbName.toLowerCase() === 'all' ? '全部数据库' : dbName}中搜索到的结果有:\n`;
      for (let i = 0; i < datas.length; i++) {
        const { from, similarity, title, author, url, material, characters } = datas[i];
        text += `\n${i + 1}\n 来源地址:${from} 相似度${similarity}\n`;
        if (title) text += `${title}${author ? ' [' + author + ']' : ''}\n`;
        if (material || characters) {
          text += `${material ? `作品名称:${material} ` : ''}${characters ? '角色:' + characters : ''}\n`;
        }
        text += url;
      }
      text += `${sauceUrl(url)}\n24小时内剩余查询次数：${limit}`;
      return text;
    }
    // 将动画查找结果拼接为字符串返回
    aniResultMsg(limit, datas, url) {
      let text = '从trace.moe中搜索到的结果有:\n';
      for (let i = 0; i < datas.length; i++) {
        const { similarity, title, episode, from, to } = datas[i];
        text += `\n${i + 1}:${title} (相似度${similarity})`;
        text += `\n第${episode}话${from} - ${to}`;
      }
      text += `\n更多结果点击:\n本月剩余查询额度：${limit}`;
      return text;
    }
  }
  return MyService;
};
