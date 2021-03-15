FROM node:12.20.0

RUN mkdir -p /image-resizer
WORKDIR /image-resizer/

COPY . /image-resizer/
