import { createRequire } from "module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || "playwright");
const SP = process.env.SHOTS || ".e2e-shots";
const base = process.env.BASE_URL || "http://localhost:3100";
mkdirSync(SP, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${page.url()} ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/ERR_TUNNEL|ERR_PROXY|net::ERR|Failed to load resource/.test(m.text())) errors.push(`[console] ${page.url()} ${m.text().slice(0, 300)}`); });
await page.goto(base + "/login");
await page.getByText("Ana Martins").click();
await page.waitForURL(base + "/");
const routes = ["/", "/operacoes", "/clientes", "/clientes/p-joao", "/familias", "/familias/h-silva", "/empresas", "/empresas/c-abc", "/crm", "/cotacoes", "/cotacoes/nova", "/cotacoes/q-fernanda", "/cotacoes/q-thiago", "/cotacoes/q-abc", "/propostas", "/propostas/pr-thiago", "/p/pr-thiago", "/apolices", "/apolices/pol-joao-auto", "/renovacoes", "/rede", "/rede?modo=plano", "/rede?modo=prestador", "/rede?modo=comparar", "/rede?modo=importar", "/seguradoras", "/documentos", "/documentos?revisar=d-inbox-felipe", "/tarefas", "/comissoes", "/relatorios", "/ai", "/automacoes", "/importar", "/configuracoes"];
for (const r of routes) {
  await page.goto(base + r);
  await page.waitForTimeout(900);
  const name = r.replace(/[/?=&]/g, "_") || "_";
  await page.screenshot({ path: `${SP}/${name}.png`, fullPage: false });
  const txt = await page.locator("body").innerText();
  if (/Application error|Unhandled Runtime/i.test(txt)) errors.push(`[content] ${r}: ${txt.slice(0, 120)}`);
}
console.log(errors.length ? errors.join("\n") : "NO ERRORS");
await browser.close();
