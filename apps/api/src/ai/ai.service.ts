import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';

export interface PlantIdentificationResult {
  name: string;
  species: string;
  description: string;
  careTips: string;
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-5';

const IDENTIFY_PROMPT = `Bu fotoğraftaki bitkiyi tanımla. Peyzaj/iç mekan bitki bakım firması için çalışıyorsun, bu yüzden yaygın iç/dış mekan süs bitkilerini (ör. Ficus, Sanseviera, Monstera, Areca palmiye, Zamioculcas, Pothos, Yucca vb.) baz al.

SADECE aşağıdaki alanları içeren geçerli bir JSON nesnesi döndür, başka hiçbir metin ekleme:
{
  "name": "Bitkinin yaygın Türkçe adı (kısa)",
  "species": "Tür / bilimsel veya yaygın tür adı",
  "description": "Bitki hakkında 1-2 cümlelik kısa açıklama",
  "careTips": "Kısa bir bakım önerisi (sulama, ışık vb.), tek cümle"
}

Emin olamadığın durumlarda en olası tahmini ver ve description alanında bunu belirt. Yanıtın markdown kod bloğu (\`\`\`) içermesin, sadece ham JSON olsun.`;

@Injectable()
export class AiService {
  async identifyPlant(file: Express.Multer.File): Promise<PlantIdentificationResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'ANTHROPIC_API_KEY tanımlı değil. Sunucu .env dosyasına eklenmeli.',
      );
    }

    const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
    const base64 = file.buffer.toString('base64');

    let response: Response;
    try {
      response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: 512,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: file.mimetype, data: base64 },
                },
                { type: 'text', text: IDENTIFY_PROMPT },
              ],
            },
          ],
        }),
      });
    } catch {
      throw new InternalServerErrorException('AI servisine ulaşılamadı. İnternet bağlantısını kontrol et.');
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new InternalServerErrorException(
        `AI servisi hata döndürdü (${response.status}). ${errorBody.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = payload.content?.find((block) => block.type === 'text')?.text ?? '';
    const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

    let parsed: Partial<PlantIdentificationResult>;
    try {
      parsed = JSON.parse(cleaned) as Partial<PlantIdentificationResult>;
    } catch {
      throw new BadRequestException('AI yanıtı işlenemedi. Lütfen tekrar dene.');
    }

    return {
      name: parsed.name?.trim() || 'Bilinmeyen bitki',
      species: parsed.species?.trim() || '',
      description: parsed.description?.trim() || '',
      careTips: parsed.careTips?.trim() || '',
    };
  }
}
