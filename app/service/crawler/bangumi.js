/**
* 爬取bangumi.tv的库
*/
'use strict';

const cheerio = require('cheerio');

module.exports = app => {
  class MyService extends app.Service {
    // 从页面获取具体信息
    async catch(id) {
      // 读取数据
      const html = await this.ctx.curl('http://bgm.tv/subject/' + id, { timeout: 10000, retry: 3 });
      if (html.status !== 200) {
        return null;
      }
      const $ = cheerio.load(html.data);
      // 标题
      const titleInfo = $('h1.nameSingle').children();
      const title = $(titleInfo[0]).text();
      const type = $(titleInfo[1]).text();
      // 图片
      const aniInfo = $('div.infobox').children();
      let idx = 0;
      const img = $(aniInfo[idx].children[1]).attr('href');
      if (img) {
        idx++;
      }
      // 信息
      const infoList = $(aniInfo[idx]).children();
      const info = {};
      for (let i = 0; i < infoList.length; i++) {
        const cur = $(infoList[i]).text();
        const l = cur.indexOf(': ');
        if (l > 0) {
          info[cur.substring(0, l)] = cur.substring(l + 2);
        }
      }
      // 简介
      const intro = $('div.subject_summary').text();
      // 摘出全部标题名称
      const names = [];
      if (info['中文名']) {
        names.push(info['中文名'].replace(/,/g, '，'));
        if (info['中文名'] !== title) {
          names.push(title.replace(/,/g, '，'));
        }
      } else {
        names.push(title.replace(/,/g, '，'));
      }
      if (info['别名']) {
        names.push(info['别名'].replace(/,/g, '，'));
      }
      // 摘出放送时间
      let timeFlag = info['放送开始'] || info['发售日'] || info['上映年度'] || '1970-01-01';

      let yearIdx = timeFlag.indexOf('年');
      if (yearIdx === -1) yearIdx = timeFlag.indexOf('-');
      if (yearIdx === -1) yearIdx = timeFlag.indexOf('/');
      let year = timeFlag.replace('*', '').replace('.', '');
      if (yearIdx > 0) {
        year = timeFlag.substring(0, yearIdx).replace('*', '').replace('.', '');
      }

      let monthIdx = timeFlag.indexOf('月', yearIdx + 1);
      if (monthIdx === -1) monthIdx = timeFlag.indexOf('-', yearIdx + 1);
      if (monthIdx === -1) monthIdx = timeFlag.indexOf('/', yearIdx + 1);
      if (monthIdx >= 0) {
        const month = Number.parseInt(timeFlag.substring(yearIdx + 1, monthIdx));
        timeFlag = `${year}-${month < 10 ? '0' : ''}${month}-01`;
      } else {
        timeFlag = year + '-01-01';
      }
      if (timeFlag < '1900-01-01' || timeFlag > '2999-12-31') {
        timeFlag = '1970-01-01';
      }
      // 返回标准格式对象
      return {
        names,
        type: (type === '剧场版') ? 'MOVIE' : type,
        releaseTime: new Date(timeFlag),
        img,
        json: {
          intro,
          chapters: info['话数'] || 0,
          bgmID: id,
        },
        info: {
          ext: info,
        },
      };
    }
  }

  return MyService;
};
