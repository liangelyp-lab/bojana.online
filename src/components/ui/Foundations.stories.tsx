import { Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Field, Select, TextArea } from './DesignSystem';

const meta = { title: 'Bojana/Fundamentos', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

const typography = [
  ['Display', 'bojana-heading-display', 'Arquitectura que acompaña'],
  ['Título de página', 'bojana-heading-page', 'Tus proyectos, en un lugar'],
  ['Título de sección', 'bojana-heading-section', 'Últimas actualizaciones'],
  ['Título de componente', 'bojana-heading-component', 'Documentos del proyecto'],
  ['Cuerpo', 'font-sans text-sm text-ink', 'Revisá los avances y compartí tus comentarios con el equipo.'],
  ['Etiqueta', 'bojana-label', 'Estado del proyecto'],
  ['Caption', 'bojana-caption', 'Actualizado hoy a las 10:30'],
  ['Editorial', 'bojana-editorial text-xl text-ink', 'Cada decisión construye el próximo paso.'],
] as const;

export const Typography: Story = {
  name: 'Tipografía',
  render: () => <main className="max-w-5xl space-y-8">
    <header><h1 className="bojana-heading-page">Tipografía</h1><p className="bojana-caption mt-2">Las muestras usan las clases reales del portal. Las familias se definen en src/brand/theme.css.</p></header>
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-xl border border-line bg-white p-5"><p className="bojana-label">--font-sans · interfaz</p><p className="mt-3 font-sans text-2xl text-ink">Aa Bb Cc · ÁÉÍÓÚ ñ ¿?</p><p className="mt-2 font-sans text-sm text-ink-muted">Regular · <span className="font-medium">Medium</span> · <span className="font-semibold">Semibold</span> · <span className="font-bold">Bold</span></p></section>
      <section className="rounded-xl border border-line bg-white p-5"><p className="bojana-label">--font-display · editorial</p><p className="mt-3 font-display text-2xl text-ink">Aa Bb Cc · ÁÉÍÓÚ ñ ¿?</p><p className="mt-2 font-display text-xl text-ink-muted">Regular · <span className="italic">Italic</span></p></section>
    </div>
    <div className="divide-y divide-line rounded-xl border border-line bg-white px-5">{typography.map(([name, className, sample]) => <section key={name} className="grid gap-3 py-5 sm:grid-cols-[12rem_1fr]"><div><h2 className="bojana-heading-component">{name}</h2><code className="mt-1 block break-words text-xs text-ink-muted">{className}</code></div><p className={className}>{sample}</p></section>)}</div>
  </main>,
};

function ValidationExample() {
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const invalid = submitted && !name.trim();
  return <form className="space-y-3 rounded-xl border border-line bg-white p-5" noValidate onSubmit={event => { event.preventDefault(); setSubmitted(true); }}>
    <h2 className="bojana-heading-section">Validación interactiva</h2>
    <Field label="Nombre del proyecto" required value={name} onChange={event => { setName(event.target.value); setSubmitted(false); }} aria-invalid={invalid || undefined} aria-describedby="project-name-feedback" />
    <p id="project-name-feedback" role={submitted ? 'status' : undefined} className={`text-xs ${invalid ? 'text-bojana-error' : 'text-ink-muted'}`}>{invalid ? 'Ingresá un nombre para continuar.' : submitted ? 'Nombre válido. Ejemplo local, sin guardar datos.' : 'Enviá vacío para ver el error; después completá el nombre.'}</p>
    <Button type="submit">Validar</Button>
  </form>;
}

export const FormStates: Story = {
  name: 'Estados de formularios',
  render: () => <main className="max-w-5xl space-y-8">
    <header><h1 className="bojana-heading-page">Estados de formularios</h1><p className="bojana-caption mt-2">Field, Select y TextArea reales. Usá Tab o hacé clic para comprobar el foco. El error se activa con aria-invalid.</p></header>
    <section className="grid gap-5 rounded-xl border border-line bg-white p-5 sm:grid-cols-3" aria-label="Estado normal y ayuda">
      <div className="space-y-2"><Field label="Nombre con ayuda" placeholder="Ej. Casa del bosque" aria-describedby="normal-help" /><p id="normal-help" className="bojana-caption">Nombre visible para el equipo.</p></div>
      <Select label="Estado del proyecto" defaultValue="progress"><option value="progress">En progreso</option><option value="paused">Pausado</option></Select>
      <TextArea label="Descripción" placeholder="Contanos sobre el proyecto" />
    </section>
    <section className="grid gap-5 rounded-xl border border-line bg-white p-5 sm:grid-cols-3" aria-label="Errores">
      <div className="space-y-2"><Field label="Nombre con error" defaultValue="" aria-invalid="true" aria-describedby="name-error" /><p id="name-error" className="text-xs text-bojana-error">Ingresá un nombre.</p></div>
      <div className="space-y-2"><Select label="Estado con error" defaultValue="" aria-invalid="true" aria-describedby="status-error"><option value="">Seleccioná un estado</option><option value="progress">En progreso</option></Select><p id="status-error" className="text-xs text-bojana-error">Seleccioná una opción.</p></div>
      <div className="space-y-2"><TextArea label="Descripción con error" aria-invalid="true" aria-describedby="description-error" /><p id="description-error" className="text-xs text-bojana-error">Completá la descripción.</p></div>
    </section>
    <section className="grid gap-5 rounded-xl border border-line bg-white p-5 sm:grid-cols-3" aria-label="Deshabilitados">
      <Field label="Nombre deshabilitado" defaultValue="Casa del bosque" disabled />
      <Select label="Estado deshabilitado" disabled><option>En progreso</option></Select>
      <TextArea label="Descripción deshabilitada" defaultValue="No editable mientras se guarda." disabled />
    </section>
    <section className="grid gap-5 rounded-xl border border-line bg-white p-5 sm:grid-cols-3" aria-label="Solo lectura y fecha">
      <Field label="Nombre de solo lectura" defaultValue="Casa del bosque" readOnly />
      <Field label="Fecha de entrega" type="date" defaultValue="2026-11-10" />
      <TextArea label="Descripción de solo lectura" defaultValue="Podés seleccionar y copiar este contenido." readOnly />
    </section>
    <p className="bojana-caption">Select no admite readOnly nativo. El calendario depende del navegador; aquí se comprueba el campo compartido.</p>
    <ValidationExample />
  </main>,
};

function SpecialFieldsExample() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [compact, setCompact] = useState('Revisión de planos');
  return <main className="max-w-3xl space-y-8">
    <header><h1 className="bojana-heading-page">Campos de login y proyecto</h1><p className="bojana-caption mt-2">Variantes compartidas utilizadas por las pantallas del portal.</p></header>
    <section className="space-y-5 rounded-xl border border-line bg-white p-6"><h2 className="bojana-heading-section">Login</h2>
      <Field label="Email" type="email" autoComplete="username" leading={<Mail size={18} />} placeholder="nombre@estudio.com" />
      <Field label="Contraseña" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" leading={<LockKeyhole size={18} />} placeholder="Ingresá tu contraseña" trailing={<Button variant="icon" ariaLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} ariaPressed={passwordVisible} onClick={() => setPasswordVisible(value => !value)}>{passwordVisible ? <EyeOff /> : <Eye />}</Button>} />
    </section>
    <form className="space-y-5 rounded-xl border border-line bg-white p-6" onSubmit={event => event.preventDefault()}><h2 className="bojana-heading-section">Nuevo proyecto</h2>
      <Field validateOnInvalid density="comfortable" label="Nombre del proyecto" required value={name} onChange={event => setName(event.target.value)} placeholder="Ej.: Remodelación del SUM" />
      <TextArea validateOnInvalid density="comfortable" rows={3} label="Alcance del proyecto" required value={description} onChange={event => setDescription(event.target.value)} placeholder="Describí el alcance aprobado" />
      <Field validateOnInvalid density="compact" label="Etapa compacta" value={compact} onChange={event => setCompact(event.target.value)} />
      <Button type="submit">Comprobar campos obligatorios</Button>
      <p className="bojana-caption">La validación es local. No se crean proyectos ni se envían credenciales.</p>
    </form>
  </main>;
}
export const SpecialFields: Story = { name: 'Campos de login y proyecto', render: () => <SpecialFieldsExample /> };
