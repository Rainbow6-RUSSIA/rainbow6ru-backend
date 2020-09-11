FROM node:12
ENV NODE_ENV production
ARG PACKAGE_NAME=${PACKAGE_NAME}
WORKDIR /usr/src/app
COPY ./ /usr/src/app
RUN yarn install
RUN yarn build
ENV PORT 80
EXPOSE 80
CMD [ "yarn", "start" ]