# Obje Görselleri

Bu klasörde oyundaki kalp, power-up ve boss saldırı görselleri bulunur.

## 📦 Gerekli Tüm Görseller

### ❤️ Normal Kalplar (8 adet)
- `cekirdek.webp` - ❤️ Kırmızı Kalp (10 puan)
- `saf_enerji.webp` - 💖 Parlak Kalp (25 puan)
- `kristal.webp` - 💎 Elmas (50 puan)
- `kirik_kalp.webp` - 💔 Kırık Kalp (-1 puan)
- `altin_oz.webp` - 🥇 Altın Kalp (100 puan)
- `bozulmus_parca.webp` - 🧊 Buz Kalp (15 puan)
- `enerji_kutlesi.webp` - 💗 Dev Kalp (20 puan)
- `can.webp` - 🏩 Can Kalbi (ekstra can)

### ⚡ Power-ups (10 adet)
- `kalkan.webp` - 🛡️ Kalkan (8 saniye koruma)
- `cekim.webp` - 🧲 Mıknatıs (8 saniye otomatik toplama)
- `zaman_durdurma.webp` - ⏳ Yavaşlatma (6 saniye)
- `duygu.webp` - 🌈 Aşk Patlaması (8 saniye)
- `enerji_darbe.webp` - ⚡ Şimşek (anlık temizleme)
- `senktron.webp` - 💫 Çift Puan (10 saniye)
- `hedef.webp` - 🎯 Otomatik Hedefleme (8 saniye)
- `stabilizor.webp` - 🔥 Kombo Koruyucu (12 saniye)
- `kalici_yasam.webp` - 💗 Maksimum Can (kalıcı)

### 👾 Boss Saldırı Kalpleri (6 adet)
- `karanlik_cekirdek.webp` - ⚫ Siyah Kalp
- `asiri_aydinlik_cekirdek.webp` - ⚪ Beyaz Kalp
- `bozulmus_cekirdek.webp` - 🖤 Siyah Kalp 2
- `parazit_blok.webp` - 🤍 Beyaz Kalp 2
- `bozulmus_isik_blok.webp` - ◼️ Siyah Kare
- `yok_edici_parca.webp` - ◻️ Beyaz Kare

### 🔥 Boss Özel Saldırılar (3 adet)
- `lav.webp` - 🔥 Lav Bombaları (Boss 2: Öfke Alevi)
- `zehir.webp` - 🐍 Zehir Bölgeleri (Boss 8: Dedikodu Yılanı)
- `glitch.webp` - 👾 Glitch Efekti (Boss 9: Teknoloji Canavarı)

## 📊 Toplam: 27 Görsel

## 📝 Görsel Özellikleri
- Format: WebP (optimize edilmiş)
- Boyut: 512x512px önerilir
- Arka plan: Şeffaf (transparent)
- Stil: Parlak, canlı renkler, hafif gölge
- Oyun için optimize: Küçük ekranlarda net görünmeli

## 🔄 Sistem Davranışı
- Eğer görsel yüklenemezse, otomatik olarak emoji fallback kullanılır
- Görseller sayfa yüklendiğinde preload edilir
- Console'da yükleme durumu görüntülenir
- Boss saldırı görselleri BossController tarafından yönetilir

## ✅ Entegrasyon Durumu
- ✅ Normal kalplar için görsel sistemi aktif
- ✅ Power-up'lar için görsel sistemi aktif
- ✅ Boss saldırı kalpleri için görsel sistemi aktif
- ✅ Lav bombaları için görsel sistemi aktif
- ✅ Zehir bölgeleri için görsel sistemi aktif
- ✅ Fallback mekanizması aktif (emoji yedekleme)
