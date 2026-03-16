# 🏫 AttendanceIQ — MERN Stack Attendance Management System

A full-stack web application for managing student attendance with role-based dashboards for Admin, Instructor, and Students.

---

## ✨ Features

### 🛡️ Admin
- Add, edit, and delete students (name, roll number, department, parent contact),
- Add and remove instructors
- View all leave requests across the system
- Dashboard with real-time stats (total students, instructors, today's attendance, pending leaves)

### 👨‍🏫 Instructor
- View all students (auto-synced from admin)
- Mark attendance (Present / Absent / Leave) per student, per day
- View historical attendance records by date
- **Export monthly attendance report as Excel (.xlsx)**
- Approve or reject student leave requests

### 🎓 Student
- View personal attendance history with month filter
- See attendance percentage with visual pie chart
- Apply for leave (with date range and reason)
- Track leave application status (Pending / Approved / Rejected)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router v6, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Excel Export | xlsx library |
| Styling | Custom CSS Design System (Dark Theme) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone & Install

```bash
# Install root dependencies
npm install

# Install backend and frontend dependencies
npm run install-all
```

### 2. Configure Environment

```bash
# Copy the example env file
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/attendance_db
JWT_SECRET=your_very_secret_key_here_change_me
CLIENT_URL=http://localhost:3000
```

### 3. Seed Database (Create Default Users)

```bash
npm run seed
```

This creates:
| Role | Identifier | Password |
|------|-----------|----------|
| Admin | admin@school.com | Admin@123 |
| Instructor | instructor@school.com | Instructor@123 |
| Student | CS2021001 | Student@123 |
| Student | CS2021002 | Student@123 |
| Student | CS2021003 | Student@123 |

### 4. Start Development Server

```bash
# Start both backend and frontend concurrently
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 📁 Project Structure

```
attendance-system/
├── backend/
│   ├── models/
│   │   ├── User.js          # User schema (admin/instructor/student)
│   │   ├── Attendance.js    # Attendance records
│   │   └── Leave.js         # Leave requests
│   ├── routes/
│   │   ├── auth.js          # Login, /me endpoint
│   │   ├── admin.js         # Admin CRUD operations
│   │   ├── instructor.js    # Attendance marking + Excel export
│   │   └── student.js       # Student attendance view + leaves
│   ├── middleware/
│   │   └── auth.js          # JWT protect + role authorize
│   ├── server.js            # Express app entry point
│   ├── seed.js              # Database seeder
│   └── .env.example
│
└── frontend/
    └── src/
        ├── context/
        │   └── AuthContext.js   # Auth state + axios setup
        ├── components/
        │   └── DashboardLayout.js  # Sidebar + layout wrapper
        ├── pages/
        │   ├── LoginPage.js
        │   ├── admin/
        │   │   ├── AdminDashboard.js
        │   │   ├── AdminHome.js
        │   │   ├── StudentsManager.js
        │   │   ├── InstructorsManager.js
        │   │   └── LeavesManager.js
        │   ├── instructor/
        │   │   ├── InstructorDashboard.js
        │   │   ├── MarkAttendance.js
        │   │   ├── AttendanceHistory.js
        │   │   └── InstructorLeaves.js
        │   └── student/
        │       ├── StudentDashboard.js
        │       ├── StudentAttendance.js
        │       └── ApplyLeave.js
        ├── App.js
        └── index.css          # Design system + global styles
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (identifier + password + role) |
| GET | `/api/auth/me` | Get current user |

### Admin (requires admin JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/students` | List all students |
| POST | `/api/admin/students` | Add student |
| PUT | `/api/admin/students/:id` | Update student |
| DELETE | `/api/admin/students/:id` | Delete student |
| GET | `/api/admin/instructors` | List instructors |
| POST | `/api/admin/instructors` | Add instructor |
| DELETE | `/api/admin/instructors/:id` | Remove instructor |
| GET | `/api/admin/leaves` | All leave requests |

### Instructor (requires instructor JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instructor/students` | All active students |
| POST | `/api/instructor/attendance` | Mark bulk attendance |
| GET | `/api/instructor/attendance?date=YYYY-MM-DD` | Get attendance by date |
| GET | `/api/instructor/export?month=YYYY-MM` | Download Excel report |
| GET | `/api/instructor/leaves` | All leave requests |
| PATCH | `/api/instructor/leaves/:id` | Approve/reject leave |

### Student (requires student JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/student/attendance?month=YYYY-MM` | Personal attendance |
| POST | `/api/student/leave` | Apply for leave |
| GET | `/api/student/leaves` | My leave history |

---

## 🔐 Security
- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT tokens** with 7-day expiry stored in localStorage
- All API routes protected with middleware
- Role-based access control (`admin`, `instructor`, `student`)
- Duplicate roll number / email prevention

---

## 📊 Excel Export
Instructors can download a monthly attendance report via **GET `/api/instructor/export?month=YYYY-MM`**. The Excel sheet includes:
- Student roll number, name, department
- A column per day with P / A / L markers
- Summary columns: Present count, Absent count, Leave count, Percentage

---

## 🌐 Deployment

### MongoDB Atlas (Cloud)
1. Create a free cluster at https://cloud.mongodb.com
2. Get your connection string
3. Update `MONGO_URI` in backend `.env`

### Render / Railway (Backend)
1. Push to GitHub
2. Create Web Service pointing to `backend/`
3. Set environment variables
4. Build command: `npm install`, Start: `node server.js`

### Vercel / Netlify (Frontend)
1. Build: `npm run build` in `frontend/`
2. Set `REACT_APP_API_URL` to your backend URL
3. Remove `"proxy"` from `package.json` for production

with step by step process
