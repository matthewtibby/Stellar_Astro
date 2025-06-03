declare module 'fits-js' {
  export class FITSHeader {
    constructor(buffer: ArrayBuffer);
    hasKeyword(keyword: string): boolean;
<<<<<<< HEAD
    getKeywordValue(keyword: string): any;
=======
    getKeywordValue(keyword: string): unknown;
>>>>>>> calibration
  }
} 