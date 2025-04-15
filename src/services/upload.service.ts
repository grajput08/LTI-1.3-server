import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../config/aws.config";
import { v4 as uuidv4 } from "uuid";

interface UploadResponse {
  fileUrl: string;
  fileName: string;
}

export class UploadService {
  private readonly bucketName: string;
  private readonly region: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || "";
    this.region = process.env.AWS_REGION || "us-east-1";
  }

  async uploadAudioToS3(
    fileBuffer: Buffer,
    userId: string,
    mimeType: string
  ): Promise<UploadResponse> {
    const fileExtension = ".mp3";
    const fileName = `${userId}/${uuidv4()}${fileExtension}`;

    const uploadParams = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: mimeType,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    const fileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;

    return {
      fileUrl,
      fileName,
    };
  }
}

export const uploadService = new UploadService();
