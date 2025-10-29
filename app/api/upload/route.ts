// app/api/upload/route.ts
import { NextResponse } from 'next/server';
import pool from '../../../lib/mysql';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

// Đảm bảo thư mục tồn tại
async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') throw error;
  }
}

export async function POST(request: Request) {
  let connection;
  try {
    // 1. Đảm bảo thư mục tồn tại
    await ensureUploadDir();

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const number = (formData.get('number') as string | null)?.trim();
    const type = (formData.get('type') as string | null)?.trim();
    const name = (formData.get('name') as string | null)?.trim();
    const issuedDate = formData.get('issued_date') as string | null;

    // 3. Validate
    if (!file) return NextResponse.json({ error: 'Thiếu file' }, { status: 400 });
    if (!number || !type || !name) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // 4. Validate ngày
    let finalIssuedDate: string | null = null;
    if (issuedDate) {
      const date = new Date(issuedDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Ngày không hợp lệ' }, { status: 400 });
      }
      finalIssuedDate = date.toISOString().split('T')[0];
    }

    // 5. Lưu file
    const safeFileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `/uploads/${safeFileName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const fullPath = path.join(uploadDir, safeFileName);

    await fs.writeFile(fullPath, buffer);

    // 6. Lưu DB
    connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO documents 
       (number, type, name, file_path, issued_date, file_size, file_name_original) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [number, type, name, filePath, finalIssuedDate, file.size, file.name]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      file_path: filePath
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Lỗi server', details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}