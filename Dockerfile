FROM node:22.7.0
WORKDIR /
COPY package.json ./
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "start"]
