"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadService = exports.UploadService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const aws_config_1 = require("../config/aws.config");
const uuid_1 = require("uuid");
class UploadService {
    constructor() {
        this.bucketName = process.env.AWS_S3_BUCKET || "";
        this.region = process.env.AWS_REGION || "us-east-1";
    }
    async uploadAudioToS3(fileBuffer, userId, mimeType) {
        const fileExtension = ".mp3";
        const fileName = `${userId}/${(0, uuid_1.v4)()}${fileExtension}`;
        const uploadParams = {
            Bucket: this.bucketName,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimeType,
        };
        await aws_config_1.s3Client.send(new client_s3_1.PutObjectCommand(uploadParams));
        const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;
        return {
            fileUrl,
            fileName,
        };
    }
}
exports.UploadService = UploadService;
exports.uploadService = new UploadService();
