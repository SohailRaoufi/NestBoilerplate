/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import 'dotenv/config';
import { fromBuffer } from 'file-type';
import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { allowedFileMimeTypes } from '../constants/files';
import { UnprocessableException } from '../exceptions/unprocessable';

type Category = keyof typeof allowedFileMimeTypes;
type MimeTypes<C extends Category> = keyof (typeof allowedFileMimeTypes)[C];

interface FileValidationOptions<T extends Category> {
  required: boolean;
  fileSize?: number;
  allowedMimeTypes?: MimeTypes<T>[];
  minCount?: number;
}

@Injectable()
export class FileValidationPipe<T extends Category> implements PipeTransform {
  private category: Category[];
  private allowedTypes: Record<string, any>;
  constructor(
    private readonly categories?: T | T[],
    private readonly options: FileValidationOptions<T> = { required: true },
  ) {}

  async transform(
    files: Express.Multer.File | Express.Multer.File[],
    _metadata: ArgumentMetadata,
  ) {
    this.mergeAllowedTypes();

    // If a single file is passed, wrap it in an array for uniformity
    const fileArray = Array.isArray(files) ? files : [files];

    if ((!files || fileArray.length === 0) && !this.options.required) {
      return;
    }

    if ((!files || fileArray.length === 0) && this.options.required) {
      throw new UnprocessableException({
        message: 'File Not Uploaded.',
        field: 'file',
      });
    }

    if (
      typeof this.options.minCount === 'number' &&
      fileArray.filter(Boolean).length < this.options.minCount
    ) {
      throw new UnprocessableException({
        message: `At least ${this.options.minCount} file(s) must be uploaded.`,
        field: fileArray[0].fieldname,
      });
    }

    // Validate each file in the array
    await Promise.all(
      fileArray.map(async (file) => {
        if (!(await this.validateFileType(file))) {
          throw new UnprocessableException({
            message: `Invalid File Type, allowed types: ${Object.keys(this.allowedTypes).join(', ')}.`,
            field: file.fieldname,
          });
        }

        if (!this.validateFileSize(file.size)) {
          throw new UnprocessableException({
            message: `File Size Too Large. It must be less than ${this.options.fileSize} mb.`,
            field: file.fieldname,
          });
        }
      }),
    );

    // Return the validated files
    return files;
  }

  /**
   * =====================================================
   * Private Methods
   * =====================================================
   */

  /**
   * Merge Allowed Mime Types
   * if category was given it will merge only defined categories
   * otherwise it will use all categories defined in allowed mime types
   */
  private mergeAllowedTypes() {
    this.category = Array.isArray(this.categories)
      ? (this.categories.filter((cat) => !!cat) as Category[])
      : ([this.categories].filter((cat) => !!cat) as Category[]);

    const merged =
      this.category.length > 0
        ? this.category.reduce((acc, cat) => {
            const types = allowedFileMimeTypes[cat];
            return { ...acc, ...types };
          }, {})
        : Object.values(allowedFileMimeTypes).reduce((acc, types) => {
            return { ...acc, ...types };
          }, {});

    if (
      this.options.allowedMimeTypes &&
      this.options.allowedMimeTypes.length > 0
    ) {
      this.allowedTypes = Object.fromEntries(
        Object.entries(merged).filter(([ext]) =>
          (this.options.allowedMimeTypes as string[]).includes(ext),
        ),
      );
    } else {
      this.allowedTypes = merged;
    }
  }

  /**
   * Validate File Type and Extension
   * @param file
   * @returns boolean
   */
  private async validateFileType(file: Express.Multer.File): Promise<boolean> {
    // Extract File type
    const fileType = await fromBuffer(file.buffer);

    if (!fileType) return false;

    const { ext, mime } = fileType;

    return this.allowedTypes[ext]?.includes(mime) || false;
  }

  /**
   * Get Max File Size
   */
  private get maxFileSize(): number {
    return (this.options.fileSize || 20) * 1024 * 1024;
  }

  /**
   * Validate File Size
   * @param fileSize
   * @returns boolean
   */
  private validateFileSize(fileSize: number): boolean {
    return fileSize <= this.maxFileSize;
  }
}
