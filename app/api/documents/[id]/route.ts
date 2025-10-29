// app/api/documents/[id]/route.ts
import { NextResponse } from 'next/server';
import pool from '../../../../lib/mysql';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let connection;
  try {
    const { id } = await params;
    if (!id || isNaN(Number(id))) return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 });

    connection = await pool.getConnection();
    const [rows]: any = await connection.query('SELECT file_path FROM documents WHERE id = ?', [id]);
    if (!rows[0]) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 });

    if (rows[0].file_path) {
      await fs.unlink(path.join(process.cwd(), 'public', rows[0].file_path)).catch(() => { });
    }

    await connection.query('DELETE FROM documents WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}