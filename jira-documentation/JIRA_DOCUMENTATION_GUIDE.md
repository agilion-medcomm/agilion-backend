# JIRA DOKÜMANTASYON KULLANIM KILAVUZU

**Oluşturulma Tarihi:** 15 Aralık 2025  
**Repository:** agilion-backend  
**Toplam Commit Analizi:** 92 commit  
**Kapsam:** Ekim 2025 - Aralık 2025

---

## 📁 DOSYA YAPISI

Bu dokümantasyon paketi 5 ana dosyadan oluşmaktadır:

### 1. JIRA_TASKS.md
**Amaç:** Genel bakış ve master task listesi  
**İçerik:**
- 138+ task detaylı açıklama
- Tüm commitler kronolojik sırayla
- Her task için Acceptance Criteria
- Epic'ler ve öncelik sıralaması
- Genel istatistikler

**Ne Zaman Kullanılır:**
- Projeye genel bakış için
- Tüm taskleri bir arada görmek için
- Sprint planlaması için
- Eksik işleri belirlemek için

---

### 2. JIRA_PIKSEEL_TASKS.md
**Amaç:** Mehmet Akif Çavuş (Pikseel) katkıları  
**İçerik:**
- 70 detaylı task
- 248 story point
- Security, Testing, Architecture uzmanlığı
- Her task için commit hash'leri
- Dosya değişiklikleri

**Öne Çıkan Katkılar:**
- Email verification system
- Password reset flow
- Laborant & Medical files (complete module)
- Leave request system
- 10+ utility module
- Security enhancements (Helmet, rate limiting)
- Test suite (82 tests, 100% pass)
- Constants standardization (zero hardcoded values)

**Jira'ya Nasıl Eklensin:**
- Epic: Security & Architecture
- Assignee: Mehmet Akif Çavuş
- Component: Security, Testing, Utilities
- Priority: High (security tasks)

---

### 3. JIRA_GRIFFINXD_TASKS.md
**Amaç:** Yunus Emre Manav (Griffinxd) katkıları  
**İçerik:**
- 32 detaylı task
- 136 story point
- Core features, Database design
- Project foundation
- Email notification system

**Öne Çıkan Katkılar:**
- Project infrastructure setup
- Layered architecture
- Prisma ORM configuration
- Authentication system (patient/personnel)
- Appointment system
- Contact form module
- Cashier functionality
- Email templates

**Jira'ya Nasıl Eklensin:**
- Epic: Core Features & Database
- Assignee: Yunus Emre Manav
- Component: Database, Core API, Email
- Priority: Critical (foundation tasks)

---

### 4. JIRA_LINARUU_TASKS.md
**Amaç:** Uğur Anıl Güney (Linaruu) katkıları  
**İçerik:**
- 26 detaylı task
- 108 story point
- Module development
- Profile management
- Cleaner system (complete ownership)

**Öne Çıkan Katkılar:**
- Personnel login endpoint
- Authorization middleware
- Patient profile management
- Cleaner module (100% - 10 tasks)
- Photo upload system
- Profile photo functionality
- Validation enhancements

**Jira'ya Nasıl Eklensin:**
- Epic: Modules & Profile Management
- Assignee: Uğur Anıl Güney
- Component: Cleaning, Profiles, Authorization
- Priority: High (module tasks)

---

### 5. JIRA_TASKS_BY_CATEGORY.md
**Amaç:** Epic/Feature bazlı organizasyon  
**İçerik:**
- 15 Epic
- 131+ task epic bazlı gruplandırılmış
- User stories
- Epic hierarchy
- Sprint breakdown önerileri

**Epic'ler:**
1. Authentication & Authorization (71 pts)
2. User Management (38 pts)
3. Appointment System (61 pts)
4. Medical Files & Laborant (41 pts)
5. Cleaning Module (39 pts)
6. Doctor & Cashier (17 pts)
7. Contact Form (17 pts)
8. Utilities & Helpers (34 pts)
9. Security Enhancements (25 pts)
10. Testing & Quality (26 pts)
11. Documentation (13 pts)
12. Refactoring (13 pts)
13. Constants & Enum (29 pts)
14. Database Migrations (17 migrations)
15. Project Infrastructure (31 pts)

**Jira'ya Nasıl Eklensin:**
- Epic'leri önce oluştur
- Her epic altına user stories ekle
- Task'ları epic'lere bağla
- Sprint'lere göre organize et

---

## 🎯 JIRA'YA AKTARMA STRATEJİSİ

### Adım 1: Epic'leri Oluştur
JIRA_TASKS_BY_CATEGORY.md dosyasından 15 epic'i kopyala:

```
Epic Name: Authentication & Authorization
Description: Complete authentication system with patient/personnel login, password reset, email verification
Story Points: 71
Priority: Critical
Component: Authentication, Security
```

### Adım 2: User Stories Ekle
Her epic altına user stories ekle (JIRA_TASKS_BY_CATEGORY.md'de hazır):

```
User Story: As a patient, I want to register with my TCKN, so that I can access the system
Acceptance Criteria:
- TCKN validation (11 digits)
- Email validation
- Password hashing with bcrypt
- JWT token generation
```

### Adım 3: Task'ları Ekle
Her developer dosyasından task'ları kopyala:

**Örnek Task:**
```
Task ID: AUTH-001
Title: Patient registration with TCKN
Type: Feature
Priority: Critical
Story Points: 8
Assignee: Yunus Emre Manav
Epic: Authentication & Authorization
Component: Authentication

Description:
Implement patient signup with TCKN validation and JWT token generation.

Acceptance Criteria:
- POST /api/v1/auth/register endpoint
- TCKN validation (11 digits)
- Email validation
- Password validation (min 8 characters)
- Bcrypt password hashing
- Auto-generate patientId (6 digits)
- Create User + Patient in transaction
- Return JWT token
- Email verification trigger

Technical Details:
- auth.service.js: registerPatient
- user.repository.js: createPatient
- JWT payload: { id, role, patientId }
- Token expiry: 7 days

Files Modified:
- src/services/auth.service.js
- src/repositories/user.repository.js
- src/api/controllers/auth.controller.js
- src/api/routes/auth.routes.js
- src/api/validations/auth.validation.js

Commit: f6g7h8i - Add patient registration endpoint
```

### Adım 4: İlişkilendirmeleri Yap
- Task'ları epic'lere bağla
- User story'lere bağla
- Related issues linkle (örn: AUTH-001 blocks AUTH-002)
- Sprint'lere ata

### Adım 5: Labels ve Components Ekle
```
Labels:
- backend
- api
- database
- security
- testing
- documentation
- patient-facing
- admin-only
- public-endpoint
- high-priority
- bug-fix
- enhancement
- refactor

Components:
- Authentication
- User Management
- Appointments
- Medical Files
- Cleaning
- Email Service
- Security
- Testing
- Database
```

---

## 📊 JIRA BULK IMPORT İÇİN CSV FORMAT

### Örnek CSV Yapısı:
```csv
Issue Type,Summary,Description,Priority,Story Points,Assignee,Epic Link,Component,Labels
Epic,Authentication & Authorization,Complete auth system,Critical,71,,,"Authentication,Security","backend,security"
Story,Patient registration,As a patient I want to register,High,8,Yunus Emre Manav,AUTH,Authentication,"backend,patient-facing"
Task,Implement TCKN validation,Validate TCKN format,High,2,Yunus Emre Manav,AUTH,Authentication,"backend,validation"
```

### CSV Oluşturma için Python Script:
```python
import csv
import re

# Her markdown dosyasını parse et
# Task'ları CSV formatına dönüştür
# JIRA bulk import için hazırla
```

---

## 🔍 TASK ARAMA REHBERİ

### Developer'a Göre Arama:
- **Pikseel tasklarını bul:** `JIRA_PIKSEEL_TASKS.md` dosyasını aç
- **Griffinxd tasklarını bul:** `JIRA_GRIFFINXD_TASKS.md` dosyasını aç
- **Linaruu tasklarını bul:** `JIRA_LINARUU_TASKS.md` dosyasını aç

### Feature'a Göre Arama:
- **Authentication tasklarını bul:** `JIRA_TASKS_BY_CATEGORY.md` → EPIC 1
- **Medical files tasklarını bul:** `JIRA_TASKS_BY_CATEGORY.md` → EPIC 4
- **Security tasklarını bul:** `JIRA_TASKS_BY_CATEGORY.md` → EPIC 9

### Task ID'ye Göre Arama:
Ctrl+F veya Cmd+F ile şunları ara:
- `AUTH-001` → Authentication task 1
- `USER-005` → User management task 5
- `LAB-003` → Laborant/Medical files task 3

### Commit Hash'e Göre Arama:
`JIRA_TASKS.md` dosyasında commit hash'i ara:
- `f8fa088` → Constants centralization commit

---

## 💡 KULLANIM ÖRNEKLERİ

### Örnek 1: Sprint Planning
**Senaryo:** Sprint 5 için task seçimi

1. `JIRA_TASKS_BY_CATEGORY.md` aç
2. Epic story point'lere bak
3. Yüksek öncelikli eksik task'ları seç:
   - API_ISSUES.md'deki eksik 3 feature
   - Notification system (TASK-136)
   - Lab test results (TASK-137)
   - Appointment reviews (TASK-138)

### Örnek 2: Developer Onboarding
**Senaryo:** Yeni developer Pikseel'in katkılarını öğrenmek istiyor

1. `JIRA_PIKSEEL_TASKS.md` aç
2. Summary bölümünü oku (en altta)
3. Key Contributions listesini incele
4. İlgili epic'lerdeki task'ları oku

### Örnek 3: Bug Fix Tracking
**Senaryo:** Medical file upload bug'ı nerede fix edildi?

1. `JIRA_PIKSEEL_TASKS.md` aç
2. Ctrl+F ile "medical file path" ara
3. TASK-PK024'ü bul
4. Commit hash: `x901yz0`
5. `git show x901yz0` ile diff'i incele

### Örnek 4: Feature Documentation
**Senaryo:** Cleaner module dokümantasyonu

1. `JIRA_LINARUU_TASKS.md` aç (Linaruu owner)
2. Cleaner Module (TASK-LN012 to LN021) bölümünü oku
3. Tüm endpoint'leri ve acceptance criteria'ları gör
4. `JIRA_TASKS_BY_CATEGORY.md` → EPIC 5 ile cross-check

### Örnek 5: Code Review Preparation
**Senaryo:** Security review hazırlığı

1. `JIRA_TASKS.md` → Section 11 (Security Enhancements)
2. Tüm security task'larını listele
3. Her task için code diff'leri kontrol et:
   - Helmet integration
   - Rate limiting
   - Magic number validation
   - Secure filename generation

---

## 📈 JIRA DASHBOARD ÖNERİLERİ

### Widget 1: Epic Progress
```
Epic Burndown Chart
- X-axis: Epic'ler
- Y-axis: Story Points
- Completed vs Remaining
```

### Widget 2: Developer Contribution
```
Pie Chart
- Pikseel: 36%
- Griffinxd: 35%
- Linaruu: 27%
- ekaan8: 2%
```

### Widget 3: Sprint Velocity
```
Sprint 1: 30 pts
Sprint 2: 120 pts
Sprint 3: 150 pts
Sprint 4: 155 pts
Average: 113 pts/sprint
```

### Widget 4: Priority Distribution
```
Critical: 15 tasks
High: 45 tasks
Medium: 50 tasks
Low: 21 tasks
```

### Widget 5: Component Breakdown
```
Authentication: 23 tasks
Appointments: 13 tasks
Medical Files: 12 tasks
Cleaning: 10 tasks
Security: 11 tasks
Testing: 7 tasks
```

---

## 🚀 HIZLI BAŞLANGIÇ

### 5 Dakikada Jira'ya Aktar:
1. Jira'da 15 epic oluştur (JIRA_TASKS_BY_CATEGORY.md'den kopyala)
2. Her developer için bir Sprint oluştur
3. Task'ları toplu import et (CSV kullan)
4. Epic-Task bağlantılarını kur
5. Dashboard'u kur

### İlk Epic'i Oluştur:
```
1. Jira'da "Create Epic" tıkla
2. Name: "Authentication & Authorization"
3. Description: JIRA_TASKS_BY_CATEGORY.md → EPIC 1'den kopyala
4. Story Points: 71
5. Components: Authentication, Security
6. Save

Sonra bu epic altına task'ları ekle:
- JIRA_GRIFFINXD_TASKS.md → AUTH-001 to AUTH-003
- JIRA_PIKSEEL_TASKS.md → AUTH-004 to AUTH-013
- JIRA_LINARUU_TASKS.md → AUTH-001 to AUTH-002
```

---

## 🎓 EN İYİ PRATİKLER

### ✅ DO:
- Her task için Acceptance Criteria ekle
- Commit hash'leri link'le
- Developer'ları doğru assign et
- Epic'lere task'ları bağla
- Story point'leri koru
- Technical Details'i Description'a ekle
- Related issues linkle

### ❌ DON'T:
- Task'ları epic'siz bırakma
- Story point'leri değiştirme (geçmiş veri)
- Developer assignment'ları değiştirme
- Commit hash'lerini silme
- Acceptance criteria'ları atla

---

## 📞 DESTEK

### Sorular:
- **Task'ı bulamıyorum:** Ctrl+F ile ara veya JIRA_TASKS.md → Index kullan
- **Epic dağılımı karışık:** JIRA_TASKS_BY_CATEGORY.md'yi kullan
- **Developer katkısı belirsiz:** Developer-specific dosyaları kullan
- **CSV import hatası:** Format örneğini kontrol et

### Ek Bilgi:
- Bu dokümantasyon 92 commit'in detaylı analizidir
- Tüm task'lar tamamlanmıştır (✅)
- Story point'ler geçmiş effort'ı yansıtır
- Yeni task'lar için API_ISSUES.md'deki 3 feature'ı ekle

---

## 📝 DEĞİŞİKLİK KAYITLARI

### Versiyon 1.0 (15 Aralık 2025)
- İlk release
- 92 commit analizi
- 138+ task dokümante edildi
- 5 markdown dosyası oluşturuldu
- Developer bazlı breakdown
- Epic bazlı organizasyon

### Gelecek Versiyonlar:
- CSV export script eklenecek
- Jira JSON format eklenecek
- Commit graph görselleştirmeleri eklenecek

---

**Hazırlayan:** GitHub Copilot  
**Repository:** agilion-backend  
**Analiz Dönemi:** 20 Ekim 2025 - 15 Aralık 2025  
**Toplam Commit:** 92  
**Toplam Task:** 138+  
**Toplam Story Point:** 455+
