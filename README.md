# Mangal Hesabı Söndürücü

Mangal başındaki **“Kim ne kadar ödedi?”**, **“Kimin kime borcu var?”** kaosunu bitirmek için geliştirilmiş akıllı bir hesap yönetim uygulamasıdır.

## 🚀 Özellikler

- **Akıllı borç paylaşımı:** “Greedy” algoritması ile minimum sayıda para transferiyle borçları hesaplar.
- **WhatsApp sohbet analizi:** WhatsApp’tan dışa aktarılan `.txt` sohbet geçmişini yükleyin; harcamaları, isimleri ve tutarları otomatik ayıklasın.
- **Çoklu ödeme desteği:** Bir harcamayı birden fazla kişi arasında bölebilme.
- **Hızlı özet:** “WhatsApp’ta Paylaş” butonu ile sonuçları tek tıkla gruba metin olarak gönderebilme.
- **LocalStorage entegrasyonu:** Veriler tarayıcıda saklanır; sayfa yenilense de kaybolmaz.

## 🛠️ Teknolojiler

- React + Vite
- Tailwind CSS
- Claude Code (Agent Teams)

## 📦 Kurulum

1. Repoyu klonlayın:
   ```bash
   git clone <repo-url>
   ```
2. Klasöre girin:
   ```bash
   cd mangal-app
   ```
3. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
4. Projeyi başlatın:
   ```bash
   npm run dev
   ```

## 💡 Nasıl Kullanılır?

1. **Katılımcıları ekle:** Mangala katılan herkesin adını yaz.
2. **Harcamaları gir:** İstersen manuel gir, istersen WhatsApp sohbetini `.txt` olarak yükle.
3. **Sonucu al:** “Sonuç” sekmesine git, kimin kime ne kadar atacağını gör.
4. **Paylaş:** Listeyi kopyala ve WhatsApp grubuna yapıştır.
