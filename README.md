# AI Pipeline IDE

A modern, professional AI Pipeline IDE built with React, TailwindCSS, and Gemini API integration for complete client-side AI pipeline development.

## ✨ Features

### 🎨 Modern React Architecture
- **Component-Based Design**: Modular React components with proper state management
- **Professional Layout**: Clean, modern interface with responsive grid system
- **Dark/Light Themes**: Toggle between dark and light modes seamlessly
- **Smooth Animations**: Micro-interactions and loading states for better UX

### 🔧 IDE Capabilities
- **Code Editor**: Full-featured code editor with syntax highlighting
- **File Management**: Interactive file tree with custom icons and multi-tab support
- **Real-time Editing**: Live code editing with file synchronization
- **Terminal Integration**: Built-in terminal interface for command execution

### 🤖 AI-Powered Pipeline Features
- **Gemini Integration**: Complete client-side AI pipeline powered by Google's Gemini API
- **Intelligent Analysis**: AI-powered code analysis, optimization, and debugging
- **Pipeline Automation**: Automated pipeline execution with real-time monitoring
- **AI Assistant**: Built-in AI assistant for code review, documentation, and optimization

### 📱 Responsive Design
- **Full-screen Layout**: Optimized for desktop development workflows
- **Flexible Panels**: Resizable sidebar and interactive panels
- **Cross-browser Compatibility**: Works across all modern browsers

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Google Gemini API key (get one at [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lequockhanh19521680/AI-Pipeline.git
   cd AI-Pipeline
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

### Configuration

1. **Set up Gemini API Key**
   - Click on "Configure" in the Gemini API section (sidebar)
   - Enter your Gemini API key
   - Click "Save" to store it locally

2. **Start using the AI Pipeline**
   - Edit your pipeline code in the editor
   - Use the AI Assistant for code analysis and optimization
   - Run the complete pipeline with Gemini integration

## 🛠️ Development

### Build System
- **Vite**: Fast development server and build tool
- **React**: Component-based architecture
- **TailwindCSS**: Utility-first CSS framework
- **PostCSS**: CSS processing and optimization

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Build CSS (if needed separately)
npm run build-css
```

### Project Structure

```
src/
├── components/          # React components
│   ├── App.jsx         # Main application component
│   ├── FileTree.jsx    # File explorer component
│   ├── Editor.jsx      # Code editor component
│   ├── Terminal.jsx    # Terminal and output component
│   ├── Pipeline.jsx    # Pipeline status and controls
│   ├── ThemeToggle.jsx # Dark/light mode toggle
│   └── AIAssistant.jsx # AI-powered code assistant
├── services/           # API services
│   └── GeminiService.js # Gemini API integration
├── data.js            # Application data and constants
├── index.css          # Global styles and Tailwind
└── main.jsx           # React entry point
```

## 🤖 AI Features

### Pipeline Stages
The AI pipeline includes four main stages, all powered by Gemini:

1. **Data Ingestion**: AI-assisted data loading and validation
2. **Processing**: Intelligent data processing and feature engineering
3. **Model Training**: AI-optimized model training and evaluation
4. **Deployment**: Smart deployment strategy and monitoring

### AI Assistant Modes
- **Analyze Code**: Get insights and suggestions for your code
- **Optimize Config**: Receive optimization recommendations
- **Debug Code**: AI-powered debugging and error resolution
- **Generate Docs**: Automatic documentation generation

### Gemini API Integration
- **Client-side Processing**: No server required, runs entirely in browser
- **Secure**: API key stored locally in browser
- **Intelligent**: Context-aware responses based on your code and configuration
- **Real-time**: Instant feedback and suggestions

## 📋 Usage Examples

### Basic Pipeline Execution
1. Configure your Gemini API key
2. Edit your pipeline code (Python/YAML/etc.)
3. Click "Run Pipeline" to execute with AI assistance
4. Monitor progress in real-time

### AI-Assisted Development
1. Open the AI Assistant tab
2. Select an analysis mode (Analyze, Optimize, Debug, or Document)
3. Click "Run" to get AI-powered insights
4. Apply suggestions directly to your code

### File Management
- Click on files in the Project Explorer to open them
- Use tabs to switch between multiple open files
- Edit code with syntax highlighting and line numbers
- All changes are auto-saved locally

## 🌐 Technology Stack

- **Frontend**: React 18+ with hooks and modern patterns
- **Styling**: TailwindCSS v3.3 with custom design system
- **Build Tool**: Vite for fast development and builds
- **AI Integration**: Google Gemini API for intelligent features
- **Icons**: Font Awesome (embedded subset)
- **Typography**: System fonts with monospace for code

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally in your browser
- **API Security**: Gemini API key stored securely in localStorage
- **No Server**: Completely client-side application
- **No Data Transmission**: Your code never leaves your device except for AI analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes with proper testing
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/lequockhanh19521680/AI-Pipeline/issues)
- **Documentation**: Check this README for setup and usage instructions
- **API Help**: Visit [Google AI Studio](https://makersuite.google.com/) for Gemini API documentation

---

**Built with ❤️ for the AI development community**

*Empowering developers with AI-assisted pipeline development*