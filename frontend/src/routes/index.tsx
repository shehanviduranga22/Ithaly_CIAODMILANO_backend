import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { ArrowUpRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { AUTH_KEY } from "@/lib/store";
import hero from "@/assets/home (1).png";
import menswear from "@/assets/home (2).png";
import accessories from "@/assets/home (3).png";

const EDITIONS = [
  {
    image: hero,
    label: "Donna",
    alt: "Women's fashion beneath the ornate arches of Milan's Galleria",
  },
  {
    image: menswear,
    label: "Uomo",
    alt: "Men's tailoring on the streets of Milan",
  },
  {
    image: accessories,
    label: "Accessori",
    alt: "A still life of Italian fashion accessories",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Sign in — Ciao D Milano Atelier" },
      {
        name: "description",
        content: "Private atelier console for Ciao D Milano, Italian luxury fashion.",
      },
      { property: "og:title", content: "Sign in — Ciao D Milano Atelier" },
      { property: "og:description", content: "Private atelier console for Ciao D Milano." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [edition, setEdition] = useState(0);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    try {
      const response = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to sign in.");
      localStorage.setItem(AUTH_KEY, "1");
      nav({ to: "/dashboard" });
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Unable to sign in.");
    }
  };
  return (
    <main className="login-page">
      <div className="login-photography">
        {EDITIONS.map((scene, index) => (
          <img
            key={scene.label}
            src={scene.image}
            alt={scene.alt}
            className={`login-photo ${edition === index ? "login-photo-active" : ""}`}
            aria-hidden={edition !== index}
          />
        ))}
        <div className="login-photo-shade" />
      </div>

      <section className="login-editorial" aria-label="Ciao D Milano editorial">
        <div className="login-brand">
          <p className="eyebrow login-brand-kicker">Italian by nature.</p>
          <h1 className="font-display">
            CIAO D<br />
            <span>MILANO</span>
            <span className="login-brand-period">.</span>
          </h1>
          <p className="login-manifesto font-display">L’eleganza è un’attitudine.</p>
        </div>
        <footer className="login-editorial-footer">
          <div className="login-edition-controls" aria-label="Editorial photographs">
            {EDITIONS.map((scene, index) => (
              <Button
                key={scene.label}
                type="button"
                variant="ghost"
                className={`login-edition-button ${edition === index ? "login-edition-selected" : ""}`}
                onClick={() => setEdition(index)}
                aria-label={`Show ${scene.label} photograph`}
                aria-pressed={edition === index}
              />
            ))}
          </div>
        </footer>
      </section>

      <section className="login-access" aria-label="Atelier sign in">
        <header className="login-access-header">
          <span className="eyebrow">Atelier Console</span>
          <LockKeyhole size={15} strokeWidth={1.3} aria-hidden="true" />
        </header>
        <form onSubmit={submit} className="login-form">
          <p className="eyebrow text-muted-foreground">Private access</p>
          <h2 className="font-display">
            Welcome
            <br />
            <em>back.</em>
          </h2>
          <p className="login-form-subtitle">Your atelier awaits.</p>
          <div className="login-fields">
            <label className="block" htmlFor="login-email">
              <span className="login-field-label">Email address</span>
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="Your email address"
              required
              className="field"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErr("");
              }}
            />
            <label className="login-password-label" htmlFor="login-password">
              <span className="login-field-label">Password</span>
            </label>
            <div className="login-password-input">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                required
                className="field"
                value={pw}
                onChange={(e) => {
                  setPw(e.target.value);
                  setErr("");
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="login-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </div>
          {err && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {err}
            </p>
          )}
          <Button type="submit" variant="atelier" className="login-submit">
            <span>Enter the atelier</span>
            <ArrowUpRight size={18} />
          </Button>
          <p className="login-private-note">
            <LockKeyhole size={11} aria-hidden="true" /> Reserved for the Ciao D Milano team
          </p>
        </form>
      </section>
    </main>
  );
}
