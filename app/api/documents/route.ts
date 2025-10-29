// app/api/documents/route.ts
import { NextResponse } from 'next/server';
import pool from '../../../lib/mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(`
      SELECT id, number, type, name, file_path, issued_date, created_at, file_size, file_name_original
      FROM documents 
      ORDER BY created_at DESC
    `);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}