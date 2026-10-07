"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/data/store";
import { createCompany, createPerson, uid } from "@/data/actions";
import { Button, Dialog, Field, Icons, Input, Segmented, Select } from "@/components/ui";
import { digits, maskCPF, maskCNPJ } from "@/lib/format";
import { cpfValid } from "@/domain/engines/importer";
import { demoGeocoder } from "@/integrations/maps";
import type { Address } from "@/domain/types";

/** Cadastro único — verifica duplicidade por CPF/CNPJ/telefone/e-mail ANTES de criar ("digitar uma vez"). */
export function NewClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db, user, update, toast } = useStore();
  const router = useRouter();
  const [kind, setKind] = useState<"person" | "company">("person");
  const [f, setF] = useState({ name: "", doc: "", birth: "", phone: "", email: "", cep: "", street: "", number: "", district: "", city: "Rio de Janeiro", profession: "", sector: "", employees: "", status: "lead" as "lead" | "ativo", ownerId: user?.role === "corretor" ? user.id : "u-juliana" });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((s) => ({ ...s, [k]: e.target.value }));
  const [geo, setGeo] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const duplicate = useMemo(() => {
    const d = digits(f.doc);
    const ph = digits(f.phone).slice(-9);
    if (kind === "person") {
      if (d.length === 11) { const p = db.persons.find((x) => digits(x.cpf) === d); if (p) return { href: `/clientes/${p.id}`, name: p.name, by: "CPF" }; }
      if (ph.length === 9) { const p = db.persons.find((x) => (x.phone && digits(x.phone).endsWith(ph)) || (x.whatsapp && digits(x.whatsapp).endsWith(ph))); if (p) return { href: `/clientes/${p.id}`, name: p.name, by: "telefone" }; }
      if (f.email.includes("@")) { const p = db.persons.find((x) => x.email?.toLowerCase() === f.email.toLowerCase()); if (p) return { href: `/clientes/${p.id}`, name: p.name, by: "e-mail" }; }
    } else if (d.length === 14) {
      const c = db.companies.find((x) => digits(x.cnpj) === d);
      if (c) return { href: `/empresas/${c.id}`, name: c.tradeName, by: "CNPJ" };
    }
    return null;
  }, [db, f.doc, f.phone, f.email, kind]);

  const docInvalid = kind === "person" && digits(f.doc).length === 11 && !cpfValid(f.doc);
  const canSave = f.name.trim().length > 2 && !duplicate && !docInvalid;

  async function lookupCep(cep: string) {
    if (digits(cep).length < 8) return;
    const g = await demoGeocoder.geocode(cep);
    if (g) {
      setGeo(g);
      const district = g.label.split("·")[1]?.trim() ?? "";
      setF((s) => ({ ...s, district: s.district || district.replace(/\b\w/g, (c) => c.toUpperCase()), city: district === "niteroi" || district === "icarai" ? "Niterói" : s.city }));
    }
  }

  function save() {
    update((d, u) => {
      let next = d;
      let addressId: string | undefined;
      if (f.cep || f.street) {
        addressId = uid("a");
        const addr: Address = { id: addressId, label: kind === "person" ? "Residencial" : "Sede", street: f.street, number: f.number, district: f.district, city: f.city, state: "RJ", cep: f.cep, lat: geo?.lat ?? -22.9068, lng: geo?.lng ?? -43.1729 };
        next = { ...next, addresses: [...next.addresses, addr] };
      }
      if (kind === "person") {
        const r = createPerson(next, u, { name: f.name.trim(), cpf: f.doc ? maskCPF(f.doc) : "", birthDate: f.birth, phone: digits(f.phone) ? "55" + digits(f.phone).slice(-11) : undefined, whatsapp: digits(f.phone) ? "55" + digits(f.phone).slice(-11) : undefined, email: f.email || undefined, addressId, profession: f.profession || undefined, ownerId: f.ownerId, clientStatus: f.status, clientSince: new Date().toISOString().slice(0, 10), source: "Cadastro manual" });
        setTimeout(() => router.push(`/clientes/${r.id}`));
        return r.db;
      }
      const r = createCompany(next, u, { legalName: f.name.trim(), tradeName: f.name.trim().replace(/ (ltda|s\.?a\.?|me|eireli)\.?$/i, ""), cnpj: f.doc ? maskCNPJ(f.doc) : "", sector: f.sector || "—", employees: Number(f.employees) || 0, addressId, phone: digits(f.phone) || undefined, email: f.email || undefined, ownerId: f.ownerId, clientStatus: f.status, clientSince: new Date().toISOString().slice(0, 10) });
      setTimeout(() => router.push(`/empresas/${r.id}`));
      return r.db;
    });
    toast(kind === "person" ? "Cliente cadastrado — oportunidades analisadas automaticamente" : "Empresa cadastrada");
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Novo cliente" wide footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={!canSave}>Cadastrar</Button></>}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Segmented value={kind} onChange={setKind} options={[{ value: "person", label: "Pessoa física" }, { value: "company", label: "Empresa" }]} />
        <span className="text-2xs text-ink-muted">Cadastro único: verificamos duplicidade enquanto você digita.</span>
      </div>
      {duplicate && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-warn-soft px-3 py-2.5 text-sm text-warn-strong">
          <Icons.UserCheck className="h-4 w-4 shrink-0" />
          <span className="flex-1"><b>{duplicate.name}</b> já está cadastrado(a) (mesmo {duplicate.by}). Não é preciso digitar de novo.</span>
          <Button size="sm" variant="secondary" onClick={() => { onClose(); router.push(duplicate.href); }}>Abrir cadastro</Button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={kind === "person" ? "Nome completo" : "Razão social"} className="sm:col-span-2"><Input value={f.name} onChange={set("name")} autoFocus /></Field>
        <Field label={kind === "person" ? "CPF" : "CNPJ"} hint={docInvalid ? <span className="text-danger">CPF inválido</span> : undefined}><Input value={f.doc} onChange={set("doc")} placeholder={kind === "person" ? "000.000.000-00" : "00.000.000/0000-00"} /></Field>
        {kind === "person" ? <Field label="Nascimento"><Input type="date" value={f.birth} onChange={set("birth")} /></Field> : <Field label="Setor"><Input value={f.sector} onChange={set("sector")} /></Field>}
        <Field label="Celular / WhatsApp"><Input value={f.phone} onChange={set("phone")} placeholder="(21) 99999-0000" /></Field>
        <Field label="E-mail"><Input type="email" value={f.email} onChange={set("email")} /></Field>
        <Field label="CEP" hint={geo ? `Localizado: ${geo.label} (geocoder DEMO)` : "Preenche bairro e geolocalização (usada na rede credenciada)"}><Input value={f.cep} onChange={set("cep")} onBlur={(e) => lookupCep(e.target.value)} placeholder="22000-000" /></Field>
        <Field label="Bairro"><Input value={f.district} onChange={set("district")} /></Field>
        <Field label="Logradouro"><Input value={f.street} onChange={set("street")} /></Field>
        <Field label="Número / compl."><Input value={f.number} onChange={set("number")} /></Field>
        {kind === "person" ? <Field label="Profissão"><Input value={f.profession} onChange={set("profession")} /></Field> : <Field label="Funcionários"><Input type="number" value={f.employees} onChange={set("employees")} /></Field>}
        <Field label="Situação"><Select value={f.status} onChange={set("status")}><option value="lead">Lead</option><option value="ativo">Cliente ativo</option></Select></Field>
        <Field label="Corretor responsável"><Select value={f.ownerId} onChange={set("ownerId")}>{db.users.filter((u) => ["corretor", "gestor", "admin"].includes(u.role)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select></Field>
      </div>
    </Dialog>
  );
}
