# AWS Lambda Image Resizer

This is the code for a simple AWS Lambda function that resizes images on demand based on a origin URL set by the env FILE_HOST.

The function will fetch the image from $FILE_HOST/images/[file], where `file` is grabbed from the `file` query param and the resize based on an optional `width`.

## Deploy
- Run:
``` bash
docker-compose run --rm web npm i
```
- Zip index.js and node_modules and upload to AWS Lambda

## Keep in mind

- For now, images are always looked for in png, which means a request for www.lambda_host.com?file=myimage.jpg will be fetched from $FILE_HOST/images/myimage.png
- If a request is made for www.lambda_host.com?file=myimage.webp, the function will fetch $FILE_HOST/images/myimage.png and return an image converted to webp
