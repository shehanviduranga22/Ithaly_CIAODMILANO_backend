import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { AUTH_KEY } from "@/lib/store";
import hero from "@/assets/slide2.jpg";
import menswear from "@/assets/slide1.jpg";
import accessories from "@/assets/slide3.jpg";

const EDITIONS = [
  {
    image: hero,
    label: "Donna",
    caption: "An expression of elegance",
    alt: "Women's fashion beneath the ornate arches of Milan's Galleria",
  },
  {
    image: menswear,
    label: "Uomo",
    caption: "The art of tailoring",
    alt: "Men's tailoring on the streets of Milan",
  },
  {
    image: accessories,
    label: "Accessori",
    caption: "The finishing touch",
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
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().toLowerCase() === "shehanviduranga@gmail.com" && pw === "12345678") {
      localStorage.setItem(AUTH_KEY, "1");
      nav({ to: "/dashboard" });
    } else setErr("Invalid email or password.");
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
        <header className="login-masthead">
          <span className="eyebrow">Milano, Italia</span>
          <span className="eyebrow">The private atelier</span>
        </header>
        <div className="login-brand">
          <p className="eyebrow login-brand-kicker">
            <span /> Italian by nature.
          </p>
          <h1 className="font-display">
            CIAO D<br />
            <span>MILANO</span>
            <span className="login-brand-period">.</span>
          </h1>
          <p className="login-manifesto font-display">L’eleganza è un’attitudine.</p>
        </div>
        <footer className="login-editorial-footer">
          <div className="login-edition-caption">
            <span className="eyebrow">
              0{edition + 1} / {EDITIONS[edition]?.label}
            </span>
            <p className="font-display">{EDITIONS[edition]?.caption}</p>
          </div>
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
              >
                0{index + 1}
              </Button>
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
              <span className="login-field-label">
                <span>Email address</span>
                <span>01</span>
              </span>
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
              <span className="login-field-label">
                <span>Password</span>
                <span>02</span>
              </span>
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
        <footer className="login-access-footer">
          <span className="font-display">C/D/M</span>
          <span className="eyebrow">Crafted in Milano.</span>
        </footer>
      </section>
    </main>
  );
}
