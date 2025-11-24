# HireIQ - AI-Powered Resume Matcher for HR

An intelligent recruitment platform that helps HR professionals find the perfect candidates by matching resumes with job requirements using AI-powered analysis.

## 🚀 Features

- **Job Management**: Create and manage job postings with required and nice-to-have skills
- **Resume Upload**: Drag-and-drop PDF resume upload with bulk processing
- **AI Matching**: Intelligent skill matching with evidence extraction
- **Score-Based Ranking**: Color-coded match scores (Green >75%, Yellow >50%, Red ≤50%)
- **Candidate Shortlisting**: Mark top candidates for further review
- **Notes System**: Add private notes to candidate profiles
- **Dashboard Analytics**: Overview of jobs, candidates, and match statistics
- **Clerk Authentication**: Secure HR-only access with professional user management

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS + ShadCN UI
- **Authentication**: Clerk
- **State Management**: React Query
- **Routing**: React Router v6
- **API Client**: Axios
- **File Upload**: React Dropzone
- **Animations**: Framer Motion

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # ShadCN UI components
│   ├── Layout.tsx       # Main app layout with sidebar
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── Navbar.tsx       # Top navigation bar
│   ├── JobFormModal.tsx # Job creation modal
│   ├── UploadDropzone.tsx # Resume upload component
│   └── NotesModal.tsx   # Candidate notes modal
├── pages/
│   ├── Dashboard.tsx    # KPI cards and analytics
│   ├── Jobs.tsx         # Job listings table
│   ├── JobDetails.tsx   # Individual job view
│   ├── Upload.tsx       # Resume upload interface
│   └── Matches.tsx      # Match results with scoring
├── services/
│   └── api.ts           # API client and service functions
└── routes/
    └── AppRoutes.tsx    # Protected route configuration
```

## 🔧 Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd hireiq
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Backend API URL
VITE_API_BASE_URL=http://localhost:8000
```

### 4. Get your Clerk credentials

1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your **Publishable Key** from the dashboard
4. Paste it into your `.env` file

### 5. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 🔌 Backend API Integration

The frontend is designed to work with a REST API. Update these endpoints in `src/services/api.ts`:

### Jobs API
- `GET /api/v1/jobs` - List all jobs
- `GET /api/v1/jobs/:id` - Get job details
- `POST /api/v1/jobs` - Create new job
- `DELETE /api/v1/jobs/:id` - Delete job

### Candidates API
- `POST /api/v1/candidates/upload` - Upload resumes (multipart/form-data)
- `POST /api/v1/candidates/process` - Process uploaded resumes
- `GET /api/v1/candidates/job/:jobId` - Get candidates for a job

### Matches API
- `GET /api/v1/matches/:jobId/run` - Run AI matching algorithm
- `GET /api/v1/matches/:jobId` - Get match results for a job
- `PATCH /api/v1/matches/shortlist/:matchId` - Toggle shortlist status
- `PATCH /api/v1/matches/notes/:matchId` - Update candidate notes

### Dashboard API
- `GET /api/v1/dashboard/stats` - Get dashboard statistics

## 🎨 Design System

The app uses the Obsidian theme with semantic color tokens:

- **Primary**: Main brand color for key actions
- **Secondary**: Supporting UI elements
- **Muted**: Subtle backgrounds and borders
- **Accent**: Highlights and interactive states
- **Destructive**: Error and warning states

Match score colors:
- **Green** (>75%): Excellent match
- **Yellow** (>50%): Good match
- **Red** (≤50%): Weak match

## 🔐 Authentication

Only authenticated HR users can access the platform. The app uses Clerk for:

- Email/password authentication
- Social login (configurable)
- User profile management
- Session management
- Protected routes

## 📱 Responsive Design

Fully responsive layout optimized for:
- Desktop (1280px+)
- Tablet (768px - 1279px)
- Mobile (< 768px)

The sidebar collapses on smaller screens for optimal mobile experience.

## 🚀 Deployment

Build for production:

```bash
npm run build
```

The optimized build will be in the `dist` folder, ready for deployment to any static hosting service.

## 📄 License

MIT License - feel free to use this project for your recruitment needs!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
