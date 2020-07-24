FROM node:12
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./ /usr/src/app
RUN yarn install
RUN yarn build
ENV NODE_ENV production
ENV PORT 80
EXPOSE 80
CMD [ \"yarn\", \"start\" ]