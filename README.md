# 💕 Burak & Berna - Aşk Oyunu

Mobil-first, romantik bir kalp yakalama oyunu. 12 benzersiz boss ile duygusal bir yolculuk.

---

## 🎮 Oyun Hakkında

Burak ve Berna'nın aşk hikayesini yaşayın. Yukarıdan düşen kalpleri yakalayın, kırık kalplerden kaçının ve 12 farklı duygusal engeli (boss) yenin.

### Özellikler
- 🎯 12 benzersiz boss (her biri farklı mekanikle)
- 💖 5 can ile başlama
- 📱 Mobil-first tasarım
- 🎨 Dinamik atmosfer efektleri
- 🎵 Prosedürel müzik sistemi
- 🎮 Dokunmatik kontroller + haptic feedback
- 🌟 Power-up sistemi
- 🏆 Combo sistemi

---

## 🎯 Nasıl Oynanır

1. **Kontroller**: Parmağınızı/fareyi hareket ettirerek Burak'ı yönlendirin
2. **Hedef**: Kırmızı kalpleri (❤️) yakalayın, kırık kalpleri (💔) kaçının
3. **Boss Savaşları**: Her dalgada bir boss ile karşılaşın
4. **Özel Kalpler**: Boss savaşlarında Berna özel kalpler atar - bunları yakalayın!
5. **Kazanma**: 12 boss'u yenin ve oyunu bitirin

---

## 👾 Boss'lar

### Faz 1: Doğal Engeller
1. **☁️ Şüphe Bulutu** - Yağmur seni yavaşlatır
2. **🔥 Öfke Alevi** - Lav bombaları hareket alanını daraltır
3. **❄️ Soğuk Mesafe** - Donma yeteneği seni hareketsiz bırakır
4. **🌪️ Fırtınalı Gün** - Rüzgar fizik kurallarını değiştirir

### Faz 2: Psikolojik Engeller
5. **🪞 Kıskançlık Aynası** - Kontroller tersine döner
6. **🌫️ Unutkanlık Sisi** - Sis görüş alanını kısıtlar
7. **🧱 Ego Duvarı** - Duvar kalpleri engeller
8. **🐍 Dedikodu Yılanı** - Zehir sürekli hareket etmeyi zorlar

### Faz 3: Meta Engeller
9. **👾 Teknoloji Canavarı** - Input lag simülasyonu
10. **⏰ Zaman Hırsızı** - Zaman manipülasyonu
11. **🌑 Sıradanlık Devşiricisi** - Renkleri çalar
12. **💔 Kara Sevda** - Final boss (multi-phase)

---

## 📊 Oyun Dengesi

### Zorluk Progression
| Dalga | Boss | Hedef | Zorluk |
|-------|------|-------|--------|
| 1-3 | ☁️❄️🔥 | 400-900 | Kolay |
| 4-7 | 🌪️🪞🌫️🧱 | 1100-2000 | Orta |
| 8-12 | 🐍👾⏰🌑💔 | 2400-4000 | Zor |

### Başlangıç
- **Can**: 5 ❤️
- **Skor**: 0
- **Hız**: Normal

### İlerleme
- Her dalga daha hızlı ve zorlaşır
- Boss HP: 3-6 arası
- Maksimum hız: 1.8x
- Maksimum broken heart: %35

---

## 🛠️ Teknik Detaylar

### Dosya Yapısı
```
├── index.html          # Ana HTML
├── script.js           # Oyun mantığı (5000+ satır)
├── boss-mechanics.js   # Boss controller sistemi
├── style.css           # Stil dosyası
├── sw.js              # Service worker (PWA)
├── manifest.json      # PWA manifest
├── berna.gif          # Berna karakteri
├── burak.gif          # Burak karakteri
├── dilerimki.mp3      # Müzik
└── favicon.svg        # İkon
```

### Teknolojiler
- Vanilla JavaScript (ES6+)
- HTML5 Canvas
- Web Audio API (prosedürel müzik)
- Service Worker (offline support)
- Haptic Feedback API
- Touch Events API

### Boss Sistemi
- Modüler `BossController` class
- 12 benzersiz mekanik
- Özel kalp sistemi
- Atmosfer efektleri
- Faz bazlı zorluk

---

## 📱 Mobil Optimizasyonlar

### Performans
- Particle reduction (%50 daha az)
- Efficient canvas rendering
- GIF sprites (DOM-based)
- Optimized collision detection

### Kontroller
- Touch/swipe gestures
- Haptic feedback
- Fullscreen support
- Orientation handling

### Denge
- Mobil-friendly hasar oranları
- Daha geniş yakalama alanı
- Landscape mode desteği
- Responsive UI

---

## 🎯 Oyun Hedefleri

### Oyuncu Başarı Oranları (Tahmini)
- %80 → Dalga 4-5
- %50 → Dalga 7-8
- %30 → Dalga 10
- %10 → Final Boss
- %5 → Oyunu bitirir

### Oyun Süresi
- İlk 4 dalga: 5-8 dakika
- Dalga 5-8: 10-15 dakika
- Dalga 9-12: 15-25 dakika
- **Toplam**: 20-30 dakika

---

## 🚀 Kurulum

### Lokal Çalıştırma
```bash
# Basit HTTP server
python -m http.server 8000
# veya
npx serve
```

Tarayıcıda `http://localhost:8000` adresini açın.

### PWA Olarak Yükleme
1. Mobil tarayıcıda oyunu açın
2. "Ana ekrana ekle" seçeneğini kullanın
3. Offline oynayabilirsiniz!

---

## 📝 Geliştirme Notları

### Son Güncellemeler
- ✅ 12 boss sistemi tamamlandı
- ✅ Oyun dengesi optimize edildi
- ✅ Mobil hasar mekanikleri ayarlandı
- ✅ Boss HP formülü güncellendi
- ✅ Can sistemi 5'e çıkarıldı
- ✅ Skor hedefleri %30 azaltıldı

### Bilinen Özellikler
- Boss'lar sadece özel mekaniklerle öldürülebilir
- Her boss'un benzersiz atmosferi var
- Berna boss savaşlarında görünür kalır
- Special heart'lar çok nadir düşer

---

## 🎨 Tasarım Felsefesi

### Tema
Romantik ilişkilerdeki duygusal engelleri temsil eden boss'lar:
- Şüphe, öfke, soğukluk (doğal duygular)
- Kıskançlık, unutkanlık, ego (psikolojik)
- Teknoloji, zaman, sıradanlık (modern)

### Görsel
- Minimalist tasarım
- Emoji-based karakterler
- Dinamik renk geçişleri
- Atmosferik efektler

### Ses
- Prosedürel müzik (Web Audio API)
- Kalp atışı ritmi
- Romantik akorlar
- Boss'a özel temalar

---

## 📄 Lisans

Bu proje eğitim ve eğlence amaçlıdır.

---

## 🙏 Teşekkürler

Burak & Berna'nın aşk hikayesini oynadığınız için teşekkürler! ❤️

---

**Versiyon**: 2.0  
**Son Güncelleme**: 2024  
**Platform**: Web (PWA)  
**Dil**: Türkçe
