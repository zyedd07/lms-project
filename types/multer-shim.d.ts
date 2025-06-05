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
    buffer?: Buffer; // Crucial for memoryStorage
  }

  type StorageEngine = any;

  // Corrected: Multer's fileFilter function itself expects this signature
  type MulterFileFilterFunction = (
    req: Request,
    file: File,
    callback: FileFilterCallback // This is the final callback function
  ) => void;

  // This is the callback function that you pass to MulterFileFilterFunction
  type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

  interface Multer {
    single(fieldName: string): (req: Request, res: any, next: any) => void;
    array(fieldName: string, maxCount?: number): (req: Request, res: any, next: any) => void;
    fields(fields: { name: string; maxCount?: number }[]): (req: Request, res: any, next: any) => void;
    any(): (req: Request, res: any, next: any) => void;
  }

  // Define the multer function, and crucially, declare static methods directly on its namespace
  function multer(options?: {
    storage?: StorageEngine;
    fileFilter?: MulterFileFilterFunction; // Use the specific function type here
    limits?: {
      fileSize?: number;
      // Add other limits if needed
    };
  }): Multer;

  // This namespace exports the types and static methods directly from 'multer'
  namespace multer {
    export { File, StorageEngine, FileFilterCallback }; // Exporting for direct import if needed

    // Directly export the static storage methods to be accessed as multer.memoryStorage()
    export function memoryStorage(): StorageEngine;
    export function diskStorage(options: {
      destination?: (req: Request, file: File, callback: (error: Error | null, destination: string) => void) => void;
      filename?: (req: Request, file: File, callback: (error: Error | null, filename: string) => void) => void;
    }): StorageEngine;
  }

  export = multer;
}

declare namespace Express {
  interface Request {
    file?: multer.File;
    files?: multer.File[] | { [fieldname: string]: multer.File[] };
  }
}