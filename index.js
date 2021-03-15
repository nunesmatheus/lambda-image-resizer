const fs = require("fs"),
  request = require("request");

const sharp = require("sharp");

exports.handler = async (event) => {
  const query = event["queryStringParameters"];

  const download = function (uri, filename, callback) {
    return new Promise((resolve, _reject) => {
      request.head(uri, function (_err, _res, _body) {
        request(uri)
          .pipe(fs.createWriteStream(filename))
          .on("close", () => {
            resolve();
          });
      });
    });
  };

  const { file } = query;
  const imageExtension = /[a-z0-9A-Z]+\.([a-z]+)$/.exec(file)[1];
  const originalImage = file.replace(imageExtension, "png");
  const imageUrl = `${process.env.FILE_HOST}/images/${originalImage}`;
  const tmpPath = `/tmp/${originalImage}`;

  await download(imageUrl, tmpPath);

  const response = await responseFromPath(tmpPath, query);
  return response;
};

function responseFromPath(path, query) {
  const { file } = query;
  const imageExtension = /[a-z0-9A-Z]+\.([a-z]+)$/.exec(file)[1];
  let { width } = query;

  return new Promise((resolve, _reject) => {
    sharp(path)
      .metadata()
      .then((info) => {
        width = width ? parseInt(width) : info.width;

        let buffer, content_type;
        if (imageExtension === "webp") {
          buffer = resizeAndWebp(path, width);
          content_type = "image/webp";
        } else {
          buffer = resize(path, width);
          content_type = `image/png`;
        }

        buffer.then((data) => {
          const response = {
            statusCode: 200,
            headers: {
              "content-type": content_type,
              "cache-control": "max-age=31536000, public",
            },
            body: data.toString("base64"),
            isBase64Encoded: true,
          };
          resolve(response);
        });
      });
  });
}

function resizeAndWebp(file, width) {
  const sharp = require("sharp");

  return sharp(file)
    .resize({ width })
    .webp({
      quality: 80,
      reductionEffort: 6,
    })
    .sharpen(0.5, 1, 1)
    .toBuffer();
}

function resize(file, width) {
  const sharp = require("sharp");

  return sharp(file).resize({ width }).toBuffer();
}
