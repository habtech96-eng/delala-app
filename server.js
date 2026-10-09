const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { pgTable, serial, text, timestamp, jsonb, uuid } = require('drizzle-orm/pg-core');
const { desc, eq } = require('drizzle-orm');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE CONFIGURATION ================= //

// 1. Listings Table
const listings = pgTable('listings', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  price: text('price').notNull(),
  location: text('location').notNull(),
  category: text('category').notNull(),
  imageUrl: text('image_url').notNull(),
  images: jsonb('images').$type().default([]),
  phone: text('phone').notNull(),
  ownerName: text('owner_name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Users Table (ለ Auth የተጨመረ)
const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull().unique(),
  fullName: text('full_name'),
  role: text('role').default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tenant identifier (project ref) ለ Supabase Pooler እንዲደርሰው ማድረግ
const client = postgres(process.env.DATABASE_URL, { 
  prepare: false,
  options: 'project=ncjithsolwasokrdleku'
});
const db = drizzle(client);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// ================= AUTHENTICATION ENDPOINTS ================= //

// ለጊዜው OTP በ Memory ለማስቀመጥ
const otpStore = {};

// 1. OTP መላኪያ Endpoint
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'እባክዎን የስልክ ቁጥር ያስገቡ!' });
    }

    // ለቴስቲንግ ጊዜያዊ ኮድ
    const generatedOtp = '123456';
    otpStore[phone] = generatedOtp;

    console.log(`📱 OTP ለ ${phone} የተላከው ኮድ፦ ${generatedOtp}`);

    return res.json({
      success: true,
      message: 'የመግቢያ ኮዱ በስኬት ተልኳል (ለቴስቲንግ ኮዱ 123456 ነው)',
    });
  } catch (error) {
    console.error('OTP Send Error:', error);
    return res.status(500).json({ success: false, message: 'የሰርቨር ስህተት ተከሰቷል!' });
  }
});

// 2. OTP ማረጋገጫ Endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp, fullName } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'ስልክ ቁጥር እና OTP ያስፈልጋል!' });
    }

    if (otpStore[phone] !== otp) {
      return res.status(400).json({ success: false, message: 'የተሳሳተ OTP ኮድ ነው!' });
    }

    delete otpStore[phone];

    // User በ Database ውስጥ መኖሩን ማረጋገጥ
    let user;
    try {
      const existingUsers = await db.select().from(users).where(eq(users.phone, phone));
      user = existingUsers[0];

      if (!user) {
        const [newUser] = await db.insert(users).values({
          phone,
          fullName: fullName || 'ተጠቃሚ',
        }).returning();
        user = newUser;
      }
    } catch (dbErr) {
      console.log('User DB check fallbacked:', dbErr.message);
      user = { phone, fullName: fullName || 'ተጠቃሚ' };
    }

    return res.json({
      success: true,
      message: 'በስኬት ገብተዋል!',
      user,
    });
  } catch (error) {
    console.error('OTP Verify Error:', error);
    return res.status(500).json({ success: false, message: 'የሰርቨር ስህተት ተከሰቷል!' });
  }
});

// ================= REST API ENDPOINTS ================= //

// 1. ሁሉንም የለቀቁ እቃዎች/ቤቶች ከ Supabase ማውጣት (GET)
app.get('/api/listings', async (req, res) => {
  try {
    const data = await db.select().from(listings).orderBy(desc(listings.createdAt));
    
    const formattedData = data.map((item) => ({
      id: item.id.toString(),
      title: item.title,
      price: item.price,
      location: item.location,
      category: item.category,
      imageUrl: item.imageUrl,
      images: item.images && item.images.length > 0 ? item.images : [item.imageUrl],
      phone: item.phone,
      ownerName: item.ownerName,
      createdAt: item.createdAt,
    }));

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ success: false, message: 'መረጃዎችን ማውጣት አልተቻለም!' });
  }
});

// 2. አዲስ እቃ/ቤት ወደ Supabase መለጠፍ (POST)
app.post('/api/listings', async (req, res) => {
  const { title, price, location, category, imageUrl, images, phone, ownerName } = req.body;

  if (!title || !price || !location || !phone) {
    return res.status(400).json({ 
      success: false, 
      message: 'እባክዎን አስፈላጊ መረጃዎችን (Title, Price, Location, Phone) ይሙሉ!' 
    });
  }

  try {
    const defaultImg = imageUrl || `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`;
    const finalImages = images && images.length > 0 ? images : [defaultImg];

    const [newListing] = await db.insert(listings).values({
      title,
      price,
      location,
      category: category || 'Other',
      imageUrl: defaultImg,
      images: finalImages,
      phone,
      ownerName: ownerName || 'አልተጠቀሰም',
    }).returning();

    const formattedListing = {
      id: newListing.id.toString(),
      title: newListing.title,
      price: newListing.price,
      location: newListing.location,
      category: newListing.category,
      imageUrl: newListing.imageUrl,
      images: newListing.images,
      phone: newListing.phone,
      ownerName: newListing.ownerName,
      createdAt: newListing.createdAt,
    };

    res.status(201).json({ success: true, data: formattedListing });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ success: false, message: 'መረጃውን መመዝገብ አልተቻለም!' });
  }
});

// ================= SOCKET.IO REAL-TIME CHAT ================= //

io.on('connection', (socket) => {
  console.log(`⚡ ተጠቃሚ ተገናኘ: ${socket.id}`);

  socket.on('join_room', (data) => {
    socket.join(data.room);
    console.log(`👤 ${data.username} ወደ Room: ${data.room} ገብቷል`);
  });

  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
    console.log(`💬 [Room ${data.room}] ${data.author}: ${data.text}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ ተጠቃሚ ተቋረጠ: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server በ port ${PORT} ላይ ከ Supabase ጋር እየሰራ ነው...`);
});
