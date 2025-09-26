import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { parseCsv, bufferToStream } from '@/lib/csv/parser';
import { createRowHash } from '@/lib/csv/hash';
import { determineBrand } from '@/lib/csv/brand-extractor';
import { env } from '@/config/env';
import type { TablesInsert } from '@/lib/supabase/types';

const BATCH_SIZE = 500; // バッチサイズ

export async function POST(request: NextRequest) {
  try {
    // TODO: 認証チェック - Basic AuthまたはSupabase Authでの管理者権限確認
    // 現時点では認証なしで実装（開発環境のみ）

    // multipart/form-dataからファイルを取得
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // ファイル拡張子チェック
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // ファイルをバッファに変換
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = bufferToStream(buffer);

    // CSVをパース
    const parseResult = await parseCsv(stream, env.CSV_MAX_ROWS);

    // バリデーションエラーのみの場合
    if (parseResult.validRows.length === 0 && parseResult.failedRows.length > 0) {
      return NextResponse.json(
        {
          error: 'ValidationFailed',
          details: parseResult.failedRows.slice(0, 20), // 最初の20行のエラーのみ返す
        },
        { status: 400 }
      );
    }

    // Supabaseクライアント取得（Service Role）
    const supabase = getSupabaseServiceRoleClient();

    // row_hashを生成してデータを準備（ブランド名を自動推測）
    const rowsWithHash: TablesInsert<'sales'>[] = parseResult.validRows.map((row) => {
      // ブランドを一度だけ推測して変数に保存
      const brand = determineBrand(row, file.name);

      return {
        sale_date: row.sale_date,
        selling_price: row.selling_price,
        sales_channel: row.sales_channel || null,
        sale_contact: row.sale_contact || null,
        item_type_group: row.item_type_group || null,
        brand: brand, // 推測したブランドを使用
        rank: row.rank || null,
        type: row.type || null,
        model_number: row.model_number || null,
        material: row.material || null,
        sale_quantity: row.sale_quantity || 1,
        adjusted_exp_sale_price: row.adjusted_exp_sale_price || 0,
        appraised_price: row.appraised_price || 0,
        row_hash: createRowHash(row, brand), // 同じブランドをrow_hashにも渡す
      };
    });

    // バッチごとにupsert実行
    let totalUpserted = 0;
    const errors: any[] = [];

    for (let i = 0; i < rowsWithHash.length; i += BATCH_SIZE) {
      const batch = rowsWithHash.slice(i, i + BATCH_SIZE);

      const { data, error, count } = await supabase
        .from('sales')
        .upsert(batch, {
          onConflict: 'row_hash',
          count: 'exact',
        });

      if (error) {
        console.error('Upsert error:', error);
        errors.push({ batch: i / BATCH_SIZE + 1, error: error.message });
      } else {
        totalUpserted += count || batch.length;
      }
    }

    // 監査ログ記録（エラーがあっても継続）
    try {
      await supabase.from('ingest_logs').insert({
        filename: file.name,
        processed: parseResult.validRows.length + parseResult.failedRows.length,
        inserted: totalUpserted, // 実際には新規と更新の合計
        updated: 0, // 区別が難しいため0として記録
        failed_rows: parseResult.failedRows.length > 0
          ? JSON.parse(JSON.stringify(parseResult.failedRows.slice(0, 20))) // 最初の20行のみ保存
          : null,
      });
    } catch (logError) {
      console.error('Failed to write audit log:', logError);
      // ログ記録の失敗は無視して続行
    }

    // エラーがあった場合
    if (errors.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'PartialFailure',
          processed: parseResult.validRows.length,
          upserted: totalUpserted,
          failed: parseResult.failedRows.length,
          batchErrors: errors,
        },
        { status: 207 } // Multi-Status
      );
    }

    // 成功レスポンス
    return NextResponse.json(
      {
        ok: true,
        processed: parseResult.validRows.length + parseResult.failedRows.length,
        upserted: totalUpserted,
        failed: parseResult.failedRows.length,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Unexpected error in CSV ingest:', error);

    // 特定のエラータイプの処理
    if (error instanceof Error) {
      if (error.message.includes('CSV file exceeds maximum')) {
        return NextResponse.json(
          { error: error.message },
          { status: 413 } // Payload Too Large
        );
      }

      if (error.message.includes('CSV parse error')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    // 予期せぬエラー
    return NextResponse.json(
      { error: 'InternalError' },
      { status: 500 }
    );
  }
}
