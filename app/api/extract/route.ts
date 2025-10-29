// app/api/extract/route.ts
import { NextResponse } from 'next/server';

function extractFromFileName(fileName: string) {
    const base = fileName.replace(/\.[^.]+$/, '').trim();
    let type = '', number = '', name = base;

    const typeMap: Record<string, string> = {
        'KH': 'Kế hoạch', 'QD': 'Quyết định', 'QĐ': 'Quyết định',
        'CV': 'Công văn', 'TT': 'Thông tư', 'VB': 'Văn bản',
        'BC': 'Báo cáo', 'HD': 'Hướng dẫn', 'TB': 'Thông báo',
        'ND': 'Nghị định'
    };

    const prefix = base.match(/^([A-ZĐ]{1,4})\s+/i);
    if (prefix) {
        type = typeMap[prefix[1].toUpperCase()] || prefix[1];
        name = base.slice(prefix[0].length).trim();
    }

    const num = name.match(/(\d{1,6}(?:\/\d{2,4})?)/);
    if (num) {
        number = num[1];
        name = name.replace(num[0], '').replace(/[-:–]\s*/g, '').trim();
    }

    name = name.replace(/\s+/g, ' ')
        .replace(/^\w/, c => c.toUpperCase())
        .trim() || 'Không xác định';

    return { type, number, name };
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'Thiếu file' }, { status: 400 });
        return NextResponse.json({ success: true, auto: extractFromFileName(file.name) });
    } catch {
        return NextResponse.json({ error: 'Lỗi xử lý' }, { status: 500 });
    }
}