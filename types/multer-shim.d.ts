// types/multer-shim.d.ts

declare module 'multer' {
  import { Request } from 'express';

  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    // --- CHANGE: Make buffer non-optional IF you are consistently using memoryStorage
    //             and expecting it to be present after successful upload processing.
    //             If you use diskStorage elsewhere, keep it optional or create another shim.
    buffer: Buffer; // Changed from buffer?: Buffer;
  }

  type StorageEngine = any;

  type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

  // Export MulterFileFilterFunction so it can be imported
  export type MulterFileFilterFunction = (
    req: Request,
    file: File,
    callback: FileFilterCallback
  ) => void;

  interface Multer {
    single(fieldName: string): (req: Request, res: any, next: any) => void;
    array(fieldName: string, maxCount?: number): (req: Request, res: any, next: any) => void;
    fields(fields: { name: string; maxCount?: number }[]): (req: Request, res: any, next: any) => void;
    any(): (req: Request, res: any, next: any) => void;
  }

  function multer(options?: {
    storage?: StorageEngine;
    fileFilter?: MulterFileFilterFunction;
    limits?: { fileSize?: number };
  }): Multer;

  namespace multer {
    // Exporting from the namespace for convenience in imports
    export { File, StorageEngine, FileFilterCallback, MulterFileFilterFunction };
    export function memoryStorage(): StorageEngine;
    export function diskStorage(options: {
      destination?: (req: Request, file: File, callback: (error: Error | null, destination: string) => void) => void;
      filename?: (req: Request, file: File, callback: (error: Error | null, filename: string) => void) => void;
    }): StorageEngine;

    // --- ADDITION: Declare MulterError within the namespace AND export it ---
    export class MulterError extends Error {
        code:
            'LIMIT_PART_COUNT' |
            'LIMIT_FILE_SIZE' |
            'LIMIT_FILE_COUNT' |
            'LIMIT_FIELD_KEY' |
            'LIMIT_FIELD_VALUE' |
            'LIMIT_FIELD_COUNT' |
            'LIMIT_UNEXPECTED_FILE';
        field?: string;
        name: 'MulterError'; // Explicitly define the name property
        message: string;
        constructor(code: string, field?: string);
    }
  }

  export = multer;
}

declare namespace Express {
  interface Request {
    file?: multer.File;
    files?: multer.File[] | { [fieldname: string]: multer.File[] };
  }
}