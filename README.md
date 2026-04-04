# SmartQueue - Smart canteen and queue management system

A full-stack application for disaster relief management with separate backend and frontend folders.

## 📁 Project Structure

```
smartQueue/
├── backend/              # Backend API (Node.js + Express)
│   ├── common/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── Routes/
│   ├── config/
│   ├── server.js
│   ├── package.json
│   └── AUTHENTICATION.md
├── frontend/            # Frontend application
├── .gitignore
├── package.json         # Root package.json for managing both frontend & backend
└── README.md
```

## 🚀 Getting Started

### Option 1: Install and Run Everything
```bash
npm run install:all      # Install dependencies for backend & frontend
npm run start:all        # Start both backend & frontend concurrently
```

### Option 2: Run Backend Only
```bash
cd backend
npm install
npm start
```

### Option 3: Run Frontend Only
```bash
cd frontend
npm install
npm start
```

## 🔐 Backend Setup

### Environment Variables
Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/smartQueue
SECRET_KEY=your_super_secret_jwt_key_here
NODE_ENV=development
```

See [backend/AUTHENTICATION.md](backend/AUTHENTICATION.md) for complete authentication documentation.

## 📚 Documentation

- [Backend Authentication & Authorization](backend/AUTHENTICATION.md)

## 🔧 Technologies

**Backend:**
- Express.js - Web server framework
- MongoDB - Database
- Mongoose - ORM
- JWT - Authentication
- Bcrypt - Password hashing

## 📝 License

ISC

## 🔗 Repository

[SahanaNet on GitHub](https://github.com/malindujayawickrama462/SahanaNet)
