const { PrismaClient, UserRole } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const { MEDICAL_SPECIALTIES, SPECIALTY_LABELS } = require('../src/config/constants');

// Scraped Data from https://zeytinburnutipmerkezi.com.tr/hekimlerimiz/
const doctorsData = [
    {
        "name": "Dr. Turgay Karamustafa",
        "title": "Mesul Müdür / ACİL",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/Turgay-karamustafa.png"
    },
    {
        "name": "Dr. Naci Onan",
        "title": "ACİL",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/Naci-Onan.png"
    },
    {
        "name": "Dr. Vagıf Ahmetoğlu",
        "title": "ACİL",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/vagif-ahmedoglu.png"
    },
    {
        "name": "Uzm. Dr. İbrahim Süve",
        "title": "İç Hastalıkları (Dahiliye)",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/Ibrahim-suve.png"
    },
    {
        "name": "Uzm. Dr. Vildan Gür",
        "title": "Deri ve Zührevi Hastalıklar (Dermatoloji)",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/Vildan-gur.png"
    },
    {
        "name": "Jin. Op. Dr. Şükran Tamtürk",
        "title": "Kadın Hastalıkları ve Doğum",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/Sukran-tamturk.png"
    },
    {
        "name": "Uzm. Dr. Tolga Aydemir",
        "title": "Göz Sağlığı ve Hastalıkları",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/tolga-aydemir.png"
    },
    {
        "name": "Op. Dr. İsmail Vurgun",
        "title": "Genel Cerrahi",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/ismail-vurgun.png"
    },
    {
        "name": "Dt. Elif Kuybet Çelik",
        "title": "Ağız ve Diş Sağlığı",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/Elif-kuybet-celik.png"
    },
    {
        "name": "Dt. Hüseyin İpektel",
        "title": "Ağız ve Diş Sağlığı",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/huseyin-ipektel.png"
    },
    {
        "name": "Dt. Çağdaş Aydın",
        "title": "Ağız ve Diş Sağlığı",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/cagdas-aydin.png"
    },
    {
        "name": "Dyt. Ayşe Reyhan Uzun",
        "title": "Beslenme ve Diyet",
        "imageUrl": "https://zeytinburnutipmerkezi.com.tr/wp-content/uploads/2024/10/ayse-reyhan-uzun.png"
    }
];

// Helper to clean strings for email generation
// Transliterate Turkish characters to English
function slugify(text) {
    const trMap = {
        'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O'
    };
    return text
        .split('')
        .map(char => trMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

/**
 * Maps the scraped title to a valid MEDICAL_SPECIALTY enum value
 * using the logic derived from SPECIALTY_LABELS where possible,
 * or direct mapping for the scraped variations.
 */
function getSpecialtyFromTitle(title) {
    const t = title.toLocaleLowerCase('tr-TR');

    // Map scraped titles to MEDICAL_SPECIALTIES key
    if (t.includes('acil')) return MEDICAL_SPECIALTIES.EMERGENCY;
    if (t.includes('dahiliye') || t.includes('iç hastalıklar')) return MEDICAL_SPECIALTIES.INTERNAL_MEDICINE;
    if (t.includes('dermatoloji') || t.includes('deri')) return MEDICAL_SPECIALTIES.DERMATOLOGY;
    if (t.includes('kadın') || t.includes('doğum')) return MEDICAL_SPECIALTIES.GYNECOLOGY_OBSTETRICS;
    if (t.includes('göz')) return MEDICAL_SPECIALTIES.EYE_HEALTH;
    if (t.includes('genel cerrahi')) return MEDICAL_SPECIALTIES.GENERAL_SURGERY;
    if (t.includes('ağız') || t.includes('diş')) return MEDICAL_SPECIALTIES.ORAL_AND_DENTAL;
    if (t.includes('beslenme') || t.includes('diyet')) return MEDICAL_SPECIALTIES.NUTRITION_DIET;

    // Fallback? or throw error?
    console.warn(`Warning: Could not map title "${title}" to a known specialty. Defaulting to INTERNAL_MEDICINE as fallback (unsafe).`);
    return MEDICAL_SPECIALTIES.INTERNAL_MEDICINE;
}

async function main() {
    console.log(`Start seeding ${doctorsData.length} doctors...`);

    // Default password for all doctors
    const hashedPassword = await bcrypt.hash('Test1234!', 10);

    for (let i = 0; i < doctorsData.length; i++) {
        const doc = doctorsData[i];

        // Parse name
        // Assuming format "Title FirstName LastName" or "Title FirstName LastName LastName"
        // We'll simplisticly split. The name field in DB is firstName, lastName.
        // The "name" from scrape includes titles like "Dr.", "Uzm. Dr." etc.
        // We should try to strip known titles to find the actual name parts.

        let cleanName = doc.name
            .replace('Uzm. Dr.', '')
            .replace('Jin. Op. Dr.', '')
            .replace('Op. Dr.', '')
            .replace('Dr.', '')
            .replace('Dt.', '')
            .replace('Dyt.', '')
            .trim();

        const nameParts = cleanName.split(' ');
        const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

        // Generate specific identifiers
        const emailSlug = slugify(firstName + lastName);
        const email = `${emailSlug}@zeytinburnutipmerkezi.com.tr`;

        // TCKN: 111111111XX (where XX is index + 10)
        const tckn = `888888888${80 + i}`;

        // Phone: 55500000XX (where XX is index + 10)
        const phoneNumber = `55500000${10 + i}`;

        // Determine correct specialty enum
        const specialtyEnum = getSpecialtyFromTitle(doc.title);
        // Get the pretty label for biography/display (optional, or just use doc.title)
        const specialtyLabel = SPECIALTY_LABELS[specialtyEnum] || doc.title;

        console.log(`Processing: ${doc.name} - TCKN: ${tckn} (${email}) - Specialty: ${specialtyEnum}`);

        try {
            // Check if user exists by email or TCKN
            let user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: email },
                        { tckn: tckn }
                    ]
                }
            });

            if (!user) {
                // Create User
                user = await prisma.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        firstName,
                        lastName,
                        tckn,
                        phoneNumber,
                        role: UserRole.DOCTOR,
                        profilePhoto: doc.imageUrl,
                        isEmailVerified: true
                    }
                });
                console.log(` - Created User: ${user.id}`);
            } else {
                // Update existing user photo
                user = await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        profilePhoto: doc.imageUrl,
                        firstName, // Update name in case it changed
                        lastName
                    }
                });
                console.log(` - Updated User: ${user.id}`);
            }

            // Check/Create Doctor profile
            const doctor = await prisma.doctor.findUnique({
                where: { userId: user.id }
            });

            if (!doctor) {
                await prisma.doctor.create({
                    data: {
                        userId: user.id,
                        specialization: specialtyEnum,
                        // Add some dummy bio text
                        biography: `${doc.name}, ${specialtyLabel} alanında uzman bir hekimdir.`,
                        workPrinciples: "Hasta odaklı yaklaşım.",
                        educationAndAchievements: "Alanında çeşitli ödüller."
                    }
                });
                console.log(` - Created Doctor Profile`);
            } else {
                await prisma.doctor.update({
                    where: { id: doctor.id },
                    data: {
                        specialization: specialtyEnum
                    }
                });
                console.log(` - Updated Doctor Profile`);
            }

        } catch (error) {
            console.error(`Error processing ${doc.name}:`, error);
        }
    }

    console.log('\n--- Seeding Completed Users ---');
    console.table(doctorsData.map((doc, i) => {
        // Re-calculate the deterministic fields for display
        let cleanName = doc.name
            .replace('Uzm. Dr.', '')
            .replace('Jin. Op. Dr.', '')
            .replace('Op. Dr.', '')
            .replace('Dr.', '')
            .replace('Dt.', '')
            .replace('Dyt.', '')
            .trim();

        const nameParts = cleanName.split(' ');
        const firstName = nameParts.slice(0, -1).join(' ') || nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        const emailSlug = slugify(firstName + lastName);
        const specialtyEnum = getSpecialtyFromTitle(doc.title);

        return {
            Name: doc.name,
            Specialty: specialtyEnum,
            TCKN: `888888888${80 + i}`,
            Email: `${emailSlug}@zeytinburnutipmerkezi.com.tr`,
            Password: 'Test1234!'
        };
    }));
    console.log('-------------------------------\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
