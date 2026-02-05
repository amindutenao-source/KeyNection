import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

type UploadBody = PutObjectCommandInput["Body"];

type S3Config = {
  region: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle: boolean;
  publicUrl?: string;
};

let cachedClient: S3Client | null = null;
let cachedConfig: S3Config | null = null;

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getS3Config = (): S3Config => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION;
  if (!region) {
    throw new Error("Missing required environment variable: AWS_REGION");
  }

  cachedConfig = {
    region,
    bucket: getRequiredEnv("AWS_S3_BUCKET"),
    endpoint: process.env.AWS_S3_ENDPOINT,
    forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === "true",
    publicUrl: process.env.AWS_S3_PUBLIC_URL,
  };

  return cachedConfig;
};

export const getS3Client = (): S3Client => {
  if (cachedClient) {
    return cachedClient;
  }

  const config = getS3Config();
  cachedClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: defaultProvider(),
  });

  return cachedClient;
};

export const uploadObject = async (params: {
  key: string;
  body: UploadBody;
  contentType?: string;
  cacheControl?: string;
  acl?: "private" | "public-read";
}): Promise<{ key: string; url?: string }> => {
  const client = getS3Client();
  const config = getS3Config();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: params.cacheControl,
      ACL: params.acl,
    })
  );

  const url = config.publicUrl
    ? `${config.publicUrl.replace(/\/$/, "")}/${params.key}`
    : undefined;

  return { key: params.key, url };
};

export const deleteObject = async (key: string): Promise<void> => {
  const client = getS3Client();
  const config = getS3Config();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    })
  );
};

export const objectExists = async (key: string): Promise<boolean> => {
  const client = getS3Client();
  const config = getS3Config();

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    const error = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (error.$metadata?.httpStatusCode === 404 || error.name === "NotFound" || error.name === "NoSuchKey") {
      return false;
    }
    throw err;
  }
};
