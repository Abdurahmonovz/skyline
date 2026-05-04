import { NextRequest, NextResponse } from 'next/server';
import { telegramSendMessageJson } from '@/lib/telegram';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      token?: string;
      chat_id?: string | number;
      text?: string;
    };
    const token = body.token?.trim();
    const { chat_id, text } = body;

    if (!token || chat_id === undefined || chat_id === null || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json(
        { ok: false, description: 'token, chat_id va text majburiy.' },
        { status: 400 }
      );
    }

    await telegramSendMessageJson(token, chat_id, text.trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    const description = e instanceof Error ? e.message : 'Nomalum xato';
    return NextResponse.json({ ok: false, description }, { status: 400 });
  }
}
