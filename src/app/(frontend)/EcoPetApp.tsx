"use client";

import Image from "next/image";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type PetKey = "turtle" | "rabbit" | "cat" | "snake";
type ViewKey = "home" | "report" | "social" | "token" | "world";
type AppUser = { id: string; displayName: string; selectedPet: PetKey; level: number; xp: number; points: number; ecoTokens: number; currentStreak: number; longestStreak: number; createdAt: string; lastActiveDate?: string; ownedAccessories: string[]; equippedAccessory: string };
type Activity = { id: string; title: string; type: string; questKey: string; distanceKm?: number; durationMinutes?: number; actualEmissionsKg?: number; avoidedEmissionsKg?: number; pointsEarned?: number; createdAt: string; owner?: string; ownerDisplayName?: string };
type Message = { id: string; sender: "user" | "pet"; message: string; createdAt: string };
type Diary = { id: string; title: string; story: string; createdAt: string; photo?: { url?: string; alt?: string; width?: number; height?: number } | string };
type Snapshot = { authenticated: boolean; user: AppUser; activities: Activity[]; messages: Message[]; people: AppUser[]; friendships: unknown[]; diary: Diary[] };

const PETS: Record<PetKey, { name: string; label: string; color: string; habitat: string }> = {
  turtle: { name: "Moss", label: "Kura-kura", color: "#53b175", habitat: "Kolam Lumut" },
  rabbit: { name: "Pip", label: "Kelinci", color: "#e8e0ce", habitat: "Kebun Wortel" },
  cat: { name: "Miko", label: "Kucing", color: "#f2a65a", habitat: "Rumah Pohon" },
  snake: { name: "Slink", label: "Ular", color: "#8dbf67", habitat: "Hutan Pakis" },
};

const NAV: { key: ViewKey; label: string; icon: ReactNode }[] = [
  { key: "home", label: "Habitat", icon: <Icon name="home" /> },
  { key: "report", label: "Laporan", icon: <Icon name="chart" /> },
  { key: "social", label: "Komunitas", icon: <Icon name="users" /> },
  { key: "token", label: "Eco Token", icon: <Icon name="token" /> },
  { key: "world", label: "Dunia", icon: <Icon name="map" /> },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    chart: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20v-2c0-3 2.5-5 6-5s6 2 6 5v2M15 14c3.5 0 6 1.5 6 4v2" /></>,
    token: <><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-5M12 3v2M12 19v2" /></>,
    map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7z" />,
    leaf: <><path d="M20 4C10 4 5 8 5 14c0 3 2 5 5 5 6 0 10-7 10-15Z" /><path d="M4 21c2-6 6-9 12-12" /></>,
    arrow: <path d="m9 18 6-6-6-6" />,
    bag: <><path d="M5 8h14l-1 13H6zM9 9V6a3 3 0 0 1 6 0v3" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="1" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    camera: <><rect x="3" y="6" width="18" height="14" rx="2" /><path d="m8 6 1-3h6l1 3" /><circle cx="12" cy="13" r="4" /></>,
    fire: <path d="M12 22c4 0 7-3 7-7 0-5-4-8-7-13 0 5-7 7-7 13 0 4 3 7 7 7Zm0 0c-2 0-3-2-3-4s2-3 3-5c0 2 3 3 3 5s-1 4-3 4Z" />,
    closet: <><rect x="4" y="3" width="16" height="18" /><path d="M12 3v18M9 12h1M14 12h1" /></>,
    book: <><path d="M3 5c4-2 7-1 9 1v15c-2-2-5-3-9-1zM21 5c-4-2-7-1-9 1v15c2-2 5-3 9-1z" /></>,
    chat: <><path d="M4 4h16v12H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
    star: <path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />,
    close: <><path d="M5 5l14 14M19 5 5 19" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      {paths[name] || paths.leaf}
    </svg>
  );
}

function PixelPet({ type, size = "large", accessory = "none" }: { type: PetKey; size?: "small" | "large"; accessory?: string }) {
  const color = PETS[type].color;
  const common = { fill: color, stroke: "#292c2b", strokeWidth: 1.5 };
  return (
    <svg className={`pixel-pet ${size}`} viewBox="0 0 120 100" shapeRendering="crispEdges" aria-label={PETS[type].label}>
      <ellipse cx="60" cy="91" rx="36" ry="5" fill="#2d4b3b" opacity=".22" />
      {type === "turtle" && <>
        <rect x="25" y="42" width="65" height="38" {...common} />
        <rect x="34" y="33" width="48" height="15" {...common} />
        <rect x="89" y="53" width="20" height="18" {...common} />
        <rect x="20" y="73" width="15" height="12" {...common} /><rect x="78" y="73" width="15" height="12" {...common} />
        <path d="M40 45v33M60 36v42M80 45v33M28 59h60" stroke="#347c57" strokeWidth="4" />
        <rect x="98" y="57" width="4" height="4" fill="#292c2b" />
      </>}
      {type === "rabbit" && <>
        <rect x="39" y="16" width="14" height="40" {...common} /><rect x="67" y="10" width="14" height="46" {...common} />
        <rect x="31" y="45" width="58" height="40" {...common} /><rect x="22" y="75" width="22" height="13" {...common} /><rect x="76" y="75" width="22" height="13" {...common} />
        <rect x="46" y="56" width="6" height="7" fill="#292c2b" /><rect x="72" y="56" width="6" height="7" fill="#292c2b" />
        <rect x="59" y="66" width="7" height="6" fill="#d87976" /><rect x="43" y="22" width="6" height="23" fill="#d9a4a1" /><rect x="71" y="17" width="6" height="26" fill="#d9a4a1" />
      </>}
      {type === "cat" && <>
        <path d="M28 45V20l23 17h18l23-17v65H28Z" {...common} />
        <rect x="40" y="52" width="7" height="8" fill="#292c2b" /><rect x="73" y="52" width="7" height="8" fill="#292c2b" />
        <rect x="57" y="64" width="7" height="6" fill="#b96767" /><path d="M60 70v8m0-4-9 5m9-5 9 5" stroke="#292c2b" strokeWidth="2" />
        <path d="M28 65H12m16 8H8m84-8h16M92 73h20" stroke="#292c2b" strokeWidth="2" />
      </>}
      {type === "snake" && <>
        <path d="M32 78h55V64H46V50h38V35H52V21h44v48H65v17H32Z" {...common} />
        <rect x="86" y="28" width="21" height="18" {...common} /><rect x="99" y="32" width="4" height="5" fill="#292c2b" />
        <path d="m107 42 10 4-10 4" stroke="#d34e4e" strokeWidth="2" />
        <rect x="58" y="28" width="7" height="7" fill="#629346" /><rect x="65" y="57" width="7" height="7" fill="#629346" /><rect x="41" y="74" width="7" height="7" fill="#629346" />
      </>}
      {accessory === "Topi Petualang" && <g className="pet-accessory"><path d="M35 25h50l-9-18H44Z" fill="#c89242" stroke="#292c2b" strokeWidth="2" /><rect x="28" y="24" width="64" height="7" fill="#9c6b2f" stroke="#292c2b" strokeWidth="2" /></g>}
      {accessory === "Mahkota Daun" && <g className="pet-accessory"><path d="M38 29 34 9l18 12L61 5l10 16L88 9l-5 20Z" fill="#d3e75f" stroke="#292c2b" strokeWidth="2" /><rect x="38" y="27" width="45" height="7" fill="#5fa35f" stroke="#292c2b" strokeWidth="2" /></g>}
      {accessory === "Kacamata Pixel" && <g className="pet-accessory"><rect x="31" y="48" width="24" height="14" fill="#71bdd0" stroke="#292c2b" strokeWidth="3" /><rect x="65" y="48" width="24" height="14" fill="#71bdd0" stroke="#292c2b" strokeWidth="3" /><path d="M55 53h10" stroke="#292c2b" strokeWidth="3" /></g>}
    </svg>
  );
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><section className={`game-modal ${wide ? "wide" : ""}`} onMouseDown={(e) => e.stopPropagation()}>
    <header><div><p className="eyebrow">ECO-PET</p><h2>{title}</h2></div><button onClick={onClose} aria-label="Tutup"><Icon name="close" /></button></header>
    <div className="modal-body">{children}</div>
  </section></div>;
}

function Auth({ onContinue }: { onContinue: (mode: "login" | "signup", email: string, password: string) => Promise<void> }) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <main className="auth-shell">
      <div className="auth-art">
        <div className="cloud cloud-one" /><div className="cloud cloud-two" />
        <div className="auth-brand"><span className="brand-pixel"><Icon name="leaf" size={17} /></span> ECO-PET</div>
        <div className="art-copy">
          <p className="eyebrow light">RAWAT BUMI, RAWAT TEMANMU</p>
          <h1>Petualangan kecil.<br />Dampak yang besar.</h1>
          <p>Temukan teman pixel-mu dan bangun habitat impian dari kebiasaan baik setiap hari.</p>
        </div>
        <div className="login-scene">
          <div className="login-tree"><span /><span /><span /></div>
          <PixelPet type="turtle" />
          <div className="ground-details">✦　·　✦　·　✦</div>
        </div>
      </div>
      <div className="auth-panel">
        <div className="mobile-brand"><span className="brand-pixel"><Icon name="leaf" size={16} /></span> ECO-PET</div>
        <div className="auth-card">
          <p className="eyebrow">SELAMAT DATANG, PENJAGA!</p>
          <h2>{mode === "signup" ? "Mulai petualanganmu" : "Kembali ke habitat"}</h2>
          <p className="muted">Satu aksi hijau membuat pet-mu semakin bahagia.</p>
          <div className="auth-tabs">
            <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Masuk</button>
            <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Daftar</button>
          </div>
          <form onSubmit={async (e) => { e.preventDefault(); setPending(true); setError(""); try { await onContinue(mode, email, password); } catch (err) { setError(err instanceof Error ? err.message : "Terjadi kesalahan."); } finally { setPending(false); } }}>
            <label>Email<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kamu@email.com" /></label>
            <label>Kata sandi<input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" /></label>
            {error && <p className="form-error">{error}</p>}
            <button className="primary-btn full" disabled={pending} type="submit">{pending ? "Memproses..." : mode === "signup" ? "Lanjut pilih pet" : "Masuk"} <Icon name="arrow" size={18} /></button>
          </form>
          <p className="tiny-note">Dengan melanjutkan, kamu setuju menjaga Bumi bersama kami.</p>
        </div>
      </div>
    </main>
  );
}

function Onboarding({ onFinish }: { onFinish: (name: string, pet: PetKey) => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [pet, setPet] = useState<PetKey>("turtle");
  return (
    <main className="onboarding-shell">
      <header className="simple-header"><div className="auth-brand dark"><span className="brand-pixel"><Icon name="leaf" size={17} /></span> ECO-PET</div><span>LANGKAH {step} / 2</span></header>
      <div className="step-dots"><i className="done" /><i className={step === 2 ? "done" : ""} /></div>
      {step === 1 ? (
        <section className="onboard-card narrow">
          <span className="pixel-sun"><Icon name="leaf" size={28} /></span>
          <p className="eyebrow">KENALAN DULU</p><h1>Siapa nama penjaga baru kami?</h1>
          <p className="muted">Pet-mu akan memanggilmu dengan nama ini.</p>
          <input className="big-input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ketik namamu..." maxLength={16} />
          <button className="primary-btn" disabled={!name.trim()} onClick={() => setStep(2)}>Lanjutkan <Icon name="arrow" size={18} /></button>
        </section>
      ) : (
        <section className="onboard-card pet-step">
          <p className="eyebrow">PILIH TEMAN PERTAMAMU</p><h1>Siapa yang akan tumbuh bersamamu?</h1>
          <p className="muted">Tenang, kamu bisa bertemu pet lain saat menjelajah nanti.</p>
          <div className="pet-grid">
            {(Object.keys(PETS) as PetKey[]).map((key) => (
              <button className={`pet-option ${pet === key ? "selected" : ""}`} key={key} onClick={() => setPet(key)}>
                <span className="select-check"><Icon name="check" size={14} /></span><PixelPet type={key} size="small" />
                <strong>{PETS[key].name}</strong><small>{PETS[key].label}</small>
              </button>
            ))}
          </div>
          <button className="primary-btn" onClick={() => onFinish(name, pet)}>Bertemu {PETS[pet].name} <Icon name="arrow" size={18} /></button>
        </section>
      )}
    </main>
  );
}

const QUESTS = [
  { key: "bottle", title: "Bawa botol minum", detail: "Kurangi plastik sekali pakai", type: "waste", icon: "leaf" },
  { key: "transport", title: "Naik transportasi umum", detail: "Masukkan jarak dan durasi", type: "transport", icon: "bolt" },
  { key: "sort-waste", title: "Pilah sampah", detail: "Organik dan anorganik", type: "waste", icon: "bag" },
  { key: "plant-meal", title: "Makan menu nabati", detail: "Satu kali makan tanpa daging", type: "food", icon: "leaf" },
  { key: "standby", title: "Matikan perangkat siaga", detail: "Hemat energi dua jam", type: "energy", icon: "bolt" },
  { key: "walk", title: "Jalan kaki 2.000 langkah", detail: "Tubuh sehat, udara sehat", type: "transport", icon: "map" },
  { key: "learn", title: "Pelajari fakta alam", detail: "Baca satu Eco Class", type: "education", icon: "book" },
  { key: "compost", title: "Mulai kompos mini", detail: "Simpan sisa buah hari ini", type: "nature", icon: "leaf" },
  { key: "local", title: "Pilih produk lokal", detail: "Kurangi jarak distribusi", type: "food", icon: "bag" },
  { key: "shower", title: "Mandi di bawah 5 menit", detail: "Hemat air bersih", type: "energy", icon: "bolt" },
];

async function appPost(data: Record<string, unknown> | FormData) {
  const response = await fetch("/api/app", { method: "POST", headers: data instanceof FormData ? undefined : { "Content-Type": "application/json" }, body: data instanceof FormData ? data : JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error || "Aksi gagal.");
  return result;
}

function StatHeader({ user }: { user: AppUser }) {
  return <div className="top-stats">
    <div className="profile-chip"><div className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</div><div><small>PENJAGA LEVEL {user.level}</small><strong>{user.displayName}</strong></div></div>
    <div className="level-progress"><div><span>Menuju level {user.level + 1}</span><b>{user.xp % 500} / 500 XP</b></div><div className="progress-track"><i style={{ width: `${(user.xp % 500) / 5}%` }} /></div></div>
    <div className="stat-pill"><Icon name="leaf" /><span><small>TOTAL POIN</small><b>{user.points.toLocaleString("id-ID")}</b></span></div>
    <div className="stat-pill token"><Icon name="token" /><span><small>ECO TOKEN</small><b>{user.ecoTokens}</b></span></div>
  </div>;
}

function Dashboard({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const pet = data.user.selectedPet;
  const [input, setInput] = useState("");
  const [speech, setSpeech] = useState(data.messages.at(-1)?.message || `Halo! Aku ${PETS[pet].name}.`);
  const [chatOpen, setChatOpen] = useState(false);
  const [transportOpen, setTransportOpen] = useState(false);
  const [petPosition, setPetPosition] = useState({ x: 50, y: 66 });
  const [pending, setPending] = useState(false);
  const today = new Date().toDateString();
  const done = data.activities.filter((a) => new Date(a.createdAt).toDateString() === today).map((a) => a.questKey);
  const savedToday = data.activities.filter((a) => new Date(a.createdAt).toDateString() === today).reduce((sum, a) => sum + Number(a.avoidedEmissionsKg || 0), 0);
  const complete = async (quest: typeof QUESTS[number]) => {
    if (done.includes(quest.key)) return;
    if (quest.type === "transport") { setTransportOpen(true); return; }
    setPending(true);
    try { await appPost({ action: "activity", title: quest.title, questKey: quest.key, type: quest.type, visibility: "public" }); setSpeech("Quest tercatat di akunmu. Habitatku terasa lebih sehat!"); await refresh(); } finally { setPending(false); }
  };
  const sendChat = async (e: FormEvent) => {
    e.preventDefault(); if (!input.trim()) return;
    setPending(true);
    try { const result = await appPost({ action: "message", message: input }); setSpeech(result.reply); setInput(""); await refresh(); setChatOpen(true); } finally { setPending(false); }
  };
  const movePet = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPetPosition({ x: Math.max(18, Math.min(82, ((e.clientX - rect.left) / rect.width) * 100)), y: Math.max(44, Math.min(74, ((e.clientY - rect.top) / rect.height) * 100)) });
  };
  return <div className="dashboard-grid">
    <section className="pet-card">
      <div className="habitat-top"><span><Icon name="map" size={16} /> {PETS[pet].habitat}</span><div className="habitat-actions"><button onClick={() => setChatOpen(true)}><Icon name="chat" size={15} /> Chat ({data.messages.length})</button></div></div>
      <div className="speech">{speech}<i /></div>
      <div className={`habitat ${pet}`} onClick={movePet}>
        <div className="sun" /><div className="pixel-cloud a" /><div className="pixel-cloud b" /><div className="mountains" />
        <button className="habitat-object food" onClick={() => setSpeech("Nyam! Terima kasih. Aku paling suka makanan lokal.")} aria-label="Beri makan pet"><Icon name="leaf" size={18} /></button>
        <button className="habitat-object toy" onClick={() => { setSpeech("Ayo bermain! Klik tempat lain supaya aku mengejarnya."); setPetPosition({ x: 70, y: 67 }); }} aria-label="Ajak pet bermain"><Icon name="star" size={17} /></button>
        <div className="tree t1" /><div className="tree t2" /><div className="pond" /><div className="move-hint">KLIK TANAH · MAKANAN · MAINAN</div>
        <div className="pet-stage" style={{ left: `${petPosition.x}%`, top: `${petPosition.y}%` }}><PixelPet type={pet} accessory={data.user.equippedAccessory} /></div>
      </div>
      <form className="pet-chat" onSubmit={sendChat}><span>AI</span><input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Tanya ${PETS[pet].name} sedang ngapain...`} /><button disabled={pending} type="submit"><Icon name="arrow" size={17} /></button></form>
    </section>
    <aside className="right-stack">
      <section className="emission-card"><div className="section-title"><div><p className="eyebrow">JEJAK AKUN HARI INI</p><h3>Karbon dihindari</h3></div><b className="good">LIVE</b></div><div className="emission-value"><strong>{savedToday.toFixed(2)}</strong><span>kg CO₂e<br /><small>Dihitung dari aktivitasmu</small></span></div><p className="insight"><Icon name="leaf" size={17} /> Dibanding alternatif kendaraan pribadimu.</p></section>
      <section className="quest-card"><div className="section-title"><div><p className="eyebrow">DAILY QUEST</p><h3>{QUESTS.length} aksi tersedia</h3></div><span>{done.length}/{QUESTS.length}</span></div><div className="quest-progress"><i style={{ width: `${done.length / QUESTS.length * 100}%` }} /></div><div className="quest-list quest-scroll">{QUESTS.map((q) => <button disabled={pending} key={q.key} onClick={() => complete(q)} className={done.includes(q.key) ? "complete" : ""}><span className="quest-icon"><Icon name={done.includes(q.key) ? "check" : q.icon} size={18} /></span><span><strong>{q.title}</strong><small>{q.detail}</small></span><b>{done.includes(q.key) ? "SELESAI" : "CATAT"}</b></button>)}</div></section>
    </aside>
    {chatOpen && <Modal title={`Chat dengan ${PETS[pet].name}`} onClose={() => setChatOpen(false)}><div className="chat-history">{data.messages.length ? data.messages.map((m) => <div key={m.id} className={`chat-row ${m.sender === "user" ? "user" : "pet"}`}><small>{m.sender === "user" ? "Kamu" : PETS[pet].name} · {new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</small><p>{m.message}</p></div>) : <p className="empty-state">Belum ada chat. Tanyakan pet-mu sedang apa.</p>}</div><form className="modal-chat-form" onSubmit={sendChat}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ketik pesan..." /><button className="primary-btn" disabled={pending}>Kirim</button></form></Modal>}
    {transportOpen && <TransportModal onClose={() => setTransportOpen(false)} onSaved={async () => { setTransportOpen(false); await refresh(); }} />}
  </div>;
}

function TransportModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => Promise<void> }) {
  const [distance, setDistance] = useState(5);
  const [duration, setDuration] = useState(25);
  const [mode, setMode] = useState("bus");
  const [alternative, setAlternative] = useState("car");
  const [pending, setPending] = useState(false);
  const factors: Record<string, number> = { walk: 0, bicycle: 0, bus: .089, train: .041, car: .192, motorcycle: .103 };
  const actual = distance * factors[mode], baseline = distance * factors[alternative], saved = Math.max(0, baseline - actual);
  return <Modal title="Catat perjalanan" onClose={onClose}><form className="transport-form" onSubmit={async (e) => { e.preventDefault(); setPending(true); try { await appPost({ action: "activity", title: `Perjalanan ${mode}`, questKey: "transport", type: "transport", distanceKm: distance, durationMinutes: duration, transportMode: mode, alternativeMode: alternative, visibility: "public" }); await onSaved(); } finally { setPending(false); } }}>
    <div className="mode-grid">{[["bus","Bus"],["train","Kereta"],["walk","Jalan kaki"],["bicycle","Sepeda"]].map(([key,label]) => <button type="button" className={mode === key ? "active" : ""} key={key} onClick={() => setMode(key)}><Icon name={key === "walk" ? "map" : "bolt"} />{label}</button>)}</div>
    <div className="form-two"><label>Jarak perjalanan (km)<input type="number" min=".1" max="200" step=".1" value={distance} onChange={(e) => setDistance(Number(e.target.value))} /></label><label>Durasi (menit)<input type="number" min="1" max="600" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></label></div>
    <label>Alternatif jika tidak memilih moda ini<select value={alternative} onChange={(e) => setAlternative(e.target.value)}><option value="car">Mobil pribadi</option><option value="motorcycle">Sepeda motor</option></select></label>
    <div className="carbon-compare"><div><small>MODA DIPILIH</small><b>{actual.toFixed(2)} kg</b></div><span>vs</span><div><small>ALTERNATIF</small><b>{baseline.toFixed(2)} kg</b></div><strong>-{saved.toFixed(2)} kg CO₂e</strong></div>
    <p className="calculation-note">Estimasi memakai faktor emisi rata-rata per penumpang-km. Hasil aktual dapat berbeda menurut kendaraan dan okupansi.</p><button className="primary-btn full" disabled={pending}>{pending ? "Menghitung..." : "Simpan perjalanan"}</button>
  </form></Modal>;
}

function Report({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const [storyOpen, setStoryOpen] = useState(false);
  const [shared, setShared] = useState(false);
  const [pending, setPending] = useState(false);
  const totalSaved = data.activities.reduce((sum, a) => sum + Number(a.avoidedEmissionsKg || 0), 0);
  const totalDistance = data.activities.reduce((sum, a) => sum + Number(a.distanceKm || 0), 0);
  const daysSinceJoin = Math.max(1, Math.ceil((Date.now() - new Date(data.user.createdAt).getTime()) / 86400000));
  const shareReport = async () => {
    const report = { title: "Eco Wrapped Eco-Pet", text: `Sejak bergabung aku menghindari ${totalSaved.toFixed(2)} kg CO₂, menyelesaikan ${data.activities.length} eco quest, dan menjaga streak ${data.user.currentStreak} hari.` };
    if (navigator.share) await navigator.share(report).catch(() => undefined); else await navigator.clipboard?.writeText(report.text);
    setShared(true);
  };
  return <div className="page-content">
    <div className="page-heading"><div><p className="eyebrow">LAPORAN AKUN</p><h1>Perjalananmu tercatat.</h1><p>Semua angka berasal dari aktivitas yang benar-benar kamu simpan.</p></div><button className="outline-btn" onClick={shareReport}><Icon name={shared ? "check" : "camera"} size={18} /> {shared ? "Siap dibagikan" : "Bagikan ke aplikasi lain"}</button></div>
    <div className="report-grid"><section className="weekly-card"><div className="week-top"><div><small>SEJAK {new Date(data.user.createdAt).toLocaleDateString("id-ID")}</small><h2>Eco Wrapped</h2></div><span>{daysSinceJoin} HARI</span></div><div className="wrapped-visual"><div className="big-number">{totalSaved.toFixed(1)}<small>KG CO₂ DIHINDARI</small></div><div className="pixel-planet"><Icon name="leaf" size={50} /></div></div><div className="mini-stats"><div><b>{data.activities.length}</b><small>QUEST TERCATAT</small></div><div><b>{totalDistance.toFixed(1)} km</b><small>PERJALANAN</small></div><div><b>{data.user.points}</b><small>POIN DIDAPAT</small></div></div></section>
      <section className="impact-card"><p className="eyebrow">DAMPAK AKUNMU</p><h3>Berdasarkan catatan nyata</h3><div className="impact-row"><span><Icon name="leaf" /></span><div><b>{(totalSaved / 21).toFixed(2)} pohon-bulan</b><small>estimasi serapan pohon dewasa</small></div></div><div className="impact-row"><span><Icon name="bolt" /></span><div><b>{(totalSaved * 4.2).toFixed(1)} kWh</b><small>perkiraan energi setara</small></div></div><div className="streak"><Icon name="fire" /><div><b>{data.user.currentStreak} hari beruntun</b><small>Rekor: {data.user.longestStreak} hari</small></div></div></section></div>
    <section className="journey-strip"><div><p className="eyebrow">PERJALANANMU</p><h2>Jejak akun sejak hari pertama</h2></div>{[["HARI 0",`Bertemu ${PETS[data.user.selectedPet].name}`],["AKTIVITAS",data.activities.length ? "Quest pertama" : "Belum dimulai"],["STREAK",`${data.user.currentStreak} hari`],["LEVEL",String(data.user.level)]].map((j,i)=><div className={`journey-stop j${i}`} key={j[0]}><span>{i+1}</span><small>{j[0]}</small><b>{j[1]}</b></div>)}</section>
    <section className="diary-section"><div className="section-title"><div><p className="eyebrow">ECO DIARY</p><h2>Foto dan cerita perjalananmu</h2></div><button className="primary-btn small" onClick={() => setStoryOpen(true)}>+ Tambah cerita</button></div><div className="diary-grid">{data.diary.length ? data.diary.map((entry) => <article className={entry.photo && typeof entry.photo === "object" ? "diary-photo uploaded" : "diary-note"} key={entry.id}>{entry.photo && typeof entry.photo === "object" && entry.photo.url && <Image src={entry.photo.url} alt={entry.photo.alt || entry.title} fill sizes="(max-width: 620px) 100vw, 33vw" />}<small>{new Date(entry.createdAt).toLocaleDateString("id-ID")}</small><div><b>{entry.title}</b><p>{entry.story}</p></div></article>) : <div className="empty-card"><Icon name="camera" /><b>Diary masih kosong</b><p>Tambahkan foto asli pertamamu.</p></div>}</div></section>
    {storyOpen && <Modal title="Catat perjalanan baru" onClose={() => setStoryOpen(false)}><form className="story-form" onSubmit={async (e) => { e.preventDefault(); setPending(true); try { await appPost(new FormData(e.currentTarget)); setStoryOpen(false); await refresh(); } finally { setPending(false); } }}><input type="hidden" name="action" value="diary" /><label>Judul cerita<input name="title" required placeholder="Hari ini aku..." /></label><label>Ceritamu<textarea name="story" required placeholder="Apa aksi baik yang kamu lakukan?" /></label><label>Foto perjalanan<input className="photo-input" name="photo" type="file" accept="image/jpeg,image/png,image/webp" /><small>JPG, PNG, atau WebP maksimal 5 MB.</small></label><label className="visibility-check"><input name="visibility" type="checkbox" value="public" /> Tampilkan di komunitas</label><button className="primary-btn full" disabled={pending} type="submit">{pending ? "Mengunggah..." : "Simpan ke diary"}</button></form></Modal>}
  </div>;
}

function Social({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const [tab, setTab] = useState<"group" | "friends">("group");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const people = data.people.filter((p) => p.id !== data.user.id);
  const visiblePeople = people.filter((p) => p.displayName.toLowerCase().includes(query.toLowerCase()));
  const profile = people.find((p) => p.id === selected);
  const community = data.activities.filter((a) => String(a.owner) !== String(data.user.id));
  const challengeProgress = Math.min(100, data.activities.filter((a) => a.type === "waste").length * 5);
  return <div className="page-content"><div className="page-heading"><div><p className="eyebrow">TUMBUH BERSAMA</p><h1>Komunitas Penjaga</h1><p>Hanya akun dan aktivitas yang benar-benar tersimpan.</p></div><div className="social-tabs"><button className={tab === "group" ? "active" : ""} onClick={() => setTab("group")}>Aktivitas</button><button className={tab === "friends" ? "active" : ""} onClick={() => setTab("friends")}>Penjaga <span>{people.length}</span></button></div></div>
    {tab === "group" ? <><div className="challenge-banner"><div><small>UPDATE OTOMATIS DARI AKTIVITAS PUBLIK</small><h2>7 Hari Bebas Plastik</h2><p>Setiap quest sampah publik menambah progres komunitas.</p><div className="challenge-bar"><i style={{width:`${challengeProgress}%`}} /></div><b>{challengeProgress}% target · diperbarui dari database</b></div><div className="banner-bottle"><Icon name="leaf" size={48} /></div></div><div className="social-grid"><section className="feed-card"><div className="section-title"><div><p className="eyebrow">AKTIVITAS PENGGUNA</p><h3>Feed komunitas nyata</h3></div><span>{people.length + 1} akun</span></div>{community.length ? community.map((a,i) => <article className="feed-item" key={a.id}><div className={`friend-avatar c${i%3}`}>{a.ownerDisplayName?.slice(0,2).toUpperCase()}</div><div><b>{a.ownerDisplayName}</b> <span>menyelesaikan aktivitas</span><p>{a.title}{a.distanceKm ? ` · ${a.distanceKm} km` : ""}</p><small>{new Date(a.createdAt).toLocaleString("id-ID")}</small></div></article>) : <div className="empty-card"><Icon name="users" /><b>Belum ada aktivitas pengguna lain</b><p>Feed akan terisi saat akun lain membagikan quest publik.</p></div>}</section><section className="leader-card"><div className="section-title"><div><p className="eyebrow">LEADERBOARD</p><h3>Berdasarkan poin akun</h3></div></div>{[data.user,...people].sort((a,b)=>b.points-a.points).slice(0,5).map((p,i)=><div className={`podium p${i}`} key={p.id}><span className="rank">{i+1}</span><div className={`friend-avatar c${i%3}`}>{p.displayName[0]}</div><b>{p.displayName}<small>{p.points} poin</small></b></div>)}</section></div></> : <section className="people-panel"><div className="people-head"><div><p className="eyebrow">DIREKTORI AKUN</p><h2>Temukan teman seperjalanan</h2></div><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Cari nama..." /></div><div className="people-grid">{visiblePeople.length ? visiblePeople.map((p,i)=><button className="person-card" key={p.id} onClick={()=>setSelected(p.id)}><div className={`friend-avatar c${i%3}`}>{p.displayName.slice(0,2).toUpperCase()}</div><div><b>{p.displayName}</b><small>{PETS[p.selectedPet]?.label} · Level {p.level}</small></div><span>Lihat</span></button>) : <div className="empty-card"><b>Belum ada akun lain</b><p>Ajak teman membuat akun Eco-Pet.</p></div>}</div></section>}
    {profile && <Modal title="Profil Penjaga" onClose={()=>setSelected(null)}><div className="member-profile"><div className="member-hero"><div className="friend-avatar">{profile.displayName.slice(0,2).toUpperCase()}</div><div><h2>{profile.displayName}</h2><p>Penjaga Level {profile.level}</p></div></div><div className="member-stats"><div><b>{profile.points}</b><small>ECO POIN</small></div><div><b>{PETS[profile.selectedPet]?.name}</b><small>PET</small></div><div><b>{profile.currentStreak}</b><small>STREAK</small></div></div><button className="primary-btn full" onClick={async()=>{ await appPost({action:"friend-request",recipient:profile.id}); setSelected(null); await refresh(); }}>Kirim permintaan teman</button></div></Modal>}
  </div>;
}

function Tokens({ user }: { user: AppUser }) {
  const items = [["Topi Petualang",80,"hat"],["Kacamata Pixel",70,"glasses"],["Kolam Teratai",150,"pond-item"]];
  return <div className="page-content"><div className="token-hero"><div><p className="eyebrow light">DOMPET ECO TOKEN</p><h1>{user.ecoTokens} <span>ET</span></h1><p>Saldo akun bertambah otomatis dari aktivitas tersimpan.</p></div><div className="coin-stack"><Icon name="token" size={62} /></div><div className="token-history"><small>LEVEL AKUN</small><b>{user.level}</b></div></div><div className="shop-heading"><div><p className="eyebrow">PIXEL SHOP</p><h2>Koleksi habitat berikutnya</h2></div></div><div className="shop-grid">{items.map(([name,cost,cls])=><article className="shop-item" key={String(name)}><div className={`item-art ${cls}`}><span /></div><div><small>Terbuka lewat perk level</small><h3>{name}</h3><button disabled><Icon name="lock" size={16} /> {cost} ET</button></div></article>)}</div></div>;
}

function World({ user }: { user: AppUser }) {
  const regions = [
    {name:"Kampung Embun",level:0,perk:"Bibit bunga",challenge:"Tanam 5 bunga penyerbuk",lesson:"Lebah membantu penyerbukan satu dari tiga suap makanan kita.",color:"meadow"},
    {name:"Hutan Berbisik",level:3,perk:"Mahkota daun",challenge:"Temukan 3 suara hutan",lesson:"Hutan tropis menyimpan sekitar seperempat karbon daratan.",color:"forest"},
    {name:"Teluk Biru",level:6,perk:"Habitat pantai",challenge:"Bersihkan sampah teluk",lesson:"Lamun menyerap karbon jauh lebih cepat dari banyak ekosistem darat.",color:"ocean"},
    {name:"Puncak Aurora",level:10,perk:"Efek aurora",challenge:"Nyalakan desa dengan energi bersih",lesson:"Angin dan matahari menghasilkan listrik tanpa emisi operasional.",color:"aurora"},
  ];
  const [selected,setSelected]=useState<number|null>(null); const [lesson,setLesson]=useState<number|null>(null); const active=selected===null?null:regions[selected];
  return <div className="world-page"><div className="world-heading"><p className="eyebrow light">PETA PETUALANGAN</p><h1>Dunia Eco-Pet · Level {user.level}</h1><p>Wilayah terbuka mengikuti level akunmu.</p></div><div className="world-map"><div className="map-path" />{regions.map((r,i)=>{const open=user.level>=r.level;return <button onClick={()=>setSelected(i)} className={`region r${i} ${r.color} ${open?"open":"locked"}`} key={r.name}><div className="region-island"><span className="region-icon"><Icon name={open?"leaf":"lock"} size={24}/></span></div><div className="region-label"><small>{open?`LEVEL ${r.level} · JELAJAHI`:`TERBUKA LEVEL ${r.level}`}</small><b>{r.name}</b><span>PERK: {r.perk}</span></div></button>})}</div><div className="level-perks"><div><p className="eyebrow">PERJALANAN LEVEL</p><h2>Mulai dari level 0</h2></div><div className="perk-track"><i style={{width:`${Math.min(100,user.level*10)}%`}}/><span className="milestone done">0<b>Kampung</b></span><span className="milestone current">{user.level}<b>Kamu</b></span><span className="milestone">3<b>Hutan</b></span><span className="milestone">6<b>Teluk</b></span><span className="milestone">10<b>Aurora</b></span></div></div><section className="eco-class"><div className="eco-class-title"><span><Icon name="book" size={28}/></span><div><p className="eyebrow">ECO CLASS</p><h2>Belajar dari alam.</h2></div></div><div className="lesson-grid">{regions.slice(0,3).map((r,i)=><button key={r.name} onClick={()=>setLesson(i)}><small>PELAJARAN 0{i+1}</small><b>{r.name}</b><span>Baca fakta <Icon name="arrow" size={14}/></span></button>)}</div></section>
    {active&&<Modal wide title={active.name} onClose={()=>setSelected(null)}><div className={`region-adventure ${active.color}`}><div className="adventure-scene"><div className="adventure-sun"/><div className="adventure-ground"/><span className="tiny-tree a"/><span className="tiny-tree b"/><div className="adventure-badge"><Icon name={user.level>=active.level?"map":"lock"} size={34}/></div></div><div className="adventure-copy"><span className={user.level>=active.level?"status-open":"status-lock"}>{user.level>=active.level?`WILAYAH LEVEL ${active.level}`:`TERKUNCI · LEVEL ${active.level}`}</span><h3>{user.level>=active.level?active.challenge:"Level akunmu belum cukup."}</h3><p>{active.lesson}</p><div className="reward-box"><Icon name="star"/><div><small>PERK</small><b>{active.perk}</b></div></div></div></div></Modal>}
    {lesson!==null&&<Modal title="Eco Class" onClose={()=>setLesson(null)}><article className="lesson-reader"><span className="lesson-number">0{lesson+1}</span><p className="eyebrow">FAKTA ALAM</p><h2>{regions[lesson].name}</h2><div className={`lesson-illustration l${lesson}`}><Icon name="leaf" size={48}/></div><p>{regions[lesson].lesson}</p><button className="primary-btn full" onClick={()=>setLesson(null)}>Selesai belajar</button></article></Modal>}
  </div>;
}

function AppShell({ data, refresh, onLogout }: { data: Snapshot; refresh: () => Promise<void>; onLogout: () => Promise<void> }) {
  const [view,setView]=useState<ViewKey>("home"); const user=data.user;
  return <div className="app-shell"><header className="app-header"><button className="logo-button" onClick={()=>setView("home")}><span className="brand-pixel"><Icon name="leaf" size={17}/></span>ECO-PET</button><nav>{NAV.map(n=><button key={n.key} className={view===n.key?"active":""} onClick={()=>setView(n.key)}>{n.icon}<span>{n.label}</span></button>)}</nav><button className="header-avatar" onClick={onLogout} title="Keluar dari akun">{user.displayName[0].toUpperCase()}<i/></button></header><main className="app-main">{view==="home"&&<><div className="welcome-row"><div><p className="eyebrow">HALO, {user.displayName.toUpperCase()}!</p><h1>Habitat {PETS[user.selectedPet].name} menunggumu.</h1></div><span className="streak-chip"><Icon name="fire"/><b>{user.currentStreak} hari</b> streak</span></div><StatHeader user={user}/><Dashboard data={data} refresh={refresh}/></>}{view==="report"&&<Report data={data} refresh={refresh}/>} {view==="social"&&<Social data={data} refresh={refresh}/>} {view==="token"&&<Tokens user={user}/>} {view==="world"&&<World user={user}/>}</main><nav className="mobile-nav">{NAV.map(n=><button key={n.key} className={view===n.key?"active":""} onClick={()=>setView(n.key)}>{n.icon}<small>{n.label}</small></button>)}</nav></div>;
}

export default function EcoPetApp() {
  const [data,setData]=useState<Snapshot|null>(null); const [loading,setLoading]=useState(true); const [stage,setStage]=useState<"auth"|"onboard">("auth"); const [credentials,setCredentials]=useState({email:"",password:""}); const [error,setError]=useState("");
  const refresh=async()=>{const response=await fetch("/api/app",{cache:"no-store"});const next=await response.json();setData(next.authenticated?next:null);setLoading(false)};
  useEffect(()=>{refresh().catch(()=>setLoading(false))},[]);
  const authContinue=async(mode:"login"|"signup",email:string,password:string)=>{if(mode==="signup"){setCredentials({email,password});setStage("onboard");return}await appPost({action:"login",email,password});await refresh()};
  const finish=async(name:string,pet:PetKey)=>{try{await appPost({action:"signup",displayName:name,email:credentials.email,password:credentials.password,selectedPet:pet});await refresh()}catch(e){setError(e instanceof Error?e.message:"Pendaftaran gagal");setStage("auth")}};
  const logout=async()=>{await appPost({action:"logout"});setData(null);setStage("auth")};
  if(loading)return <div className="loading-screen"><span className="brand-pixel"><Icon name="leaf"/></span><p>Memuat habitat...</p></div>;
  if(data)return <AppShell data={data} refresh={refresh} onLogout={logout}/>;
  if(stage==="onboard")return <Onboarding onFinish={finish}/>;
  return <><Auth onContinue={authContinue}/>{error&&<div className="global-toast">{error}</div>}</>;
}
