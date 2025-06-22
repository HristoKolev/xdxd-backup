import type { Writable } from 'stream';

export function closeWriteStream(writeStream: Writable): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Check if the stream is already ended or destroyed
    if (writeStream.destroyed || writeStream.writableEnded) {
      resolve();
      return;
    }

    // Handle any errors that might occur during closing
    writeStream.on('error', reject);

    // Listen for the 'finish' event which indicates all data has been flushed
    writeStream.on('finish', resolve);

    // End the stream, which will trigger flushing and then emit 'finish'
    writeStream.end();
  });
}
