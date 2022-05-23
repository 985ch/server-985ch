// 对接QQ机器人
'use strict';

const _ = require('lodash');

const srcDB = {
  0: 'HMagazines',
  2: 'HGame_CG',
  3: 'DoujinshiDB',
  5: 'Pixiv',
  8: 'Nico_Nico_Seiga',
  9: 'Danbooru',
  10: 'Drawr',
  11: 'Nijie',
  12: 'Yandere',
  13: 'Openingsmoe',
  15: 'Shutterstock',
  16: 'FAKKU',
  18: 'HMisc',
  19: 'TwoDMarket',
  20: 'MediBang',
  21: 'Anime',
  22: 'HAnime',
  23: 'Movies',
  24: 'Shows',
  25: 'Gelbooru',
  26: 'Konachan',
  27: 'SankakuChannel',
  28: 'AnimePicturesnet',
  29: 'E621net',
  30: 'IdolComplex',
  31: 'Bcynet_Illust',
  32: 'Bcynet_Cosplay',
  33: 'PortalGraphicsnet',
  34: 'DeviantArt',
  35: 'Pawoonet',
  36: 'Madokami',
  37: 'MangaDex',
  38: 'EHentai',
  39: 'Artstation',
  40: 'FurAffinity',
  41: 'Twitter',
  42: 'Furry_Network',
  999: 'all',
};
const snDB = _.invert(_.mapValues(srcDB, _.lowerCase));

module.exports = app => {
  const apiKey = app.config.saucenaoKey;
  class MyService extends app.Service {
    // 请求saucenao服务器
    async searchPicture(url, type = 'all') {
      if (!snDB[type]) return { fail: -3, msg: '无效的数据源' };

      // 获取数据
      try {
        const res = await this.ctx.curl('https://saucenao.com/search.php', {
          method: 'GET',
          timeout: 60000,
          data: {
            url,
            output_type: 2,
            api_key: apiKey,
            db: snDB[type],
            numres: 10,
          },
          dataType: 'json',
        });
        if (res.status === 429) return { fail: -2, msg: '单位时间调用次数已达上限!' };
        if (res.status !== 200) return { fail: -1, msg: '调用查询接口失败！' };

        // 判断结果的有效性
        const results = res.data.results;
        let datas = [];
        const { short_limit, long_limit } = res.data.header;
        if (results) {
          datas = _.filter(_.map(results, this.filterResult), o => o);
        }
        if (!results || datas.length === 0) return { fail: -2, msg: '没有找到靠谱的结果！' };

        // 返回结果
        return {
          short_limit,
          long_limit,
          datas,
        };
      } catch (e) {
        return { fail: -1, msg: '调用saucenao失败！' };
      }
    }
    // 处理结果数据，得到指定格式并返回
    async filterResult(data) {
      const {
        header: {
          similarity, // 相似度
          index_id, // 图库
        },
        data: {
          ext_urls,
          title, // 标题
          member_name, // 作者
          eng_name, // 本子名
          jp_name, // 本子名
          source, // 来源
          author, // 作者
          artist, // 作者
        },
      } = data;
      // 排除相似度太低的图片
      if (parseFloat(similarity) < 50) return null;
      let url = null;
      let titleName = jp_name || eng_name || title;
      if (/(http|https):\/\/?/.test(source)) {
        url = source;
      } else if (ext_urls.length > 0) {
        url = ext_urls[0];
        titleName = titleName || source;
      }
      if (!url) return null;
      const result = {
        similarity,
        from: srcDB[index_id] || '未知来源',
        url,
        title: titleName || null,
        author: author || artist || member_name || null,
      };
      return result;
    }
  }
  return MyService;
};
