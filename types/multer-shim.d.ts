// types/multer-shim.d.ts

// This declares the core 'multer' module and its exports.
declare module 'multer' {
  import { Request } from 'express';

  // Minimal definition for the File type from Multer
  interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string; // Optional: exists with diskStorage
    filename?: string;    // Optional: exists with diskStorage
    path?: string;        // Optional: exists with diskStorage
    buffer?: Buffer;      // Optional: exists with memoryStorage - crucial for Supabase upload!
  }

  // Basic types for StorageEngine and FileFilterCallback to resolve TS2709
  // Using 'any' for now for simplicity in this shim, as their internal structure is complex.
  type StorageEngine = any;
  type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

  // Interface for the Multer function itself, and its common methods
  interface Multer {
    single(fieldName: string): (req: Request, res: any, next: any) => void;
    array(fieldName: string, maxCount?: number): (req: Request, res: any, next: any) => void;
    fields(fields: { name: string; maxCount?: number }[]): (req: Request, res: any, next: any) => void;
    any(): (req: Request, res: any, next: any) => void;

    // Define the storage methods
    memoryStorage(): StorageEngine;
    diskStorage(options: {
      destination?: (req: Request, file: File, callback: (error: Error | null, destination: string) => void) => void;
      filename?: (req: Request, file: File, callback: (error: Error | null, filename: string) => void) => void;
    }): StorageEngine;
  }

  // The default export of the 'multer' module is a function that creates a Multer instance
  function multer(options?: { storage?: StorageEngine; fileFilter?: FileFilterCallback; limits?: { fileSize?: number } }): Multer;

  // This is crucial for allowing 'import multer, { File } from "multer";' syntax
  // by extending the function with a namespace.
  namespace multer {
    export { File, StorageEngine, FileFilterCallback };
  }

  export = multer; // Export the function as the default module export
}

// This augments the Express Request type globally, so `req.file` has our custom File type
declare namespace Express {
  interface Request {
    file?: multer.File; // Using the File type we defined above in the multer module
    files?: multer.File[] | { [fieldname: string]: multer.File[] };
  }
}