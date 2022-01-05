FROM node:16-alpine

WORKDIR /usr/src/app

COPY package.json .
COPY package-lock.json .

RUN npm install

ADD . /usr/src/app

RUN npm run build

CMD [ "npm", "run", "start" ]

EXPOSE 3500
