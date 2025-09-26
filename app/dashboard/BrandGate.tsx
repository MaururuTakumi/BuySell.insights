import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { ensureBrandAccessible } from '@/lib/sales/brands';

type BrandGateProps = {
  brand?: string;
  children: ReactNode;
};

export default async function BrandGate({ brand, children }: BrandGateProps) {
  // ブランドが指定されていない場合（ダッシュボード全体）はそのまま表示
  if (!brand) {
    return <>{children}</>;
  }

  // ブランドが指定されている場合はSupabaseでアクセス権を確認
  try {
    const isAccessible = await ensureBrandAccessible(brand);

    if (!isAccessible) {
      notFound();
    }
  } catch (error) {
    console.error('Error checking brand access:', error);
    notFound();
  }

  return <>{children}</>;
}
