/**
 * /acceso — Screen 1: log in or create an account (owner or renter).
 * Renters must link at least one social handle so owners can vet them.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { Building2, KeyRound } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const outfit = { fontFamily: "'Outfit', sans-serif" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif" } as const;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});
type LoginValues = z.infer<typeof loginSchema>;

const signupSchema = z
  .object({
    role: z.enum(["renter", "owner"]),
    name: z.string().min(1, "Ingresa tu nombre completo"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(2, "Contraseña demasiado corta"),
    location: z.string().optional(),
    social_platform: z.enum(["instagram", "linkedin", "x"]),
    social_handle: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === "renter" && !data.social_handle?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["social_handle"],
        message: "Los arrendatarios deben vincular al menos una red social",
      });
    }
  });
type SignupValues = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// Shared field wrapper
// ---------------------------------------------------------------------------

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs tracking-wide text-[oklch(0.65_0.010_260)]" style={outfit}>
        {label}
      </Label>
      {children}
      {error && (
        <p className="text-xs text-red-400" style={outfit}>
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

function LoginForm({ next }: { next?: string | null }) {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    try {
      const me = await login(values.email, values.password);
      toast.success(`¡Bienvenido de vuelta, ${me.name.split(" ")[0]}!`);
      navigate(next || (me.role === "owner" ? "/mis-palcos" : "/explorar"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo iniciar sesión");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
        <Input type="email" placeholder="tu@correo.com" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Contraseña" error={form.formState.errors.password?.message}>
        <Input type="password" placeholder="••••••••" autoComplete="current-password" {...form.register("password")} />
      </Field>
      <Button type="submit" disabled={form.formState.isSubmitting} className="btn-gold w-full py-5 rounded-sm text-sm">
        {form.formState.isSubmitting ? "Iniciando..." : "Iniciar Sesión"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

function SignupForm({ defaultRole = "renter" }: { defaultRole?: "renter" | "owner" }) {
  const { signup } = useAuth();
  const [, navigate] = useLocation();
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: defaultRole, social_platform: "instagram" },
  });
  const role = form.watch("role");

  const onSubmit = async (values: SignupValues) => {
    try {
      const social: Record<string, string> = {};
      if (values.social_handle?.trim()) social[values.social_platform] = values.social_handle.trim();
      await signup({
        role: values.role,
        name: values.name,
        email: values.email,
        password: values.password,
        location: values.location || "",
        social_media: social,
      });
      toast.success("Cuenta creada. Revisa tu código de confirmación.");
      navigate("/confirmar");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la cuenta");
    }
  };

  const roleCard = (value: "renter" | "owner", icon: React.ReactNode, title: string, desc: string) => (
    <button
      type="button"
      onClick={() => form.setValue("role", value)}
      className={`flex-1 rounded-md border p-4 text-left transition-all ${
        role === value
          ? "border-[oklch(0.72_0.12_75)] bg-[oklch(0.72_0.12_75/10%)]"
          : "border-white/10 hover:border-white/25"
      }`}
    >
      <div className="flex items-center gap-2 mb-1 text-[oklch(0.72_0.12_75)]">
        {icon}
        <span className="text-sm font-semibold text-white" style={outfit}>
          {title}
        </span>
      </div>
      <p className="text-xs text-[oklch(0.58_0.010_260)]" style={outfit}>
        {desc}
      </p>
    </button>
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        {roleCard("renter", <KeyRound size={15} />, "Quiero rentar", "Busco palcos para eventos")}
        {roleCard("owner", <Building2 size={15} />, "Tengo un palco", "Quiero publicarlo y generar ingresos")}
      </div>

      <Field label="Nombre completo" error={form.formState.errors.name?.message}>
        <Input placeholder="Tu nombre" autoComplete="name" {...form.register("name")} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Correo electrónico" error={form.formState.errors.email?.message}>
          <Input type="email" placeholder="tu@correo.com" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Contraseña" error={form.formState.errors.password?.message}>
          <Input type="password" placeholder="••••••••" autoComplete="new-password" {...form.register("password")} />
        </Field>
      </div>
      <Field label="Ciudad (opcional)">
        <Input placeholder="p. ej. Monterrey" {...form.register("location")} />
      </Field>

      <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
        <Field label="Red social">
          <select
            {...form.register("social_platform")}
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm text-white [&>option]:bg-[oklch(0.13_0.007_260)]"
            style={outfit}
          >
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="x">X</option>
          </select>
        </Field>
        <Field label="Usuario / handle" error={form.formState.errors.social_handle?.message}>
          <Input placeholder="@tuusuario" {...form.register("social_handle")} />
        </Field>
      </div>
      <p className="text-xs text-[oklch(0.50_0.008_260)] -mt-2" style={outfit}>
        {role === "renter"
          ? "Obligatorio para arrendatarios — los propietarios lo usan para conocer a quién le rentan."
          : "Opcional para propietarios."}
      </p>

      <Button type="submit" disabled={form.formState.isSubmitting} className="btn-gold w-full py-5 rounded-sm text-sm">
        {form.formState.isSubmitting ? "Creando cuenta..." : "Crear Cuenta"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Auth() {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const preselectOwner = searchParams.get("role") === "owner";
  const next = searchParams.get("next");

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="gold-divider" />
            <span className="text-xs tracking-widest uppercase text-[oklch(0.72_0.12_75)] font-medium" style={outfit}>
              Acceso
            </span>
            <div className="gold-divider rotate-180" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white" style={serif}>
            Bienvenido a <span className="text-gold-gradient italic">Palcos</span>
          </h1>
        </div>

        <div className="bg-[oklch(0.13_0.007_260)] border border-white/6 rounded-lg p-6 sm:p-8">
          <Tabs defaultValue={preselectOwner ? "signup" : "login"}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="login" className="flex-1" style={outfit}>
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1" style={outfit}>
                Crear Cuenta
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm next={next} />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm defaultRole={preselectOwner ? "owner" : "renter"} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
