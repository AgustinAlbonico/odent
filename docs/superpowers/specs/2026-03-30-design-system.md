# Design System Spec — Sistema Odontológico

> **Fecha**: 2026-03-30
> **Estado**: aprobado
> **Personalidad**: Profesional clínico
> **Stack visual**: Tailwind CSS v4 + CVA + Radix UI Primitives
> **Paquete**: `packages/ui`

---

## 1. Decisiones de dirección visual

| Decisión | Valor | Razón |
|----------|-------|-------|
| Personalidad | Profesional clínico | Transmite confianza para datos clínicos y financieros en uso diario prolongado |
| Color principal | Teal (#0D9488) | Diferenciador en el mercado odontológico argentino, fresco sin perder seriedad |
| Presencia del color | Acento sobre neutro | Máxima legibilidad y sostenibilidad visual para uso 8-10hs/día |
| Densidad | Equilibrada tirando a generosa | Profesional sin sentirse apretado, sin desperdiciar espacio |
| Esquinas | Redondeadas suaves (8px) | Moderno sin ser juguetón |
| Dark mode | Sí, desde el inicio | Tokens duplicados ahora evitan refactor monumental después |
| Tipografía | Inter | Legibilidad máxima para datos clínicos, tablas y formularios |
| Arquitectura | Tailwind puro + CVA + Radix | Control total, sin dependencias de UI pesadas, compatible con monorepo |

---

## 2. Sistema de color

### 2.1 Estructura

Los colores se organizan en 3 capas conceptuales:

- **Brand** — el teal crudo, referencia interna, NO se usa directamente en componentes.
- **Semantic** — para qué se usa (primary, destructive, muted, etc.). Son los tokens que exponemos.
- **Component** — aplicación concreta (botón primary, badge success, etc.). Se resuelve con semantic + CVA.

### 2.2 Paleta principal — Light Mode

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-background` | `oklch(100% 0 0)` (#FFFFFF) | Fondo principal |
| `--color-foreground` | `oklch(20% 0.02 260)` (#0F172A) | Texto principal |
| `--color-muted` | `oklch(96.5% 0.005 260)` (#F1F5F9) | Fondos secundarios, hover sutil |
| `--color-muted-foreground` | `oklch(55% 0.015 260)` (#64748B) | Texto secundario, placeholders |
| `--color-card` | `oklch(100% 0 0)` (#FFFFFF) | Fondo de cards |
| `--color-card-foreground` | `oklch(20% 0.02 260)` (#0F172A) | Texto dentro de cards |
| `--color-border` | `oklch(91% 0.005 260)` (#E2E8F0) | Bordes |
| `--color-ring` | `oklch(55% 0.12 175)` (#0D9488) | Focus rings |
| `--color-ring-offset` | `oklch(100% 0 0)` (#FFFFFF) | Offset de focus ring |

### 2.3 Paleta de acento (Teal) — Light Mode

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `oklch(55% 0.12 175)` (#0D9488 / teal-600) | Botones principales, links activos, acentos |
| `--color-primary-foreground` | `oklch(100% 0 0)` (#FFFFFF) | Texto sobre primary |
| `--color-primary-hover` | `oklch(48% 0.12 175)` (#0F766E / teal-700) | Hover de primary |
| `--color-primary-subtle` | `oklch(97% 0.01 175)` (#F0FDFA / teal-50) | Badges, highlights, filas seleccionadas |

### 2.4 Paletas semánticas funcionales — Light Mode

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-destructive` | `oklch(55% 0.22 27)` (#DC2626 / red-600) | Errores, eliminación, danger |
| `--color-destructive-foreground` | `oklch(100% 0 0)` (#FFFFFF) | Texto sobre destructive |
| `--color-warning` | `oklch(65% 0.18 75)` (#D97706 / amber-600) | Alertas, advertencias |
| `--color-warning-foreground` | `oklch(100% 0 0)` (#FFFFFF) | Texto sobre warning |
| `--color-success` | `oklch(62% 0.19 145)` (#16A34A / green-600) | Confirmaciones, OK |
| `--color-success-foreground` | `oklch(100% 0 0)` (#FFFFFF) | Texto sobre success |
| `--color-info` | `oklch(55% 0.18 260)` (#2563EB / blue-600) | Información contextual |
| `--color-info-foreground` | `oklch(100% 0 0)` (#FFFFFF) | Texto sobre info |

### 2.5 Paleta principal — Dark Mode

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-background` | `oklch(20% 0.02 260)` (#0F172A) | Fondo principal |
| `--color-foreground` | `oklch(98% 0.005 260)` (#F8FAFC) | Texto principal |
| `--color-muted` | `oklch(27% 0.02 260)` (#1E293B) | Fondos secundarios |
| `--color-muted-foreground` | `oklch(70% 0.015 260)` (#94A3B8) | Texto secundario |
| `--color-card` | `oklch(27% 0.02 260)` (#1E293B) | Fondo de cards |
| `--color-card-foreground` | `oklch(98% 0.005 260)` (#F8FAFC) | Texto dentro de cards |
| `--color-border` | `oklch(37% 0.02 260)` (#334155) | Bordes |
| `--color-ring` | `oklch(65% 0.14 175)` (#14B8A6 / teal-500) | Focus rings en dark |
| `--color-ring-offset` | `oklch(20% 0.02 260)` (#0F172A) | Offset de focus ring en dark |

### 2.6 Paleta de acento (Teal) — Dark Mode

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `oklch(65% 0.14 175)` (#14B8A6 / teal-500) | Acento en dark (un tono más claro) |
| `--color-primary-foreground` | `oklch(20% 0.02 260)` (#0F172A) | Texto sobre primary dark |
| `--color-primary-hover` | `oklch(72% 0.14 175)` (#2DD4BF / teal-400) | Hover en dark |
| `--color-primary-subtle` | `oklch(35% 0.08 175)` (#134E4A / teal-900) | Backgrounds sutiles en dark |

### 2.7 Reglas del sistema de color

1. Nunca usar colores brand directamente en componentes — siempre a través de tokens semantic.
2. El teal se aclara un tono en dark mode para mantener contraste sobre fondos oscuros.
3. `primary-subtle` es el "teal fantasma" — para badges, filas seleccionadas, tags. Nunca para texto.
4. Destructive/Warning/Success/Info solo se usan para feedback puntual, nunca como color decorativo.
5. Contraste mínimo WCAG AA (4.5:1 para texto normal, 3:1 para texto grande) en todas las combinaciones texto/fondo.
6. Los colores OKLCH son la fuente de verdad. Los hex son referencia visual para lectura humana.

---

## 3. Tipografía

### 3.1 Familia

**Inter** para todo el sistema. Se carga desde Google Fonts (`Inter Variable`) o se self-hostea según deploy.

```css
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

### 3.2 Escala tipográfica

| Token | Tamaño | Line Height | Weight | Uso |
|-------|--------|-------------|--------|-----|
| `--text-xs` | 12px | 16px | 400 | Metadatos, timestamps, badges chicos |
| `--text-sm` | 14px | 20px | 400 | Texto secundario, labels, descripciones, contenido de tablas |
| `--text-base` | 16px | 24px | 400 | Texto de cuerpo, inputs, contenido principal |
| `--text-lg` | 18px | 28px | 400 | Subtítulos secundarios |
| `--text-xl` | 20px | 28px | 600 | Títulos de sección |
| `--text-2xl` | 24px | 32px | 600 | Títulos de página |
| `--text-3xl` | 30px | 36px | 700 | Título principal (login, dashboard header) |

### 3.3 Pesos tipográficos

| Weight | Valor | Uso |
|--------|-------|-----|
| Regular | 400 | Cuerpo de texto, datos, inputs |
| Medium | 500 | Labels, badges, énfasis suave |
| Semibold | 600 | Títulos de sección, botones, nav items |
| Bold | 700 | Títulos principales, alertas críticas |

### 3.4 Reglas tipográficas

1. Nunca usar weight < 400 — en pantallas de datos clínicos, la legibilidad es prioritaria.
2. 14px es el mínimo para contenido interactivo — labels de formulario, texto en tablas, botones.
3. 12px solo para metadatos no interactivos — timestamps, IDs, notas al pie.
4. Un solo cambio de tamaño por nivel de jerarquía — no saltar de xs a 2xl sin escalas intermedias.
5. Line height siempre explícito — nunca depender del default del browser.
6. Font smoothing antialiased siempre activo en body.

### 3.5 Tipografía en tablas (caso específico del sistema)

Las tablas son el componente más tipográfico del sistema (pacientes con 8+ columnas, odontograma con 14, transacciones contables):

- **Headers**: `text-sm font-medium text-muted-foreground uppercase tracking-wider`
- **Celdas**: `text-sm` (14px)
- **Celdas numéricas**: `text-sm font-mono tabular-nums` (alineación decimal consistente para montos, códigos)
- **Estados en tablas**: `text-xs font-medium` en badges con color

---

## 4. Espaciado y layout

### 4.1 Escala de spacing

Base: **4px**. Todos los valores son múltiplos de 4.

| Token | Valor | Uso |
|-------|-------|-----|
| `--spacing-0` | 0px | Sin espacio |
| `--spacing-1` | 4px | Espacio mínimo (icono + texto) |
| `--spacing-2` | 8px | Gap entre elementos relacionados |
| `--spacing-3` | 12px | Padding interno de inputs, gap en form groups |
| `--spacing-4` | 16px | Padding de cards, gap entre secciones |
| `--spacing-5` | 20px | Separación entre bloques |
| `--spacing-6` | 24px | Padding de page sections |
| `--spacing-8` | 32px | Separación entre módulos |
| `--spacing-10` | 40px | Separación entre grandes secciones |
| `--spacing-12` | 48px | Máximo espacio vertical entre secciones de página |

### 4.2 Layout del sidebar

| Elemento | Valor | Nota |
|----------|-------|------|
| Ancho sidebar expandido | 256px | Navegación completa con texto |
| Ancho sidebar colapsado | 64px | Solo iconos |
| Transición | 200ms ease | Expansión/colapso suave |
| Fondo sidebar (light) | `--color-card` | Mismo fondo que cards, con border-right |
| Fondo sidebar (dark) | `--color-muted` | Un tono más oscuro que el fondo principal |

### 4.3 Layout del header

| Elemento | Valor |
|----------|-------|
| Altura | 64px |
| Fondo (light) | `--color-background` |
| Fondo (dark) | `--color-background` |
| Border bottom | `1px solid --color-border` |
| Padding horizontal | `--spacing-6` |

### 4.4 Contenido principal

| Elemento | Valor |
|----------|-------|
| Max width | Sin restricción — el sistema usa todo el ancho disponible |
| Padding | `--spacing-6` (24px) en todos los lados |
| Gap entre secciones | `--spacing-8` (32px) |

### 4.5 Container y grid

| Elemento | Valor |
|----------|-------|
| Container max-width | No aplica — layout full-width con sidebar |
| Grid gap por defecto | `--spacing-4` (16px) |
| Grid responsive | 1 col mobile → 2 col sm → 3 col lg → 4 col xl |

### 4.6 Reglas de espaciado

1. Todo espacio es múltiplo de 4px — sin excepciones.
2. El espaciado vertical entre bloques es siempre mayor que el interno — refuerza la jerarquía.
3. Padding de cards: 24px (`--spacing-6`) — generoso pero no excesivo.
4. Gap entre campos de formulario: 16px (`--spacing-4`).
5. Márgenes de page nunca menores a 24px.

---

## 5. Sombras, bordes y elevación

### 5.1 Sistema de sombras

Solo 3 niveles. Las sombras comunican elevación — no se usan como decoración.

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Cards, inputs elevados sutilmente |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)` | Dropdowns, popovers, modales |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)` | Dialog, drawer, overlay panels |

### 5.2 Bordes

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 4px | Badges, chips, tags pequeños |
| `--radius-md` | 6px | Inputs, selects, tooltips |
| `--radius-lg` | 8px | Cards, modales, botones |
| `--radius-xl` | 12px | Alertas, banners, contenedores destacados |
| `--radius-full` | 9999px | Avatares, pills, status dots |

### 5.3 Elevación

La elevación se expresa con sombras, NO con bordes más gruesos:

| Nivel | Sombra + Borde | Uso |
|-------|-----------------|-----|
| Nivel 0 | Sin sombra, borde `--color-border` | Cards en reposo, contenedores estáticos |
| Nivel 1 | `--shadow-sm`, sin borde extra | Cards con hover, inputs con foco |
| Nivel 2 | `--shadow-md` | Dropdowns, popovers, autocomplete |
| Nivel 3 | `--shadow-lg` | Modales, dialogs, drawers |

### 5.4 Reglas de sombras y bordes

1. Nunca usar `box-shadow` como decoración — solo para comunicar elevación.
2. Las cards en reposo tienen borde pero no sombra. Al hacer hover ganan `--shadow-sm`.
3. Inputs en reposo: `border border-border`. En focus: `ring-2 ring-ring ring-offset-2`.
4. Dark mode: las sombras se reducen ligeramente porque los fondos oscuros ya generan contraste.
5. Bordes de 1px siempre — sin excepciones.

---

## 6. Arquitectura de componentes

### 6.1 Estructura de `packages/ui`

```
packages/ui/
├── src/
│   ├── styles/
│   │   ├── theme.css          # @theme con todos los tokens
│   │   └── dark.css           # Override de tokens para dark mode
│   ├── components/
│   │   ├── button.tsx          # CVA + Radix Slot
│   │   ├── input.tsx           # Input con error state
│   │   ├── label.tsx
│   │   ├── select.tsx          # Radix Select + CVA
│   │   ├── dialog.tsx          # Radix Dialog compound
│   │   ├── popover.tsx         # Radix Popover
│   │   ├── dropdown-menu.tsx   # Radix DropdownMenu
│   │   ├── tabs.tsx            # Radix Tabs
│   │   ├── tooltip.tsx         # Radix Tooltip
│   │   ├── badge.tsx           # CVA puro
│   │   ├── card.tsx            # Compound component
│   │   ├── table.tsx           # Compound component (HTML nativo)
│   │   ├── alert.tsx           # CVA + íconos semánticos
│   │   ├── avatar.tsx          # Radix Avatar
│   │   ├── switch.tsx          # Radix Switch
│   │   ├── checkbox.tsx        # Radix Checkbox
│   │   ├── radio-group.tsx     # Radix RadioGroup
│   │   ├── separator.tsx       # Radix Separator
│   │   ├── skeleton.tsx        # Loading placeholder
│   │   ├── toast.tsx           # Sonner o Radix Toast
│   │   └── calendar.tsx        # Base para agenda/turnos
│   ├── lib/
│   │   └── utils.ts            # cn(), focusRing, disabled
│   └── index.ts                # Re-exports
├── package.json
└── tsconfig.json
```

### 6.2 Patrón de construcción de componentes

Todos los componentes siguen el mismo patrón:

```typescript
// 1. CVA para variantes
const buttonVariants = cva('base-classes', {
  variants: { variant: {...}, size: {...} },
  defaultVariants: { variant: 'default', size: 'default' },
})

// 2. Props con VariantProps + HTML nativo + ref como prop (React 19)
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// 3. Componente con cn() para merge
export function Button({ className, variant, size, ref, ...props }: ButtonProps) {
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
}
```

### 6.3 Componentes compound

Los componentes que representan bloques complejos (Card, Dialog, Table) se estructuran como compound components:

```typescript
// Card: Card > CardHeader > CardTitle + CardDescription > CardContent > CardFooter
// Table: Table > TableHeader > TableRow > TableHead / TableBody > TableRow > TableCell
// Dialog: Dialog > DialogTrigger + DialogContent > DialogHeader > DialogTitle + DialogDescription > DialogFooter
```

### 6.4 Categorías de componentes

| Categoría | Componentes | Base |
|-----------|-------------|------|
| **Formulario** | Button, Input, Label, Select, Checkbox, RadioGroup, Switch, Textarea | Radix + CVA |
| **Superficie** | Card, Dialog, Popover, Drawer, Sheet | Radix + compound |
| **Navegación** | Tabs, DropdownMenu, Breadcrumb, Sidebar, Command | Radix + CVA |
| **Datos** | Table, Badge, Avatar, Skeleton, Separator | HTML nativo + CVA |
| **Feedback** | Alert, Toast, Tooltip, Progress | Radix + CVA |
| **Dominio** | Odontograma, Calendar (agenda), PatientSearch | Custom sobre los anteriores |

### 6.5 Reglas de arquitectura de componentes

1. Todo componente usa `cn()` (clsx + tailwind-merge) para merge de classes — sin excepciones.
2. Variantes se definen con CVA, nunca con ternarios inline en el className.
3. Ref es una prop regular (React 19) — no se usa `forwardRef`.
4. `asChild` en componentes que necesitan composición (Radix `Slot`).
5. Los componentes de dominio (odontograma, agenda) NO viven en `packages/ui` — viven en `apps/web/src/features/` y consumen componentes de `packages/ui`.
6. Todo componente es accesible: `aria-*` attrs, `role`, focus management, keyboard navigation.

---

## 7. Estados e interacciones

### 7.1 Estados de interactive elements

| Estado | Implementación | Uso |
|--------|----------------|-----|
| **Default** | Estilo base del componente | Estado de reposo |
| **Hover** | Cambio sutil de fondo/borde con transición explícita + `cursor-pointer` en controles custom | Mouse sobre elemento interactivo |
| **Focus** | `ring-2 ring-ring ring-offset-2` | Elemento tiene foco del teclado |
| **Focus visible** | Mismo ring, solo con teclado (`focus-visible`) | No mostrar ring en clicks de mouse |
| **Active** | Opacidad reducida (0.8) o fondo más oscuro | Momento del click/press |
| **Disabled** | `opacity-50 pointer-events-none` | Elemento no interactivo |
| **Loading** | Spinner/bars + `pointer-events-none` + `opacity-80` | Acción en progreso |
| **Error** | Border `destructive` + ring `destructive` + mensaje | Validación fallida |

### 7.2 Transiciones

| Elemento | Duración | Easing | Qué se anima |
|----------|----------|--------|-------------|
| Botones, links, tabs, icon buttons | 150ms | ease-out | background-color, border-color, color |
| Hover de cards | 200ms | ease | box-shadow, transform (translateY -1px) |
| Thumbnails / media affordances | 150ms | ease-out | opacity, box-shadow, transform |
| Sidebar expand/collapse | 200ms | ease | width |
| Modales/dialogs | 200ms | ease-out | opacity + scale (0.95 → 1) |
| Tooltips | 150ms | ease-out | opacity |
| Dropdowns | 150ms | ease-out | opacity + scale (0.95 → 1) |
| Page transitions | 200ms | ease | opacity |

### 7.3 Focus ring estándar

Todos los elementos interactivos comparten el mismo focus ring:

```css
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

Utility helper en `lib/utils.ts`:

```typescript
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
export const hoverTransition = "transition-colors duration-150 ease-out";
export const interactiveTransition = "transition-[opacity,box-shadow,transform] duration-150 ease-out";
```

### 7.4 Animaciones de entrada/salida

Definidas como `@keyframes` dentro de `@theme`:

| Animación | Duración | Uso |
|-----------|----------|-----|
| `fade-in` | 200ms ease-out | Entrada de modales, toasts, alerts |
| `fade-out` | 150ms ease-in | Salida de toasts, notificaciones |
| `slide-in` | 200ms ease-out | Entrada de drawers, sidepanels |
| `slide-out` | 150ms ease-in | Salida de drawers |
| `scale-in` | 200ms ease-out | Entrada de dropdowns, popovers |

### 7.5 Reglas de interacciones

1. `focus-visible` SIEMPRE — nunca `focus` puro (evita ring en clicks).
2. Todo elemento interactivo con `hover:*` lleva una transición explícita — nunca cambios bruscos.
3. El estándar por defecto es `150ms ease-out` — rápido, sobrio y consistente con un producto clínico.
4. Para cambios simples de color/fondo/borde usar `transition-colors duration-150 ease-out`.
5. Para affordances de media / preview usar `transition-[opacity,box-shadow,transform] duration-150 ease-out`.
6. No animar propiedades que disparan layout (`width`, `height`, `top`, `left`) — solo `transform`, `opacity`, `box-shadow`, `background-color`, `border-color`, `color`.
7. Los controles clickeables custom (icon buttons, overlays, thumbnails, filas seleccionables) exponen `cursor-pointer` de forma explícita.
8. Hover de cards: solo `shadow-sm` + `translateY(-1px)` — sutil, no teatral.
9. Estados de loading SIEMPRE bloquean interacción (`pointer-events-none`).
10. Botones SIEMPRE tienen `cursor-pointer` en estado default y hover.
11. Respetar `prefers-reduced-motion` — deshabilitar animaciones no esenciales para usuarios que lo tienen activado.

---

## 8. Iconografía

### 8.1 Librería de íconos

**Lucide React** — compatible con el estilo limpio del sistema, tree-shakeable, buen soporte React 19.

### 8.2 Tamaños de íconos

| Tamaño | Valor | Uso |
|--------|-------|-----|
| `sm` | 16px | Inline con texto, badges, table actions |
| `md` | 20px | Botones, nav items, form fields |
| `lg` | 24px | Headers, empty states, ilustraciones |

### 8.3 Reglas de iconografía

1. Íconos siempre acompañan texto en botones — botones solo-icono solo para acciones obvias (cerrar, eliminar, editar en tablas).
2. Stroke width consistente: 1.5px (default de Lucide).
3. Color de ícono hereda del `currentColor` del contenedor — nunca hardcodear color en íconos.
4. Íconos en nav items: 20px, con label de texto al lado.
5. Affordances de preview / enlarge usan íconos neutrales de acción (`ZoomIn`, `Expand`) — nunca íconos de dominio clínico para indicar interacción genérica.

---

## 9. Tokens específicos del dominio

### 9.1 Estados de pacientes/turnos

| Estado | Color | Badge |
|--------|-------|-------|
| Pendiente | `--color-warning` | Badge warning |
| Confirmado | `--color-success` | Badge success |
| Cancelado | `--color-muted-foreground` | Badge muted |
| En atención | `--color-primary` | Badge primary |
| Ausente | `--color-destructive` | Badge destructive |

### 9.2 Tipos de práctica odontológica (colores para odontograma)

| Tipo | Color | Uso |
|------|-------|-----|
| Normal | `--color-primary` | Práctica registrada |
| Extracción | `--color-destructive` | Diente extraído |
| Corona | `--color-info` | Corona / implante |
| Preexistente | `--color-muted-foreground` | Condición previa al tratamiento |

### 9.3 Estados financieros

| Estado | Color | Uso |
|--------|-------|------|
| Pagado | `--color-success` | Cobro confirmado |
| Pendiente | `--color-warning` | A la espera de cobro |
| Vencido | `--color-destructive` | Pasó la fecha límite |
| Anulado | `--color-muted-foreground` | Transacción cancelada |

---

## 10. Implementación CSS — Estructura del archivo theme.css

```css
/* packages/ui/src/styles/theme.css */
@import "tailwindcss";

@theme {
  /* Font families */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Semantic colors — Light mode */
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(20% 0.02 260);
  --color-muted: oklch(96.5% 0.005 260);
  --color-muted-foreground: oklch(55% 0.015 260);
  --color-card: oklch(100% 0 0);
  --color-card-foreground: oklch(20% 0.02 260);
  --color-border: oklch(91% 0.005 260);
  --color-ring: oklch(55% 0.12 175);
  --color-ring-offset: oklch(100% 0 0);

  /* Primary — Teal */
  --color-primary: oklch(55% 0.12 175);
  --color-primary-foreground: oklch(100% 0 0);
  --color-primary-hover: oklch(48% 0.12 175);
  --color-primary-subtle: oklch(97% 0.01 175);

  /* Semantic — Functional */
  --color-destructive: oklch(55% 0.22 27);
  --color-destructive-foreground: oklch(100% 0 0);
  --color-warning: oklch(65% 0.18 75);
  --color-warning-foreground: oklch(100% 0 0);
  --color-success: oklch(62% 0.19 145);
  --color-success-foreground: oklch(100% 0 0);
  --color-info: oklch(55% 0.18 260);
  --color-info-foreground: oklch(100% 0 0);

  /* Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05);

  /* Animations */
  --animate-fade-in: fade-in 0.2s ease-out;
  --animate-fade-out: fade-out 0.15s ease-in;
  --animate-slide-in: slide-in 0.2s ease-out;
  --animate-slide-out: slide-out 0.15s ease-in;
  --animate-scale-in: scale-in 0.2s ease-out;

  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
  @keyframes slide-in { from { transform: translateY(-0.5rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slide-out { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-0.5rem); opacity: 0; } }
  @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
}

/* Dark mode variant */
@custom-variant dark (&:where(.dark, .dark *));

/* Dark mode overrides — definidos en dark.css e importados aquí */
```

```css
/* packages/ui/src/styles/dark.css */
.dark {
  --color-background: oklch(20% 0.02 260);
  --color-foreground: oklch(98% 0.005 260);
  --color-muted: oklch(27% 0.02 260);
  --color-muted-foreground: oklch(70% 0.015 260);
  --color-card: oklch(27% 0.02 260);
  --color-card-foreground: oklch(98% 0.005 260);
  --color-border: oklch(37% 0.02 260);
  --color-ring: oklch(65% 0.14 175);
  --color-ring-offset: oklch(20% 0.02 260);

  --color-primary: oklch(65% 0.14 175);
  --color-primary-foreground: oklch(20% 0.02 260);
  --color-primary-hover: oklch(72% 0.14 175);
  --color-primary-subtle: oklch(35% 0.08 175);

  --color-destructive: oklch(60% 0.18 27);
  --color-destructive-foreground: oklch(98% 0 0);
  --color-warning: oklch(70% 0.15 75);
  --color-warning-foreground: oklch(20% 0.02 260);
  --color-success: oklch(65% 0.17 145);
  --color-success-foreground: oklch(20% 0.02 260);
  --color-info: oklch(60% 0.16 260);
  --color-info-foreground: oklch(20% 0.02 260);
}
```

```css
/* packages/ui/src/styles/base.css */
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-family: var(--font-sans);
  }
}
```

---

## 11. Dependencias requeridas

| Paquete | Versión | Propósito |
|---------|---------|-----------|
| `tailwindcss` | ^4.x | CSS framework |
| `@radix-ui/react-slot` | último | Composición con `asChild` |
| `class-variance-authority` | último | Variantes de componentes (CVA) |
| `clsx` | último | Merge condicional de clases |
| `tailwind-merge` | último | Merge inteligente de clases Tailwind |
| `lucide-react` | último | Iconografía |
| Inter (Google Fonts) | variable | Tipografía |

### Radix UI primitives por componente

| Componente | Radix package |
|------------|---------------|
| Dialog | `@radix-ui/react-dialog` |
| Dropdown Menu | `@radix-ui/react-dropdown-menu` |
| Select | `@radix-ui/react-select` |
| Popover | `@radix-ui/react-popover` |
| Tabs | `@radix-ui/react-tabs` |
| Tooltip | `@radix-ui/react-tooltip` |
| Checkbox | `@radix-ui/react-checkbox` |
| Radio Group | `@radix-ui/react-radio-group` |
| Switch | `@radix-ui/react-switch` |
| Separator | `@radix-ui/react-separator` |
| Avatar | `@radix-ui/react-avatar` |
| Accordion | `@radix-ui/react-accordion` |

---

## 12. Reglas generales del design system

1. **Consistencia sobre creatividad** — un componente se ve igual en todas las pantallas. Si un botón primary es teal con texto blanco en la pantalla de pacientes, es teal con texto blanco en TODAS las pantallas.
2. **Solo se crean componentes en `packages/ui`** — los componentes de dominio (odontograma, agenda) viven en `apps/web/src/features/`.
3. **Todo componente nuevo debe pasar por este spec** — si no está definido acá, se define antes de implementarlo.
4. **No inventar tokens nuevos** sin agregarlos a este documento primero.
5. **No usar `!important`** — si necesitás `!important`, el token está mal definido.
6. **Preferir composición sobre configuración** — compound components en vez de un mega-componente con 50 props.
7. **Accesibilidad no es opcional** — todo componente cumple WCAG 2.1 AA por defecto.
8. **Mobile-first no aplica en esta etapa** — el sistema es desktop-first por naturaleza (odontólogos usan PC en consultorio). Responsive se maneja como adaptación, no como diseño principal.

---

## 13. Skeleton — Estados de carga

### 13.1 Filosofía

Todo lo que tarda en cargarse muestra un placeholder estructural que replica el layout del contenido real. El skeleton NO es un spinner genérico — es un molde vacío que le dice al usuario "esto es lo que va a aparecer acá". Esto reduce perceived latency y evita layout shift cuando el contenido llega.

### 13.2 Animación

Se usa un **shimmer** (barrido de luz) en vez de `animate-pulse`. El shimmer es más sutil, premium y no genera la sensación de "parpadeo" que tiene pulse en fondos claros.

```css
@keyframes skeleton-shimmer {
  from { background-position: -200% 0; }
  to { background-position: 200% 0; }
}
```

| Propiedad | Valor | Nota |
|-----------|-------|------|
| Duración | `1.5s` | Lo suficientemente lento para no distraer |
| Timing | `ease-in-out` | Suave, no mecánico |
| Iteración | `infinite` | Se repite hasta que el contenido cargue |
| Dirección | Normal (no alternate) | Barrido unidireccional |
| Color base | `--color-muted` | slate-100 light / slate-800 dark |
| Color highlight | `rgba(255,255,255,0.4)` light / `rgba(255,255,255,0.06)` dark | Brillo que pasa |

### 13.3 Componente base — `Skeleton`

Componente building-block. Se usa para construir cualquier placeholder.

```typescript
export interface SkeletonProps extends ComponentPropsWithRef<'div'> {
  /** Ancho. Default: "100%" */
  width?: string | number;
  /** Alto. Default: "1rem" */
  height?: string | number;
  /** Forma del borde */
  shape?: 'rect' | 'circle';
}
```

| Shape | Border radius | Uso |
|-------|---------------|-----|
| `rect` | `rounded-md` (6px) | Default. Texto, inputs, cards, botones |
| `circle` | `rounded-full` | Avatares, status dots, icon placeholders |

**Reglas:**
- `width` y `height` son props, NO className hacking. Mantienen la API declarativa.
- Nunca usar `Skeleton` sin dimensiones explícitas — un skeleton sin tamaño es invisible.
- El componente aplica `aria-hidden="true"` internamente — el contenedor padre es responsable de `role="status"`.

### 13.4 Componente `SkeletonText`

Bloque de texto placeholder con múltiples líneas.

```typescript
export interface SkeletonTextProps {
  /** Cantidad de líneas. Default: 3 */
  lines?: number;
  /** Gap entre líneas. Default: "0.5rem" (8px) */
  gap?: string;
  /** Ancho de la última línea. Default: "70%" — simula texto natural */
  lastLineWidth?: string;
}
```

| Líneas | Genera | Uso |
|--------|--------|-----|
| 1 | 1 línea al 100% | Títulos, labels |
| 2-4 | N líneas + última al 70% | Párrafos, descripciones |
| 5+ | Considerar si el contenido real necesita tanto texto visible | Descripciones largas |

### 13.5 Presets compuestos

Los siguientes presets cubren los patrones de carga más comunes del sistema. Cada uno replica la estructura del componente real que va a reemplazar.

#### `SkeletonTable`

```
┌──────────────────────────────────────────┐
│ ████████  ████████  ████████  ████████  │  ← header row
│ ─────────────────────────────────────── │
│ ██████████  ██████  ████████  ██████   │  ← data row 1
│ ██████████  ██████  ████████  ██████   │  ← data row 2
│ ██████████  ██████  ████████  ██████   │  ← data row 3
└──────────────────────────────────────────┘
```

| Prop | Default | Uso |
|------|---------|-----|
| `rows` | 5 | Cantidad de filas de datos |
| `columns` | 4 | Cantidad de columnas |
| `showHeader` | `true` | Fila de headers |

#### `SkeletonCard`

```
┌────────────────────┐
│ ██████████         │  ← título
│ ████               │  ← descripción corta
│                    │
│ ████████████████   │  ← contenido
│ ████████           │  ← contenido
│                    │
│        ██████████  │  ← footer / acción
└────────────────────┘
```

#### `SkeletonForm`

```
┌────────────────────┐
│ ████               │  ← label
│ █████████████████  │  ← input (h-10)
│                    │
│ ████               │  ← label
│ █████████████████  │  ← input (h-10)
│                    │
│ ████████████████   │  ← botón submit (h-10)
└────────────────────┘
```

| Prop | Default | Uso |
|------|---------|-----|
| `fields` | 3 | Cantidad de campos |
| `showSubmit` | `true` | Botón submit al final |

#### `SkeletonMetric`

```
┌──────────┐
│ ████     │  ← label
│ ██████   │  ← valor grande
│ ██  ██   │  ← variación / comparación
└──────────┘
```

Usado para dashboard header con métricas (turnos del día, facturación, pacientes activos).

#### `SkeletonSidebar`

```
┌────┐
│ ██ │  ← logo / nombre
│    │
│ ██ │  ← nav item
│ ██ │  ← nav item
│ ██ │  ← nav item
│ ██ │  ← nav item
│    │
│ ██ │  ← user / logout
└────┘
```

| Prop | Default | Uso |
|------|---------|-----|
| `items` | 6 | Cantidad de nav items |
| `collapsed` | `false` | Sidebar colapsado (solo iconos) |

### 13.6 Convenciones de uso

1. **Todo `Suspense` fallback usa Skeleton presets** — nunca un spinner suelto, nunca un "Cargando..." en texto plano.
2. **El skeleton replica el layout** — mismo grid, mismos gaps, mismos tamaños. Si la tabla tiene 4 columnas, el skeleton tiene 4 columnas.
3. **`role="status"` + `aria-busy="true"`** en el contenedor wrapper, no en cada bloque individual.
4. **`aria-live="polite"`** cuando el contenido es una región dinámica que se actualiza (ej: búsqueda de pacientes).
5. **Transición suave** — cuando el contenido real reemplaza al skeleton, usar `opacity` transition (200ms) para evitar un "flash" brusco. Esto se maneja con `AnimatePresence` o CSS transition en el wrapper.
6. **Prefers-reduced-motion** — el shimmer se reemplaza por un color sólido estático (`bg-muted`) sin animación.
7. **Nunca usar skeleton para estados vacíos** — skeleton = "está cargando". Empty state = "no hay datos". Son cosas distintas con componentes distintos.
8. **Los presets son punto de partida** — si un feature necesita un skeleton específico (ej: odontograma), se crea en `apps/web/src/features/` componiendo los bloques base.

### 13.7 Accesibilidad

| Atributo | Dónde | Valor |
|----------|-------|-------|
| `role="status"` | Contenedor wrapper | Indica región de carga |
| `aria-busy="true"` | Contenedor wrapper | "true" mientras carga, se remueve al llegar contenido |
| `aria-hidden="true"` | Cada bloque `Skeleton` | El lector de pantalla no anuncia "rectángulo gris" |
| `aria-label` | Contenedor wrapper | "Cargando {contexto}" — ej: "Cargando pacientes" |

### 13.8 Estructura de archivos

```
packages/ui/src/components/
  skeleton.tsx          # Skeleton, SkeletonText, SkeletonCircle
  skeleton-presets.tsx  # SkeletonTable, SkeletonCard, SkeletonForm, SkeletonMetric, SkeletonSidebar
```

Se exportan ambos desde `index.ts`:

```typescript
export * from './components/skeleton';
export * from './components/skeleton-presets';
```
