import { Router } from 'express';
import { db } from '../db'; // የ Drizzle DB connectionህ
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// ለቴስቲንግ የሚሆን ጊዜያዊ OTP ማከማቻ (In-Memory)
const otpStore: Record<string, string> = {};

// 1. OTP መላኪያ Endpoint
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'ስልክ ቁጥር ያስፈልጋል' });
    }

    // 6-digit OTP ኮድ ማፍለቅ (ለጊዜው 123456 ወይም Random)
    const generatedOtp = '123456'; // ለቴስቲንግ 123456 አድርገነዋል
    otpStore[phone] = generatedOtp;

    console.log(`📱 OTP ለ ${phone} የተላከው ኮድ፦ ${generatedOtp}`);

    return res.json({
      success: true,
      message: 'OTP በስኬት ተልኳል (ለቴስቲንግ ኮዱ 123456 ነው)',
    });
  } catch (error) {
    console.error('OTP Send Error:', error);
    return res.status(500).json({ success: false, message: 'የሰርቨር ስህተት ተከሰቷል' });
  }
});

// 2. OTP ማረጋገጫ እና User Registration/Login Endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, fullName } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'ስልክ ቁጥር እና OTP ያስፈልጋል' });
    }

    // OTP ትክክለኛ መሆኑን ማረጋገጥ
    if (otpStore[phone] !== otp) {
      return res.status(400).json({ success: false, message: 'የተሳሳተ OTP ኮድ ነው!' });
    }

    // OTP ከተረጋገጠ በኋላ ከ Store ማጽዳት
    delete otpStore[phone];

    // ተጠቃሚው በ Database ውስጥ መኖሩን ማረጋገጥ
    const existingUsers = await db.select().from(users).where(eq(users.phone, phone));
    let user = existingUsers[0];

    // አዲስ ተጠቃሚ ከሆነ መመዝገብ
    if (!user) {
      const newUser = await db
        .insert(users)
        .values({
          phone,
          fullName: fullName || 'ተጠቃሚ',
        })
        .returning();
      user = newUser[0];
    }

    return res.json({
      success: true,
      message: 'በስኬት ገብተዋል!',
      user,
    });
  } catch (error) {
    console.error('OTP Verify Error:', error);
    return res.status(500).json({ success: false, message: 'የሰርቨር ስህተት ተከሰቷል' });
  }
});

export default router;
