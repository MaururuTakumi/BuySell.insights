// CSV処理エラーの型定義

export interface FailedRowReport {
  row: number;
  data: Record<string, unknown>;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

export class CsvParseError extends Error {
  constructor(
    message: string,
    public readonly failedRows: FailedRowReport[]
  ) {
    super(message);
    this.name = 'CsvParseError';
  }
}

export class CsvMaxRowsExceededError extends Error {
  constructor(maxRows: number) {
    super(`CSV file exceeds maximum allowed rows (${maxRows})`);
    this.name = 'CsvMaxRowsExceededError';
  }
}