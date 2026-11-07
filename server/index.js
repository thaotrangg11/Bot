import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use(express.static(path.join(root, 'public')));

const clean = (v, max = 1800) => String(v ?? '').trim().slice(0, max);
const tarotSystem = `Bạn là Luna, một tarot reader giàu kinh nghiệm, ấm áp, tinh tế và không phán xét. Bạn đọc Tarot theo hệ Rider–Waite–Smith. Hãy viết bằng tiếng Việt tự nhiên, mềm mại, giàu hình ảnh nhưng không mê tín cực đoan. Tarot là công cụ chiêm nghiệm/giải trí, không phải dự đoán chắc chắn hay thay thế tư vấn y tế, pháp lý, tài chính.

YÊU CẦU PHÂN TÍCH:
1) Mở đầu bằng một đoạn ngắn nắm bắt năng lượng chung của trải bài.
2) Với TỪNG lá: giải thích biểu tượng/hình ảnh đặc trưng trên lá; ý nghĩa cốt lõi; tác động của chính vị hay đảo ngược; ý nghĩa riêng theo vị trí trong trải bài; liên hệ trực tiếp với câu hỏi người xem. Không lặp lại một đoạn định nghĩa chung cho mọi lá.
3) Phân tích tương tác giữa các lá: điểm cộng hưởng, mâu thuẫn, trình tự/câu chuyện mà chúng tạo thành.
4) Trả lời trọng tâm câu hỏi, nêu xu hướng và điều kiện có thể làm thay đổi kết quả; tránh khẳng định tương lai tuyệt đối.
5) Đưa ra lời khuyên thực tế, cụ thể, có thể làm trong 7 ngày tới; kết thúc bằng một câu dịu dàng của Luna.

Giọng văn như một người chị dịu dàng đang ngồi cạnh người xem: có nhịp nghỉ tự nhiên, câu không quá dài, không dùng emoji dày đặc, không sáo rỗng. Không bịa chi tiết đời tư của người xem.`;

app.post('/api/reading', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'Chưa cấu hình OPENAI_API_KEY trong file .env.' });
    const question = clean(req.body?.question, 700);
    const topic = clean(req.body?.topic, 80) || 'Tổng quan';
    const spread = Array.isArray(req.body?.cards) ? req.body.cards.slice(0, 10) : [];
    if (!question || spread.length < 1) return res.status(400).json({ error: 'Vui lòng nhập câu hỏi và rút ít nhất một lá bài.' });
    const cardContext = spread.map((c, i) => `${i + 1}. Vị trí: ${clean(c.position, 100)} | Lá: ${clean(c.name, 100)} | Trạng thái: ${c.reversed ? 'Đảo ngược' : 'Chính vị'} | Từ khóa: ${clean((c.keywords || []).join(', '), 220)}`).join('\n');
    const userPrompt = `Chủ đề: ${topic}\nCâu hỏi: ${question}\n\nTrải bài:\n${cardContext}\n\nHãy luận giải sâu sắc, có cấu trúc tiêu đề rõ ràng. Phân tích hình tượng của từng lá dựa trên biểu tượng Rider–Waite–Smith truyền thống. Đừng chỉ liệt kê từ khóa.`;
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4.1-mini', temperature: 0.78, messages: [{ role: 'system', content: tarotSystem }, { role: 'user', content: userPrompt }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'AI chưa thể phân tích lúc này.' });
    res.json({ analysis: data.choices?.[0]?.message?.content || 'Luna chưa nhận được phần luận giải. Bạn thử lại nhé.' });
  } catch (e) { res.status(500).json({ error: 'Có lỗi khi kết nối AI: ' + e.message }); }
});

app.post('/api/voice', async (req, res) => {
  try {
    const text = clean(req.body?.text, 4200);
    if (!text) return res.status(400).json({ error: 'Không có nội dung để đọc.' });
    if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_VOICE_ID) {
      return res.status(503).json({ error: 'Chưa cấu hình ElevenLabs. Thêm ELEVENLABS_API_KEY và ELEVENLABS_VOICE_ID trong .env để dùng giọng Luna tự nhiên.' });
    }
    const voiceId = encodeURIComponent(process.env.ELEVENLABS_VOICE_ID);
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2', voice_settings: { stability: 0.38, similarity_boost: 0.78, style: 0.42, use_speaker_boost: true } })
    });
    if (!r.ok) {
      const msg = await r.text();
      return res.status(r.status).json({ error: `ElevenLabs: ${msg.slice(0, 500)}` });
    }
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    r.body.pipeTo(new WritableStream({ write(chunk) { res.write(Buffer.from(chunk)); }, close() { res.end(); }, abort() { res.end(); } }));
  } catch (e) { if (!res.headersSent) res.status(500).json({ error: 'Không tạo được giọng đọc: ' + e.message }); }
});

app.get('/api/status', (_req, res) => res.json({ ai: Boolean(process.env.OPENAI_API_KEY), voice: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) }));
app.get('*', (_req, res) => res.sendFile(path.join(root, 'public', 'index.html')));
const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Mystic Tarot AI đang chạy tại http://localhost:${port}`));
