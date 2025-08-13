# AI Pipeline IDE

A modern, professional AI Pipeline IDE built with vanilla JavaScript, TailwindCSS, and modern web technologies.

## Features

### 🎨 Modern UI Design
- **Professional Layout**: Clean, modern interface with responsive grid system
- **Dark/Light Themes**: Toggle between dark and light modes seamlessly
- **Smooth Animations**: Micro-interactions and loading states for better UX
- **Typography**: Custom font stack optimized for code editing

### 🔧 IDE Capabilities
- **Code Editor**: Full-featured code editor with syntax highlighting
- **File Management**: Interactive file tree with custom icons
- **Multi-tab Support**: Switch between multiple files easily
- **Real-time Editing**: Live code editing with file synchronization

### 🚀 AI Pipeline Features
- **Pipeline Visualization**: Real-time status indicators for each pipeline stage
- **Output Monitoring**: Live output logs and pipeline flow visualization
- **Terminal Integration**: Built-in terminal interface for command execution
- **Progress Tracking**: Visual progress indicators and status updates

### 📱 Responsive Design
- **Full-screen Layout**: Optimized for desktop development workflows
- **Flexible Panels**: Resizable sidebar and preview panels
- **Mobile Friendly**: Responsive design that works across devices

## Project Structure

```
AI-Pipeline/
├── index.html          # Main HTML file
├── src/
│   ├── input.css       # TailwindCSS source styles
│   └── app.js          # Main JavaScript application
├── dist/
│   └── output.css      # Compiled CSS (generated)
├── package.json        # Project dependencies
├── tailwind.config.js  # TailwindCSS configuration
└── README.md          # This file
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lequockhanh19521680/AI-Pipeline.git
   cd AI-Pipeline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the CSS:
   ```bash
   npm run build
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:8080`

## Development

### Building Styles
```bash
# Build CSS once
npx tailwindcss -i ./src/input.css -o ./dist/output.css

# Watch mode (rebuild on changes)
npx tailwindcss -i ./src/input.css -o ./dist/output.css --watch
```

### File Structure
- **HTML**: Semantic, accessible markup with proper ARIA labels
- **CSS**: TailwindCSS utility classes with custom components
- **JavaScript**: Vanilla ES6+ with modular architecture

## Key Features Implemented

### ✅ Phase 1: Project Setup
- [x] Modern project structure with npm configuration
- [x] TailwindCSS setup with custom theme
- [x] Professional color scheme and typography
- [x] Responsive grid layout system

### ✅ Phase 2: Core IDE Components
- [x] Interactive file tree with custom icons
- [x] Code editor with syntax highlighting placeholder
- [x] Multi-tab interface for file switching
- [x] Terminal interface with command history

### ✅ Phase 3: Professional UI Features
- [x] Pipeline status indicators with animations
- [x] Loading states and progress tracking
- [x] Error handling UI components
- [x] Smooth transitions and micro-interactions

### ✅ Phase 4: Visual Enhancements
- [x] Dark/light mode toggle
- [x] Professional shadows and depth effects
- [x] Optimized color schemes for both themes
- [x] Responsive design across devices

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: TailwindCSS v3.3
- **Icons**: Font Awesome (embedded subset)
- **Typography**: System fonts with fallbacks
- **Build**: Node.js toolchain

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Screenshots

### Dark Mode
![AI Pipeline IDE - Dark Mode](screenshots/dark-mode.png)

### Light Mode
![AI Pipeline IDE - Light Mode](screenshots/light-mode.png)

---

**Built with ❤️ for the AI development community**