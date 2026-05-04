import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramBlobFromServer } from '@/lib/telegram';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const token = form.get('token')?.toString()?.trim();
    const chatIdRaw = form.get('chat_id')?.toString()?.trim();
    const caption = form.get('caption')?.toString();
    const file = form.get('file');

    if (!token || !chatIdRaw || !file || typeof file === 'string') {
      return NextResponse.json(
        { ok: false, description: 'token, chat_id va file majburiy.' },
        { status: 400 }
      );
    }

    if (!(file instanceof Blob)) {
      return NextResponse.json({ ok: false, description: 'Notogri fayl.' }, { status: 400 });
    }

    const fileName = file instanceof File && file.name ? file.name : 'file';

    const chatId: string | number = /^\d+$/.test(chatIdRaw) ? Number(chatIdRaw) : chatIdRaw;

    await sendTelegramBlobFromServer(token, chatId, file, fileName, caption ?? undefined);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const description = e instanceof Error ? e.message : 'Nomalum xato';
    return NextResponse.json({ ok: false, description }, { status: 400 });
  }
}
