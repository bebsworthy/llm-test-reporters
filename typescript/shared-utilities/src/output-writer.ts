/**
 * Output writer for handling file and console output
 */

import * as fs from 'fs';
import * as path from 'path';

export class OutputWriter {
  private outputFile?: string;
  private stream?: fs.WriteStream;

  constructor(outputFile?: string) {
    this.outputFile = outputFile;
    
    if (outputFile) {
      // Ensure directory exists
      const dir = path.dirname(outputFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create write stream
      this.stream = fs.createWriteStream(outputFile, { flags: 'w' });
    }
  }

  write(content: string): void {
    if (this.stream) {
      this.stream.write(content);
    } else {
      process.stdout.write(content);
    }
  }

  writeLine(line: string = ''): void {
    this.write(line + '\n');
  }

  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.stream) {
        this.stream.end(() => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * Write output in streaming mode (line by line)
   */
  static writeStreaming(lines: string[], outputFile?: string): void {
    if (outputFile) {
      // For file output, write all at once
      const content = lines.join('\n');
      const dir = path.dirname(outputFile);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(outputFile, content);
    } else {
      // For console output, write line by line
      for (const line of lines) {
        console.log(line);
      }
    }
  }
}