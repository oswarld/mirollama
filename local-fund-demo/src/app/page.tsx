'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const lang = navigator.language.toLowerCase();
    if (lang.startsWith('ko')) {
      router.replace('/live-demo/ko');
    } else if (lang.startsWith('zh')) {
      router.replace('/live-demo/zh');
    } else {
      router.replace('/live-demo/en');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
    </div>
  );
}
