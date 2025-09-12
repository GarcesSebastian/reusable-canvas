# Rendraw

Una potente biblioteca de TypeScript para crear aplicaciones de lienzo interactivas con formas, transformaciones y manejo de eventos. Rendraw proporciona un motor de renderizado completo para construir aplicaciones visuales como editores gráficos, herramientas de diagramación y pizarras colaborativas.

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Características](#características)
- [Instalación](#instalación)
- [Inicio Rápido](#inicio-rápido)
- [Referencia de la API](#referencia-de-la-api)
- [Ejemplos](#ejemplos)
- [Configuración](#configuración)
- [Sistema de Eventos](#sistema-de-eventos)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

## Descripción General

Rendraw está diseñado para simplificar la creación de aplicaciones interactivas basadas en lienzos. Construido con TypeScript, ofrece una base sólida para desarrollar herramientas visuales con características como manipulación de formas, manejo de eventos, gestión de historial y una arquitectura extensible.

**Autor**: [Sebxstt](https://github.com/GarcesSebastian)

## Características

### Funcionalidad Principal
- **Sistema de Formas**: Soporte integrado para rectángulos, círculos, texto e imágenes
- **Eventos Interactivos**: Manejo completo de eventos de ratón y teclado
- **Transformaciones**: Mover, rotar, escalar y manipular formas
- **Gestión de Historial**: Operaciones de deshacer/rehacer con límites configurables
- **Sistema de Cámara**: Capacidades de paneo y zoom para lienzos grandes

### Características Avanzadas
- **Ajuste Inteligente**: Asistencia automática para alineación y posicionamiento
- **Sistema de Selección**: Operaciones de selección múltiple y agrupación
- **Exportar/Importar**: Guardar y cargar estados del lienzo
- **Arquitectura Orientada a Eventos**: Sistema de eventos extensible para funcionalidades personalizadas
- **Soporte para TypeScript**: Seguridad de tipos completa y soporte de IntelliSense

## Instalación

```bash
npm install rendraw
```

## Inicio Rápido

### Configuración Básica

```typescript
import { Render, Vector } from 'rendraw';

// Obtén tu elemento canvas
const canvas = document.getElementById('myCanvas') as HTMLCanvasElement;

// Crea una instancia de Render (solo toma el elemento canvas)
const render = new Render(canvas);

// Carga la configuración de forma asíncrona
await render.loadConfiguration({
  history: true,           // Habilita el sistema de deshacer/rehacer
  pan: true,              // Habilita el paneo de la cámara con el ratón
  zoom: true,             // Habilita el zoom con la rueda del ratón
  transform: true,        // Habilita los manejadores de transformación de formas
  selection: true,        // Habilita la selección múltiple con un cuadro de arrastre
  snap: true,             // Habilita las guías de ajuste inteligente
  save: "localstorage",   // Autoguardado en localStorage ("indexeddb" | "localstorage" | null)
  keywords: {             // Atajos de teclado
    undo: "ctrl+z",
    redo: "ctrl+y",
    copy: "ctrl+c",
    paste: "ctrl+v",
    delete: "delete"      // También se puede usar "backspace"
  },
  properties: {           // Propiedades de zoom e interacción
    zoomFactor: 1.05,     // Factor de incremento de zoom
    minZoom: 0.1,         // Nivel mínimo de zoom
    maxZoom: 5.0          // Nivel máximo de zoom
  }
});

// Habilita el contador de FPS (opcional)
render.allowFps();

// Crea formas usando el creador incorporado
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

// El bucle de renderizado comienza automáticamente en el constructor
// render.start() se llama internamente
```

### Configuración HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>Aplicación de Lienzo con Rendraw</title>
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

## Referencia de la API

### Clases Principales

#### Render

El motor de renderizado principal que gestiona el lienzo, los eventos y todos los subsistemas.

```typescript
class Render extends RenderProvider {
  // Constructor
  constructor(canvas: HTMLCanvasElement)  // Solo toma el elemento canvas
  
  // Propiedades principales
  canvas: HTMLCanvasElement              // El elemento canvas HTML
  ctx: CanvasRenderingContext2D         // Contexto de renderizado 2D
  currentCamera: Camera                 // Sistema de cámara para paneo/zoom
  childrens: Map<string, Shape>         // Todas las formas en el lienzo por ID
  configuration: RenderConfiguration    // Gestor de configuración
  history: History                      // Sistema de deshacer/rehacer
  snapSmart: SnapSmart                 // Sistema de ajuste inteligente
  transformer: Transformer             // Transformador de selección múltiple
  selection: Selection                 // Sistema de caja de selección
  exporter: Exporter                   // Sistema de exportación/descarga
  creator: RenderCreator               // Fábrica de formas
  manager: RenderManager               // Gestión de formas
  showFps: boolean                     // Si se debe mostrar el contador de FPS
  
  // Métodos de configuración
  loadConfiguration(config: Partial<RenderConfigurationProps>): Promise<void>  // Cargar configuración de forma asíncrona
  
  // Métodos principales
  start(): void                        // Iniciar el bucle de renderizado (se llama automáticamente)
  stop(): void                         // Detener el bucle de renderizado
  resize(): void                       // Redimensionar el lienzo para que se ajuste al contenedor
  clear(): void                        // Limpiar todas las formas del lienzo
  
  // Métodos de FPS
  allowFps(): void                     // Habilitar la visualización del contador de FPS
  disallowFps(): void                  // Deshabilitar la visualización del contador de FPS
  
  // Gestión de datos
  serialize(): ShapeRawData[]          // Exportar todas las formas como datos JSON
  deserialize(data: ShapeRawData[]): void  // Importar formas desde datos JSON
  autoSave(): void                     // Disparar el autoguardado si está habilitado
  
  // Ayudantes de exportación
  preExport(): void                    // Preparar el lienzo para la exportación (ocultar UI)
  postExport(): void                   // Restaurar el lienzo después de la exportación
  
  // Métodos de utilidad
  mousePosition(): Vector              // Obtener la posición actual del ratón en coordenadas del mundo
  worldToScreen(worldPos: Vector): Vector    // Convertir coordenadas del mundo a la pantalla
  screenToWorld(screenPos: Vector): Vector   // Convertir coordenadas de la pantalla al mundo
  toWorldCoordinates(screenPos: Vector): Vector  // Conversión alternativa de coordenadas
}
```

#### RenderCreator

Clase de fábrica para crear formas con registro automático y emisión de eventos.

```typescript
class RenderCreator {
  constructor(render: Render)
  
  // Métodos de creación de formas
  Rect(props: IRect): Rect
  Circle(props: ICircle): Circle
  Text(props: IText): Text
  Image(props: IImage): Image
  Vector(x: number, y: number): Vector
}
```

### Sistema de Formas

#### Interfaz Base de Forma

```typescript
interface IShape {
  position: Vector;
  zIndex?: number;
  rotation?: number;
  dragging?: boolean;
  visible?: boolean;
}
```

#### Rectángulo (Rect)

```typescript
interface IRect extends IShape {
  width: number;            // Ancho del rectángulo en píxeles
  height: number;           // Alto del rectángulo en píxeles
  color?: string;           // Color de relleno (por defecto: "#000000")
  borderWidth?: number;     // Grosor del borde en píxeles (por defecto: 0)
  borderColor?: string;     // Color del borde (por defecto: "#000000")
  borderRadius?: number;    // Radio de las esquinas para esquinas redondeadas (por defecto: 0)
}

// Ejemplo de uso
const rect = render.creator.Rect({
  position: new Vector(50, 50),    // Posición de la esquina superior izquierda
  width: 100,                      // Ancho en píxeles
  height: 80,                      // Alto en píxeles
  color: '#2ecc71',               // Color de relleno verde
  borderWidth: 2,                 // Borde de 2px
  borderColor: '#27ae60',         // Borde verde más oscuro
  borderRadius: 5                 // Esquinas redondeadas
});
```

#### Círculo (Circle)

```typescript
interface ICircle extends IShape {
  radius: number;           // Radio del círculo en píxeles
  color?: string;           // Color de relleno (por defecto: "#000000")
}

// Ejemplo de uso
const circle = render.creator.Circle({
  position: new Vector(200, 200),  // Posición del centro
  radius: 50,                      // Radio en píxeles
  color: '#e74c3c'                // Color de relleno rojo
});
```

#### Texto (Text)

```typescript
interface IText extends IShape {
  text: string;                    // Contenido de texto a mostrar
  fontSize?: number;               // Tamaño de la fuente en píxeles (por defecto: 16)
  fontFamily?: string;             // Nombre de la familia de fuentes (por defecto: "Arial")
  fontWeight?: string;             // Grosor de la fuente: "normal", "bold", etc. (por defecto: "normal")
  fontStyle?: string;              // Estilo de la fuente: "normal", "italic" (por defecto: "normal")
  textAlign?: string;              // Alineación del texto: "left", "center", "right" (por defecto: "left")
  color?: string;                  // Color del texto (por defecto: "#000000")
  backgroundColor?: string;        // Color de fondo detrás del texto (por defecto: "transparent")
  borderWidth?: number;            // Grosor del borde alrededor del cuadro de texto (por defecto: 0)
  borderColor?: string;            // Color del borde (por defecto: "#000000")
  padding?: {                      // Espaciado interno alrededor del texto
    top: number;                   // Relleno superior en píxeles
    right: number;                 // Relleno derecho en píxeles
    bottom: number;                // Relleno inferior en píxeles
    left: number;                  // Relleno izquierdo en píxeles
  };
}

// Ejemplo de uso
const text = render.creator.Text({
  position: new Vector(100, 300),     // Posición superior izquierda del cuadro de texto
  text: '¡Hola Rendraw!',            // Texto a mostrar
  fontSize: 24,                      // Tamaño de fuente grande
  fontFamily: 'Arial',               // Familia de fuentes
  fontWeight: 'bold',                // Texto en negrita
  color: '#2c3e50',                 // Color de texto oscuro
  backgroundColor: '#ecf0f1',        // Fondo claro
  padding: { top: 10, right: 15, bottom: 10, left: 15 }  // Relleno alrededor del texto
});
```

#### Imagen (Image)

```typescript
interface IImage extends IShape {
  src: string;              // URL de la imagen o URL de datos
  width?: number;           // Ancho de la imagen en píxeles (se detecta automáticamente si no se proporciona)
  height?: number;          // Alto de la imagen en píxeles (se detecta automáticamente si no se proporciona)
  borderWidth?: number;     // Grosor del borde alrededor de la imagen (por defecto: 0)
  borderColor?: string;     // Color del borde (por defecto: "#000000")
  borderRadius?: number;    // Radio de las esquinas para una imagen redondeada (por defecto: 0)
}

// Ejemplo de uso
const image = render.creator.Image({
  position: new Vector(300, 100),     // Posición de la esquina superior izquierda
  src: 'https://example.com/image.jpg', // URL de origen de la imagen
  width: 200,                         // Forzar un ancho específico
  height: 150,                        // Forzar un alto específico
  borderRadius: 10                    // Esquinas redondeadas
});
```

## Sistema de Configuración

### RenderConfiguration

```typescript
interface RenderConfigurationProps {
  history: boolean;         // Habilitar el sistema de deshacer/rehacer con guardado automático de estado
  pan: boolean;            // Habilitar el paneo de la cámara con arrastre del ratón
  zoom: boolean;           // Habilitar la funcionalidad de zoom con la rueda del ratón
  snap: boolean;           // Habilitar las guías de ajuste inteligente para la alineación
  transform: boolean;      // Habilitar los manejadores de transformación de formas para redimensionar/rotar
  selection: boolean;      // Habilitar la selección múltiple con un cuadro de arrastre
  save: AutoSaveMethods;   // Método de autoguardado: "localstorage" | "indexeddb" | null
  keywords: Keys;          // Configuración de atajos de teclado
  properties: Properties;  // Límites de zoom y propiedades de interacción
}

// Configuración con autoguardado en IndexedDB
await render.loadConfiguration({
  history: true,
  pan: true,
  zoom: true,
  snap: true,
  transform: true,
  selection: true,
  save: "indexeddb",       // Habilitar persistencia en IndexedDB
  keywords: {
    // ... atajos de teclado
  },
  properties: {
    zoomFactor: 1.05,
    minZoom: 0.1,
    maxZoom: 5.0
  }
});
```

### Integracion con IndexedDB

Cuando se usa `save: "indexeddb"`, Rendraw proporciona seguimiento del progreso para las operaciones de guardado y carga:

```typescript
// Configurar callbacks de progreso para operaciones de IndexedDB
render.onSavingProgress = (progress) => {
  console.log(`Guardando: ${Math.round(progress.p * 100)}%`);
  if (progress.state) {
    console.log('Operación de guardado en progreso...');
  } else {
    console.log('¡Operación de guardado completada!');
  }
};

render.onLoadProgress = (progress) => {
  console.log(`Cargando: ${Math.round(progress.p * 100)}%`);
  if (progress.state) {
    console.log('Operación de carga en progreso...');
  } else {
    console.log('¡Operación de carga completada!');
  }
};

// Cargar configuración con IndexedDB
await render.loadConfiguration({
  save: "indexeddb",
  // ... otras opciones de configuración
});

// El lienzo se guardará automáticamente en IndexedDB cuando ocurran cambios
// El progreso se informará a través del callback onSavingProgress

// Carga manual desde IndexedDB
await render.load(); // El progreso se informa a través del callback onLoadProgress
```

### Características de la Base de Datos IndexedDB

La integración con IndexedDB proporciona:

- **Guardado Automático en Segundo Plano**: El estado del lienzo se guarda automáticamente cuando ocurren cambios.
- **Seguimiento del Progreso**: Actualizaciones de progreso en tiempo real para operaciones de guardado/carga.
- **Soporte de Web Workers**: Las operaciones pesadas se ejecutan en workers en segundo plano para un mejor rendimiento.
- **Esquema con Tipado Seguro**: Soporte completo de TypeScript para operaciones de base de datos.
- **Operaciones Masivas**: Manejo eficiente de grandes conjuntos de datos.
- **Monitoreo del Tamaño de la Base de Datos**: Seguimiento del uso del almacenamiento.

```typescript
// Acceder a la instancia de la base de datos (cuando se usa IndexedDB)
const database = render.database;

// Obtener el tamaño de la base de datos en megabytes
const sizeMB = await database?.getDatabaseSizeMB();
console.log(`Tamaño de la base de datos: ${sizeMB?.toFixed(2)} MB`);

// Operaciones manuales de la base de datos (uso avanzado)
const nodesTable = database?.getTable("nodes");
const allShapes = await nodesTable?.getAll();
```

### Interfaz de Atajos de Teclado

```typescript
// Interfaz de atajos de teclado
interface Keys {
  undo: string;            // Deshacer la última acción (por defecto: "ctrl+z")
  redo: string;            // Rehacer la última acción deshecha (por defecto: "ctrl+y")
  save: string;            // Guardar el estado del lienzo (por defecto: "ctrl+s")
  copy: string;            // Copiar las formas seleccionadas (por defecto: "ctrl+c")
  cut: string;             // Cortar las formas seleccionadas (por defecto: "ctrl+x")
  paste: string;           // Pegar formas del portapapeles (por defecto: "ctrl+v")
  duplicate: string;       // Duplicar las formas seleccionadas (por defecto: "ctrl+d")
  delete: string;          // Eliminar las formas seleccionadas (por defecto: "delete")
  selectAll: string;       // Seleccionar todas las formas (por defecto: "ctrl+a")
  top: string;             // Traer las formas a la capa superior (por defecto: "ctrl+i")
  bottom: string;          // Enviar las formas a la capa inferior (por defecto: "ctrl+k")
  front: string;           // Traer las formas una capa hacia adelante (por defecto: "ctrl+shift+i")
  back: string;            // Enviar las formas una capa hacia atrás (por defecto: "ctrl+shift+k")
}
```

### Interfaz de Propiedades

```typescript
// Interfaz de propiedades
interface Properties {
  zoomFactor: number;      // Factor de incremento/decremento de zoom (por defecto: 1.05)
  minZoom?: number;        // Nivel mínimo de zoom (opcional, por defecto: 0.1)
  maxZoom?: number;        // Nivel máximo de zoom (opcional, por defecto: 5.0)
}
```

### Métodos de Autoguardado

```typescript
// Métodos de autoguardado
type AutoSaveMethods = "localstorage" | "indexeddb" | null;
```

## Características Avanzadas

### Sistema de Cámara

```typescript
// Controles de la cámara
render.currentCamera.bind(new Vector(400, 300));  // Centrar la cámara en un punto
render.currentCamera.bindForce(shape);             // Seguir una forma
render.currentCamera.unbind();                     // Dejar de seguir

// Propiedades de la cámara
render.currentCamera.offset;    // Desplazamiento actual de la cámara
render.currentCamera.maxOffset; // Desplazamiento objetivo para un movimiento suave
```

### Gestión de Historial

```typescript
// El historial se gestiona automáticamente cuando está habilitado en la configuración
render.configuration.config.history = true;

// Operaciones manuales de historial
render.history.save(render.serialize());  // Guardar el estado actual
render.history.undo();                    // Deshacer la última acción
render.history.redo();                    // Rehacer la última acción deshecha
```

### Ajuste Inteligente (Smart Snapping)

```typescript
// Configurar la apariencia y el comportamiento del ajuste
render.snapSmart.setConfig({
  color: "rgba(0, 255, 255, 0.5)",        // Color de la línea guía para la alineación de formas
  colorViewport: "rgba(255, 255, 255, 1)", // Color de la línea guía para la alineación con el viewport
  lineWidth: 2,                            // Grosor de la línea guía en píxeles
  lineDash: [5, 5],                       // Patrón de línea discontinua [guion, espacio]
  snapFactor: 10,                         // Factor base para el cálculo de la distancia de ajuste
  snapTolerance: 15,                      // Distancia de tolerancia para el ajuste en píxeles
  snapDistance: 1000,                     // Distancia máxima para buscar objetivos de ajuste
  enableSpacingPatterns: true,            // Habilitar la detección de patrones de espaciado
  spacingTolerance: 5                     // Tolerancia para la detección de patrones de espaciado
});

// Habilitar el modo de depuración para ver candidatos y patrones de ajuste
render.snapSmart.debug(true);             // Mostrar información de depuración
render.snapSmart.debug(false);            // Ocultar información de depuración

// El ajuste se maneja automáticamente cuando está habilitado en la configuración
render.configuration.config.snap = true;

// Operaciones manuales de ajuste
render.snapSmart.bind(shape);             // Vincular el ajuste a una forma específica
render.snapSmart.unbind();                // Desvincular el objetivo de ajuste actual
render.snapSmart.update();                // Actualizar los cálculos de ajuste
render.snapSmart.drawGuides();            // Dibujar las líneas guía de ajuste
render.snapSmart.clearGuides();           // Limpiar todas las líneas guía
```

### Selección y Transformación

```typescript
// Selección múltiple usando el transformador
render.transformer.add(shape1);           // Añadir forma a la selección
render.transformer.add(shape2);           // Añadir otra forma
render.transformer.selectAll();           // Seleccionar todas las formas
render.transformer.clear();               // Limpiar la selección

// Transformar las formas seleccionadas
render.transformer.childs;                // Obtener el Map de formas seleccionadas

// Configurar la apariencia del transformador
render.transformer.setConfig({
  borderWidth: 2,                          // Grosor del borde de selección
  borderColor: "#0c89e4",                 // Color del borde de selección
  nodeBorderColor: "#0c89e4",             // Color del borde del manejador de redimensión
  nodeColor: "rgba(255, 255, 255, 1)",   // Color de relleno del manejador de redimensión
  nodeBorderWidth: 1,                     // Grosor del borde del manejador de redimensión
  nodeSize: 8,                            // Tamaño del manejador de redimensión en píxeles
  target: true,                           // Mostrar cuadro de información del objetivo
  targetColor: "rgba(255, 255, 255, 1)",  // Color del texto del objetivo
  targetBackgroundColor: "#0c89e4",       // Color de fondo del objetivo
  targetBorderWidth: 2,                   // Grosor del borde del objetivo
  targetBorderColor: "#0c89e4",           // Color del borde del objetivo
  targetRadius: 10,                       // Radio de las esquinas del objetivo
  targetFontSize: 12,                     // Tamaño de la fuente del objetivo
  targetFontFamily: "sans-serif",         // Familia de fuentes del objetivo
  targetFontWeight: "500",                // Grosor de la fuente del objetivo
  targetFontStyle: "normal"               // Estilo de la fuente del objetivo
});

// Visibilidad del transformador
render.transformer.show();                // Mostrar el transformador
render.transformer.hide();                // Ocultar el transformador
```

### Sistema de Exportación

```typescript
// Exportar el lienzo como imagen
const blob = await render.exporter.export({
  format: "png",
  quality: "high",
  name: "my-canvas"
});

// Exportar con recorte
const croppedBlob = await render.exporter.export({
  format: "jpeg",
  quality: "medium",
  name: "cropped-canvas",
  cutStart: new Vector(100, 100),
  cutEnd: new Vector(500, 400)
});

// Descarga directa
await render.exporter.download({
  format: "png",
  quality: "high",
  name: "canvas-export"
});

// Exportar como datos JSON
const jsonBlob = await render.exporter.export({
  format: "json",
  name: "canvas-data"
});
```

#### Exportación Interactiva con Selección Visual

El sistema de exportación incluye una herramienta de recorte interactiva que permite a los usuarios seleccionar visualmente el área a exportar con retroalimentación en tiempo real:

```typescript
// Iniciar el modo de exportación interactiva
render.exporter.startExportCut();

// Esto muestra una superposición de selección visual donde:
// - El área seleccionada aparece normal
// - El área fuera de la selección aparece atenuada/opaca
// - Los usuarios pueden arrastrar para seleccionar el área de exportación

// Obtener las dimensiones del área seleccionada
const dimensions = render.exporter.getDimension();
if (dimensions) {
  console.log('Inicio de la selección:', dimensions.start);
  console.log('Fin de la selección:', dimensions.end);
}

// Exportar el área seleccionada
await render.exporter.download({
  format: "png",
  quality: "high",
  name: "area-seleccionada",
  scale: 2,
  jpegQuality: 0.98,
  cutStart: dimensions.start,
  cutEnd: dimensions.end
});

// Finalizar el modo de exportación interactiva
render.exporter.endExportCut();

// Cancelar el modo de exportación interactiva
render.exporter.abort();
```

#### Ejemplo Completo de Exportación Interactiva

```typescript
// Variables de estado
let cutting = false;
let isExporting = false;

// Crear botones
const selectButton = document.createElement('button');
selectButton.textContent = 'Seleccionar Área de Exportación';

const exportButton = document.createElement('button');
exportButton.textContent = 'Exportar Área Seleccionada';
exportButton.style.display = 'none';

const cancelButton = document.createElement('button');
cancelButton.textContent = 'Cancelar';
cancelButton.style.display = 'none';

// Agregar botones a la página
const buttonContainer = document.createElement('div');
buttonContainer.appendChild(selectButton);
buttonContainer.appendChild(exportButton);
buttonContainer.appendChild(cancelButton);
document.body.appendChild(buttonContainer);

// Manejar inicio de selección
selectButton.addEventListener('click', () => {
  if (!render) return;
  
  render.exporter.startExportCut();
  cutting = true;
  
  // Mostrar/ocultar botones
  selectButton.style.display = 'none';
  exportButton.style.display = 'inline-block';
  cancelButton.style.display = 'inline-block';
});

// Manejar exportación
exportButton.addEventListener('click', async () => {
  if (!render || isExporting) return;

  const dimensions = render.exporter.getDimension();
  if (!dimensions) return;
  
  isExporting = true;
  exportButton.textContent = 'Exportando...';
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
    
    // Restablecer botones
    selectButton.style.display = 'inline-block';
    exportButton.style.display = 'none';
    cancelButton.style.display = 'none';
    exportButton.textContent = 'Exportar Área Seleccionada';
    exportButton.disabled = false;
    
  } catch (error) {
    console.error("Error en la exportación:", error);
    alert("Error en la exportación. La imagen podría ser demasiado grande. Intenta reducir la calidad o el área de recorte.");
  } finally {
    isExporting = false;
    exportButton.textContent = 'Exportar Área Seleccionada';
    exportButton.disabled = false;
  }
});

// Manejar cancelación
cancelButton.addEventListener('click', () => {
  if (!render) return;
  
  render.exporter.abort();
  cutting = false;
  
  // Restablecer botones
  selectButton.style.display = 'inline-block';
  exportButton.style.display = 'none';
  cancelButton.style.display = 'none';
});
```

#### Referencia de Métodos de Exportación

```typescript
interface Exporter {
  // Iniciar el modo de selección interactiva
  startExportCut(): void;
  
  // Finalizar el modo de selección interactiva
  endExportCut(): void;
  
  // Cancelar/abortar el modo de selección interactiva
  abort(): void;
  
  // Obtener las dimensiones de la selección actual
  getDimension(): { start: Vector; end: Vector } | null;
  
  // Exportar con opciones completas
  export(options: ExportOptions): Promise<Blob>;
  
  // Descarga directa
  download(options: ExportOptions): Promise<void>;
}

interface ExportOptions {
  format: "png" | "jpeg" | "json";
  quality?: "high" | "medium" | "low";
  name: string;
  scale?: number;                    // Factor de escala para exportaciones de mayor resolución
  jpegQuality?: number;              // Calidad JPEG (0.0 a 1.0)
  cutStart?: Vector;                 // Posición de inicio para recorte
  cutEnd?: Vector;                   // Posición final para recorte
}
```

## Ejemplos

### Lienzo Interactivo Completo

```typescript
import { Render, Vector } from 'rendraw';

// Configuración del lienzo con todas las opciones
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

// Crear varias formas
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
  text: 'Lienzo Interactivo',
  fontSize: 18,
  fontWeight: 'bold',
  color: '#2c3e50'
});

// Manejo de eventos
render.on('click', (event) => {
  console.log('Lienzo clickeado:', event.pointer.world);
});

render.on('create', (event) => {
  console.log('Forma creada:', event.shape.id);
});

render.on('save', (event) => {
  console.log('Lienzo guardado con', event.data.length, 'formas');
});

// Iniciar el renderizado
render.start();
```

### Creación Dinámica de Formas

```typescript
// Crear formas basadas en la entrada del usuario
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
        text: 'Nuevo Texto',
        fontSize: 16,
        color: '#333'
      });
  }
}

// Manejar clics en el lienzo para crear formas
render.on('click', (event) => {
  if (event.target === render) { // Clic en el lienzo vacío
    createShapeAtPosition('rect', event.pointer.world);
  }
});
```

### Trabajando con Imágenes y Portapapeles

```typescript
// Manejar el pegado de imágenes desde el portapapeles
render.on('paste', (event) => {
  console.log('Pegado', event.data.length, 'elementos');
});

// Crear imagen desde URL
const image = render.creator.Image({
  position: new Vector(100, 100),
  src: 'https://picsum.photos/200/150',
  borderRadius: 10,
  borderWidth: 2,
  borderColor: '#ddd'
});

// Manejar la carga de la imagen
image.on('load', () => {
  console.log('Imagen cargada exitosamente');
});

image.on('error', () => {
  console.log('Error al cargar la imagen');
});
```

## Sistema de Eventos

### Eventos Disponibles

| Evento | Descripción | Datos del Evento |
|-------|-------------|------------------|
| `click` | Lienzo o forma clickeada | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `dblclick` | Evento de doble clic | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `mousemove` | Movimiento del ratón | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `mousedown` | Botón del ratón presionado | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `mouseup` | Botón del ratón liberado | `{ pointer: { absolute: Vector, world: Vector }, target: Shape \| Render }` |
| `create` | Forma creada | `{ shape: Shape }` |
| `save` | Lienzo guardado | `{ data: ShapeRawData[] }` |
| `load` | Lienzo cargado | `{ data: ShapeRawData[] }` |
| `undo` | Operación de deshacer | `{}` |
| `redo` | Operación de rehacer | `{}` |
| `copy` | Operación de copiar | `{ data: ShapeRawData[] }` |
| `cut` | Operación de cortar | `{ data: ShapeRawData[] }` |
| `paste` | Operación de pegar | `{ data: Shape[] }` |
| `delete` | Operación de eliminar | `{ data: Shape[] }` |
| `selectAll` | Operación de seleccionar todo | `{ data: Shape[] }` |
| `top` | Traer al frente | `{ data: Shape[] }` |
| `bottom` | Enviar al fondo | `{ data: Shape[] }` |
| `front` | Traer hacia adelante | `{ data: Shape[] }` |
| `back` | Enviar hacia atrás | `{ data: Shape[] }` |

### Ejemplos de Uso de Eventos

```typescript
// Manejo de eventos con tipado seguro
render.on('click', (event) => {
  const { pointer, target } = event;
  console.log(`Clickeado en la posición del mundo: ${pointer.world.x}, ${pointer.world.y}`);
  
  if (target instanceof Shape) {
    console.log(`Clickeado en la forma: ${target.id}`);
  } else {
    console.log('Clickeado en el lienzo vacío');
  }
});

// Eventos específicos de formas
render.on('create', (event) => {
  const shape = event.shape;
  console.log(`Creado ${shape.type} en la posición ${shape.position.x}, ${shape.position.y}`);
});

// Eventos de atajos de teclado
render.on('save', (event) => {
  // Manejar Ctrl+S
  const canvasData = event.data;
  localStorage.setItem('canvas-backup', JSON.stringify(canvasData));
});
```

## Casos de Uso

Rendraw está diseñado para construir:

- **Herramientas de Diseño Gráfico**: Editores basados en lienzo similares a Canva o Figma
- **Aplicaciones de Diagramación**: Editores de diagramas de flujo, UML y redes
- **Pizarras Colaborativas**: Herramientas de dibujo colaborativo y lluvia de ideas en tiempo real
- **Editores de Niveles de Juegos**: Herramientas de desarrollo de juegos 2D y diseño de niveles
- **Visualización de Datos**: Constructores interactivos de gráficos, diagramas y paneles de control
- **Herramientas de Prototipado**: Aplicaciones de wireframing y mockup para UI/UX
- **Software Educativo**: Herramientas de aprendizaje interactivo y simulaciones
- **Mapas Mentales**: Aplicaciones de pensamiento visual y mapeo de conceptos

## Compatibilidad de Navegadores

- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## Requisitos

- **Node.js**: >= 16.0.0
- **TypeScript**: >= 4.0.0 (para proyectos de TypeScript)
- **Navegador Moderno**: API Canvas, módulos ES6+ y características modernas de JavaScript

## Contribuciones

¡Las contribuciones son bienvenidas! No dudes en enviar issues, solicitudes de características o pull requests para ayudar a mejorar Rendraw.

## Licencia

Este proyecto está licenciado bajo la Licencia Pública General GNU v3.0. Consulta el archivo [LICENSE](LICENSE) para obtener más detalles.

---

**Rendraw** - Empoderando a los desarrolladores para crear aplicaciones visuales interactivas con facilidad.