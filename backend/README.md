## 🔧 Backend Setup Guide

Follow these steps to get your backend server running locally:

---

### 1️⃣ Install Dependencies

```bash
cd backend
npm install
```

> ⚠️ You might see some warnings or minor errors — unless they block the install, you can ignore them.

---

### 2️⃣ Configure Environment Variables

Create a `.env` file inside the `backend` folder and add:

```
MONGO_URL=mongodb://127.0.0.1/school
```

> ❗ **Important:** Do not include spaces around the `=` sign.

---
### ⚙️ Prerequisite: Install MongoDB
Follow the official guide to install MongoDB Community Edition on your OS:
https://docs.mongodb.com/manual/installation/

---

### 3️⃣ Start MongoDB Locally

MongoDB must be running on your local machine to connect.

#### Option A: Run directly from terminal (recommended)

```bash
mongod --dbpath C:\data\db
```

> Make sure the path exists. You can create it if it doesn’t:
```bash
mkdir C:\data\db

---

#### 🔁 Option B: 

If you're not comfortable with Option A, you can use this alternative:

1. Go to **Start** in your Windows system  
2. Search for `cmd`  
3. **Right-click** on **Command Prompt** and select **"Run as administrator"**

Now, in the elevated terminal, run:

```
net start MongoDB
```
You’ll see a message like this:

The MongoDB service is starting.
The MongoDB service was started successfully.

> 🛑 If you see **"System error 5 has occurred. Access is denied."**, that means you didn’t run CMD as an administrator. Try again by following the above steps carefully.

---

### 4️⃣ Confirm MongoDB is Running

Check if MongoDB is active by opening a new terminal and running:

```bash
mongosh
```

If successful, you’ll see a MongoDB shell prompt like:
```
test>
```

### 5️⃣ Start the Backend Server

Once MongoDB is up, start your backend server:

```bash
npm start
```

Expected output:

```
✅ Connected to MongoDB  
Server started at port no. 5000
```

---

### ☁️ Using MongoDB Atlas?

Replace the `MONGO_URL` in your `.env` file:

```env
MONGO_URL=mongodb+srv://<username>:<password>@cluster0.mongodb.net/school?retryWrites=true&w=majority
```

> Don’t forget to whitelist your IP in the Atlas dashboard!

---