const path = require("path");
const fs = require("fs");
const AWS = require("@aws-sdk/client-s3");
const {
  S3Client,
  ListObjectsCommand,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = AWS;

class AwsS3Store {
  /**
   * A class for storing authentication data of Whatsapp-web.js to AWS S3.
   * @example
   * For example usage see `example/index.js`.
   * @param {Object} options Specifies the params pattern.
   * @param {String} options.bucketName Specifies the S3 bucket name.
   * @param {String} options.remoteDataPath Specifies the remote path to save authentication files.
   * @param {Object} options.s3Client The S3Client instance after configuring the AWS SDK.
   * @param {Object} options.putObjectCommand  The PutObjectCommand class from `@aws-sdk/client-s3`.
   * @param {Object} options.headObjectCommand  The HeadObjectCommand class from `@aws-sdk/client-s3`.
   * @param {Object} options.getObjectCommand  The GetObjectCommand class from `@aws-sdk/client-s3`.
   * @param {Object} options.deleteObjectCommand  The DeleteObjectCommand class from `@aws-sdk/client-s3`.
   */
  constructor({ bucketName, remoteDataPath, s3Client } = {}) {
    if (!bucketName)
      throw new Error("A valid bucket name is required for AwsS3Store.");
    if (!remoteDataPath)
      throw new Error("A valid remote dir path is required for AwsS3Store.");
    // if (!s3Client) throw new Error("A valid S3Client instance is required for AwsS3Store.");
    this.bucketName = bucketName;
    this.remoteDataPath = remoteDataPath;
    this.s3Client = s3Client;
    this.debugEnabled = process.env.STORE_DEBUG === "true";
  }

  async isValidConfig(options) {
    if (!options.session) {
      console.log("Error: A valid session is required for AwsS3Store.");
      return false;
    }
    if (!this.bucketName) {
      console.log("Error: A valid bucket name is required for AwsS3Store.");
      return false;
    }
    if (!this.remoteDataPath) {
      console.log("Error: A valid remote dir path is required for AwsS3Store.");
      return false;
    }
    if (!this.s3Client) {
      console.log(
        "Error: A valid S3Client instance is required for AwsS3Store."
      );
      return false;
    }

    try {
      const result = await this.s3Client.send(
        new ListObjectsCommand({ Bucket: this.bucketName })
      );
      if (!result.$metadata) return false;
      if (!result.$metadata.httpStatusCode) return false;
      if (result.$metadata.httpStatusCode !== 200) return false;
      return true;
    } catch (error) {
      console.log("Error: Invalid AwsS3Store configuration", error);
      return true;
    }
  }

  async sessionExists(options) {
    this.debugLog("[METHOD: sessionExists] Triggered.");

    if ((await this.isValidConfig(options)) === false) return;

    const remoteFilePath = path
      .join(this.remoteDataPath, `${options.session}.zip`)
      .replace(/\\/g, "/");
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath,
    };
    try {
      await this.s3Client.send(new HeadObjectCommand(params));
      this.debugLog(
        `[METHOD: sessionExists] File found. PATH='${remoteFilePath}'.`
      );
      return true;
    } catch (err) {
      if (err.name === "NoSuchKey" || err.name === "NotFound") {
        this.debugLog(
          `[METHOD: sessionExists] File not found. PATH='${remoteFilePath}'.`
        );
        return false;
      }
      this.debugLog(`[METHOD: sessionExists] Error: ${err.message}`);
      // throw err;
      return;
    }
  }

  async save(options) {
    this.debugLog("[METHOD: save] Triggered.");

    if ((await this.isValidConfig(options)) === false) return;

    const remoteFilePath = path
      .join(this.remoteDataPath, `${options.session}.zip`)
      .replace(/\\/g, "/");
    options.remoteFilePath = remoteFilePath;

    // await this.#deletePrevious(options);

    try {
      const fileStream = fs.createReadStream(`${options.session}.zip`);
      const params = {
        Bucket: this.bucketName,
        Key: remoteFilePath,
        Body: fileStream,
        ACL: "private",
        ContentType: "application/zip",
      };
      await this.s3Client.send(new PutObjectCommand(params));
      this.debugLog(`[METHOD: save] File saved. PATH='${remoteFilePath}'.`);
    } catch (error) {
      this.debugLog(`[METHOD: save] Error: ${error.message}`);
      throw error;
    }
  }

  async extract(options) {
    this.debugLog("[METHOD: extract] Triggered.");

    if ((await this.isValidConfig(options)) === false) return;

    const remoteFilePath = path
      .join(this.remoteDataPath, `${options.session}.zip`)
      .replace(/\\/g, "/");
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath,
    };

    try {
      const fileStream = fs.createWriteStream(options.path);
      const response = await this.s3Client.send(new GetObjectCommand(params));
      await new Promise((resolve, reject) => {
        response.Body.pipe(fileStream)
          .on("error", reject)
          .on("finish", resolve);
      });

      this.debugLog(
        `[METHOD: extract] File extracted. REMOTE_PATH='${remoteFilePath}', LOCAL_PATH='${options.path}'.`
      );
    } catch (error) {
      this.debugLog(`[METHOD: extract] Error: ${error.message}`);
      throw error;
    }
  }

  async delete(options) {
    this.debugLog("[METHOD: delete] Triggered.");

    if ((await this.isValidConfig(options)) === false) return;

    const remoteFilePath = path
      .join(this.remoteDataPath, `${options.session}.zip`)
      .replace(/\\/g, "/");
    const params = {
      Bucket: this.bucketName,
      Key: remoteFilePath,
    };
    try {
      await this.s3Client.send(new HeadObjectCommand(params));
      await this.s3Client.send(new DeleteObjectCommand(params));
      this.debugLog(`[METHOD: delete] File deleted. PATH='${remoteFilePath}'.`);
    } catch (err) {
      if (err.name === "NoSuchKey" || err.name === "NotFound") {
        this.debugLog(
          `[METHOD: delete] File not found. PATH='${remoteFilePath}'.`
        );
        return;
      }
      this.debugLog(`[METHOD: delete] Error: ${err.message}`);
      // throw err;
      return;
    }
  }

  async #deletePrevious(options) {
    this.debugLog("[METHOD: #deletePrevious] Triggered.");

    if (!options.remoteFilePath)
      throw new Error("A valid remote file path is required for AwsS3Store.");
    if ((await this.isValidConfig(options)) === false) return;

    const params = {
      Bucket: this.bucketName,
      Key: options.remoteFilePath,
    };
    try {
      await this.s3Client.send(new HeadObjectCommand(params));
      await this.s3Client.send(new DeleteObjectCommand(params));
      this.debugLog(
        `[METHOD: #deletePrevious] File deleted. PATH='${options.remoteFilePath}'.`
      );
    } catch (err) {
      if (err.name === "NoSuchKey" || err.name === "NotFound") {
        this.debugLog(
          `[METHOD: #deletePrevious] File not found. PATH='${options.remoteFilePath}'.`
        );
        return;
      }
      this.debugLog(`[METHOD: #deletePrevious] Error: ${err.message}`);
      // throw err;
      return;
    }
  }

  debugLog(msg) {
    if (this.debugEnabled) {
      const timestamp = new Date().toISOString();
      console.log(`${timestamp} [STORE_DEBUG] ${msg}`);
    }
  }
}

module.exports = {
  AwsS3Store,
  S3Client,
};
