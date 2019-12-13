FROM node:10.16-alpine
RUN mkdir /app
COPY . /app
WORKDIR /app
RUN npm install --registry=https://registry.npm.taobao.org --production
CMD ["npm","run","start"]
EXPOSE 7001