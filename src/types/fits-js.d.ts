declare module 'fits-js' {
  export class FITSHeader {
    constructor(buffer: ArrayBuffer);
    hasKeyword(keyword: string): boolean;
    getKeywordValue(keyword: string): unknown;
  }
} 