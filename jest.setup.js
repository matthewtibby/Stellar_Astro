import '@testing-library/jest-dom'; 

// Polyfill for TextEncoder/TextDecoder in Node.js (for Jest)
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
} 