#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import {
  detectScenario,
  getPlanRAM,
  generateCompose,
  generateTraefikYml,
  generateMiddlewaresYml,
  generatePostgresConf,
  generateRedisConf,
  generateSetup,
  generateBackup,
  generateRestore,
  generateTerraform,
  generateTerraformVars,
  generateTerraformOutputs,
  generateManualProvision,
  generateEnv,
  generateReadme,
  generateMakefile
} from '../src/compiler.js';

const program = new Command();

function validateTopology(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    errors.push('El contenido no es un objeto JSON válido.');
    return { errors, warnings };
  }

  const nodes = data.nodes || [];
  const areas = data.areas || [];

  if (!Array.isArray(nodes)) {
    errors.push("El campo 'nodes' debe ser un array.");
    return { errors, warnings };
  }

  if (nodes.length === 0) {
    errors.push("La topología debe tener al menos un nodo (ej. 'vps').");
    return { errors, warnings };
  }

  const vpsNodes = nodes.filter(n => n.type === 'vps');
  if (vpsNodes.length === 0) {
    errors.push("Falta el servidor VPS principal (se requiere al menos un nodo de tipo 'vps').");
  }

  // Check unique IDs
  const ids = new Set();
  nodes.forEach((n, idx) => {
    if (!n.id) {
      errors.push(`El nodo en el índice ${idx} no tiene el campo 'id'.`);
    } else if (ids.has(n.id)) {
      errors.push(`ID de nodo duplicado encontrado: '${n.id}'.`);
    } else {
      ids.add(n.id);
    }
  });

  // Check types and configs
  nodes.forEach(n => {
    if (!n.type) {
      errors.push(`El nodo '${n.id || 'sin id'}' no tiene el campo 'type'.`);
      return;
    }

    const config = n.config || {};

    if (n.type === 'vps') {
      const allowedProviders = ['hetzner', 'digitalocean', 'contabo', 'vultr', 'linode', 'gcloud'];
      if (!config.provider) {
        errors.push(`El nodo VPS '${n.id}' no especifica un proveedor ('config.provider').`);
      } else if (!allowedProviders.includes(config.provider)) {
        errors.push(`Proveedor no válido en VPS '${n.id}': '${config.provider}'. Soportados: ${allowedProviders.join(', ')}`);
      }
    }

    if (n.type === 'traefik') {
      if (!config.cert_email) {
        errors.push(`El nodo Traefik '${n.id}' requiere un email para SSL ('config.cert_email').`);
      }
    }

    if (n.type === 'cloudflare') {
      if (!config.domain) {
        errors.push(`El nodo Cloudflare '${n.id}' requiere un dominio ('config.domain').`);
      }
    }

    if (n.type === 'frontend' || n.type === 'backend') {
      if (!config.port) {
        warnings.push(`El nodo de aplicación '${n.id}' (${n.type}) no especifica un puerto. Se usará el puerto por defecto.`);
      }
    }
  });

  return { errors, warnings };
}

program
  .name('infradraw')
  .description('CLI para compilar arquitecturas visuales de InfraDraw')
  .version('1.0.0');

program
  .command('compile')
  .description('Compila un archivo infradraw.json a ficheros IaC y configuraciones')
  .argument('<file>', 'Ruta al archivo infradraw.json')
  .argument('[outDir]', 'Directorio de salida', './dist')
  .option('--json', 'Salida en formato JSON legible por máquinas')
  .action(async (file, outDir, options) => {
    const isJson = !!options.json;
    const generatedFiles = [];
    try {
      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        if (isJson) {
          console.log(JSON.stringify({ status: 'error', error: `No se encontró el archivo ${file}` }));
        } else {
          console.error(chalk.red(`Error: No se encontró el archivo ${fullPath}`));
        }
        process.exit(1);
      }

      if (!isJson) console.log(chalk.blue(`Iniciando compilación de ${file}...`));
      const data = await fs.readJson(fullPath);
      
      const nodes = data.nodes || [];
      const areas = data.areas || [];
      
      if (nodes.length === 0) {
        if (isJson) {
          console.log(JSON.stringify({ status: 'error', error: 'El archivo no contiene nodos (servicios).' }));
        } else {
          console.error(chalk.red('Error: El archivo no contiene nodos (servicios).'));
        }
        process.exit(1);
      }

      const det = detectScenario(nodes);
      const { scenario, vpsNodes } = det;
      const vpsConfig = (vpsNodes[0] && vpsNodes[0].config) || {};
      const provider = vpsConfig.provider || 'hetzner';
      const isManual = provider === 'contabo';
      const needsTerraform = ['hetzner', 'digitalocean', 'vultr', 'linode', 'gcloud'].includes(provider);
      const ramGB = getPlanRAM(provider, vpsConfig.plan || 'cx31');

      const cfNode = nodes.find(n => n.type === 'cloudflare');
      const cloudflareConfig = (cfNode && cfNode.config) || {};
      const trNode = nodes.find(n => n.type === 'traefik');

      const has = (t) => nodes.some(n => n.type === t);

      // Limpiar y preparar directorio de salida
      const out = path.resolve(process.cwd(), outDir);
      await fs.ensureDir(out);

      // Escribir ficheros
      const write = async (relPath, content) => {
        const target = path.join(out, relPath);
        await fs.ensureDir(path.dirname(target));
        await fs.writeFile(target, content, 'utf8');
        generatedFiles.push(relPath);
        if (!isJson) console.log(chalk.green(`  Generado: ${relPath}`));
      };

      await write('docker-compose.yml', generateCompose(nodes, areas, scenario, vpsConfig));
      
      if (has('traefik')) {
        await write('config/traefik.yml', generateTraefikYml((trNode?.config?.cert_email) || 'admin@tudominio.com'));
        await write('config/middlewares.yml', generateMiddlewaresYml());
      }
      if (has('postgres')) {
        await write('config/postgresql.conf', generatePostgresConf(ramGB));
        await write('scripts/backup.sh', generateBackup(nodes, vpsConfig));
        await write('scripts/restore.sh', generateRestore(nodes, vpsConfig));
      }
      if (has('redis')) {
        const rd = nodes.find(n => n.type === 'redis');
        await write('config/redis.conf', generateRedisConf((rd?.config?.maxmemory) || '1gb'));
      }

      await write('scripts/setup.sh', generateSetup(vpsConfig, nodes));

      if (needsTerraform) {
        await write('terraform/main.tf', generateTerraform(nodes, vpsConfig, cloudflareConfig));
        await write('terraform/variables.tf', generateTerraformVars(vpsConfig, cloudflareConfig));
        await write('terraform/outputs.tf', generateTerraformOutputs(vpsNodes, vpsConfig));
        let tfvarsExample = '';
        if (provider === 'gcloud') {
          tfvarsExample = '# Copia como terraform.tfvars y completa los valores\n' +
            '# NUNCA subas terraform.tfvars a git\n\n' +
            'gcp_project_id       = ""\n' +
            'gcp_credentials_file = "../gcp-credentials.json"\n' +
            'ssh_public_key       = ""\n' +
            'cloudflare_api_token = ""\n' +
            'cloudflare_zone_id   = ""\n';
        } else {
          tfvarsExample = '# Copia como terraform.tfvars y completa los valores\n' +
            '# NUNCA subas terraform.tfvars a git\n\n' +
            'hcloud_token         = ""\n' +
            'ssh_public_key       = ""\n' +
            'cloudflare_api_token = ""\n' +
            'cloudflare_zone_id   = ""\n';
        }
        await write('terraform/terraform.tfvars.example', tfvarsExample);
      }

      if (has('devopsbot')) {
        await write('bot/Dockerfile', 'FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm install\nCOPY . .\nCMD ["node", "index.js"]\n');
        await write('bot/package.json', '{\n  "name": "devops-bot",\n  "version": "1.0.0",\n  "main": "index.js",\n  "dependencies": {\n    "node-telegram-bot-api": "^0.65.0",\n    "dockerode": "^3.3.5",\n    "@google/genai": "^0.1.1",\n    "@google-cloud/compute": "^4.9.0"\n  }\n}\n');
        
        const botCode = [
          "const TelegramBot = require('node-telegram-bot-api');",
          "const Docker = require('dockerode');",
          "const { GoogleGenAI } = require('@google/genai');",
          "const { exec } = require('child_process');",
          "",
          "const token = process.env.TELEGRAM_BOT_TOKEN;",
          "const chatId = process.env.TELEGRAM_CHAT_ID;",
          "const geminiApiKey = process.env.GEMINI_API_KEY;",
          "const provider = process.env.CLOUD_PROVIDER || 'private';",
          "const checkIntervalMs = (parseInt(process.env.HEALTH_CHECK_INTERVAL_MINUTES) || 5) * 60 * 1000;",
          "",
          "if (!token || !chatId) {",
          "  console.error('Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required.');",
          "  process.exit(1);",
          "}",
          "",
          "const bot = new TelegramBot(token, { polling: true });",
          "const docker = new Docker({ socketPath: '/var/run/docker.sock' });",
          "",
          "let ai = null;",
          "if (geminiApiKey) {",
          "  try {",
          "    ai = new GoogleGenAI({ apiKey: geminiApiKey });",
          "  } catch (err) {",
          "    console.error('Error starting Google GenAI:', err.message);",
          "  }",
          "}",
          "",
          "const reportedAlerts = new Set();",
          "const diagnosticsCache = new Map();",
          "let lastHeartbeatTime = 0;",
          "",
          "function runCmd(cmd) {",
          "  return new Promise((resolve) => {",
          "    exec(cmd, (err, stdout) => {",
          "      if (err) resolve('Error: ' + err.message);",
          "      else resolve(stdout.trim());",
          "    });",
          "  });",
          "}",
          "",
          "async function scaleGcpInstance() {",
          "  const projectId = process.env.GCP_PROJECT_ID;",
          "  const instanceName = process.env.GCP_INSTANCE_NAME;",
          "  const zone = process.env.GCP_ZONE;",
          "  const credentialsPath = process.env.GCP_CREDENTIALS_JSON_PATH;",
          "",
          "  if (!projectId || !instanceName || !zone) {",
          "    throw new Error('Missing GCP_PROJECT_ID, GCP_INSTANCE_NAME or GCP_ZONE in environment.');",
          "  }",
          "",
          "  const { InstancesClient } = require('@google-cloud/compute');",
          "  const options = credentialsPath ? { keyFilename: credentialsPath } : {};",
          "  const instancesClient = new InstancesClient(options);",
          "",
          "  console.log('Stopping GCP instance ' + instanceName + '...');",
          "  const [stopOp] = await instancesClient.stop({ project: projectId, zone, instance: instanceName });",
          "  await stopOp.promise();",
          "",
          "  console.log('Upgrading machine type to e2-standard-2...');",
          "  const [setMachineTypeOp] = await instancesClient.setMachineType({",
          "    project: projectId,",
          "    zone,",
          "    instance: instanceName,",
          "    instancesSetMachineTypeRequestResource: {",
          "      machineType: 'zones/' + zone + '/machineTypes/e2-standard-2'",
          "    }",
          "  });",
          "  await setMachineTypeOp.promise();",
          "",
          "  console.log('Starting GCP instance ' + instanceName + '...');",
          "  const [startOp] = await instancesClient.start({ project: projectId, zone, instance: instanceName });",
          "  await startOp.promise();",
          "",
          "  return 'Instancia ' + instanceName + ' escalada con exito a e2-standard-2.';",
          "}",
          "",
          "async function checkResources() {",
          "  const issues = [];",
          "  const dfOut = await runCmd(\"df -h / | tail -n 1 | awk '{print $5}'\");",
          "  const diskPct = parseInt(dfOut.replace('%', '')) || 0;",
          "  if (diskPct > 80) {",
          "    issues.push('Uso de disco elevado: ' + diskPct + '% en la particion raiz.');",
          "  }",
          "",
          "  const freeOut = await runCmd(\"free | grep Mem | awk '{print int($3/$2 * 100)}'\");",
          "  const ramPct = parseInt(freeOut) || 0;",
          "  if (ramPct > 85) {",
          "    issues.push('Uso de RAM elevado: ' + ramPct + '%.');",
          "  }",
          "",
          "  const cpuOut = await runCmd(\"cat /proc/loadavg | awk '{print $1}'\");",
          "  const loadAvg = parseFloat(cpuOut) || 0;",
          "  if (loadAvg > 4.0) {",
          "    issues.push('Carga de CPU elevada (Load Average 1m: ' + loadAvg + ').');",
          "  }",
          "  return { issues, diskPct, ramPct, loadAvg };",
          "}",
          "",
          "async function performHealthCheck() {",
          "  try {",
          "    const res = await checkResources();",
          "    const systemIssues = res.issues;",
          "",
          "    const containers = await docker.listContainers({ all: true }).catch(() => []);",
          "    const unhealthyContainers = [];",
          "    for (const c of containers) {",
          "      if (c.State !== 'running') {",
          "        const name = c.Names[0].replace(/^\\//, '');",
          "        unhealthyContainers.push({ id: c.Id, name, state: c.State });",
          "      }",
          "    }",
          "",
          "    const hasIssues = systemIssues.length > 0 || unhealthyContainers.length > 0;",
          "",
          "    if (hasIssues) {",
          "      if (systemIssues.length > 0) {",
          "        const alertId = 'system_resources';",
          "        if (!reportedAlerts.has(alertId)) {",
          "          reportedAlerts.add(alertId);",
          "          await handleSystemAlert(systemIssues, res);",
          "        }",
          "      }",
          "      for (const uc of unhealthyContainers) {",
          "        if (!reportedAlerts.has(uc.id)) {",
          "          reportedAlerts.add(uc.id);",
          "          await handleContainerAlert(uc.id, uc.name, uc.state);",
          "        }",
          "      }",
          "    } else {",
          "      if (reportedAlerts.has('system_resources')) {",
          "        reportedAlerts.delete('system_resources');",
          "        bot.sendMessage(chatId, '✅ Los recursos del sistema han vuelto a niveles normales.');",
          "      }",
          "      for (const key of reportedAlerts) {",
          "        if (key !== 'system_resources') {",
          "          const exists = unhealthyContainers.some(c => c.id === key);",
          "          if (!exists) {",
          "            reportedAlerts.delete(key);",
          "            diagnosticsCache.delete(key);",
          "            bot.sendMessage(chatId, '✅ La alerta para el contenedor ha sido resuelta (contenedor en ejecucion).');",
          "          }",
          "        }",
          "      }",
          "",
          "      const now = Date.now();",
          "      if (now - lastHeartbeatTime >= 3600000) {",
          "        lastHeartbeatTime = now;",
          "        bot.sendMessage(chatId, '🟢 *Heartbeat Horario:* Todos los chequeos de salud reportan \"Todo OK\". Recursos normales.', { parse_mode: 'Markdown' });",
          "      }",
          "    }",
          "  } catch (err) {",
          "    console.error('Error checking health:', err.message);",
          "  }",
          "}",
          "",
          "async function handleSystemAlert(issues, metrics) {",
          "  let diagnosis = 'Recursos del sistema elevados. Se recomienda optimizacion o escalado.';",
          "  if (ai) {",
          "    try {",
          "      const prompt = 'El servidor reporta las siguientes alertas de recursos:\\n' +",
          "        issues.join('\\n') + '\\n\\n' +",
          "        'Metricas actuales: Disco ' + metrics.diskPct + '%, RAM ' + metrics.ramPct + '%, LoadAvg ' + metrics.loadAvg + '.\\n' +",
          "        'Por favor genera un diagnostico breve y sugiere acciones funcionales.';",
          "      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });",
          "      diagnosis = response.text || diagnosis;",
          "    } catch (err) {",
          "      console.error('Gemini error:', err.message);",
          "    }",
          "  }",
          "",
          "  const msgText = '⚠️ *ALERTA DE RECURSOS DEL SISTEMA* ⚠️\\n\\n' +",
          "    issues.map(i => '• ' + i).join('\\n') + '\\n\\n' +",
          "    '🤖 *Diagnostico y Solucion (AI):*\\n' + diagnosis;",
          "",
          "  const inlineKeyboard = [];",
          "  if (provider === 'gcloud') {",
          "    inlineKeyboard.push([",
          "      { text: '👍 Aplicar Solucion Sugerida (Auto-Escalar VM)', callback_data: 'scale_gcp' },",
          "      { text: '👎 Solucionar yo mismo', callback_data: 'dismiss_system' }",
          "    ]);",
          "  } else {",
          "    inlineKeyboard.push([",
          "      { text: '💡 Solucionar yo mismo', callback_data: 'dismiss_system' }",
          "    ]);",
          "  }",
          "",
          "  await bot.sendMessage(chatId, msgText, {",
          "    reply_markup: { inline_keyboard: inlineKeyboard },",
          "    parse_mode: 'Markdown'",
          "  });",
          "}",
          "",
          "async function handleContainerAlert(id, name, state) {",
          "  let logs = '';",
          "  try {",
          "    const container = docker.getContainer(id);",
          "    const logsBuf = await container.logs({ stdout: true, stderr: true, tail: 30 });",
          "    logs = logsBuf.toString('utf8').replace(/[\\x00-\\x1F\\x7F-\\x9F]/g, \"\").trim();",
          "  } catch (err) {",
          "    logs = 'No logs: ' + err.message;",
          "  }",
          "",
          "  let diagnosis = 'Contenedor inactivo. Se recomienda reiniciar.';",
          "  if (ai) {",
          "    try {",
          "      const prompt = 'El contenedor \"' + name + '\" esta en estado \"' + state + '\".\\n' +",
          "        'Logs recientes:\\n' + logs + '\\n\\n' +",
          "        'Proporciona un diagnostico muy breve y una propuesta de solucion.';",
          "      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });",
          "      diagnosis = response.text || diagnosis;",
          "    } catch (err) {",
          "      console.error('Gemini error:', err.message);",
          "    }",
          "  }",
          "",
          "  diagnosticsCache.set(id, { name, state, logs, lastDiagnosis: diagnosis });",
          "",
          "  const msgText = '⚠️ *ALERTA DE CONTENEDOR* ⚠️\\n\\n' +",
          "    '• *Contenedor:* ' + name + '\\n' +",
          "    '• *Estado:* ' + state + '\\n\\n' +",
          "    '🤖 *Diagnostico y Solucion (AI):*\\n' + diagnosis;",
          "",
          "  const inlineKeyboard = [",
          "    [",
          "      { text: '👍 Aprobar Reinicio', callback_data: 'restart_' + id },",
          "      { text: '👎 Solucionar yo mismo', callback_data: 'reject_' + id }",
          "    ]",
          "  ];",
          "  if (ai) {",
          "    inlineKeyboard.push([",
          "      { text: '💡 Sugerir otra solucion', callback_data: 'suggest_' + id }",
          "    ]);",
          "  }",
          "",
          "  await bot.sendMessage(chatId, msgText, {",
          "    reply_markup: { inline_keyboard: inlineKeyboard },",
          "    parse_mode: 'Markdown'",
          "  });",
          "}",
          "",
          "bot.on('callback_query', async (query) => {",
          "  const action = query.data;",
          "  const msgChatId = query.message.chat.id;",
          "  const messageId = query.message.message_id;",
          "",
          "  if (action === 'scale_gcp') {",
          "    await bot.sendMessage(msgChatId, '🔄 Iniciando auto-escalado de instancia en GCP...');",
          "    try {",
          "      const res = await scaleGcpInstance();",
          "      await bot.editMessageText('✅ *Accion Completada*:\\n' + res, { chat_id: msgChatId, message_id: messageId, parse_mode: 'Markdown' });",
          "      reportedAlerts.delete('system_resources');",
          "    } catch (err) {",
          "      await bot.sendMessage(msgChatId, '❌ Error al escalar en GCP: ' + err.message);",
          "    }",
          "  } else if (action === 'dismiss_system') {",
          "    await bot.editMessageText('❌ *Alerta Silenciada*.\\nSe espera depuracion manual.', { chat_id: msgChatId, message_id: messageId, parse_mode: 'Markdown' });",
          "  } else if (action.startsWith('restart_')) {",
          "    const id = action.split('_')[1];",
          "    const cached = diagnosticsCache.get(id);",
          "    const name = cached ? cached.name : id;",
          "    await bot.sendMessage(msgChatId, '🔄 Reiniciando contenedor *' + name + '*...', { parse_mode: 'Markdown' });",
          "    try {",
          "      const container = docker.getContainer(id);",
          "      await container.restart();",
          "      reportedAlerts.delete(id);",
          "      diagnosticsCache.delete(id);",
          "      await bot.editMessageText('✅ *Reiniciado*.\\nEl contenedor *' + name + '* ha sido reiniciado con exito.', { chat_id: msgChatId, message_id: messageId, parse_mode: 'Markdown' });",
          "    } catch (err) {",
          "      await bot.sendMessage(msgChatId, '❌ Error al reiniciar *' + name + '*: ' + err.message);",
          "    }",
          "  } else if (action.startsWith('reject_')) {",
          "    const id = action.split('_')[1];",
          "    const cached = diagnosticsCache.get(id);",
          "    const name = cached ? cached.name : id;",
          "    diagnosticsCache.delete(id);",
          "    await bot.editMessageText('❌ *Alerta Silenciada* para *' + name + '*.\\nSe espera depuracion manual.', { chat_id: msgChatId, message_id: messageId, parse_mode: 'Markdown' });",
          "  } else if (action.startsWith('suggest_')) {",
          "    const id = action.split('_')[1];",
          "    const cached = diagnosticsCache.get(id);",
          "    if (!cached || !ai) return;",
          "",
          "    await bot.sendMessage(msgChatId, '🔍 Consultando alternativa de solucion...');",
          "    try {",
          "      const prompt = 'Los logs de \"' + cached.name + '\" son:\\n' + cached.logs + '\\n\\n' +",
          "        'La sugerencia anterior fue:\\n' + cached.lastDiagnosis + '\\n\\n' +",
          "        'Sugiere una solucion de depuracion alternativa.';",
          "      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });",
          "      const text = response.text || '';",
          "      cached.lastDiagnosis = text;",
          "      diagnosticsCache.set(id, cached);",
          "",
          "      await bot.sendMessage(msgChatId, '💡 *Sugerencia Alternativa para* *' + cached.name + '*:\\n\\n' + text, {",
          "        reply_markup: {",
          "          inline_keyboard: [",
          "            [",
          "              { text: '👍 Aprobar Reinicio', callback_data: 'restart_' + id },",
          "              { text: '👎 Solucionar yo mismo', callback_data: 'reject_' + id }",
          "            ]",
          "          ]",
          "        },",
          "        parse_mode: 'Markdown'",
          "      });",
          "    } catch (err) {",
          "      await bot.sendMessage(msgChatId, 'Error al generar alternativa: ' + err.message);",
          "    }",
          "  }",
          "});",
          "",
          "bot.on('message', async (msg) => {",
          "  if (!msg.text || msg.text.startsWith('/start')) return;",
          "  if (!ai) {",
          "    await bot.sendMessage(msg.chat.id, '⚠️ El asistente DevOps no tiene GEMINI_API_KEY configurado.');",
          "    return;",
          "  }",
          "",
          "  await bot.sendChatAction(msg.chat.id, 'typing');",
          "  try {",
          "    const systemPrompt = 'Eres un asistente DevOps experto integrado en la infraestructura. Tu rol es sugerir soluciones practicas, comandos y guias ante dudas de servidores, contenedores y configuracion. Se directo.';",
          "    const response = await ai.models.generateContent({",
          "      model: 'gemini-2.5-flash',",
          "      contents: msg.text,",
          "      config: { systemInstruction: systemPrompt }",
          "    });",
          "    await bot.sendMessage(msg.chat.id, response.text, { parse_mode: 'Markdown' });",
          "  } catch (err) {",
          "    await bot.sendMessage(msg.chat.id, '❌ Error: ' + err.message);",
          "  }",
          "});",
          "",
          "setInterval(performHealthCheck, checkIntervalMs);",
          "bot.sendMessage(chatId, '🚀 *DevOps Bot Inicializado* 🚀\\nModo de proveedor: `' + provider + '`\\nChequeos de salud cada ' + (checkIntervalMs / 60000) + ' minutos.', { parse_mode: 'Markdown' });"
        ].join('\n');

        await write('bot/index.js', botCode);
      }

      if (isManual) {
        await write('PROVISION_MANUAL.md', generateManualProvision(vpsConfig));
      }

      await write('.env.example', generateEnv(nodes, vpsConfig, cloudflareConfig));
      await write('.gitignore', '.env\nterraform.tfvars\n.terraform/\n*.tfstate\n*.tfstate.backup\ndist/\n');
      await write('README.md', generateReadme(nodes, scenario, vpsConfig, cloudflareConfig));
      await write('Makefile', generateMakefile(scenario, vpsConfig));

      if (isJson) {
        console.log(JSON.stringify({ status: 'success', outDir, generatedFiles }));
      } else {
        console.log(chalk.blue.bold(`\n✨ Compilación completada con éxito en ${outDir}`));
      }
    } catch (err) {
      if (isJson) {
        console.log(JSON.stringify({ status: 'error', error: err.message || err }));
      } else {
        console.error(chalk.red(`Error fatal:`), err);
      }
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Verifica si la arquitectura en el archivo es válida')
  .argument('<file>', 'Ruta al archivo infradraw.json')
  .option('--json', 'Salida en formato JSON legible por máquinas')
  .action(async (file, options) => {
    const isJson = !!options.json;
    try {
      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        if (isJson) {
          console.log(JSON.stringify({ valid: false, errors: [`No existe el archivo ${file}`], warnings: [] }));
        } else {
          console.error(chalk.red(`Error: No existe el archivo ${file}`));
        }
        process.exit(1);
      }

      const data = await fs.readJson(fullPath);
      const { errors, warnings } = validateTopology(data);
      
      if (isJson) {
        console.log(JSON.stringify({ valid: errors.length === 0, errors, warnings }));
      } else {
        if (errors.length > 0) {
          console.log(chalk.red('❌ Errores en la arquitectura:'));
          errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
        } else {
          console.log(chalk.green('✅ La topología es válida.'));
        }
        
        if (warnings.length > 0) {
          console.log(chalk.yellow('\n⚠️  Advertencias:'));
          warnings.forEach(w => console.log(chalk.yellow(`  - ${w}`)));
        }
      }
    } catch (err) {
      if (isJson) {
        console.log(JSON.stringify({ valid: false, errors: [err.message || err], warnings: [] }));
      } else {
        console.error(chalk.red(`Error al validar:`), err);
      }
      process.exit(1);
    }
  });

program
  .command('create')
  .description('Inicia un asistente interactivo o crea una topología de arquitectura no interactiva')
  .argument('[outputFile]', 'Nombre del archivo de destino', 'infradraw.json')
  .option('--non-interactive', 'Desactiva el asistente interactivo')
  .option('--provider <provider>', 'Proveedor de nube (VPS): hetzner, digitalocean, contabo, vultr, linode')
  .option('--plan <plan>', 'Plan de servidor (ej: cx31, s-2vcpu-4gb)')
  .option('--region <region>', 'Región del servidor')
  .option('--domain <domain>', 'Dominio principal (Cloudflare)')
  .option('--traefik <traefik>', 'Activar Traefik con SSL (si/no)')
  .option('--cert-email <email>', 'Email para certificados SSL')
  .option('--app <app>', 'Framework/Tipo de aplicación principal: nextjs, vite, nodejs, python, go, ninguno')
  .option('--port <port>', 'Puerto de la aplicación')
  .option('--db <db>', 'Base de datos a incluir (postgres/redis/ambas/ninguna)')
  .option('--json', 'Salida en formato JSON')
  .action(async (outputFile, options) => {
    const isJson = !!options.json;
    if (options.nonInteractive) {
      try {
        const provider = options.provider || 'hetzner';
        let defaultPlan = 'cx31';
        if (provider === 'digitalocean') defaultPlan = 's-2vcpu-4gb';
        else if (provider === 'contabo') defaultPlan = 'vps-s';
        else if (provider === 'vultr') defaultPlan = 'vc2-2c-4gb';
        else if (provider === 'linode') defaultPlan = 'linode-4gb';

        const plan = options.plan || defaultPlan;

        let defaultRegion = 'nbg1';
        if (provider === 'digitalocean') defaultRegion = 'nyc1';
        else if (provider === 'contabo') defaultRegion = 'fra1';
        else if (provider === 'vultr') defaultRegion = 'ewr';
        else if (provider === 'linode') defaultRegion = 'us-east';

        const region = options.region || defaultRegion;
        const domain = options.domain || '';
        const useTraefik = options.traefik || (domain ? 'si' : 'no');
        const certEmail = options.certEmail || (useTraefik === 'si' ? (domain ? `admin@${domain}` : 'admin@tudominio.com') : '');
        const appFramework = options.app || 'nextjs';

        let defaultPort = 3000;
        if (appFramework === 'vite') defaultPort = 5173;
        else if (appFramework === 'nodejs' || appFramework === 'go') defaultPort = 8080;
        else if (appFramework === 'python') defaultPort = 8000;
        
        const appPort = options.port ? parseInt(options.port) : defaultPort;
        const dbType = options.db || 'postgres';

        const nodes = [];
        const areas = [
          { id: 'a1', type: 'net-public', x: -50, y: -50, w: 300, h: 300 },
          { id: 'a2', type: 'net-db', x: 350, y: -50, w: 300, h: 300 }
        ];

        // 1. Nodo VPS
        nodes.push({
          id: 'n1',
          type: 'vps',
          x: 0,
          y: 0,
          config: {
            provider,
            plan,
            region,
            os: 'ubuntu-24.04',
            role: dbType !== 'ninguna' ? 'app+db' : 'app'
          }
        });

        // 2. Cloudflare
        if (domain) {
          nodes.push({
            id: 'n_cf',
            type: 'cloudflare',
            x: -150,
            y: 0,
            config: { domain }
          });
        }

        // 3. Traefik
        if (useTraefik === 'si') {
          nodes.push({
            id: 'n_tr',
            type: 'traefik',
            parentId: 'a1',
            x: 10,
            y: 10,
            config: { version: 'v3.0', cert_email: certEmail }
          });
        }

        // 4. App
        if (appFramework !== 'ninguno') {
          const isFrontend = ['nextjs', 'vite'].includes(appFramework);
          nodes.push({
            id: 'n_app',
            type: isFrontend ? 'frontend' : 'backend',
            parentId: 'a1',
            x: 10,
            y: 120,
            config: isFrontend ? { framework: appFramework, port: appPort } : { language: appFramework, port: appPort }
          });
        }

        // 5. Postgres
        if (dbType === 'postgres' || dbType === 'ambas') {
          nodes.push({
            id: 'n_pg',
            type: 'postgres',
            parentId: 'a2',
            x: 10,
            y: 10,
            config: { version: '16', pgbouncer_enabled: false }
          });
        }

        // 6. Redis
        if (dbType === 'redis' || dbType === 'ambas') {
          nodes.push({
            id: 'n_rd',
            type: 'redis',
            parentId: 'a2',
            x: 10,
            y: 120,
            config: { maxmemory: '1gb' }
          });
        }

        const topology = {
          version: 1,
          nodes,
          areas,
          conns: []
        };

        const outPath = path.resolve(process.cwd(), outputFile);
        await fs.ensureDir(path.dirname(outPath));
        await fs.writeJson(outPath, topology, { spaces: 2 });

        if (isJson) {
          console.log(JSON.stringify({ status: 'success', outputFile: outPath, topology }));
        } else {
          console.log(chalk.bold.green(`\n🎉 ¡Archivo de arquitectura creado con éxito (no interactivo)!`));
          console.log(`Guardado en: ${chalk.cyan(outPath)}`);
        }
      } catch (err) {
        if (isJson) {
          console.log(JSON.stringify({ status: 'error', error: err.message || err }));
        } else {
          console.error(chalk.red('\nError al crear la arquitectura:'), err);
        }
        process.exit(1);
      }
      return;
    }

    const rl = readline.createInterface({ input, output });

    try {
      console.log(chalk.bold.cyan(`
 ___ _   _ _____ ____    _   ____  ____    _ __        __
|_ _| \\ | |  ___|  _ \\  / \\ |  _ \\|  _ \\  / \\\\ \\      / /
 | ||  \\| | |_  | |_) |/ _ \\| |_) | |_) |/ _ \\\\ \\ /\\ / / 
 | || |\\  |  _| |  _ < / ___ \\  _ <|  _ </ ___ \\\\ V  V /  
|___|_| \\_|_|   |_| \\_/_/   \\_\\_| \\_\\_| \\_/_/   \\_\\_/\\_/  
      `));
      console.log(chalk.bold.magenta('\n🛸 Bienvenido al asistente interactivo de InfraDraw\n'));
      console.log('Vamos a diseñar tu arquitectura en pocos pasos.\n');

      const provider = await askQuestion(rl, 'Proveedor de nube (VPS)', ['hetzner', 'digitalocean', 'contabo', 'vultr', 'linode'], 'hetzner');

      let defaultPlan = 'cx31';
      let planOptions = ['cx21', 'cx31', 'cx41', 'cx51'];
      if (provider === 'digitalocean') {
        defaultPlan = 's-2vcpu-4gb';
        planOptions = ['s-1vcpu-2gb', 's-2vcpu-4gb', 's-4vcpu-8gb', 's-8vcpu-16gb'];
      } else if (provider === 'contabo') {
        defaultPlan = 'vps-s';
        planOptions = ['vps-s', 'vps-m', 'vps-l'];
      } else if (provider === 'vultr') {
        defaultPlan = 'vc2-2c-4gb';
        planOptions = ['vc2-1c-2gb', 'vc2-2c-4gb', 'vc2-4c-8gb'];
      } else if (provider === 'linode') {
        defaultPlan = 'linode-4gb';
        planOptions = ['nanode-1gb', 'linode-4gb', 'linode-8gb'];
      }

      const plan = await askQuestion(rl, `Plan de servidor para ${provider}`, planOptions, defaultPlan);

      let defaultRegion = 'nbg1';
      if (provider === 'digitalocean') defaultRegion = 'nyc1';
      else if (provider === 'contabo') defaultRegion = 'fra1';
      else if (provider === 'vultr') defaultRegion = 'ewr';
      else if (provider === 'linode') defaultRegion = 'us-east';

      const regionInput = await rl.question(chalk.cyan(`Región del servidor`) + ` [${chalk.yellow(defaultRegion)}]: `);
      const region = regionInput.trim() || defaultRegion;

      const domainInput = await rl.question(chalk.cyan(`Dominio principal (Cloudflare) (opcional, ej: mi-app.com)`) + `: `);
      const domain = domainInput.trim();

      let certEmail = '';
      const useTraefik = await askQuestion(rl, '¿Activar Traefik con SSL automático (Let\'s Encrypt)?', ['si', 'no'], 'si');
      if (useTraefik === 'si') {
        const defaultEmail = domain ? `admin@${domain}` : 'admin@tudominio.com';
        const emailInput = await rl.question(chalk.cyan(`Email para certificados SSL`) + ` [${chalk.yellow(defaultEmail)}]: `);
        certEmail = emailInput.trim() || defaultEmail;
      }

      const appFramework = await askQuestion(rl, 'Framework / Tipo de aplicación principal', ['nextjs', 'vite', 'nodejs', 'python', 'go', 'ninguno'], 'nextjs');

      let appPort = 3000;
      if (appFramework !== 'ninguno') {
        let defaultPort = 3000;
        if (appFramework === 'vite') defaultPort = 5173;
        else if (appFramework === 'nodejs' || appFramework === 'go') defaultPort = 8080;
        else if (appFramework === 'python') defaultPort = 8000;

        const portInput = await rl.question(chalk.cyan(`Puerto de la aplicación`) + ` [${chalk.yellow(defaultPort)}]: `);
        appPort = parseInt(portInput.trim()) || defaultPort;
      }

      const dbType = await askQuestion(rl, 'Base de datos a incluir', ['postgres', 'redis', 'ambas', 'ninguna'], 'postgres');

      // Construcción del JSON resultante
      const nodes = [];
      const areas = [
        {
          id: 'a1',
          type: 'net-public',
          x: -50,
          y: -50,
          w: 300,
          h: 300
        },
        {
          id: 'a2',
          type: 'net-db',
          x: 350,
          y: -50,
          w: 300,
          h: 300
        }
      ];

      // 1. Nodo VPS
      nodes.push({
        id: 'n1',
        type: 'vps',
        x: 0,
        y: 0,
        config: {
          provider,
          plan,
          region,
          os: 'ubuntu-24.04',
          role: dbType !== 'ninguna' ? 'app+db' : 'app'
        }
      });

      // 2. Cloudflare
      if (domain) {
        nodes.push({
          id: 'n_cf',
          type: 'cloudflare',
          x: -150,
          y: 0,
          config: {
            domain
          }
        });
      }

      // 3. Traefik
      if (useTraefik === 'si') {
        nodes.push({
          id: 'n_tr',
          type: 'traefik',
          parentId: 'a1',
          x: 10,
          y: 10,
          config: {
            version: 'v3.0',
            cert_email: certEmail
          }
        });
      }

      // 4. App
      if (appFramework !== 'ninguno') {
        const isFrontend = ['nextjs', 'vite'].includes(appFramework);
        nodes.push({
          id: 'n_app',
          type: isFrontend ? 'frontend' : 'backend',
          parentId: 'a1',
          x: 10,
          y: 120,
          config: isFrontend ? {
            framework: appFramework,
            port: appPort
          } : {
            language: appFramework,
            port: appPort
          }
        });
      }

      // 5. Postgres
      if (dbType === 'postgres' || dbType === 'ambas') {
        nodes.push({
          id: 'n_pg',
          type: 'postgres',
          parentId: 'a2',
          x: 10,
          y: 10,
          config: {
            version: '16',
            pgbouncer_enabled: false
          }
        });
      }

      // 6. Redis
      if (dbType === 'redis' || dbType === 'ambas') {
        nodes.push({
          id: 'n_rd',
          type: 'redis',
          parentId: 'a2',
          x: 10,
          y: 120,
          config: {
            maxmemory: '1gb'
          }
        });
      }

      const topology = {
        version: 1,
        nodes,
        areas,
        conns: []
      };

      const outPath = path.resolve(process.cwd(), outputFile);
      await fs.ensureDir(path.dirname(outPath));
      await fs.writeJson(outPath, topology, { spaces: 2 });

      console.log(chalk.bold.green(`\n🎉 ¡Archivo de arquitectura creado con éxito!`));
      console.log(`Guardado en: ${chalk.cyan(outPath)}`);
      console.log(`\nAhora puedes compilarlo ejecutando:`);
      console.log(chalk.yellow(`  node bin/infradraw.js compile ${outputFile} dist/`));
    } catch (err) {
      console.error(chalk.red('\nError durante el asistente:'), err);
    } finally {
      rl.close();
    }
  });

async function askQuestion(rl, query, options, defaultVal) {
  let promptText = chalk.cyan(query);
  if (options && options.length > 0) {
    promptText += ` (${options.join('/')})`;
  }
  if (defaultVal !== undefined) {
    promptText += ` [${chalk.yellow(defaultVal)}]`;
  }
  promptText += ': ';

  while (true) {
    const answer = (await rl.question(promptText)).trim();
    if (!answer && defaultVal !== undefined) {
      return defaultVal;
    }
    if (!options || options.length === 0) {
      return answer;
    }
    const match = options.find(opt => opt.toLowerCase() === answer.toLowerCase());
    if (match) {
      return match;
    }
    console.log(chalk.red(`Opción inválida. Por favor selecciona una de: ${options.join(', ')}`));
  }
}

program
  .command('schema')
  .description('Muestra el esquema de metadatos soportados por InfraDraw en formato JSON')
  .action(() => {
    const schemaInfo = {
      version: '1.0.0',
      supportedNodeTypes: ['vps', 'traefik', 'frontend', 'backend', 'postgres', 'redis', 'cloudflare'],
      providers: {
        hetzner: {
          plans: ['cx21', 'cx31', 'cx41', 'cx51', 'ccx13', 'ccx23'],
          defaultRegion: 'nbg1'
        },
        digitalocean: {
          plans: ['s-1vcpu-2gb', 's-2vcpu-4gb', 's-4vcpu-8gb', 's-8vcpu-16gb'],
          defaultRegion: 'nyc1'
        },
        contabo: {
          plans: ['vps-s', 'vps-m', 'vps-l'],
          defaultRegion: 'fra1'
        },
        vultr: {
          plans: ['vc2-1c-2gb', 'vc2-2c-4gb', 'vc2-4c-8gb'],
          defaultRegion: 'ewr'
        },
        linode: {
          plans: ['nanode-1gb', 'linode-4gb', 'linode-8gb', 'linode-16gb'],
          defaultRegion: 'us-east'
        }
      },
      appFrameworks: ['nextjs', 'vite', 'nodejs', 'python', 'go', 'ninguno'],
      databaseTypes: ['postgres', 'redis', 'ambas', 'ninguna']
    };
    console.log(JSON.stringify(schemaInfo, null, 2));
  });

program.parse(process.argv);
