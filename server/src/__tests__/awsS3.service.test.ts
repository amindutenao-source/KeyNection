jest.mock('@aws-sdk/client-s3', () => {
  const sendMock = jest.fn();
  const S3Client = jest.fn().mockImplementation((config) => ({
    config,
    send: sendMock
  }));
  const PutObjectCommand = jest.fn().mockImplementation((input) => ({ input, kind: 'PutObject' }));
  const DeleteObjectCommand = jest.fn().mockImplementation((input) => ({ input, kind: 'DeleteObject' }));
  const HeadObjectCommand = jest.fn().mockImplementation((input) => ({ input, kind: 'HeadObject' }));

  return {
    __esModule: true,
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    __sendMock: sendMock
  };
});

jest.mock('@aws-sdk/credential-provider-node', () => ({
  defaultProvider: jest.fn(() => 'creds')
}));

const getAwsMock = () =>
  jest.requireMock('@aws-sdk/client-s3') as {
    S3Client: jest.Mock;
    PutObjectCommand: jest.Mock;
    DeleteObjectCommand: jest.Mock;
    HeadObjectCommand: jest.Mock;
    __sendMock: jest.Mock;
  };

describe('awsS3 service', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;
    delete process.env.AWS_S3_BUCKET;
    delete process.env.AWS_S3_ENDPOINT;
    delete process.env.AWS_S3_FORCE_PATH_STYLE;
    delete process.env.AWS_S3_PUBLIC_URL;
  });

  it('throws when AWS_REGION is missing', async () => {
    process.env.AWS_S3_BUCKET = 'bucket';

    const { getS3Client } = await import('../services/awsS3');

    expect(() => getS3Client()).toThrow('Missing required environment variable: AWS_REGION');
  });

  it('throws when AWS_S3_BUCKET is missing', async () => {
    process.env.AWS_REGION = 'us-east-1';

    const { uploadObject } = await import('../services/awsS3');

    await expect(
      uploadObject({ key: 'file.txt', body: 'content' })
    ).rejects.toThrow('Missing required environment variable: AWS_S3_BUCKET');
  });

  it('reuses cached S3 client', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'bucket';

    const { getS3Client } = await import('../services/awsS3');
    const first = getS3Client();
    const second = getS3Client();

    expect(first).toBe(second);
    const aws = getAwsMock();
    expect(aws.S3Client).toHaveBeenCalledTimes(1);
  });

  it('uploads an object and returns a public URL', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'bucket';
    process.env.AWS_S3_PUBLIC_URL = 'https://cdn.example.com/';
    process.env.AWS_S3_FORCE_PATH_STYLE = 'true';

    const { uploadObject } = await import('../services/awsS3');
    const aws = getAwsMock();

    aws.__sendMock.mockResolvedValueOnce({});

    const result = await uploadObject({
      key: 'uploads/file.txt',
      body: 'hello',
      contentType: 'text/plain',
      cacheControl: 'max-age=3600',
      acl: 'public-read'
    });

    expect(aws.PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'bucket',
        Key: 'uploads/file.txt',
        Body: 'hello',
        ContentType: 'text/plain',
        CacheControl: 'max-age=3600',
        ACL: 'public-read'
      })
    );
    expect(result).toEqual({
      key: 'uploads/file.txt',
      url: 'https://cdn.example.com/uploads/file.txt'
    });
  });

  it('uploads an object without public URL', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'bucket';

    const { uploadObject } = await import('../services/awsS3');
    const aws = getAwsMock();

    aws.__sendMock.mockResolvedValueOnce({});

    const result = await uploadObject({
      key: 'uploads/file.txt',
      body: 'hello'
    });

    expect(result).toEqual({
      key: 'uploads/file.txt',
      url: undefined
    });
  });

  it('deletes an object', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'bucket';

    const { deleteObject } = await import('../services/awsS3');
    const aws = getAwsMock();

    aws.__sendMock.mockResolvedValueOnce({});

    await deleteObject('uploads/file.txt');

    expect(aws.DeleteObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'bucket',
        Key: 'uploads/file.txt'
      })
    );
  });

  it('returns false when object does not exist', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'bucket';

    const { objectExists } = await import('../services/awsS3');
    const aws = getAwsMock();

    aws.__sendMock.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } });

    await expect(objectExists('missing.txt')).resolves.toBe(false);
  });

  it('returns true when object exists', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'bucket';

    const { objectExists } = await import('../services/awsS3');
    const aws = getAwsMock();

    aws.__sendMock.mockResolvedValueOnce({});

    await expect(objectExists('present.txt')).resolves.toBe(true);
  });

  it('throws when objectExists receives unexpected error', async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'bucket';

    const { objectExists } = await import('../services/awsS3');
    const aws = getAwsMock();

    aws.__sendMock.mockRejectedValueOnce(new Error('boom'));

    await expect(objectExists('missing.txt')).rejects.toThrow('boom');
  });
});
