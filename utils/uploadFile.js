const AWS = require("aws-sdk");
const { AWS_ACCESS_KEY, AWS_SECRET_KEY } = require("../config/config");
const catchAsync = require("./catchAsync");
const router = require("express").Router();
const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY,
  secretAccessKey: AWS_SECRET_KEY,
  region: "us-east-2",
});

const uploadFile = (filename, bucketname, file, ContentType) => {
  return new Promise((resolve, reject) => {
    const params = {
      Key: filename,
      Bucket: bucketname,
      Body: file,
      ContentType: ContentType, //'audio/mpeg',
      ACL: "public-read",
    };

    s3.upload(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Location);
      }
    });
  });
};

const deleteFile = (bucket_name, image_name) => {
  // Delete the image from the bucket
  s3.deleteObject(
    {
      Bucket: bucket_name,
      Key: image_name,
    },
    function (err, data) {
      if (err) console.log(err, err.stack);
      else return data;
    }
  );
};

router.post(
  "/file",
  catchAsync(async (req, res, next) => {
    const file = req.file.buffer;
    const fileName = req.file.originalname;
    const link = await uploadFile(
      fileName,
      "cryptobancx",
      file,
      req.file.mimetype
    );
    return res.status(200).json({
      status: true,
      message: "File uploaded",
      url: link,
    });
  })
);

module.exports = router;

// deleteFile("userprofileimag","profile-1.jpg")
