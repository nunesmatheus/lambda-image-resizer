const fs = require("fs"),
  request = require("request");

const imagemin = require("imagemin");
const imageminWebp = require("imagemin-webp");

const sharp = require("sharp");

const { exec } = require("child_process");

exports.handler = async (event) => {
  const query = event["queryStringParameters"];

  const download = function (uri, filename, callback) {
    return new Promise((resolve, reject) => {
      request.head(uri, function (err, res, body) {
        request(uri)
          .pipe(fs.createWriteStream(filename))
          .on("close", () => {
            resolve();
          });
      });
    });
  };

  const { file } = query;
  const image_extension = /[a-z0-9A-Z]+\.([a-z]+)$/.exec(file)[1];
  const original_image = file.replace(image_extension, "png");
  const image_url = `${process.env.FILE_HOST}/images/${original_image}`;
  const tmp_path = `/tmp/${original_image}`;

  await download(image_url, tmp_path);

  const response = await responseFromPath(tmp_path, query);
  return response;
};

function responseFromPath(path, query) {
  const { file } = query;
  const image_extension = /[a-z0-9A-Z]+\.([a-z]+)$/.exec(file)[1];
  let { width } = query;

  return new Promise((resolve, reject) => {
    sharp(path)
      .metadata()
      .then((info) => {
        width = width ? parseInt(width) : info.width;

        let buffer, content_type;
        if (image_extension === "webp") {
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
    .toBuffer();
}

function resize(file, width) {
  const sharp = require("sharp");

  return sharp(file).resize({ width }).toBuffer();
}
