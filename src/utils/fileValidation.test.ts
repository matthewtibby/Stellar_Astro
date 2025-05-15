import { getFrameTypeFromFilename } from './fileValidation';

describe('getFrameTypeFromFilename', () => {
  it('returns "light" for filenames containing "light"', () => {
    expect(getFrameTypeFromFilename('my_light_frame.fits')).toBe('light');
    expect(getFrameTypeFromFilename('LIGHT_FRAME.FIT')).toBe('light');
  });

  it('returns "dark" for filenames containing "dark"', () => {
    expect(getFrameTypeFromFilename('project_dark_001.fts')).toBe('dark');
    expect(getFrameTypeFromFilename('DARKFRAME.fit')).toBe('dark');
  });

  it('returns "flat" for filenames containing "flat"', () => {
    expect(getFrameTypeFromFilename('session_flat_2023.fits')).toBe('flat');
    expect(getFrameTypeFromFilename('FLATFIELD.fit')).toBe('flat');
  });

  it('returns "bias" for filenames containing "bias"', () => {
    expect(getFrameTypeFromFilename('bias_12.fts')).toBe('bias');
    expect(getFrameTypeFromFilename('BIAS_FRAME.fit')).toBe('bias');
  });

  it('returns "unknown" for filenames with no known type', () => {
    expect(getFrameTypeFromFilename('randomfile.fits')).toBe('unknown');
    expect(getFrameTypeFromFilename('image.fit')).toBe('unknown');
  });
}); 