# 📱 Delala Mobile Application

**Delala** ለአቅራቢዎች እና ለገዢዎች የተዘጋጀ ዘመናዊ የኢ-ኮሜርስ እና የእቃዎች/ቤቶች መለጠፊያ እና መገበያያ ሞባይል መተግበሪያ ነው።

---

## 🚀 ዋና ዋና ባህሪያት (Features)

* **🔐 ቀላል የመግቢያ ስርአት (User Authentication):** ተጠቃሚዎች በስሟቸው እና በኢሜላቸው በቀላሉ ገብተው አገልግሎቱን መጠቀም ይችላሉ።
* **📌 ማስታወቂያዎችን መመልከት እና መለጠፍ (Listings Management):** ተጠቃሚዎች የራሳቸውን እቃዎች/ቤቶች ፎቶ፣ ዋጋ እና አድራሻ በመሙላት መለጠፍ እንዲሁም ሌሎችን መመልከት ይችላሉ።
* **💬 የቀጥታ የውይይት መስመር (Real-time Chat):** በ Socket.io አማካኝነት ገዢዎች እና ሻጮች በቀጥታ መልእክት መላላክ ይችላሉ።
* **🔍 ፈጣን ፍለጋ (Category & Search Filter):** እቃዎችን በየምድባቸው እና በስም ለይቶ በፍጥነት የመፈለግ አማራጭ።
* **💾 የአካባቢ ሴክሽን ማስታወሻ (SQLite Local Session):** ተጠቃሚዎች አንዴ ከገቡ በኋላ መረጃቸው በስልካቸው ላይ በ SQLite ተቀምጦ ይቆያል።

---

## 🛠️ ጥቅም ላይ የዋሉ ቴክኖሎጂዎች (Tech Stack)

### Frontend (Mobile App)
* **Framework:** React Native / Expo (Expo Router)
* **Local Database:** Expo SQLite
* **State & Storage:** AsyncStorage
* **UI Components:** React Native Safe Area Context, Vector Icons

### Backend (Server)
* **Runtime:** Node.js & Express.js
* **Database ORM:** Drizzle ORM
* **Database Service:** Neon PostgreSQL / Supabase
* **Real-time Engine:** Socket.io

---

## 📦 አፑን ለማስነሳት የሚከተሉትን ትእዛዛት ይጠቀሙ

### 1. የፊት ለፊት ሞባይል አፕሊኬሽን (Frontend Setup)
```bash
# ዲፔንደንስ መጫን
npm install

# አፑን ማስነሳት (Metro Bundler)
npx expo start -c
