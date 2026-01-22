import multer from 'multer';
import { Request } from 'express';
import { ValidationError } from '../utils/error';

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default
const ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
];

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ValidationError(`Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`));
    }
};

// Multer configuration for memory storage
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter,
});

// Single file upload middleware
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Multiple files upload middleware
export const uploadMultiple = (fieldName: string, maxCount: number = 5) =>
    upload.array(fieldName, maxCount);

// Fields upload middleware
export const uploadFields = (fields: Array<{ name: string; maxCount: number }>) =>
    upload.fields(fields);
