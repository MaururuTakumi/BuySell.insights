import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { SalesCsvRowSchema, type ParsedCsvRow } from './schema';
import {
  type FailedRowReport,
  CsvMaxRowsExceededError
} from './errors';

export interface ParseResult {
  validRows: ParsedCsvRow[];
  failedRows: FailedRowReport[];
}

export async function parseCsv(
  stream: Readable,
  maxRows: number = 10000
): Promise<ParseResult> {
  const validRows: ParsedCsvRow[] = [];
  const failedRows: FailedRowReport[] = [];
  let rowNumber = 0;

  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true,
      encoding: 'utf8',
    });

    parser.on('readable', function () {
      let record: Record<string, string>;
      while ((record = parser.read()) !== null) {
        rowNumber++;

        // 最大行数チェック
        if (rowNumber > maxRows) {
          parser.destroy();
          reject(new CsvMaxRowsExceededError(maxRows));
          return;
        }

        // スキーマバリデーション
        const result = SalesCsvRowSchema.safeParse(record);

        if (result.success) {
          validRows.push(result.data);
        } else {
          const errors = result.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }));

          failedRows.push({
            row: rowNumber,
            data: record,
            errors,
          });
        }
      }
    });

    parser.on('error', (err) => {
      reject(new Error(`CSV parse error: ${err.message}`));
    });

    parser.on('end', () => {
      resolve({
        validRows,
        failedRows,
      });
    });

    // ストリームをパーサーにパイプ
    stream.pipe(parser);
  });
}

/**
 * Bufferからストリームを作成するヘルパー関数
 */
export function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}