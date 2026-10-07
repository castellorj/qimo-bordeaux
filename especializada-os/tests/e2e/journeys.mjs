import { createRequire } from "module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || "playwright");
const SP = process.env.SHOTS || ".e2e-shots", base = process.env.BASE_URL || "http://localhost:3100";
mkdirSync(SP, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${page.url()} ${e.message}`));
page.on("dialog", (d) => d.accept());
const step = async (name, fn) => { try { await fn(); console.log("OK  ", name); } catch (e) { console.log("FAIL", name, e.message.split("\n")[0]); await page.screenshot({ path: `${SP}/fail_${name.replace(/\W+/g, "_")}.png` }); } };
await page.goto(base + "/login"); await page.getByText("Ana Martins").click(); await page.waitForURL(base + "/");

// ── JORNADA SAÚDE: família Pereira (4 vidas, bebê) → recomendação → comparação → proposta → aceite → apólice → renovação
await step("saude: abrir cotação da família", async () => { await page.goto(base + "/cotacoes/nova?ramo=saude&familia=h-pereira"); await page.getByText("Prévia da recomendação").waitFor(); });
await step("saude: escolher hospital desejado", async () => { await page.getByPlaceholder("Buscar hospital").fill("Perinatal"); await page.getByRole("button", { name: /Maternidade Perinatal Lagoa/ }).click(); });
await step("saude: calcular", async () => { await page.getByRole("button", { name: /Calcular e comparar planos/ }).click(); await page.waitForURL(/\/cotacoes\/q-/); await page.getByText("Comparador de planos").waitFor(); await page.screenshot({ path: `${SP}/j_saude_resultado.png`, fullPage: true }); });
await step("saude: gerar proposta", async () => { await page.getByRole("button", { name: /Gerar proposta/ }).first().click(); await page.getByRole("dialog").getByRole("button", { name: "Gerar" }).click(); await page.waitForURL(/\/propostas\/pr-/); });
const healthProposalUrl = page.url();
await step("saude: enviar por whatsapp", async () => { const [popup] = await Promise.all([page.waitForEvent("popup").catch(() => null), page.getByRole("button", { name: /WhatsApp/ }).first().click()]); if (popup) await popup.close(); await page.getByText(/Enviada|enviada/).first().waitFor(); });
await step("saude: página pública", async () => { const id = healthProposalUrl.split("/").pop(); await page.goto(base + "/p/" + id); await page.waitForTimeout(800); await page.screenshot({ path: `${SP}/j_saude_publica.png`, fullPage: true }); await page.goto(healthProposalUrl); });
await step("saude: cliente aceitou", async () => { await page.getByRole("button", { name: /aceitou/i }).click(); const dlg = page.getByRole("dialog"); if (await dlg.count()) { await dlg.getByRole("button", { name: /Confirmar|aceite|Registrar/i }).last().click(); } await page.getByText(/Aceita/).first().waitFor(); });
await step("saude: registrar emissão", async () => { await page.getByRole("button", { name: /Registrar emissão/ }).click(); await page.getByRole("dialog").getByRole("button", { name: /Registrar|Emitir|Confirmar/ }).last().click(); await page.waitForURL(/\/apolices\/pol-/); await page.screenshot({ path: `${SP}/j_saude_apolice.png`, fullPage: true }); });

// ── JORNADA AUTO: cliente existente (João, renovação BMW) → multicálculo → proposta → emissão → renovação concluída
await step("auto: nova cotação renovação", async () => { await page.goto(base + "/cotacoes/nova?ramo=auto&cliente=p-joao&renovacao=pol-joao-auto"); await page.getByRole("button", { name: /Calcular em/ }).click(); await page.waitForURL(/\/cotacoes\/q-/, { timeout: 15000 }); await page.getByText("Resultado do multicálculo").waitFor(); await page.screenshot({ path: `${SP}/j_auto_multicalculo.png`, fullPage: true }); });
await step("auto: cotação manual Meridiano", async () => { await page.getByRole("button", { name: /Registrar cotação manual/ }).first().click(); await page.getByRole("dialog").locator("input").first().fill("10400"); await page.getByRole("button", { name: /Incluir no comparativo/ }).click(); });
await step("auto: gerar e enviar proposta", async () => { await page.getByRole("button", { name: /Gerar proposta/ }).first().click(); await page.getByRole("dialog").getByRole("button", { name: "Gerar" }).click(); await page.waitForURL(/\/propostas\/pr-/); const [popup] = await Promise.all([page.waitForEvent("popup").catch(() => null), page.getByRole("button", { name: /WhatsApp/ }).first().click()]); if (popup) await popup.close(); });
await step("auto: aceitar e emitir", async () => { await page.getByRole("button", { name: /aceitou/i }).click(); const dlg = page.getByRole("dialog"); if (await dlg.count()) await dlg.getByRole("button", { name: /Confirmar|aceite|Registrar/i }).last().click(); await page.getByRole("button", { name: /Registrar emissão/ }).click(); await page.getByRole("dialog").getByRole("button", { name: /Registrar|Emitir|Confirmar/ }).last().click(); await page.waitForURL(/\/apolices\/pol-/); });
await step("auto: renovação anterior concluída", async () => { await page.goto(base + "/apolices/pol-joao-auto"); await page.waitForTimeout(800); const t = await page.locator("body").innerText(); if (!/Renovada/.test(t)) throw new Error("apólice anterior não marcada como renovada"); });

// ── JORNADA EMPRESA: TechNova → sócios → vida em grupo → cotação → proposta
await step("empresa: ver sócios", async () => { await page.goto(base + "/empresas/c-technova"); await page.getByText("Sócios e pessoas").waitFor(); });
await step("empresa: cotação vida em grupo", async () => { await page.goto(base + "/cotacoes/nova?ramo=vida&empresa=c-technova"); await page.getByRole("button", { name: /^Cotar$/ }).click(); await page.waitForURL(/\/cotacoes\/q-/); await page.getByRole("button", { name: /Gerar proposta/ }).first().click(); await page.getByRole("dialog").getByRole("button", { name: "Gerar" }).click(); await page.waitForURL(/\/propostas\/pr-/); });

// ── DOCUMENT AI
await step("docai: revisar e confirmar documento do Felipe", async () => { await page.goto(base + "/documentos?revisar=d-inbox-felipe"); const btn = page.getByText("Marcar todos como conferidos"); await btn.click(); await page.getByRole("button", { name: /Confirmar/ }).last().click(); await page.waitForTimeout(800); await page.screenshot({ path: `${SP}/j_docai_ok.png` }); });

// ── AI
await step("ai: perguntar", async () => { await page.goto(base + "/ai?q=" + encodeURIComponent("Quem tem seguro vencendo este mês?")); await page.waitForTimeout(1200); await page.screenshot({ path: `${SP}/j_ai.png`, fullPage: true }); });

// ── RBAC: corretor Rafael não vê clientes da Juliana
await step("rbac: corretor", async () => { await page.goto(base + "/login"); await page.getByText("Rafael Souza").click(); await page.waitForURL(base + "/"); await page.goto(base + "/clientes/p-joao"); await page.getByText("Sem acesso").waitFor(); await page.goto(base + "/clientes"); const t = await page.locator("body").innerText(); if (t.includes("João Silva")) throw new Error("vazou cliente"); });
console.log(errors.length ? errors.join("\n") : "NO PAGE ERRORS");
await browser.close();
