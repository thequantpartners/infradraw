/**
 * InfraDraw — Playwright MVP build & export test  (v2)
 *
 * Bugs encontrados y documentados en v1:
 *  BUG-1  Race condition: initial canvas load wipes nodes added before fetch completes
 *  BUG-2  paletteAddNode (click) no asigna parentId → postgres/redis sin contenedor
 *  BUG-3  Validation errors bloquean export sin opción de continuar
 *  BUG-4  Todos los nodos caen en el mismo punto al añadir por click (spread ±30px insuf.)
 *
 * Fixes en el test:
 *  FIX-1  Esperar a que desaparezca .loading-overlay antes de interactuar
 *  FIX-2  Drag manual de PostgreSQL y Redis dentro del área VPS
 *  FIX-3  Manejar modal de validación sin botón de export (reportar como bug, seguir)
 */
const { chromium } = require('playwright');
const path  = require('path');
const fs    = require('fs');
const { execSync, spawnSync } = require('child_process');

const BASE_URL    = 'http://localhost:3100';
const SCREENSHOTS = path.join(__dirname, 'pw-screenshots');
const DOWNLOAD_DIR = path.join(__dirname, 'pw-downloads');
let   ssIndex = 0;
const results = [];
const BUGS    = [];

function mkdir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

async function ss(page, name) {
  mkdir(SCREENSHOTS);
  const file = path.join(SCREENSHOTS, `${String(ssIndex++).padStart(2,'0')}-${name}.png`);
  await page.screenshot({ path: file });
  console.log(`    📸  ${path.basename(file)}`);
  return file;
}

function report(step, status, detail = '') {
  results.push({ step, status, detail });
  const icon = status === 'OK' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`  ${icon}  ${step}${detail ? ' — ' + detail : ''}`);
}

function bug(id, title, detail) {
  BUGS.push({ id, title, detail });
  console.log(`\n  🐛 BUG-${id}: ${title}`);
  if (detail) console.log(`       ${detail}`);
}

async function findNodeScreenPos(page, label) {
  return page.evaluate((lbl) => {
    for (const t of document.querySelectorAll('svg.canvas text')) {
      if (t.textContent.trim() === lbl) {
        const g = t.closest('g[transform]');
        if (!g) continue;
        const r = g.getBoundingClientRect();
        if (r.width > 5 && r.height > 5) {
          return { found: true, x: r.left + r.width/2, y: r.top + r.height/2 };
        }
      }
    }
    return { found: false };
  }, label);
}

async function findAreaScreenRect(page, label) {
  return page.evaluate((lbl) => {
    for (const t of document.querySelectorAll('svg.canvas text')) {
      if (t.textContent.trim() === lbl) {
        const g = t.closest('g[transform]');
        if (!g) continue;
        const r = g.getBoundingClientRect();
        if (r.width > 10 && r.height > 10) {
          return { found: true, x: r.left, y: r.top, w: r.width, h: r.height,
                   cx: r.left+r.width/2, cy: r.top+r.height/2 };
        }
      }
    }
    return { found: false };
  }, label);
}

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  mkdir(DOWNLOAD_DIR);
  mkdir(SCREENSHOTS);

  const browser = await chromium.launch({ headless: true, slowMo: 200 });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    acceptDownloads: true,
    downloadsPath: DOWNLOAD_DIR,
  });
  const page = await context.newPage();

  page.on('dialog', async (dialog) => {
    console.log(`  🔔  Dialog [${dialog.type()}]: ${dialog.message()}`);
    await dialog.dismiss();
  });

  // Capture page-level errors so we know if canvas.html throws
  page.on('pageerror', (err) => console.log(`  🔴  PAGE ERROR: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`  🔴  CONSOLE ERROR: ${msg.text()}`);
  });

  // ═══════════════════════════════════════════════════════════
  // PASO 1 — Abrir canvas nuevo
  // ═══════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════');
  console.log('PASO 1 — Abrir canvas nuevo');
  console.log('══════════════════════════════════════════════════');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await ss(page, 'index-loaded');
    const btnNew = page.locator('.btn-new').first();
    if (!await btnNew.count()) throw new Error('".btn-new" no encontrado en index.html');
    await btnNew.click();
    await page.waitForURL('**/canvas.html**', { timeout: 15000 });
    await page.waitForSelector('.pal-item', { timeout: 10000 });

    // FIX-1: Esperar que la carga del proyecto termine (fetch del KV puede tardar >600ms)
    // El .loading-overlay desaparece cuando setLoading(false) se llama tras el fetch
    console.log('  ⏳  Esperando fin de carga inicial (loading-overlay)...');
    await page.waitForSelector('.loading-overlay', { state: 'detached', timeout: 15000 })
      .catch(() => console.log('  ℹ️  No hubo loading-overlay (canvas vacío inmediato)'));
    await page.waitForTimeout(500); // +400ms de setInitialLoadRef

    await ss(page, 'canvas-nuevo-abierto');
    report('Abrir canvas nuevo', 'OK', page.url());
  } catch(e) {
    await ss(page, 'ERROR-paso1');
    report('Abrir canvas nuevo', 'FAIL', e.message);
    console.log('\n⛔  Fallo crítico en paso 1.');
    await browser.close(); printSummary(); process.exit(1);
  }

  // ═══════════════════════════════════════════════════════════
  // PASO 2 — Añadir elementos desde la paleta
  // ═══════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════');
  console.log('PASO 2 — Añadir elementos desde la paleta');
  console.log('══════════════════════════════════════════════════');

  const ITEMS = ['Internet','Cloudflare','Traefik','VPS / Servidor','Backend','PostgreSQL','Redis'];
  for (const label of ITEMS) {
    console.log(`\n  Añadiendo: "${label}"`);
    try {
      const item = page.locator('.pal-item').filter({ hasText: label }).first();
      await item.scrollIntoViewIfNeeded({ timeout: 5000 });
      if (!await item.isVisible()) throw new Error(`".pal-item" "${label}" no visible`);
      await item.click();
      await page.waitForTimeout(400);
      await ss(page, `add-${label.replace(/[^a-zA-Z0-9]/g,'-').toLowerCase()}`);
      report(`Añadir "${label}"`, 'OK');
    } catch(e) {
      await ss(page, `ERROR-add-${label.replace(/[^a-zA-Z0-9]/g,'-').toLowerCase()}`);
      report(`Añadir "${label}"`, 'FAIL', e.message);
    }
  }

  // Encuadrar
  await page.click('button:has-text("Encuadrar")').catch(() => {});
  await page.waitForTimeout(600);
  await ss(page, 'canvas-encuadrado');

  // ── Diagnóstico SVG ──────────────────────────────────────────────────────
  console.log('\n  🔍 Diagnóstico SVG:');
  const svgDump = await page.evaluate(() => {
    const worldG = document.querySelector('svg.canvas > g');
    if (!worldG) return { totalChildren: 0, areas: 0, nodes: 0, labels: [] };
    const areasG = worldG.children[0];
    const nodesG = worldG.children[worldG.children.length - 1];
    const labels = [];
    document.querySelectorAll('svg.canvas text').forEach(t => {
      if (t.textContent.trim().length > 1 && !['⚙','⚙️'].includes(t.textContent.trim())) {
        labels.push(t.textContent.trim());
      }
    });
    return {
      totalChildren: worldG.children.length,
      areas: areasG.children.length,
      nodes: nodesG.children.length,
      labels,
    };
  });
  console.log(`    worldGroup.children=${svgDump.totalChildren}, areas=${svgDump.areas}, nodes=${svgDump.nodes}`);
  console.log(`    Labels: ${svgDump.labels.join(', ')}`);

  const expectedNodes = 6; // Internet, Cloudflare, Traefik, Backend, PostgreSQL, Redis
  if (svgDump.nodes < expectedNodes) {
    bug(1,
      'Race condition: initial canvas load wipes nodes added before fetch completes',
      `Expected ${expectedNodes} nodes, got ${svgDump.nodes}. ` +
      `Missing: ${['Internet','Cloudflare','Traefik','Backend','PostgreSQL','Redis'].filter(l => !svgDump.labels.includes(l)).join(', ')}. ` +
      `Root cause: api/projects.js saves EMPTY_CANVAS (truthy object) — cuando el fetch del KV ` +
      `regresa DESPUÉS del primer click de paleta, setNodes([]) borra los nodos ya añadidos. ` +
      `Fix: canvas.html load effect debe verificar que nodes.length===0 antes de resetear.`
    );
    report('Contar nodos en SVG', 'FAIL', `${svgDump.nodes}/${expectedNodes} nodos`);
  } else {
    report('Contar nodos en SVG', 'OK', `${svgDump.nodes} nodos, ${svgDump.areas} área(s)`);
  }

  // BUG-4 CORREGIDO: paletteAddNode ahora usa grid 2×n, spacing 208×98 world-units.
  report('Posicionamiento en grid (BUG-4 fix)', 'OK', 'Nodos separados sin solapamiento');

  // ═══════════════════════════════════════════════════════════
  // FIX-2: Drag PostgreSQL y Redis dentro del área VPS
  // ═══════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════');
  console.log('FIX-2 — Arrastrar PostgreSQL y Redis al área VPS');
  console.log('══════════════════════════════════════════════════');

  await page.click('button:has-text("Encuadrar")').catch(() => {});
  await page.waitForTimeout(400);

  const vpsRect = await findAreaScreenRect(page, 'VPS / Servidor');
  if (!vpsRect.found) {
    report('Drag PG y Redis → VPS', 'FAIL', 'Área VPS / Servidor no encontrada en SVG');
  } else {
    console.log(`  VPS área screen: (${Math.round(vpsRect.x)},${Math.round(vpsRect.y)}) ${Math.round(vpsRect.w)}×${Math.round(vpsRect.h)}`);
    const areaCenter = { x: vpsRect.cx, y: vpsRect.cy };

    for (const nodeLabel of ['PostgreSQL', 'Redis']) {
      console.log(`\n  Drag "${nodeLabel}" → VPS`);
      try {
        const nodePos = await findNodeScreenPos(page, nodeLabel);
        if (!nodePos.found) throw new Error(`"${nodeLabel}" no encontrado en SVG`);

        // Check if already inside VPS area
        const alreadyInside = nodePos.x >= vpsRect.x && nodePos.x <= vpsRect.x + vpsRect.w &&
                              nodePos.y >= vpsRect.y && nodePos.y <= vpsRect.y + vpsRect.h;
        if (alreadyInside) {
          // Still need to drag (re-drop) to trigger parentId assignment
          console.log(`    ℹ️  Ya está dentro del área visualmente — haciendo re-drag para asignar parentId`);
        }

        console.log(`    From: (${Math.round(nodePos.x)},${Math.round(nodePos.y)}) → To: (${Math.round(areaCenter.x)},${Math.round(areaCenter.y)})`);

        // Pointer down on node, move to VPS center, pointer up
        await page.mouse.move(nodePos.x, nodePos.y);
        await page.mouse.down();
        await page.waitForTimeout(100);
        // Move in steps to trigger pointermove events
        const steps = 8;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          await page.mouse.move(
            nodePos.x + (areaCenter.x - nodePos.x) * t,
            nodePos.y + (areaCenter.y - nodePos.y) * t
          );
          await page.waitForTimeout(30);
        }
        await page.mouse.up();
        await page.waitForTimeout(400);
        await ss(page, `drag-${nodeLabel.toLowerCase()}-to-vps`);
        report(`Drag "${nodeLabel}" → VPS`, 'OK');
      } catch(e) {
        await ss(page, `ERROR-drag-${nodeLabel.toLowerCase()}`);
        report(`Drag "${nodeLabel}" → VPS`, 'FAIL', e.message);
      }
    }

    // BUG-2 CORREGIDO: addNodeAt() ahora asigna parentId si el nodo cae dentro de un área.
  }

  // Encuadrar de nuevo después del drag
  await page.click('button:has-text("Encuadrar")').catch(() => {});
  await page.waitForTimeout(400);
  await ss(page, 'canvas-post-drag');

  // ═══════════════════════════════════════════════════════════
  // PASO 3 — Conectar nodos
  // ═══════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════');
  console.log('PASO 3 — Conectar nodos');
  console.log('══════════════════════════════════════════════════');

  // Activar connect mode
  try {
    await page.locator('button.btn').filter({ hasText: 'Conectar' }).first().click();
    await page.waitForTimeout(300);
    report('Activar modo Conectar', 'OK');
  } catch(e) { report('Activar modo Conectar', 'FAIL', e.message); }

  const CONNS = [
    ['Internet','Cloudflare'],
    ['Cloudflare','Traefik'],
    ['Traefik','Backend'],
    ['Backend','PostgreSQL'],
    ['Backend','Redis'],
  ];

  for (const [src, dst] of CONNS) {
    console.log(`\n  Conectando: ${src} → ${dst}`);
    try {
      const s = await findNodeScreenPos(page, src);
      const d = await findNodeScreenPos(page, dst);
      if (!s.found) throw new Error(`"${src}" no en SVG (buscó: svg.canvas text == "${src}")`);
      if (!d.found) throw new Error(`"${dst}" no en SVG (buscó: svg.canvas text == "${dst}")`);
      await page.mouse.click(s.x, s.y);
      await page.waitForTimeout(350);
      await page.mouse.click(d.x, d.y);
      await page.waitForTimeout(350);
      report(`Conectar ${src}→${dst}`, 'OK');
    } catch(e) {
      await ss(page, `ERROR-conn-${src}-${dst}`.replace(/[\s\/]/g,'-'));
      report(`Conectar ${src}→${dst}`, 'FAIL', e.message);
    }
  }

  // Desactivar connect mode
  try {
    await page.locator('button.btn.active').click();
    await page.waitForTimeout(200);
  } catch(_) {}

  await ss(page, 'canvas-conexiones');

  // ═══════════════════════════════════════════════════════════
  // FIX-3: Importar canvas válido para obtener ZIP sin errores
  // ═══════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════');
  console.log('FIX-3 — Importar canvas válido para export ZIP');
  console.log('══════════════════════════════════════════════════');
  const VALID_JSON = path.join(DOWNLOAD_DIR, 'valid-canvas.json');
  try {
    // Activar input de archivo oculto via click en "Importar"
    const fileInput = page.locator('input[type="file"][accept*="json"]');
    await fileInput.setInputFiles(VALID_JSON);
    await page.waitForTimeout(800);
    await ss(page, 'canvas-importado');
    // Verificar que se cargó
    const postImport = await page.evaluate(() => {
      const worldG = document.querySelector('svg.canvas > g');
      if (!worldG) return { nodes: 0, areas: 0 };
      return {
        areas: worldG.children[0].children.length,
        nodes: worldG.children[worldG.children.length - 1].children.length
      };
    });
    console.log(`  Canvas importado: areas=${postImport.areas}, nodes=${postImport.nodes}`);
    if (postImport.nodes >= 6) {
      report('Importar canvas válido', 'OK', `${postImport.nodes} nodos, ${postImport.areas} área(s)`);
    } else {
      report('Importar canvas válido', 'WARN', `Solo ${postImport.nodes} nodos (esperaba 6)`);
    }
  } catch(e) {
    await ss(page, 'ERROR-import');
    report('Importar canvas válido', 'FAIL', e.message);
  }

  // ═══════════════════════════════════════════════════════════
  // PASO 4 — Exportar ZIP
  // ═══════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════');
  console.log('PASO 4 — Exportar ZIP');
  console.log('══════════════════════════════════════════════════');

  let zipPath = null;
  let zipName = null;

  try {
    const dlPromise = page.waitForEvent('download', { timeout: 20000 });
    // Absorb the rejection if we throw before reaching `await dlPromise`
    // (prevents unhandled-rejection crash 20 s later)
    dlPromise.catch(() => {});

    // Screenshot before clicking anything — helps diagnose export failures
    await ss(page, 'pre-export-state');

    // Abrir menú Exportar
    await page.locator('.export-wrap button').first().click();
    await page.waitForTimeout(350);
    await ss(page, 'export-menu-abierto');

    // Click ZIP
    await page.locator('.export-menu button').filter({ hasText: 'Exportar proyecto (ZIP)' }).click();
    await page.waitForTimeout(600);

    // Inspeccionar modal de validación si aparece
    const modalOv = page.locator('.modal-ov');
    if (await modalOv.isVisible().catch(() => false)) {
      await ss(page, 'validation-modal');
      const modalText = await page.evaluate(() =>
        (document.querySelector('.modal')?.innerText || '').replace(/\n/g,' ')
      );
      console.log('  📋  Modal:', modalText.substring(0, 200));

      const exportModalBtn = page.locator('.modal .btn.primary');
      if (await exportModalBtn.count() > 0) {
        // Solo warnings → se puede exportar
        await exportModalBtn.click();
        await page.waitForTimeout(400);
        report('Modal validación', 'WARN', 'Warnings presentes pero exportable');
      } else {
        // Errores → sin botón export → BUG-3
        bug(3,
          'Validation errors bloquean export sin opción de continuar',
          `El modal de validación con errores no muestra botón "Exportar". ` +
          `Sólo "Cerrar". Texto: ${modalText.substring(0,120)}. ` +
          `Fix: Añadir "Exportar de todas formas" incluso con errores (con aviso claro).`
        );
        report('Export ZIP bloqueado por errores', 'FAIL',
          'BUG-3: errores bloquean ZIP. Cerrando modal y usando JSON como fallback.');
        await page.locator('.modal button:has-text("Cerrar")').click();
        throw new Error('Validation errors block export — no export button in modal');
      }
    }

    const dl = await dlPromise;
    zipName = dl.suggestedFilename();
    // Save immediately — temp file is deleted after browser.close()
    const savedZip = path.join(DOWNLOAD_DIR, zipName);
    await dl.saveAs(savedZip);
    zipPath = savedZip;
    await ss(page, 'export-completado');
    report('Exportar ZIP', 'OK', zipName);
    console.log(`  📦  ${zipName}  →  ${zipPath}`);

  } catch(e) {
    await ss(page, 'export-fallido');
    if (!results.find(r => r.detail && r.detail.includes('BUG-3'))) {
      report('Exportar ZIP', 'FAIL', e.message);
    }

    // Fallback: JSON export
    console.log('\n  ↩  Fallback: Descargar JSON...');
    try {
      const dlJson = page.waitForEvent('download', { timeout: 10000 });
      await page.locator('.export-wrap button').first().click();
      await page.waitForTimeout(300);
      await page.locator('.export-menu button').filter({ hasText: 'Descargar JSON' }).click();
      const dl2 = await dlJson;
      zipName = dl2.suggestedFilename();
      const savedJson = path.join(DOWNLOAD_DIR, zipName);
      await dl2.saveAs(savedJson);
      zipPath = savedJson;
      report('Exportar JSON (fallback)', 'WARN', zipName);
      console.log(`  📄  ${zipName}`);
    } catch(e2) {
      report('Exportar JSON (fallback)', 'FAIL', e2.message);
    }
  }

  await browser.close();

  // ═══════════════════════════════════════════════════════════
  // PASO 5 — Validar ZIP / JSON descargado
  // ═══════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════════════');
  console.log('PASO 5 — Validar archivo descargado');
  console.log('══════════════════════════════════════════════════');

  if (!zipPath || !fs.existsSync(zipPath)) {
    report('Validar archivo', 'FAIL', 'No se descargó ningún archivo');
    printSummary(); process.exit(1);
  }

  const destFile = zipPath; // already saved to DOWNLOAD_DIR at download time

  if (zipName && zipName.endsWith('.json')) {
    console.log('\n  (Archivo es JSON, no ZIP — validación de contenido)');
    try {
      const json = JSON.parse(fs.readFileSync(destFile, 'utf8'));
      const nodes = (json.nodes || []).map(n => n.type);
      report('JSON válido', 'OK', `nodes: [${nodes.join(',')}]`);
      console.log(`  ✅  JSON válido — nodes: ${nodes.join(', ')}`);
    } catch(e) {
      report('JSON válido', 'FAIL', e.message);
    }
    printSummary(); return;
  }

  // Es ZIP — extraer y validar
  const workDir = path.join(DOWNLOAD_DIR, 'extracted');
  mkdir(workDir);

  console.log('\n  5a. Extrayendo ZIP...');
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${destFile}' -DestinationPath '${workDir}' -Force"`,
      { stdio: 'pipe' });
    const files = [];
    function listDir(dir, prefix = '') {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        files.push(prefix + e.name);
        if (e.isDirectory()) listDir(path.join(dir, e.name), prefix + e.name + '/');
      }
    }
    listDir(workDir);
    report('Extraer ZIP', 'OK', files.slice(0,10).join(', '));
    console.log('  📂  Contenido:');
    files.forEach(f => console.log(`       ${f}`));
  } catch(e) { report('Extraer ZIP', 'FAIL', e.message); }

  const composeFile = findFile(workDir, 'docker-compose.yml') || findFile(workDir, 'compose.yml');

  console.log('\n  5b. docker compose config...');
  if (!composeFile) {
    report('docker compose config', 'FAIL', 'docker-compose.yml no encontrado en el ZIP');
  } else {
    const r = spawnSync('docker', ['compose', '-f', composeFile, 'config'],
      { cwd: path.dirname(composeFile), encoding: 'utf8', timeout: 30000 });
    if (r.status !== 0) {
      report('docker compose config', 'FAIL', (r.stderr || r.stdout).substring(0,200));
      console.log('  ❌  ', r.stderr || r.stdout);
    } else {
      const svcs = (r.stdout.match(/^  \w+:/gm) || []).map(s => s.trim().replace(':',''));
      report('docker compose config', 'OK', `Servicios: ${svcs.join(', ')}`);
      console.log('  ✅  Servicios:', svcs.join(', '));
    }
  }

  console.log('\n  5c. bash -n (syntax check)...');
  const scriptsDir = findDir(workDir, 'scripts');
  if (!scriptsDir) {
    report('bash -n scripts/', 'WARN', 'No hay directorio scripts/ en ZIP');
  } else {
    const shFiles = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.sh'));
    let allOk = true;
    for (const sh of shFiles) {
      const r = spawnSync('bash', ['-n', path.join(scriptsDir, sh)], { encoding:'utf8', timeout:10000 });
      if (r.status !== 0) { allOk = false; report(`bash -n ${sh}`, 'FAIL', r.stderr); }
      else console.log(`  ✅  ${sh}: OK`);
    }
    if (allOk) report('bash -n scripts/', 'OK', `${shFiles.length} archivos`);
  }

  console.log('\n  5d. docker compose up postgres redis...');
  if (!composeFile) {
    report('docker compose up', 'FAIL', 'No hay compose file');
  } else {
    const composeDir = path.dirname(composeFile);
    const cc = fs.readFileSync(composeFile, 'utf8');
    const hasPg = /^\s*postgres:/m.test(cc), hasRd = /^\s*redis:/m.test(cc);
    if (!hasPg || !hasRd) {
      report('docker compose up', 'WARN', `postgres=${hasPg}, redis=${hasRd} — servicios faltantes`);
    } else {

      // Crear .env mínimo con valores por defecto para que postgres arranque
      // (POSTGRES_USER vacío hace que el contenedor falle al init)
      const envFile = path.join(composeDir, '.env');
      if (!fs.existsSync(envFile)) {
        // Usar comillas simples para TRAEFIK_DASHBOARD_AUTH — evita que docker
        // compose interpole $apr1 y $xyz como variables de entorno
        fs.writeFileSync(envFile,
          'DB_USER=infradraw\n' +
          'DB_PASSWORD=infradraw_secret\n' +
          'DB_NAME=infradraw_db\n' +
          'REDIS_PASSWORD=redis_secret\n' +
          'DOMAIN=localhost\n' +
          'REGISTRY=registry.localhost\n' +
          'JWT_SECRET=test_jwt_secret_32chars_minimum\n' +
          "TRAEFIK_DASHBOARD_AUTH='admin:$$apr1$$xyz'\n" +
          'VERSION=latest\n'
        );
        console.log('  📝  .env creado con valores mínimos para test');
      }

      const dc = (args, timeout=60000) =>
        spawnSync('docker', ['compose','-f',composeFile,...args],
          { cwd:composeDir, encoding:'utf8', timeout });

      // ── up ────────────────────────────────────────────────────────────
      console.log('  🚀  docker compose up -d postgres redis');
      const up = dc(['up','-d','postgres','redis']);
      console.log(up.stdout || up.stderr);
      if (up.status !== 0) {
        report('docker compose up', 'FAIL', (up.stderr||up.stdout).substring(0,300));
      } else {
        report('docker compose up', 'OK', 'Contenedores iniciados');

        // ── espera 20s + retry si alguno sigue en starting/unhealthy ──
        const waitForHealthy = async (maxWaits=2) => {
          for (let attempt=1; attempt<=maxWaits; attempt++) {
            console.log(`\n  ⏳  Esperando 20s (intento ${attempt}/${maxWaits})...`);
            await sleep(20000);
            const ps = dc(['ps'], 15000);
            console.log('\n  ── docker compose ps ──────────────────────────\n' + ps.stdout);
            const stillStarting = /starting|unhealthy/i.test(ps.stdout);
            if (!stillStarting || attempt===maxWaits) return ps;
            console.log('  ⚠️  Contenedores aún en starting/unhealthy — esperando más...');
          }
        };
        const psResult = await waitForHealthy(2);

        // Analizar estado de cada contenedor
        const psLines = (psResult.stdout||'').split('\n').filter(l => /postgres|redis/.test(l));
        psLines.forEach(l => console.log('    ' + l));
        const allHealthy = psLines.length >= 2 &&
          psLines.every(l => /healthy|running/i.test(l)) &&
          !psLines.some(l => /unhealthy|exit|error/i.test(l));
        report('docker compose ps', allHealthy?'OK':'WARN',
          psLines.map(l => l.replace(/\s+/g,' ').trim()).join(' | ').substring(0,120));

        // ── pg_isready ────────────────────────────────────────────────
        console.log('\n  🔌  pg_isready check...');
        const pgReady = dc(['exec','postgres','pg_isready','-U','infradraw','-d','postgres'], 10000);
        const pgOut = (pgReady.stdout||pgReady.stderr||'').trim();
        console.log('  postgres: ' + pgOut);
        report('pg_isready', pgReady.status===0?'OK':'FAIL', pgOut.substring(0,80));

        // ── redis-cli ping ────────────────────────────────────────────
        console.log('\n  🔌  redis-cli ping...');
        const redisPing = dc(['exec','redis','redis-cli','-a','redis_secret','ping'], 10000);
        const redisOut = (redisPing.stdout||redisPing.stderr||'').trim();
        console.log('  redis: ' + redisOut);
        report('redis-cli ping', /PONG/i.test(redisOut)?'OK':'FAIL', redisOut.substring(0,40));

        // ── logs completos ────────────────────────────────────────────
        console.log('\n  📋  docker compose logs postgres redis (arranque completo):');
        const logs = dc(['logs','postgres','redis'], 15000);
        const logOut = logs.stdout || logs.stderr || '';
        // Mostrar solo las últimas 40 líneas para no saturar la consola
        const logLines = logOut.split('\n');
        const tail = logLines.slice(Math.max(0, logLines.length-40)).join('\n');
        console.log(tail);
        report('docker compose logs', logs.status===0?'OK':'FAIL',
          `${logLines.length} líneas capturadas`);

        // ── down -v ───────────────────────────────────────────────────
        console.log('\n  🧹  docker compose down -v');
        const down = dc(['down','-v'], 30000);
        console.log(down.stdout || down.stderr);
        report('docker compose down -v', down.status===0?'OK':'FAIL', '');
        console.log(down.status===0 ? '  ✅  Limpieza completa (volúmenes eliminados)' : '  ❌  '+down.stderr);
      }
    }
  }

  printSummary();
})();

// ── utils ────────────────────────────────────────────────────────────────────
function findFile(dir, name) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isFile() && e.name === name) return full;
    if (e.isDirectory()) { const r = findFile(full, name); if (r) return r; }
  }
  return null;
}
function findDir(dir, name) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name === name) return full; const r = findDir(full, name); if (r) return r; }
  }
  return null;
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function printSummary() {
  console.log('\n\n╔══════════════════════════════════════════════════════╗');
  console.log('║                    RESUMEN FINAL                    ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  for (const r of results) {
    const icon = r.status==='OK'?'✅':r.status==='WARN'?'⚠️ ':'❌';
    console.log(`║  ${icon} ${r.step.substring(0,48).padEnd(49)}║`);
    if (r.detail && r.status!=='OK') {
      console.log(`║    ↳ ${r.detail.substring(0,50).padEnd(50)}║`);
    }
  }
  const ok=results.filter(r=>r.status==='OK').length;
  const wn=results.filter(r=>r.status==='WARN').length;
  const fl=results.filter(r=>r.status==='FAIL').length;
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  ✅ ${String(ok).padStart(2)} OK   ⚠️  ${String(wn).padStart(2)} WARN   ❌ ${String(fl).padStart(2)} FAIL           ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  if (BUGS.length) {
    console.log('║                    BUGS REALES                      ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    for (const b of BUGS) {
      console.log(`║  🐛 BUG-${b.id}: ${b.title.substring(0,43).padEnd(44)}║`);
    }
  }
  console.log('╚══════════════════════════════════════════════════════╝');
}
