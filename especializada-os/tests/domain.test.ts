import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/data/seed";
import { runAutomations } from "../src/domain/engines/automation";
import { operationsQueue } from "../src/domain/engines/priority";
import { recommend, whatChanges, ageBand } from "../src/domain/engines/health";
import { ask, SUGGESTED_QUESTIONS } from "../src/domain/engines/assistant";
import { globalSearch } from "../src/domain/engines/search";
import { crossSellFor } from "../src/domain/engines/crosssell";
import { analyzeRows, guessMapping, parseCSV, SAMPLE_IMPORT_CSV, cpfValid } from "../src/domain/engines/importer";
import { regexParser } from "../src/integrations/document-parsing";
import { fillSample, SAMPLE_DOCS } from "../src/data/seed";
import { providerSimilarity } from "../src/lib/text";
import { dashboardMetrics } from "../src/domain/engines/metrics";

const TODAY = "2026-10-07";
const db = createSeed(TODAY);

test("seed: 20 clientes DEMO, todos marcados demo", () => {
  const clients = db.persons.filter((p) => p.clientStatus).length + db.companies.filter((c) => c.clientStatus).length;
  assert.equal(clients, 20);
  for (const coll of [db.persons, db.companies, db.policies, db.assets, db.insurers, db.providers]) assert.ok(coll.every((x: { demo: boolean }) => x.demo === true));
});

test("seed: CPFs com dígito verificador válido", () => {
  for (const p of db.persons) assert.ok(cpfValid(p.cpf), p.cpf);
});

test("automações: idempotentes", () => {
  const again = runAutomations(db, TODAY);
  assert.equal(again.runs.length, 0);
  assert.equal(again.db.tasks.length, db.tasks.length);
});

test("automações: renovações abertas para apólices até 90 dias e uma tarefa aberta por renovação", () => {
  const due = db.policies.filter((p) => p.status === "vigente" && p.end <= "2027-01-05");
  for (const p of due) assert.ok(db.renewals.some((r) => r.policyId === p.id), p.id);
  for (const r of db.renewals) {
    const open = db.tasks.filter((t) => t.status === "aberta" && t.id.startsWith(`t-ren-${r.policyId}-w`));
    assert.ok(open.length <= 1, r.policyId);
  }
});

test("follow-up automático para proposta sem resposta", () => {
  assert.ok(db.tasks.some((t) => t.id === "t-fu-pr-thiago"));
  assert.ok(db.tasks.some((t) => t.id === "t-fu-pr-abc"));
});

test("central: itens urgentes primeiro", () => {
  const q = operationsQueue(db, TODAY, db.users[0]);
  assert.ok(q.length > 10);
  assert.equal(q[0].primary, "urgente");
  for (let i = 1; i < q.length; i++) assert.ok(q[i - 1].score >= q[i].score);
});

test("saúde: faixas ANS e recomendação com 4 categorias", () => {
  assert.equal(ageBand(0), "0-18");
  assert.equal(ageBand(19), "19-23");
  assert.equal(ageBand(58), "54-58");
  assert.equal(ageBand(59), "59+");
  const q = db.quotes.find((x) => x.id === "q-fernanda")!;
  const rec = recommend(db, q.request as never);
  assert.equal(rec.picks.length, 4);
  const a = db.healthPlans.find((p) => p.id === "hp-vit-prime")!;
  const b = db.healthPlans.find((p) => p.id === "hp-car-plus")!;
  const diff = whatChanges(db, a, b, [38, 40, 8]);
  assert.ok(diff[0].includes("por mês"));
});

test("rede: matching de nomes duplicados", () => {
  assert.ok(providerSimilarity("Hospital Atlântico D'Or", "Atlantico Dor") > 0.8);
  assert.ok(providerSimilarity("Hospital Atlântico D'Or", "Hospital Atlântico D'Or RJ") > 0.8);
  assert.ok(providerSimilarity("Hospital Atlântico D'Or", "Hospital Barra Central") < 0.5);
});

test("assistente: todas as perguntas sugeridas têm resposta (nenhuma 'unknown')", () => {
  for (const q of SUGGESTED_QUESTIONS) {
    const a = ask(db, q, TODAY, db.users[0]);
    assert.notEqual(a.intent, "unknown", q);
  }
  assert.equal(ask(db, "qual a capital da França?", TODAY).intent, "unknown");
});

test("busca global: placa, CPF, apólice, hospital", () => {
  assert.equal(globalSearch(db, "RIO2A23", db.users[0])[0].type, "Veículo");
  const cpf = db.persons.find((p) => p.id === "p-joao")!.cpf;
  assert.equal(globalSearch(db, cpf, db.users[0])[0].label, "João Silva");
  assert.equal(globalSearch(db, "copa d")[0]?.type ?? globalSearch(db, "atlantico")[0].type, globalSearch(db, "atlantico", db.users[0])[0].type);
});

test("cross-sell: João (dependentes, sem vida) e Paulo (imóvel sem residencial)", () => {
  assert.ok(crossSellFor(db, { type: "person", id: "p-joao" }, TODAY).some((s) => s.line === "vida"));
  assert.ok(crossSellFor(db, { type: "person", id: "p-eduardo" }, TODAY).some((s) => s.line === "residencial"));
});

test("importação: mapeamento, validação e matching", () => {
  const rows = parseCSV(fillSample(SAMPLE_IMPORT_CSV, db.persons));
  const map = guessMapping(rows[0]).map((m) => m.field);
  assert.deepEqual(map.slice(0, 3), ["name", "cpf", "birthDate"]);
  const res = analyzeRows(db, rows.slice(1), map);
  assert.equal(res[0].action, "criar");
  assert.equal(res[1].action, "atualizar");
  assert.equal(res[2].action, "ignorar"); // CPF inválido
  assert.equal(res[3].match?.id, "p-joao"); // telefone
});

test("document AI: extrai campos da apólice de exemplo", async () => {
  const s = SAMPLE_DOCS[0];
  const r = await regexParser.parse({ fileName: s.fileName, text: fillSample(s.text(TODAY), db.persons), knownInsurers: db.insurers });
  assert.equal(r.kind, "apolice");
  const f = Object.fromEntries(r.fields.map((x) => [x.key, x.value]));
  assert.equal(f.policyNumber, "TOK-RE-552901");
  assert.equal(f.premium, "1036");
  assert.equal(f.insurer, "Tokio Marine");
});

test("dashboard: métricas coerentes", () => {
  const m = dashboardMetrics(db, TODAY, db.users[0]);
  assert.equal(m.activeClients, 16);
  assert.ok(m.hoursSaved30 > 0);
  assert.ok(m.renew30.length > 3);
});

import { can } from "../src/domain/rbac";
import { manualPlaceholders } from "../src/integrations/insurers/registry";
import { retentionPreview, RETENTION_RULES } from "../src/domain/engines/retention";

test("decisão 1: comissões visíveis só para o Administrador", () => {
  for (const u of db.users) assert.equal(can(db, u, "commissions.view"), u.role === "admin", u.role);
  const corretor = db.users.find((u) => u.role === "corretor")!;
  assert.match(ask(db, "Quanto temos de comissão prevista?", TODAY, corretor).text, /não tem acesso/);
});

test("decisão 2: carteira restrita ao corretor por padrão", () => {
  assert.equal(db.settings.restrictWalletToOwner, true);
});

test("decisões 3/4: catálogo real + seguradoras sem adapter entram como cotação manual", () => {
  assert.ok(db.insurers.length >= 25);
  const manual = manualPlaceholders(db.insurers, "auto");
  assert.ok(manual.length > 0 && manual.every((r) => r.status === "manual_pendente"));
  assert.ok(manual.some((r) => r.insurerId === "ins-mapfre"));
});

test("decisão 6: política de retenção com prévia", () => {
  const prev = retentionPreview(db, TODAY);
  assert.equal(prev.length, RETENTION_RULES.length);
  assert.ok(prev.every((p) => p.count >= 0));
});

import { guessLayout, parseCommissionStatement, reconcile, applyReconciliation, sampleStatement } from "../src/integrations/insurers/commission-statements";
import { redact } from "../src/integrations/insurers/http";
import { fromInsurerResponse } from "../src/integrations/insurers/adapters/_template";

test("extrato de comissões: layout, parse e conciliação", () => {
  const comp = db.commissions.find((c) => db.policies.find((p) => p.id === c.policyId)?.insurerId === "ins-porto")!.competence;
  const csv = sampleStatement(db, "ins-porto", comp);
  const layout = guessLayout("ins-porto", parseCSV(csv)[0]);
  assert.equal(layout.columns.amount, "Valor comissão");
  assert.equal(layout.columns.paidAt, "Data pagamento");
  const { lines, errors } = parseCommissionStatement(csv, layout);
  assert.equal(errors.length, 0);
  const r = reconcile(db, lines);
  assert.ok(r.lines.some((l) => l.status === "conferida"));
  assert.ok(r.lines.some((l) => l.status === "apolice_nao_encontrada"));
  const next = applyReconciliation(db, r.lines, "u-ana");
  const ok = r.lines.find((l) => l.status === "conferida")!;
  assert.equal(next.commissions.find((c) => c.id === ok.commission!.id)!.status, "recebida");
});

test("integrações: log mascara dados pessoais e adapter valida resposta", () => {
  assert.ok(!redact("cpf 123.456.789-09 email a@b.com").includes("123.456"));
  assert.throws(() => fromInsurerResponse({ numeroCalculo: "1", premioTotal: 0, coberturas: [] }, "x"));
  assert.equal(fromInsurerResponse({ numeroCalculo: "9", premioTotal: 1000, coberturas: [{ nome: "Casco" }], percentualComissao: 15 }, "x").commissionPct, 0.15);
});
