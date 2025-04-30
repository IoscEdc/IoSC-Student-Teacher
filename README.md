# 🎓 SCHOOL MANAGEMENT SYSTEM

<p align="center">
An open-source project to streamline school management, class organization, and simplify student-faculty interactions.<br>
Track attendance, assess performance, and communicate effortlessly.<br><br>
💻 Built using the MERN Stack (MongoDB, Express.js, React.js, Node.js)
</p>

---

## 🚀 About the Project

The **School Management System** is a full-stack web application that centralizes administrative and academic activities in schools. This project is being used as part of an **Open Source Contribution Competition** — contributors are welcome to build new features, fix bugs, enhance UI/UX, and more.

---

## ✅ Features (Already Implemented)

- **User Roles:** Admin, Teacher, and Student — each with different access.
- **Admin Dashboard:** Manage classes, subjects, students, teachers, and users.
- **Attendance Tracking:** Teachers can mark attendance and generate reports.
- **Performance Assessment:** Enter and view student marks and feedback.
- **Data Visualization:** Students can view their academic performance via charts.
- **Communication Tools:** Messaging system between teachers and students.

---

## 🧰 Tech Stack

- **Frontend:** React.js, Redux, Material UI  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB

---

## 🛠️ Getting Started

```bash
git clone https://github.com/IoscEdc/IoSC-Student-Teacher.git
```

Open **two terminals** in separate tabs/windows:

### 1️⃣ Backend Setup

```bash
cd backend
npm install
npm start
```

Create a `.env` file in the `backend` folder and add:

```
MONGO_URL = mongodb://127.0.0.1/school
```

> If you're using MongoDB Atlas, replace with your own connection string.

---

### 2️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

- Visit the frontend at: `http://localhost:3000`
- Backend API runs on: `http://localhost:5000`

---

## ⚠️ Troubleshooting

### ❗ Sign-up / Network Errors

If you see a loading or network error during sign-up:

1. Open `frontend/.env` and **uncomment the first line**.
2. Restart the frontend:

```bash
cd frontend
npm start
```

If it still doesn’t work:

- Open `frontend/src/redux/userRelated/userHandle.js`
- Add this at the top:

```js
const REACT_APP_BASE_URL = "http://localhost:5000";
```

- Replace all `process.env.REACT_APP_BASE_URL` with `REACT_APP_BASE_URL`

> Repeat this for all `*Handle.js` files in folders like `teacherRelated`.

---

### 🗑️ Delete Function Disabled?

The delete functionality is disabled on the live version. To enable it locally:

1. In `frontend/src/redux/userRelated/userHandle.js`, uncomment the full `deleteUser` function and comment out the one showing the "disabled" message.
2. Go to `frontend/src/pages/admin`, and in every file prefixed with `Show` or `View`, find the `deleteHandler` and:
   - **Uncomment** the `dispatch(deleteUser(...))` line
   - **Comment** out the `setMessage("Sorry...")` line

Example:

```js
// Before
setMessage("Sorry, the delete function has been disabled for now.");
setShowPopup(true);

// After
dispatch(deleteUser(deleteID, address)).then(() => {
  dispatch(getAllSclasses(adminID, "Sclass"));
});
```

Repeat for all relevant files.

---

## 🌟 How to Contribute

We welcome contributions in the form of:

- 🚀 New features (e.g., grading system, file uploads, event calendar)
- 🎨 UI/UX improvements
- 🐛 Bug fixes
- 📈 Code optimization or performance enhancement
- ✅ Adding tests

Feel free to fork this repo, create your branch, and submit a pull request!

---

# 🛠️ After submitting a PR or after new PRs are merged:  
## How to keep your local repo updated

If you have **forked** the repo, always remember to follow these steps so that changes in the **original repo** are also reflected in your **local repo**.

---

✅ You need to run this **only once** (to set upstream):
```bash
git remote add upstream https://github.com/IoscEdc/IoSC-Student-Teacher.git
```

---

✅ Then, **every time you want to update your local repo**:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

*(This will pull the latest code from the original repo into your local `main` branch.)*

---

If you want, you can also **push** these updates to your forked repo on GitHub (optional but recommended):

```bash
git push origin main
```

This way your **GitHub fork** stays updated too! 🚀

---

**shortcut** way where you don’t even have to manually merge:
 (Using `git pull upstream main` directly!) 🚀 It saves a step!

---

## 📦 Deployment Info

- **Frontend:** Deployed on Netlify  
- **Backend:** Deployed on Render  

For local development, use `localhost:3000` and `localhost:5000`.

---

## 🙌 Join the Competition!

Help make this project better while earning recognition and sharpening your skills.  
Open issues, suggest improvements, or fix bugs — your contributions matter!

---
