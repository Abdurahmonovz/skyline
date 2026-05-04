export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type TelegramResponse = { ok: boolean; description?: string };

async function parseTelegramResponse(response: Response): Promise<TelegramResponse> {
  return (await response.json()) as TelegramResponse;
}

/**
 * Rasm: sendPhoto, keyin xato bolsa sendDocument fallback.
 * HEIC: darhol document. MIME yoki nom bolmasa, kengaytma qoshiladi.
 */
export function pickTelegramSendMethod(file: File): { method: string; field: string } {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();

  const extHeic = /\.(heic|heif)$/i.test(name);
  if (extHeic || mime === 'image/heic' || mime === 'image/heif') {
    return { method: 'sendDocument', field: 'document' };
  }

  const extImg = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name);
  if (mime.startsWith('image/') || extImg) {
    return { method: 'sendPhoto', field: 'photo' };
  }

  const looksMp4Family =
    mime === 'video/mp4' ||
    mime === 'video/quicktime' ||
    /\.(mp4|m4v|mov)$/i.test(name);
  if (mime.startsWith('video/') && looksMp4Family) {
    return { method: 'sendVideo', field: 'video' };
  }
  if (/\.(mp4|m4v|mov)$/i.test(name)) return { method: 'sendVideo', field: 'video' };

  return { method: 'sendDocument', field: 'document' };
}

/** Davomat xabari matni (HTML). */
export function buildAbsenceNotificationHtml(
  studentName: string,
  groupName: string,
  date: string,
  message?: string
): string {
  const extra = message?.trim()
    ? `\n\n📝 <b>Izoh:</b> ${escapeHtml(message.trim())}`
    : '';

  return (
    `⚠️ <b>Davomat eslatmasi</b>\n\n` +
    `Hurmatli <b>${escapeHtml(studentName)}</b>,\n\n` +
    `Siz <b>${escapeHtml(date)}</b> sanasida <b>${escapeHtml(groupName)}</b> guruhi boyicha <b>kelmadingiz</b> deb belgilandingiz.` +
    extra +
    `\n\nBatafsil malumot uchun mamuriyat bilan boglaning.\n\n` +
    `Hurmat bilan,\nSkyline Education`
  );
}

type NarrowUser = { id?: number; username?: string };

function unameMatch(u: NarrowUser | undefined, handle: string): boolean {
  return Boolean(u?.username && u.username.toLowerCase() === handle);
}

/** Shaxsiy xabar uchun: doim `from.id` (guruhdagi xabarda chat_id emas). Eng yangi yangiliklardan qidirish. */
function scanUpdatesForUsername(updates: unknown[], handle: string): number | null {
  const h = handle.toLowerCase();

  for (let i = updates.length - 1; i >= 0; i--) {
    const u = updates[i] as Record<string, unknown>;

    for (const key of ['message', 'edited_message', 'channel_post'] as const) {
      const msg = u[key] as { from?: NarrowUser; chat?: { id?: number; type?: string } } | undefined;
      if (msg?.from && unameMatch(msg.from, h) && typeof msg.from.id === 'number') {
        return msg.from.id;
      }
    }

    const cb = u.callback_query as { from?: NarrowUser } | undefined;
    if (cb?.from && unameMatch(cb.from, h) && typeof cb.from.id === 'number') {
      return cb.from.id;
    }

    const iq = u.inline_query as { from?: NarrowUser } | undefined;
    if (iq?.from && unameMatch(iq.from, h) && typeof iq.from.id === 'number') {
      return iq.from.id;
    }

    const cir = u.chosen_inline_result as { from?: NarrowUser } | undefined;
    if (cir?.from && unameMatch(cir.from, h) && typeof cir.from.id === 'number') {
      return cir.from.id;
    }

    const cjr = u.chat_join_request as { user?: NarrowUser } | undefined;
    if (cjr?.user && unameMatch(cjr.user, h) && typeof cjr.user.id === 'number') {
      return cjr.user.id;
    }

    const my = u.my_chat_member as { from?: NarrowUser; chat?: { id?: number; type?: string } } | undefined;
    if (my?.from && unameMatch(my.from, h) && typeof my.from.id === 'number') {
      return my.from.id;
    }

    const pa = u.poll_answer as { user?: NarrowUser } | undefined;
    if (pa?.user && unameMatch(pa.user, h) && typeof pa.user.id === 'number') {
      return pa.user.id;
    }
  }
  return null;
}


async function getUpdatesManyPages(botToken: string, maxPages: number): Promise<unknown[]> {
  const all: unknown[] = [];
  let offset = 0;

  for (let p = 0; p < maxPages; p++) {
    const q = offset > 0 ? `limit=100&offset=${offset}` : 'limit=100';
    const r = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?${q}`);
    const j = (await r.json()) as {
      ok?: boolean;
      result?: Array<{ update_id: number }>;
    };
    if (!j.ok || !Array.isArray(j.result) || j.result.length === 0) break;
    all.push(...j.result);
    const last = j.result[j.result.length - 1]?.update_id;
    if (typeof last !== 'number') break;
    offset = last + 1;
    if (j.result.length < 100) break;
  }
  return all;
}

const ERR_WEBHOOK_UZ =
  'Botda webhook yoqilgan — username orqali qidirish ishlamaydi. Sozlamalarda webhookni ochirib qayta urining yoki oquchining raqamli Telegram ID sini kiriting.';

const ERR_USER_NOT_RESOLVED = (handle: string) =>
  `"@${handle}" uchun chat topilmadi. Oquvchi sizning botingizga Telegramda /start yuborgan bolsin (yoki boshqa harakat: tugma, sorov). Username notogri yozilgan bolishi mumkin. Eng ishonchli yol: Telegram → Sozlamalar → raqamli ID ni nusxalab, oquchi kartasiga "Telegram ID" qatoriga qoying.`;

const ERR_CHAT_NOT_FOUND_NUM =
  'Bu raqamli ID bilan chat topilmadi. ID notogri yoki foydalanuvchi bu bot bilan hech qachon yozishmagan bolishi mumkin.';

function mapTelegramSendError(description: string, hadUsername: boolean): string {
  const d = description.toLowerCase();
  if (d.includes('chat not found')) {
    return hadUsername
      ? 'Chat topilmadi. Username yoki ID ni tekshiring; oquvchi botga /start yuborgan bolsin yoki raqamli ID kiriting.'
      : ERR_CHAT_NOT_FOUND_NUM;
  }
  if (d.includes('bot was blocked')) {
    return 'Foydalanuvchi botni bloklagan.';
  }
  if (d.includes('forbidden')) {
    return 'Yuborish rad etildi (foydalanuvchi botni yopgan yoki cheklov).';
  }
  return description;
}

/**
 * Faqat yuborish uchun raqamli chat_id qaytaradi.
 * Username: getChat → getUpdates (bir necha sahifa). @username bilan sendMessage qilmaymiz.
 */
export async function resolveTelegramChatId(
  botToken: string,
  chatId: string | number
): Promise<number> {
  if (typeof chatId === 'number' && Number.isFinite(chatId)) {
    return chatId;
  }
  const s = String(chatId).trim();
  if (/^\d+$/.test(s)) {
    return Number(s);
  }

  const handle = s.replace(/^@/, '').toLowerCase();
  if (!handle) {
    throw new Error('Telegram chat_id notogri.');
  }
  const param = `@${handle}`;

  const tryGetChat = await fetch(
    `https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(param)}`
  );
  const getChatJson = (await tryGetChat.json()) as { ok?: boolean; result?: { id?: number } };
  if (getChatJson.ok && typeof getChatJson.result?.id === 'number') {
    return getChatJson.result.id;
  }

  const hookR = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
  const hookJ = (await hookR.json()) as { result?: { url?: string } };
  if (hookJ.result?.url) {
    throw new Error(ERR_WEBHOOK_UZ);
  }

  const batches = await getUpdatesManyPages(botToken, 8);
  const fromUpdates = scanUpdatesForUsername(batches, handle);
  if (fromUpdates != null) {
    return fromUpdates;
  }

  throw new Error(ERR_USER_NOT_RESOLVED(handle));
}

export async function telegramSendMessageJson(
  botToken: string,
  chatId: string | number,
  text: string
): Promise<TelegramResponse> {
  const hadUsername = typeof chatId === 'string' && !/^\d+$/.test(String(chatId).trim());
  const resolved = await resolveTelegramChatId(botToken, chatId);
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: resolved,
      text,
      parse_mode: 'HTML',
    }),
  });
  const data = await parseTelegramResponse(response);
  if (!data.ok) {
    throw new Error(mapTelegramSendError(data.description || '', hadUsername));
  }
  return data;
}

function buildTelegramFileFormData(
  resolvedChatId: number,
  file: File,
  field: string,
  caption?: string
): FormData {
  const fd = new FormData();
  fd.append('chat_id', String(resolvedChatId));
  fd.append(field, file, file.name || 'file');
  const cap = caption?.trim();
  if (cap) {
    const short = cap.length > 1020 ? `${cap.slice(0, 1017)}…` : cap;
    fd.append('caption', escapeHtml(short));
    fd.append('parse_mode', 'HTML');
  }
  return fd;
}

async function postTelegramMultipart(
  botToken: string,
  method: string,
  formData: FormData
): Promise<TelegramResponse> {
  const url = `https://api.telegram.org/bot${botToken}/${method}`;
  const response = await fetch(url, { method: 'POST', body: formData });
  return parseTelegramResponse(response);
}

/** Telegram fayl nomida kengaytma bolmasa, MIME dan qoshiladi. */
function ensureUploadFilename(name: string, mime: string): string {
  const base = (name || '').trim() || 'upload';
  if (/\.[a-z0-9]{2,8}$/i.test(base)) return base;
  const m = mime.toLowerCase();
  if (m.includes('png')) return `${base}.png`;
  if (m.includes('jpeg') || m === 'image/jpg') return `${base}.jpg`;
  if (m.includes('gif')) return `${base}.gif`;
  if (m.includes('webp')) return `${base}.webp`;
  if (m.includes('bmp')) return `${base}.bmp`;
  if (m.includes('heic') || m.includes('heif')) return `${base}.heic`;
  if (m.includes('mp4')) return `${base}.mp4`;
  if (m.includes('quicktime') || m.includes('mov')) return `${base}.mov`;
  return `${base}.dat`;
}

/**
 * Server tomonda — rasm/video/hujjatni multipart bilan Telegramga yuboradi.
 * sendPhoto yoki sendVideo xato bersa, sendDocument bilan qayta uriniladi.
 */
export async function sendTelegramBlobFromServer(
  botToken: string,
  chatId: string | number,
  blob: Blob,
  fileName: string,
  caption?: string
): Promise<TelegramResponse> {
  const hadUsername = typeof chatId === 'string' && !/^\d+$/.test(String(chatId).trim());
  const resolved = await resolveTelegramChatId(botToken, chatId);
  const mime = blob.type || 'application/octet-stream';
  const safeName = ensureUploadFilename(fileName, mime);
  const file = new File([blob], safeName, { type: mime });
  let { method, field } = pickTelegramSendMethod(file);

  let fd = buildTelegramFileFormData(resolved, file, field, caption);
  let data = await postTelegramMultipart(botToken, method, fd);

  if (!data.ok && method === 'sendPhoto') {
    method = 'sendDocument';
    field = 'document';
    fd = buildTelegramFileFormData(resolved, file, field, caption);
    data = await postTelegramMultipart(botToken, method, fd);
  }

  if (!data.ok && method === 'sendVideo') {
    method = 'sendDocument';
    field = 'document';
    fd = buildTelegramFileFormData(resolved, file, field, caption);
    data = await postTelegramMultipart(botToken, method, fd);
  }

  if (!data.ok) {
    throw new Error(mapTelegramSendError(data.description || '', hadUsername));
  }
  return data;
}
