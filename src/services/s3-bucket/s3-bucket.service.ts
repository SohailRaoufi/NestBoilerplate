/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-base-to-string */
import 'dotenv/config';
import * as sharp from 'sharp';
import { extname } from 'path';
import { fromBuffer } from 'file-type';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

import { S3BucketPaths } from './s3-bucket-paths';
import { resizeImage } from '@/utils/image-resize';

@Injectable()
export class S3BucketService {
  private s3Client: S3Client;
  private bucketName: string;
  private privateBucketName: string;
  private endpoint: string;
  private isMinio: boolean;
  private s3Region: string;
  constructor() {
    this.endpoint = process.env.MINIO_ENDPOINT!;
    this.isMinio = process.env.S3_IS_MINIO === 'true';
    this.s3Region = process.env.S3_REGION!;
    this.s3Client = new S3Client({
      region: process.env.S3_REGION!,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      ...(this.isMinio && { forcePathStyle: true, endpoint: this.endpoint }),
    });

    this.bucketName = process.env.S3_PUBLIC_BUCKET_NAME!;
    this.privateBucketName = process.env.S3_PRIVATE_BUCKET_NAME!;
  }

  /**
   * Upload File and Return Its MetaData
   * @param file
   * @param path
   * @returns File MetaData
   */
  async uploadFile(file: Express.Multer.File, path: S3BucketPaths) {
    if (!file.originalname || !file.buffer || !file.mimetype) {
      throw new BadRequestException('Invalid file data.');
    }
    const fileName = this.generateFileName(file.originalname);
    const fullPath = `${path}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fullPath,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const fileMetadata = await this.extractMetadata(file.buffer, file.mimetype);

    return {
      url: this.getUrl(fullPath),
      size: fileMetadata.size,
      mimeType: fileMetadata.mimeType,
      originalName: file.originalname,
    };
  }

  /**
   * Upload a photo and return back the metaData
   * @param file
   * @param path
   * @param options
   * @returns metaData and Thmbnail metaData
   */
  async UploadPhoto(
    file: Express.Multer.File,
    path: string,
    options: { generateThumbnail?: boolean } = { generateThumbnail: true },
  ) {
    const fileName = this.generateFileName(file.originalname);
    const fullPath = `${path}/${fileName}`;

    const metadata = await this.extractMetadata(file.buffer, file.mimetype);

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fullPath,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    const thumbnailMetadata = async () => {
      if (options.generateThumbnail) {
        const thumbnail = this.generateFileName(file.originalname);
        const thumbnailPath = `${path}/${thumbnail}`;
        const thumbnailBuffer = await resizeImage(file.buffer, 256, 256);

        const commnad = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: thumbnailPath,
          Body: thumbnailBuffer,
          ContentType: file.mimetype,
        });

        await this.s3Client.send(commnad);

        const metadata = await this.extractMetadata(
          thumbnailBuffer,
          file.mimetype,
        );

        return {
          name: thumbnail,
          url,
          size: metadata.size,
          width: metadata.width,
          height: metadata.height,
          mimeType: metadata.mimeType,
        };
      }
    };

    const url = this.getUrl(fullPath);

    return {
      originalMetadata: {
        name: fileName,
        url,
        size: metadata.size,
        width: metadata.width,
        height: metadata.height,
        mimeType: metadata.mimeType,
      },
      ...(options.generateThumbnail && {
        thumbnailMetadata: await thumbnailMetadata(),
      }),
    };
  }

  /**
   * Delete a File using its url or path
   * @param path
   * @returns boolean
   */
  async deleteFile(path: string) {
    try {
      const file_key = path.split(this.bucketName)[1];
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: file_key,
      });

      await this.s3Client.send(command);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new BadRequestException('Failed Deleting File.');
    }
  }

  /**
   * Delete a private file
   * @param key
   */
  async deletePrivateFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.privateBucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Uploads private attachments to the specified S3 bucket.
   * @param file The file to upload
   * @param path The file path
   */
  async uploadPrivateAttachment(
    file: Express.Multer.File,
    path: S3BucketPaths,
  ) {
    const originalFileName = file.originalname;
    const newFileName = this.generateFileName(file.originalname);

    // Combine original file name and generated name
    const combinedFileName = `${newFileName}-${originalFileName}`;
    const fullPath = `${path}/${combinedFileName}`;

    const params = {
      Bucket: this.privateBucketName,
      Key: fullPath,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(params);
    await this.s3Client.send(command);

    const metadata = await this.extractMetadata(file.buffer, file.mimetype);

    return {
      key: fullPath,
      ...metadata,
    };
  }

  /**
   * Generates a presigned URL for a message attachment stored in S3, allowing temporary access.
   * @param {string} key The key (filename) of the private file
   * @param {number} [expiresIn=3600] The expiration time of the URL in seconds (default is 1 hour)
   * @returns {Promise<string>} The presigned URL for accessing the private file
   */
  async getPrivateAttachmentsUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const params = {
      Bucket: this.privateBucketName,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(this.s3Client, command, { expiresIn });
    return url; // Presigned URL
  }

  /**
   * ===============================================================
   * Private Methods
   * ===============================================================
   */

  private async extractMetadata(
    buffer: Buffer,
    mimetype: string,
  ): Promise<{
    size: number;
    width?: number;
    height?: number;
    mimeType: string;
  }> {
    // Determine the file type
    const detectedType = await fromBuffer(buffer);

    // Validate the file mimetype against the detected type
    const isImage = detectedType?.mime.startsWith('image/');

    if (isImage) {
      try {
        const metadata = await sharp(buffer).metadata();
        return {
          size: buffer.length, // Size in bytes
          width: metadata.width || 0,
          height: metadata.height || 0,
          mimeType: metadata.format || mimetype, // Prefer metadata format from sharp
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        throw new BadRequestException('Failed to Upload Image.');
      }
    } else {
      // Non image files
      return {
        size: buffer.length,
        mimeType: mimetype,
      };
    }
  }

  /**
   * Generate a random file name using current date
   * @param originalName
   * @returns file name
   */
  private generateFileName(originalName: string) {
    const uniqueKey = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(originalName)}`;
    return uniqueKey;
  }

  /**
   * Get url for public files and images
   * @param fullPath
   * @returns url
   */
  private getUrl(fullPath: string) {
    const PrdUrl = `https://${this.bucketName}.s3.${this.s3Region}.amazonaws.com/${fullPath}`;
    const developmentUrl = `${this.endpoint}/${this.bucketName}/${fullPath}`;
    return this.isMinio ? developmentUrl : PrdUrl;
  }
}
