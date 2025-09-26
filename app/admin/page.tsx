'use client';

import { useState } from 'react';

interface UploadResult {
  ok: boolean;
  processed?: number;
  upserted?: number;
  failed?: number;
  error?: string;
  details?: any[];
}

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('CSVファイルを選択してください');
        setFile(null);
      } else {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('ファイルを選択してください');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'アップロードに失敗しました');
        if (data.details) {
          setResult(data);
        }
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">CSV アップロード管理画面</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CSVファイルを選択
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={loading}
            className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'アップロード中...' : 'アップロード'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-semibold">エラー</p>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && result.ok && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 font-semibold mb-2">アップロード成功</p>
            <ul className="text-green-800 space-y-1">
              <li>処理件数: {result.processed?.toLocaleString()} 件</li>
              <li>登録/更新件数: {result.upserted?.toLocaleString()} 件</li>
              {result.failed && result.failed > 0 && (
                <li className="text-orange-600">
                  失敗件数: {result.failed.toLocaleString()} 件
                </li>
              )}
            </ul>
          </div>
        )}

        {result && !result.ok && result.details && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-h-96 overflow-auto">
            <p className="text-yellow-600 font-semibold mb-2">
              バリデーションエラー詳細
            </p>
            <div className="text-sm text-gray-700">
              {result.details.slice(0, 10).map((detail: any, index) => (
                <div key={index} className="mb-2 p-2 bg-white rounded">
                  <p className="font-semibold">行 {detail.row}:</p>
                  {detail.errors.map((err: any, errIndex: number) => (
                    <p key={errIndex} className="text-red-600 text-xs">
                      {err.field}: {err.message}
                    </p>
                  ))}
                </div>
              ))}
              {result.details.length > 10 && (
                <p className="text-gray-500 mt-2">
                  他 {result.details.length - 10} 件のエラー...
                </p>
              )}
            </div>
          </div>
        )}

        {file && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              選択ファイル: {file.name}
            </p>
            <p className="text-sm text-gray-600">
              サイズ: {(file.size / 1024).toFixed(2)} KB
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>注意事項:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>UTF-8エンコードのCSVファイルのみ対応</li>
          <li>ヘッダー行が必要です</li>
          <li>最大10,000行まで処理可能</li>
          <li>必須列: sale_date, selling_price</li>
        </ul>
      </div>
    </div>
  );
}