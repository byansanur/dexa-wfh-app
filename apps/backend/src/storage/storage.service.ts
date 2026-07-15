import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { extname } from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly bucketName = process.env.MINIO_BUCKET || 'dexa-uploads';
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        
        // Set bucket policy to public read
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        this.logger.log(`Bucket ${this.bucketName} created with public read policy.`);
      } else {
        this.logger.log(`Bucket ${this.bucketName} already exists.`);
      }
    } catch (error) {
      this.logger.error('Error initializing MinIO bucket', error);
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    
    await this.minioClient.putObject(
      this.bucketName,
      fileName,
      file.buffer,
      file.size,
      { 'Content-Type': file.mimetype }
    );

    // Return the public URL
    const endPoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    return `http://${endPoint}:${port}/${this.bucketName}/${fileName}`;
  }
}
