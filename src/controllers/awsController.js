const aws = require('aws-sdk')
aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",
        secretAccessKey: "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",
        region: "ap-south-1"
});

let uploadFile = async(file) => {
    return new Promise(function(resolve, reject) {
        // Create S3 service object
        let s3 = new aws.S3({ apiVersion: "2006-03-01" });
        var uploadParams = {
            ACL: "public-read", // this file is publically readable
            Bucket: "classroom-training-bucket",
            Key: "group31/shopping cart/"  + file.originalname,
            Body: file.buffer,
        };
        
        s3.upload(uploadParams, function(err, data) {
            if (err) {
                return reject({ "error": err });
            }
            console.log(data)
            console.log(`File uploaded successfully. ${data.Location}`);
            return resolve(data.Location);
        });
    });
};
module.exports = {
    uploadFile
}
