jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    existsSync: jest.fn(() => true),
    mkdirSync: jest.fn(),
    unlink: jest.fn((_path: string, callback: (err: NodeJS.ErrnoException | null) => void) =>
      callback(null)
    )
  };
});

import multer from 'multer';
import { deleteFile, getFileUrl, handleUploadError } from '../middleware/upload';

describe('upload middleware helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns file URL using API_URL when set', () => {
    process.env.API_URL = 'https://api.example.com';
    expect(getFileUrl('photo.png')).toBe('https://api.example.com/uploads/photo.png');
  });

  it('returns file URL using default when API_URL is not set', () => {
    delete process.env.API_URL;
    expect(getFileUrl('photo.png')).toBe('http://localhost:3001/uploads/photo.png');
  });

  it('handles Multer file size errors', () => {
    const error = new multer.MulterError('LIMIT_FILE_SIZE');
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    handleUploadError(error, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'FILE_TOO_LARGE'
      })
    );
  });

  it('handles Multer file count errors', () => {
    const error = new multer.MulterError('LIMIT_FILE_COUNT');
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    handleUploadError(error, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'TOO_MANY_FILES'
      })
    );
  });

  it('handles unexpected file errors', () => {
    const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE');
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    handleUploadError(error, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'INVALID_FILE_TYPE'
      })
    );
  });

  it('handles custom file type errors', () => {
    const error = new Error('Seuls les fichiers images sont autorisés (jpeg, jpg, png, gif, webp)');
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    handleUploadError(error, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'INVALID_FILE_TYPE'
      })
    );
  });

  it('delegates unknown errors to next', () => {
    const error = new Error('unknown');
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    handleUploadError(error, {}, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('deletes files via fs.unlink', async () => {
    await expect(deleteFile('dummy.png')).resolves.toBeUndefined();
    const fs = await import('fs');
    expect(fs.unlink).toHaveBeenCalled();
  });
});
