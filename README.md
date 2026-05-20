# Unsolved

## Proje Adı

**Unsolved - Problem Discovery Radar**

## Proje Tanımı

Unsolved, SaaS ve dijital ürün fikirleri geliştirmek isteyen ekipler için gerçek kullanıcı problemlerini kamusal kaynaklardan toplayan bir problem keşif platformudur. Uygulama Reddit, Hacker News ve App Store yorumları gibi kaynaklardan sinyal toplar; bu sinyalleri problem kartlarına dönüştürür, skorlar, filtreler ve kurucuların doğrulama sürecinde kullanabileceği panolar halinde sunar.

Projede ayrıca Türkçe/İngilizce dil desteği, koyu/açık tema, Supabase tabanlı kullanıcı hesabı, problem analizi, hesap yönetimi ve Brevo ile haftalık problem özeti maili gönderimi bulunmaktadır.

## Test Sitesi

Projenin test yayınına aşağıdaki adresten erişilebilir:

https://unsolved-ai.vercel.app/

## Özellikler

- Canlı problem keşif panosu: Reddit, Hacker News ve App Store sinyallerini listeler.
- Kaynak filtresi: Sadece Reddit, sadece HackerNews veya App Store gibi kaynak bazlı filtreleme yapılabilir.
- Skor filtresi: Kullanıcı minimum problem skorunu kaydırmalı bar ile belirleyebilir.
- Problem detay sayfası: Kaynak kanıtları, skor kırılımı, trend grafikleri ve pazar açıkları gösterilir.
- Türkçe problem analizi: BytePlus Ark ile isteğe bağlı Türkçe özet, çözüm fikirleri, MVP adımları ve riskler üretilir.
- Kurucu paneli: Kaydedilen problemler, doğrulama havuzu, hesap profili, şifre değiştirme ve hesap silme alanları bulunur.
- Haftalık e-posta özeti: En yüksek skorlu 5 problem, Türkçe analiz ve çözüm önerileriyle Brevo üzerinden gönderilir.
- Admin görünümü: Pipeline sağlığı, servis durumları ve skor ağırlıkları izlenebilir.
- Çoklu dil desteği: Navbar üzerinden TR / EN seçimi yapılabilir.
- Tema desteği: Varsayılan koyu tema ve pastel açık tema arasında geçiş yapılabilir.
- Supabase Auth desteği: Kullanıcı oturumu, profil ve hesap yönetimi için kullanılır.

## Kullanılan Teknolojiler

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui ve Radix primitives
- lucide-react ikonları
- motion animasyonları
- Recharts grafik bileşenleri

### Backend

- Next.js Route Handlers
- Supabase Auth
- Prisma ORM
- BytePlus Ark Chat Completions API
- Brevo Transactional Email API

### Veritabanı

- Supabase PostgreSQL
- Prisma Client
- Problem, kaynak, analiz, kullanıcı ve doğrulama kayıtları

### Harici Veri Kaynakları

- Reddit public JSON endpoints
- Hacker News Firebase API
- Apple App Store RSS yorumları

## Kurulum Adımları

1. Repoyu klonlayın:

```bash
git clone https://github.com/eminbalmuk/Unsolved-AI.git
cd Unsolved-AI
```

2. Bağımlılıkları kurun:

```bash
npm install
```

3. `.env` dosyasını oluşturun veya mevcut dosyayı doldurun:

```env
DATABASE_URL="postgresql://..."

SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="..."

BYTEPLUS_ARK_API_KEY="..."
BYTEPLUS_ARK_API_URL="https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions"
BYTEPLUS_ARK_MODEL="deepseek-v3-2-251201"

BREVO_API_KEY="..."
REPORTS_FROM_EMAIL="Unsolved AI <abfb39001@smtp-brevo.com>"
CRON_SECRET="generate-a-long-random-secret"

REDDIT_USER_AGENT="UnsolvedMVP/0.1 by local-dev"
APPLE_RSS_COUNTRY="us"
```

Not: Brevo free tier ile haftalık özet maili test edilebilir. Manuel gönderim giriş yapmış ve e-posta hizmeti açık olan kullanıcının kendi adresine yapılır; otomatik haftalık cron gönderimi de veritabanında `emailService = ENABLED` olan kullanıcıların e-posta adreslerine gider. Vercel Cron, `vercel.json` üzerinden pazartesi 06:00 UTC'de çalışacak şekilde ayarlanmıştır.

4. Prisma Client üretin:

```bash
npm run db:generate
```

5. Supabase şemasını hazırlayın:

```bash
npm run db:setup:supabase
```

6. İsteğe bağlı başlangıç problem verilerini ekleyin:

```bash
npm run db:seed:problems
```

7. Geliştirme sunucusunu başlatın:

```bash
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışır.

## Kullanım

- `/` ana sayfası ürünün genel keşif deneyimini gösterir.
- `/explora` canlı problem keşif panosudur.
- `/explore` aynı keşif panosuna alternatif route olarak çalışır.
- `/problems/[slug]` seçilen problemin detay, analiz ve kaynak kanıt sayfasıdır.
- `/dashboard` kurucu çalışma alanı ve hesap ayarlarını içerir.
- `/reports` haftalık problem özeti ve e-posta gönderim alanıdır.
- `/login` kullanıcı girişi sayfasıdır.
- `/register` hesap oluşturma sayfasıdır.
- `/admin` pipeline ve skor kontrol ekranıdır.

Sistem varsayılan olarak koyu tema ile açılır. Navbar üzerinden tema ve dil değiştirilebilir.

## Ekip Üyeleri ve Katkı Alanları

Projede görev dağılımı aşağıdaki şekilde planlanmıştır:

1. **Muhammet Emin Balmuk**  
   Ana mimari, problem keşif mantığı, Supabase entegrasyonu, canlı veri akışı, skorlama sistemi.

2. **Ertuğrul Selim Öztürk**  
   Frontend deneyimi, Explora dashboard düzeni, filtreleme arayüzleri, tema/dil geçişleri ve kullanıcı deneyimi iyileştirmeleri.

3. **Arif Küçükeşmekaya**  
   Backend API route yapısı, problem analiz endpointleri, BytePlus Ark entegrasyonu, veri doğrulama ve hata yönetimi.

4. **Furkan Köksalan**  
   Haftalık raporlama modülü, Brevo e-posta akışı, problem özeti ekranı ve rapor içeriklerinin düzenlenmesi.

5. **Yusuf Üveyik**  
   Test, dokümantasyon, README düzeni, kurulum yönergeleri, son kullanıcı kontrolleri ve görsel kalite incelemeleri.

## Lisans

Bu proje **GNU Affero General Public License v3.0 (AGPLv3)** lisansı ile lisanslanmıştır.

AGPLv3 kapsamında kaynak kodu kullanabilir, inceleyebilir, değiştirebilir ve dağıtabilirsiniz. Ancak bu yazılımı ağ üzerinden kullanıcıların erişimine açan türev çalışmaların da ilgili kaynak kodunu aynı lisans koşullarıyla paylaşması gerekir.

Detaylı lisans metni için `LICENSE` dosyasına bakınız.
