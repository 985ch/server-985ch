/**
* 爬取bangumi.tv的库
*/
'use strict';

const cheerio = require('cheerio');

module.exports = app => {
  class MyService extends app.Service {
    // 从页面获取具体信息
    async catch(url) {
      let id = 0;
      if (url.indexOf('/') < 0) {
        url = 'http://bgm.tv/subject/' + url;
        id = Number.parseInt(url);
      }
      // 读取数据
      const html = await this.ctx.curl(url, { timeout: 10000, retry: 3 });
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
          const key = cur.substring(0, l);
          const data = cur.substring(l + 2);
          if (info[key]) {
            info[key].push(data);
          } else {
            info[key] = [ data ];
          }
        }
      }
      // 简介
      const intro = $('div.subject_summary').text();
      // 摘出全部标题名称
      const names = [];
      if (info['中文名']) {
        names.push(info['中文名'][0].replace(/,/g, '，'));
      }
      if (!info['中文名'] || info['中文名'][0] !== title) {
        names.push(title.replace(/,/g, '，'));
      }
      if (info['别名']) {
        for (const name of info['别名']) {
          names.push(name.replace(/,/g, '，'));
        }
      }
      // 摘出放送时间
      let timeFlag = info['放送开始'] || info['发售日'] || info['上映年度'] || [ '1970-01-01' ];
      timeFlag = timeFlag[0];

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
          chapters: info['话数'] ? info['话数'][0] : 0,
          bgmID: id,
        },
        info,
      };
    }
  }

  return MyService;
};
