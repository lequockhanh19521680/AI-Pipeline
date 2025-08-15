# 🤖 AI Pipeline IDE

A modern, professional AI Pipeline IDE built with React, TypeScript, Node.js, and AI integration for complete full-stack AI pipeline development.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)

## ✨ Features

### 🏗️ Modern Architecture

- **Workspace-based Structure**: Separate frontend and backend with shared types
- **TypeScript ESM Support**: Full TypeScript ESM across the entire stack
- **Hot Reload**: Real-time development for both frontend and backend
- **Shared Types**: Consistent interfaces between frontend and backend
- **WebSocket Integration**: Real-time collaboration and pipeline updates

### 🎨 Frontend (React + TypeScript + Vite)

- **Component-Based Design**: Modular React components with proper state management
- **Advanced Pipeline Builder**: Drag-drop pipeline creation with React Flow
- **Minimalist Code Editor**: Split-view with Monaco Editor integration
- **Professional Layout**: Clean, modern interface with responsive design
- **Dark/Light Themes**: Toggle between dark and light modes seamlessly

### 🚀 Backend (Node.js + Express + TypeScript ESM)

- **RESTful API**: Well-structured API endpoints for pipeline management
- **WebSocket Server**: Real-time communication for pipeline execution
- **Pipeline Engine**: Robust pipeline execution and monitoring
- **ESM Module Support**: Modern ES modules with tsx runtime

### 🤖 AI-Powered Features

- **AI Intelligence**: Real-time code analysis and intelligent suggestions
- **Pipeline Templates**: Pre-built templates for common AI/ML use cases
- **Automated Pipeline Execution**: Smart execution with real-time monitoring
- **AI Assistant**: Built-in AI assistant for code review and optimization

### 📱 Cross-Platform Compatibility

- **Full-stack Development**: Complete development environment
- **Cross-browser Support**: Works across all modern browsers
- **Responsive Design**: Optimized for various screen sizes

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/lequockhanh19521680/AI-Pipeline.git
   cd AI-Pipeline
   ```

2. **Install all dependencies**

   ```bash
   npm install
   ```

3. **Start development servers**

   ```bash
   # Run both frontend and backend concurrently
   npm run dev
   ```

4. **Access the application**
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:3001

### Alternative Development Commands

```bash
# Run frontend only (React + Vite)
npm run dev:frontend

# Run backend only (Node.js + Express)
npm run dev:backend

# Build for production
npm run build

# Type checking
npm run type-check

# Clean build artifacts
npm run clean
```

## 🏗️ Project Structure

```
AI-Pipeline/
├── package.json              # Root workspace manager
├── 📁 frontend/              # React + TypeScript + Vite
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── AdvancedPipelineBuilder.tsx
│   │   │   ├── MinimalistCodeEditor.tsx
│   │   │   ├── AIIntelligenceFeatures.tsx
│   │   │   └── PipelineTemplates.tsx
│   │   ├── services/         # API services
│   │   ├── types/           # Frontend types
│   │   └── main.tsx
│   └── dist/                # Build output
├── 📁 backend/               # Node.js + Express + TypeScript ESM
│   ├── package.json
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── websocket/       # WebSocket handlers
│   │   ├── types/          # Backend types
│   │   └── server.ts
│   └── dist/               # Build output
├── 📁 shared/              # Common types and interfaces
│   ├── types/
│   └── interfaces/
└── 📁 docs/               # Documentation
```

## 🔗 API Endpoints

### REST API

| Method | Endpoint                   | Description            |
| ------ | -------------------------- | ---------------------- |
| `GET`  | `/api/health`              | Health check           |
| `POST` | `/api/pipeline/create`     | Create new pipeline    |
| `POST` | `/api/pipeline/execute`    | Execute pipeline       |
| `GET`  | `/api/pipeline/status/:id` | Get pipeline status    |
| `GET`  | `/api/templates`           | Get pipeline templates |

### WebSocket Events

| Event            | Description                              |
| ---------------- | ---------------------------------------- |
| `join-pipeline`  | Join pipeline room for real-time updates |
| `pipeline-event` | Pipeline execution events                |
| `log`            | Real-time log streaming                  |
| `collaboration`  | Real-time collaboration events           |

## 🤖 AI Features

### Pipeline Builder

- **Drag & Drop Interface**: Visual pipeline creation with React Flow
- **Node-based System**: Connect different processing nodes
- **Real-time Validation**: Instant feedback on pipeline configuration
- **Template Integration**: Use pre-built templates as starting points

### Code Editor

- **Monaco Editor**: VS Code-like editing experience
- **Syntax Highlighting**: Support for Python, JavaScript, YAML, JSON
- **IntelliSense**: Auto-completion and error detection
- **Split View**: Side-by-side code and preview

### AI Intelligence

- **Code Analysis**: Real-time code quality analysis
- **Smart Suggestions**: AI-powered optimization recommendations
- **Error Detection**: Intelligent error detection and fixing
- **Documentation Generation**: Automatic documentation creation

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev                # Start both frontend and backend
npm run dev:frontend       # Start only frontend (port 5173)
npm run dev:backend        # Start only backend (port 3001)

# Building
npm run build              # Build both frontend and backend
npm run build:frontend     # Build only frontend
npm run build:backend      # Build only backend

# Type Checking
npm run type-check         # Check TypeScript types
npm run type-check:frontend
npm run type-check:backend

# Linting & Formatting
npm run lint               # Lint all code
npm run format             # Format all code

# Testing
npm run test               # Run all tests
npm run test:frontend      # Run frontend tests
npm run test:backend       # Run backend tests

# Utilities
npm run clean              # Clean build artifacts
npm run preview            # Preview production build
```

### Development Workflow

1. **Make Changes**: Edit files in `frontend/src/` or `backend/src/`
2. **Hot Reload**: Changes automatically restart services
3. **Type Safety**: Shared types ensure consistency
4. **Testing**: Write tests for new features
5. **Build**: Test production builds before deployment

## 📚 Usage Examples

### Creating a Pipeline

1. Open the Advanced Pipeline Builder
2. Drag nodes from the palette
3. Connect nodes to create data flow
4. Configure each node's parameters
5. Save and execute the pipeline

### Using AI Features

1. Open the AI Intelligence panel
2. Select analysis type (Analyze, Optimize, Debug)
3. Get AI-powered insights and suggestions
4. Apply recommendations to improve your code

### Real-time Collaboration

1. Share your pipeline URL
2. Multiple users can edit simultaneously
3. See real-time changes and cursor positions
4. Chat and discuss changes inline

## 🌐 Technology Stack

### Frontend

- **React 18+** - Component-based UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Flow** - Interactive node-based UIs
- **Monaco Editor** - VS Code editor in browser

### Backend

- **Node.js 18+** - JavaScript runtime
- **Express** - Web application framework
- **TypeScript ESM** - Modern ES modules
- **Socket.io** - Real-time communication
- **tsx** - TypeScript execution engine

### DevOps & Tools

- **npm Workspaces** - Monorepo management
- **ESLint + Prettier** - Code quality and formatting
- **Concurrently** - Run multiple processes
- **Nodemon** - Auto-restart development server

## 🔒 Security & Privacy

- **Local Development**: All data stays on your machine during development
- **Environment Variables**: Secure configuration management
- **Type Safety**: Prevents common runtime errors
- **Input Validation**: Proper validation on all API endpoints
- **CORS Configuration**: Secure cross-origin requests

## 🚀 Deployment

### Production Build

```bash
# Build both frontend and backend
npm run build

# The frontend build will be in frontend/dist/
# The backend build will be in backend/dist/
```

### Deployment Options

- **Frontend**: Deploy to Vercel, Netlify, or any static hosting
- **Backend**: Deploy to Railway, Heroku, DigitalOcean, or AWS
- **Full-stack**: Use Docker for containerized deployment

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure type safety across frontend/backend

## 📋 Roadmap

### ✅ Completed

- [x] Workspace-based architecture
- [x] TypeScript ESM support
- [x] Advanced pipeline builder
- [x] Real-time WebSocket integration
- [x] AI intelligence features

### 🚧 In Progress

- [ ] Pipeline template marketplace
- [ ] Advanced AI model integration
- [ ] Cloud deployment options
- [ ] Performance optimization

### 📅 Planned

- [ ] Mobile responsive design
- [ ] Plugin system
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

## 🆘 Support & Documentation

- **Issues**: [GitHub Issues](https://github.com/lequockhanh19521680/AI-Pipeline/issues)
- **Documentation**: [docs/README.md](docs/README.md)
- **Discussions**: [GitHub Discussions](https://github.com/lequockhanh19521680/AI-Pipeline/discussions)

### Troubleshooting

#### Common Issues

1. **Port conflicts**: Kill processes using ports 3001 or 5173
2. **TypeScript errors**: Run `npm run type-check` to verify
3. **Dependency issues**: Delete `node_modules` and run `npm install`
4. **Build failures**: Clear `dist` folders and rebuild

#### Getting Help

- Check the [docs](docs/) folder for detailed documentation
- Search existing [issues](https://github.com/lequockhanh19521680/AI-Pipeline/issues)
- Create a new issue with detailed information

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite team for the lightning-fast build tool
- TypeScript team for type safety
- All contributors who make this project better

---

**Built with ❤️ for the AI development community**

_Empowering developers with modern AI pipeline development tools_

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/lequockhanh19521680/AI-Pipeline)
![GitHub forks](https://img.shields.io/github/forks/lequockhanh19521680/AI-Pipeline)
![GitHub issues](https://img.shields.io/github/issues/lequockhanh19521680/AI-Pipeline)
![GitHub pull requests](https://img.shields.io/github/issues-pr/lequockhanh19521680/AI-Pipeline)
