# Rendraw

A powerful TypeScript library for creating interactive canvas applications with shapes, transformations, and event handling. Rendraw provides a complete rendering engine for building visual applications like graphic editors, diagramming tools, and collaborative whiteboards.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Configuration](#configuration)
- [Event System](#event-system)
- [Contributing](#contributing)
- [License](#license)

## Overview

Rendraw is designed to simplify the creation of interactive canvas-based applications. Built with TypeScript, it offers a robust foundation for developing visual tools with features like shape manipulation, event handling, history management, and extensible architecture.

**Author**: [Sebxstt](https://github.com/GarcesSebastian)

## Features

### Core Functionality
- **Shape System**: Built-in support for rectangles, circles, text, and images
- **Interactive Events**: Comprehensive mouse and keyboard event handling
- **Transformations**: Move, rotate, scale, and manipulate shapes
- **History Management**: Undo/redo operations with configurable limits
- **Camera System**: Pan and zoom capabilities for large canvases

### Advanced Features
- **Smart Snapping**: Automatic alignment and positioning assistance
- **Selection System**: Multi-select and group operations
- **Export/Import**: Save and load canvas states
- **Event-Driven Architecture**: Extensible event system for custom functionality
- **TypeScript Support**: Full type safety and IntelliSense support

## Installation

```bash
npm install rendraw
```

## Quick Start

### Basic Setup

```typescript
import { Render, Vector } from 'rendraw';

// Get your canvas element
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

// Create a render instance (only takes canvas element)
const render = new Render(canvas);

// Load configuration asynchronously
await render.loadConfiguration({
  history: true,           // Enable undo/redo system
  pan: true,              // Enable camera panning with mouse
  zoom: true,             // Enable zoom with mouse wheel
  transform: true,        // Enable shape transformation handles
  selection: true,        // Enable multi-selection with drag box
  snap: true,             // Enable smart snapping guides
  save: "localstorage",   // Auto-save to localStorage ("indexeddb" | "localstorage" | null)
  keywords: {             // Keyboard shortcuts
    undo: "ctrl+z",
    redo: "ctrl+y",
    copy: "ctrl+c",
    paste: "ctrl+v",
    delete: "delete"      // Can also use "backspace"
  },
  properties: {           // Zoom and interaction properties
    zoomFactor: 1.05,     // Zoom increment factor
    minZoom: 0.1,         // Minimum zoom level
    maxZoom: 5.0          // Maximum zoom level
  }
});

// Enable FPS counter (optional)
render.allowFps();

// Create shapes using the built-in creator
const rect = render.creator.Rect({
  position: new Vector(100, 100),
  width: 200,
  height: 150,
  color: '#3498db',
  borderWidth: 2,
  borderColor: '#2980b9'
});

const circle = render.creator.Circle({
  position: new Vector(400, 200),
  radius: 75,
  color: '#e74c3c'
});

// The render loop starts automatically in constructor
// render.start() is called internally
```

### HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
    <title>Rendraw Canvas App</title>
    <style>
        canvas {
            border: 1px solid #ddd;
            cursor: crosshair;
        }
    </style>
</head>
<body>
    <canvas id="myCanvas" width="800" height="600"></canvas>
    <script type="module" src="your-script.js"></script>
</body>
</html>
```

## API Reference

### Core Classes

#### Render

The main rendering engine that manages the canvas, events, and all subsystems.

```typescript
class Render extends RenderProvider {
  // Constructor
  constructor(canvas: HTMLCanvasElement)  // Only takes canvas element
  
  // Core properties
  canvas: HTMLCanvasElement              // The HTML canvas element
  ctx: CanvasRenderingContext2D         // 2D rendering context
  currentCamera: Camera                 // Camera system for pan/zoom
  childrens: Map<string, Shape>         // All shapes on canvas by ID
  configuration: RenderConfiguration    // Configuration manager
  history: History                      // Undo/redo system
  snapSmart: SnapSmart                 // Smart snapping system
  transformer: Transformer             // Multi-selection transformer
  selection: Selection                 // Selection box system
  exporter: Exporter                   // Export/download system
  creator: RenderCreator               // Shape factory
  manager: RenderManager               // Shape management
  showFps: boolean                     // Whether to show FPS counter
  
  // Configuration methods
  loadConfiguration(config: Partial<RenderConfigurationProps>): Promise<void>  // Load config async
  
  // Core methods
  start(): void                        // Start render loop (called automatically)
  stop(): void                         // Stop render loop
  resize(): void                       // Resize canvas to fit container
  clear(): void                        // Clear all shapes from canvas
  
  // FPS methods
  allowFps(): void                     // Enable FPS counter display
  disallowFps(): void                  // Disable FPS counter display
  
  // Data management
  serialize(): ShapeRawData[]          // Export all shapes as JSON data
  deserialize(data: ShapeRawData[]): void  // Import shapes from JSON data
  autoSave(): void                     // Trigger auto-save if enabled
  
  // Export helpers
  preExport(): void                    // Prepare canvas for export (hide UI)
  postExport(): void                   // Restore canvas after export
  
  // Utility methods
  mousePosition(): Vector              // Get current mouse position in world coords
  worldToScreen(worldPos: Vector): Vector    // Convert world to screen coordinates
  screenToWorld(screenPos: Vector): Vector   // Convert screen to world coordinates
  toWorldCoordinates(screenPos: Vector): Vector  // Alternative coordinate conversion
}
```

#### RenderCreator

Factory class for creating shapes with automatic registration and event emission.

```typescript
class RenderCreator {
  constructor(render: Render)
  
  // Shape creation methods
  Rect(props: IRect): Rect
  Circle(props: ICircle): Circle
  Text(props: IText): Text
  Image(props: IImage): Image
  Vector(x: number, y: number): Vector
}
```

### Shape System

#### Base Shape Interface

```typescript
interface IShape {
  position: Vector;
  zIndex?: number;
  rotation?: number;
  dragging?: boolean;
  visible?: boolean;
}
```

#### Rectangle (Rect)

```typescript
interface IRect extends IShape {
  width: number;            // Rectangle width in pixels
  height: number;           // Rectangle height in pixels
  color?: string;           // Fill color (default: "#000000")
  borderWidth?: number;     // Border thickness in pixels (default: 0)
  borderColor?: string;     // Border color (default: "#000000")
  borderRadius?: number;    // Corner radius for rounded corners (default: 0)
}

// Usage example
const rect = render.creator.Rect({
  position: new Vector(50, 50),    // Top-left corner position
  width: 100,                      // Width in pixels
  height: 80,                      // Height in pixels
  color: '#2ecc71',               // Green fill color
  borderWidth: 2,                 // 2px border
  borderColor: '#27ae60',         // Darker green border
  borderRadius: 5                 // Rounded corners
});
```

#### Circle

```typescript
interface ICircle extends IShape {
  radius: number;           // Circle radius in pixels
  color?: string;           // Fill color (default: "#000000")
}

// Usage example
const circle = render.creator.Circle({
  position: new Vector(200, 200),  // Center position
  radius: 50,                      // Radius in pixels
  color: '#e74c3c'                // Red fill color
});
```

#### Text

```typescript
interface IText extends IShape {
  text: string;                    // Text content to display
  fontSize?: number;               // Font size in pixels (default: 16)
  fontFamily?: string;             // Font family name (default: "Arial")
  fontWeight?: string;             // Font weight: "normal", "bold", etc. (default: "normal")
  fontStyle?: string;              // Font style: "normal", "italic" (default: "normal")
  textAlign?: string;              // Text alignment: "left", "center", "right" (default: "left")
  color?: string;                  // Text color (default: "#000000")
  backgroundColor?: string;        // Background color behind text (default: "transparent")
  borderWidth?: number;            // Border thickness around text box (default: 0)
  borderColor?: string;            // Border color (default: "#000000")
  padding?: {                      // Internal spacing around text
    top: number;                   // Top padding in pixels
    right: number;                 // Right padding in pixels
    bottom: number;                // Bottom padding in pixels
    left: number;                  // Left padding in pixels
  };
}

// Usage example
const text = render.creator.Text({
  position: new Vector(100, 300),     // Top-left position of text box
  text: 'Hello Rendraw!',            // Text to display
  fontSize: 24,                      // Large font size
  fontFamily: 'Arial',               // Font family
  fontWeight: 'bold',                // Bold text
  color: '#2c3e50',                 // Dark text color
  backgroundColor: '#ecf0f1',        // Light background
  padding: { top: 10, right: 15, bottom: 10, left: 15 }  // Padding around text
});
```

#### Image

```typescript
interface IImage extends IShape {
  src: string;              // Image URL or data URL
  width?: number;           // Image width in pixels (auto-detected if not provided)
  height?: number;          // Image height in pixels (auto-detected if not provided)
  borderWidth?: number;     // Border thickness around image (default: 0)
  borderColor?: string;     // Border color (default: "#000000")
  borderRadius?: number;    // Corner radius for rounded image (default: 0)
}

// Usage example
const image = render.creator.Image({
  position: new Vector(300, 100),     // Top-left corner position
  src: 'https://example.com/image.jpg', // Image source URL
  width: 200,                         // Force specific width
  height: 150,                        // Force specific height
  borderRadius: 10                    // Rounded corners
});
```

## Configuration System

### RenderConfiguration

```typescript
interface RenderConfigurationProps {
  history: boolean;         // Enable undo/redo system with automatic state saving
  pan: boolean;            // Enable camera panning with mouse drag
  zoom: boolean;           // Enable zoom functionality with mouse wheel
  snap: boolean;           // Enable smart snapping guides for alignment
  transform: boolean;      // Enable shape transformation handles for resize/rotate
  selection: boolean;      // Enable multi-selection with drag box
  save: AutoSaveMethods;   // Auto-save method: "localstorage" | "indexeddb" | null
  keywords: Keys;          // Keyboard shortcuts configuration
  properties: Properties;  // Zoom limits and interaction properties
}

// Configuration with IndexedDB auto-save
await render.loadConfiguration({
  history: true,
  pan: true,
  zoom: true,
  snap: true,
  transform: true,
  selection: true,
  save: "indexeddb",       // Enable IndexedDB persistence
  keywords: {
    // ... keyboard shortcuts
  },
  properties: {
    zoomFactor: 1.05,
    minZoom: 0.1,
    maxZoom: 5.0
  }
});
```

### IndexedDB Integration

When using `save: "indexeddb"`, Rendraw provides progress tracking for save and load operations:

```typescript
// Set up progress callbacks for IndexedDB operations
render.onSavingProgress = (progress) => {
  console.log(`Saving: ${Math.round(progress.p * 100)}%`);
  if (progress.state) {
    console.log('Save operation in progress...');
  } else {
    console.log('Save operation completed!');
  }
};

render.onLoadProgress = (progress) => {
  console.log(`Loading: ${Math.round(progress.p * 100)}%`);
  if (progress.state) {
    console.log('Load operation in progress...');
  } else {
    console.log('Load operation completed!');
  }
};

// Load configuration with IndexedDB
await render.loadConfiguration({
  save: "indexeddb",
  // ... other config options
});

// The canvas will automatically save to IndexedDB when changes occur
// Progress will be reported through onSavingProgress callback

// Manual load from IndexedDB
await render.load(); // Progress reported through onLoadProgress callback
```

### IndexedDB Database Features

The IndexedDB integration provides:

- **Automatic Background Saving**: Canvas state is automatically saved when changes occur
- **Progress Tracking**: Real-time progress updates for save/load operations
- **Web Worker Support**: Heavy operations run in background workers for better performance
- **Type-Safe Schema**: Full TypeScript support for database operations
- **Bulk Operations**: Efficient handling of large datasets
- **Database Size Monitoring**: Track storage usage

```typescript
// Access the database instance (when using IndexedDB)
const database = render.database;

// Get database size in megabytes
const sizeMB = await database?.getDatabaseSizeMB();
console.log(`Database size: ${sizeMB?.toFixed(2)} MB`);

// Manual database operations (advanced usage)
const nodesTable = database?.getTable("nodes");
const allShapes = await nodesTable?.getAll();
```

### Keyboard Shortcuts Interface

```typescript
// Keyboard shortcuts interface
interface Keys {
  undo: string;            // Undo last action (default: "ctrl+z")
  redo: string;            // Redo last undone action (default: "ctrl+y")
  save: string;            // Save canvas state (default: "ctrl+s")
  copy: string;            // Copy selected shapes (default: "ctrl+c")
  cut: string;             // Cut selected shapes (default: "ctrl+x")
  paste: string;           // Paste shapes from clipboard (default: "ctrl+v")
  duplicate: string;       // Duplicate selected shapes (default: "ctrl+d")
  delete: string;          // Delete selected shapes (default: "delete")
  selectAll: string;       // Select all shapes (default: "ctrl+a")
  top: string;             // Bring shapes to top layer (default: "ctrl+i")
  bottom: string;          // Send shapes to bottom layer (default: "ctrl+k")
  front: string;           // Bring shapes forward one layer (default: "ctrl+shift+i")
  back: string;            // Send shapes back one layer (default: "ctrl+shift+k")
}
```

### Properties Interface

```typescript
// Properties interface
interface Properties {
  zoomFactor: number;      // Zoom increment/decrement factor (default: 1.05)
  minZoom?: number;        // Minimum zoom level (optional, default: 0.1)
  maxZoom?: number;        // Maximum zoom level (optional, default: 5.0)
}
```

### Auto-Save Methods

```typescript
// Auto-save methods
type AutoSaveMethods = "localstorage" | "indexeddb" | null;
```

## Advanced Features

### Camera System

```typescript
// Camera controls
render.currentCamera.bind(new Vector(400, 300));  // Center camera on point
render.currentCamera.bindForce(shape);             // Follow a shape
render.currentCamera.unbind();                     // Stop following

// Camera properties
render.currentCamera.offset;    // Current camera offset
render.currentCamera.maxOffset; // Target offset for smooth movement
```

### History Management

```typescript
// History is automatically managed when enabled in configuration
render.configuration.config.history = true;

// Manual history operations
render.history.save(render.serialize());  // Save current state
render.history.undo();                    // Undo last action
render.history.redo();                    // Redo last undone action
```

### Smart Snapping

```typescript
// Configure snapping appearance and behavior
render.snapSmart.setConfig({
  color: "rgba(0, 255, 255, 0.5)",        // Guide line color for shape alignment
  colorViewport: "rgba(255, 255, 255, 1)", // Guide line color for viewport alignment
  lineWidth: 2,                            // Guide line thickness in pixels
  lineDash: [5, 5],                       // Dashed line pattern [dash, gap]
  snapFactor: 10,                         // Base snap distance calculation factor
  snapTolerance: 15,                      // Tolerance distance for snapping in pixels
  snapDistance: 1000,                     // Maximum distance to search for snap targets
  enableSpacingPatterns: true,            // Enable spacing pattern detection
  spacingTolerance: 5                     // Tolerance for spacing pattern detection
});

// Enable debug mode to see snap candidates and patterns
render.snapSmart.debug(true);             // Show debug information
render.snapSmart.debug(false);            // Hide debug information

// Snapping is automatically handled when enabled in configuration
render.configuration.config.snap = true;

// Manual snapping operations
render.snapSmart.bind(shape);             // Bind snapping to a specific shape
render.snapSmart.unbind();                // Unbind current snapping target
render.snapSmart.update();                // Update snap calculations
render.snapSmart.drawGuides();            // Draw snap guide lines
render.snapSmart.clearGuides();           // Clear all guide lines
```

### Selection and Transformation

```typescript
// Multi-selection using transformer
render.transformer.add(shape1);           // Add shape to selection
render.transformer.add(shape2);           // Add another shape
render.transformer.selectAll();           // Select all shapes
render.transformer.clear();               // Clear selection

// Transform selected shapes
render.transformer.childs;                // Get selected shapes Map

// Configure transformer appearance
render.transformer.setConfig({
  borderWidth: 2,                          // Selection border thickness
  borderColor: "#0c89e4",                 // Selection border color
  nodeBorderColor: "#0c89e4",             // Resize handle border color
  nodeColor: "rgba(255, 255, 255, 1)",   // Resize handle fill color
  nodeBorderWidth: 1,                     // Resize handle border thickness
  nodeSize: 8,                            // Resize handle size in pixels
  target: true,                           // Show target info box
  targetColor: "rgba(255, 255, 255, 1)",  // Target text color
  targetBackgroundColor: "#0c89e4",       // Target background color
  targetBorderWidth: 2,                   // Target border thickness
  targetBorderColor: "#0c89e4",           // Target border color
  targetRadius: 10,                       // Target corner radius
  targetFontSize: 12,                     // Target font size
  targetFontFamily: "sans-serif",         // Target font family
  targetFontWeight: "500",                // Target font weight
  targetFontStyle: "normal"               // Target font style
});

// Transformer visibility
render.transformer.show();                // Show transformer
render.transformer.hide();                // Hide transformer
```

### Export System

```typescript
// Export canvas as image
const blob = await render.exporter.export({
  format: "png",
  quality: "high",
  name: "my-canvas"
});

// Export with cropping
const croppedBlob = await render.exporter.export({
  format: "jpeg",
  quality: "medium",
  name: "cropped-canvas",
  cutStart: new Vector(100, 100),
  cutEnd: new Vector(500, 400)
});

// Direct download
await render.exporter.download({
  format: "png",
  quality: "high",
  name: "canvas-export"
});

// Export as JSON data
const jsonBlob = await render.exporter.export({
  format: "json",
  name: "canvas-data"
});
```

#### Interactive Export with Visual Selection

The export system includes an interactive cutting tool that allows users to visually select the area to export with real-time feedback:

```typescript
// Start interactive export mode
render.exporter.startExportCut();

// This displays a visual selection overlay where:
// - The selected area appears normal
// - The area outside the selection appears dimmed/opaque
// - Users can drag to select the export area

// Get the dimensions of the selected area
const dimensions = render.exporter.getDimension();
if (dimensions) {
  console.log('Selection start:', dimensions.start);
  console.log('Selection end:', dimensions.end);
}

// Export the selected area
await render.exporter.download({
  format: "png",
  quality: "high",
  name: "selected-area",
  scale: 2,
  jpegQuality: 0.98,
  cutStart: dimensions.start,
  cutEnd: dimensions.end
});

// End the interactive export mode
render.exporter.endExportCut();

// Cancel the interactive export mode
render.exporter.abort();
```

#### Complete Interactive Export Example

```typescript
// State variables
let cutting = false;
let isExporting = false;

// Create buttons
const selectButton = document.createElement('button');
selectButton.textContent = 'Select Export Area';

const exportButton = document.createElement('button');
exportButton.textContent = 'Export Selected Area';
exportButton.style.display = 'none';

const cancelButton = document.createElement('button');
cancelButton.textContent = 'Cancel';
cancelButton.style.display = 'none';

// Add buttons to page
const buttonContainer = document.createElement('div');
buttonContainer.appendChild(selectButton);
buttonContainer.appendChild(exportButton);
buttonContainer.appendChild(cancelButton);
document.body.appendChild(buttonContainer);

// Handle start cut
selectButton.addEventListener('click', () => {
  if (!render) return;
  
  render.exporter.startExportCut();
  cutting = true;
  
  // Show/hide buttons
  selectButton.style.display = 'none';
  exportButton.style.display = 'inline-block';
  cancelButton.style.display = 'inline-block';
});

// Handle export
exportButton.addEventListener('click', async () => {
  if (!render || isExporting) return;

  const dimensions = render.exporter.getDimension();
  if (!dimensions) return;
  
  isExporting = true;
  exportButton.textContent = 'Exporting...';
  exportButton.disabled = true;
  
  try {
    await render.exporter.download({
      format: "png",
      quality: "high",
      name: "canvas-export",
      scale: 2,
      jpegQuality: 0.98,
      cutStart: dimensions.start,
      cutEnd: dimensions.end
    });
    
    render.exporter.endExportCut();
    cutting = false;
    
    // Reset buttons
    selectButton.style.display = 'inline-block';
    exportButton.style.display = 'none';
    cancelButton.style.display = 'none';
    exportButton.textContent = 'Export Selected Area';
    exportButton.disabled = false;
    
  } catch (error) {
    console.error("Export failed:", error);
    alert("Export failed. The image might be too large. Try reducing the quality or crop area.");
  } finally {
    isExporting = false;
    exportButton.textContent = 'Export Selected Area';
    exportButton.disabled = false;
  }
});

// Handle cancel
cancelButton.addEventListener('click', () => {
  if (!render) return;
  
  render.exporter.abort();
  cutting = false;
  
  // Reset buttons
  selectButton.style.display = 'inline-block';
  exportButton.style.display = 'none';
  cancelButton.style.display = 'none';
});
```

#### Export Methods Reference

```typescript
interface Exporter {
  // Start interactive selection mode
  startExportCut(): void;
  
  // End interactive selection mode
  endExportCut(): void;
  
  // Cancel/abort interactive selection mode
  abort(): void;
  
  // Get current selection dimensions
  getDimension(): { start: Vector; end: Vector } | null;
  
  // Export with full options
  export(options: ExportOptions): Promise<Blob>;
  
  // Direct download
  download(options: ExportOptions): Promise<void>;
}

interface ExportOptions {
  format: "png" | "jpeg" | "json";
  quality?: "high" | "medium" | "low";
  name: string;
  scale?: number;                    // Scale factor for higher resolution exports
  jpegQuality?: number;              // JPEG quality (0.0 to 1.0)
  cutStart?: Vector;                 // Start position for cropping
  cutEnd?: Vector;                   // End position for cropping
}
```

## Examples

### Complete Interactive Canvas

```typescript
import { Render, Vector } from 'rendraw';

// Setup canvas with full configuration
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const render = new Render(canvas, {
  history: true,
  pan: true,
  zoom: true,
  transform: true,
  selection: true,
  snap: true,
  save: "localstorage",
  keywords: {
    undo: "ctrl+z",
    redo: "ctrl+y",
    copy: "ctrl+c",
    paste: "ctrl+v",
    delete: "delete",
    duplicate: "ctrl+d",
    selectAll: "ctrl+a"
  },
  properties: {
    zoomFactor: 1.1,
    minZoom: 0.1,
    maxZoom: 5.0
  }
});

// Create various shapes
const rect = render.creator.Rect({
  position: new Vector(50, 50),
  width: 100,
  height: 80,
  color: '#3498db',
  borderWidth: 2,
  borderColor: '#2980b9'
});

const circle = render.creator.Circle({
  position: new Vector(200, 150),
  radius: 40,
  color: '#e74c3c'
});

const text = render.creator.Text({
  position: new Vector(300, 50),
  text: 'Interactive Canvas',
  fontSize: 18,
  fontWeight: 'bold',
  color: '#2c3e50'
});

// Event handling
render.on('click', (event) => {
  console.log('Canvas clicked:', event.pointer.world);
});

render.on('create', (event) => {
  console.log('Shape created:', event.shape.id);
});

render.on('save', (event) => {
  console.log('Canvas saved with', event.data.length, 'shapes');
});

// Start rendering
render.start();
```

### Dynamic Shape Creation

```typescript
// Create shapes based on user input
function createShapeAtPosition(type: string, position: Vector) {
  switch (type) {
    case 'rect':
      return render.creator.Rect({
        position,
        width: 80,
        height: 60,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      });
    
    case 'circle':
      return render.creator.Circle({
        position,
        radius: 30,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      });
    
    case 'text':
      return render.creator.Text({
        position,
        text: 'New Text',
        fontSize: 16,
        color: '#333'
      });
  }
}

// Handle canvas clicks to create shapes
render.on('click', (event) => {
  if (event.target === render) { // Clicked on empty canvas
    createShapeAtPosition('rect', event.pointer.world);
  }
});
```

### Working with Images and Clipboard

```typescript
// Handle image paste from clipboard
render.on('paste', (event) => {
  console.log('Pasted', event.data.length, 'items');
});

// Create image from URL
const image = render.creator.Image({
  position: new Vector(100, 100),
  src: 'https://picsum.photos/200/150',
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#ddd'
});

// Handle image loading
image.on('load', () => {
  console.log('Image loaded successfully');
});

image.on('error', () => {
  console.log('Failed to load image');
});
```

## Event System

### Available Events

| Event | Description | Event Data |
|-------|-------------|------------|
| `click` | Canvas or shape clicked | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `dblclick` | Double-click event | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `mousemove` | Mouse movement | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `mousedown` | Mouse button pressed | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `mouseup` | Mouse button released | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `create` | Shape created | `{ shape: Shape }` |
| `save` | Canvas saved | `{ data: ShapeRawData[] }` |
| `load` | Canvas loaded | `{ data: ShapeRawData[] }` |
| `undo` | Undo operation | `{}` |
| `redo` | Redo operation | `{}` |
| `copy` | Copy operation | `{ data: ShapeRawData[] }` |
| `cut` | Cut operation | `{ data: ShapeRawData[] }` |
| `paste` | Paste operation | `{ data: Shape[] }` |
| `delete` | Delete operation | `{ data: Shape[] }` |
| `selectAll` | Select all operation | `{ data: Shape[] }` |
| `top` | Bring to top | `{ data: Shape[] }` |
| `bottom` | Send to bottom | `{ data: Shape[] }` |
| `front` | Bring forward | `{ data: Shape[] }` |
| `back` | Send backward | `{ data: Shape[] }` |

### Event Usage Examples

```typescript
// Type-safe event handling
render.on('click', (event) => {
  const { pointer, target } = event;
  console.log(`Clicked at world position: ${pointer.world.x}, ${pointer.world.y}`);
  
  if (target instanceof Shape) {
    console.log(`Clicked on shape: ${target.id}`);
  } else {
    console.log('Clicked on empty canvas');
  }
});

// Shape-specific events
render.on('create', (event) => {
  const shape = event.shape;
  console.log(`Created ${shape.type} at position ${shape.position.x}, ${shape.position.y}`);
});

// Keyboard shortcut events
render.on('save', (event) => {
  // Handle Ctrl+S
  const canvasData = event.data;
  localStorage.setItem('canvas-backup', JSON.stringify(canvasData));
});
```

## Use Cases

Rendraw is designed for building:

- **Graphic Design Tools**: Canvas-based editors similar to Canva or Figma
- **Diagramming Applications**: Flowchart, UML, and network diagram editors
- **Collaborative Whiteboards**: Real-time collaborative drawing and brainstorming tools
- **Game Level Editors**: 2D game development and level design tools
- **Data Visualization**: Interactive charts, graphs, and dashboard builders
- **Prototyping Tools**: UI/UX wireframing and mockup applications
- **Educational Software**: Interactive learning tools and simulations
- **Mind Mapping**: Visual thinking and concept mapping applications

## Browser Compatibility

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## Requirements

- **Node.js**: >= 16.0.0
- **TypeScript**: >= 4.0.0 (for TypeScript projects)
- **Modern Browser**: Canvas API, ES6+ modules, and modern JavaScript features

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests to help improve Rendraw.

## License

This project is licensed under the GNU General Public License v3.0. See the [LICENSE](LICENSE) file for details.

---

**Rendraw** - Empowering developers to create interactive visual applications with ease.