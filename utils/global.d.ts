// global.d.ts
import 'multer'; // This line might help TypeScript recognize multer's global augmentations.

// You can add other global type augmentations here if needed.
// For example, if you ever explicitly augment Express.Request or other global types:
// declare namespace Express {
//   interface Request {
//     myCustomProperty?: string;
//   }
// }