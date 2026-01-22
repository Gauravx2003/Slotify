import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const requiredEnvVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET_NAME'];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`${envVar} environment variable is not set`);
    }
}

export const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
const PROFILE_FOLDER = process.env.AWS_S3_PROFILE_FOLDER || 'user-profiles';
const APPOINTMENT_FOLDER = process.env.AWS_S3_APPOINTMENT_FOLDER || 'appointment-images';

export interface UploadFileParams {
    fileBuffer: Buffer;
    fileName: string;
    contentType: string;
    userId: string;
}

export const s3Helpers = {
    /**
     * Upload a file to S3
     */
    async uploadFile({ fileBuffer, fileName, contentType, userId }: UploadFileParams): Promise<string> {
        const key = `${PROFILE_FOLDER}/${userId}/${Date.now()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
        });

        try {
            await s3Client.send(command);
            return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        } catch (error) {
            console.error('S3 Upload Error:', error);
            throw new Error('Failed to upload file to S3');
        }
    },

    /**
     * Delete a file from S3
     */
    async deleteFile(fileUrl: string): Promise<void> {
        try {
            const url = new URL(fileUrl);
            const key = url.pathname.substring(1);

            const command = new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            });

            await s3Client.send(command);
        } catch (error) {
            console.error('S3 Delete Error:', error);
            throw new Error('Failed to delete file from S3');
        }
    },

    /**
     * Generate a presigned URL for downloading a file
     */
    async getPresignedUrl(fileUrl: string, expiresIn: number = 3600): Promise<string> {
        try {
            const url = new URL(fileUrl);
            const key = url.pathname.substring(1);

            const command = new GetObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            });

            return await getSignedUrl(s3Client, command, { expiresIn });
        } catch (error) {
            console.error('S3 Presigned URL Error:', error);
            throw new Error('Failed to generate presigned URL');
        }
    },

    /**
     * Upload profile picture specifically
     */
    async uploadProfilePicture(fileBuffer: Buffer, fileName: string, contentType: string, userId: string): Promise<string> {
        return this.uploadFile({
            fileBuffer,
            fileName,
            contentType,
            userId,
        });
    },

    /**
     * Upload appointment image
     */
    async uploadAppointmentImage(fileBuffer: Buffer, fileName: string, contentType: string, appointmentTypeId: string): Promise<string> {
        const key = `${APPOINTMENT_FOLDER}/${appointmentTypeId}/${Date.now()}-${fileName}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
        });

        try {
            await s3Client.send(command);
            return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        } catch (error) {
            console.error('S3 Appointment Image Upload Error:', error);
            throw new Error('Failed to upload appointment image to S3');
        }
    },
};
