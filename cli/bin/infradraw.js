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

program
  .name('infradraw')
  .description('CLI para compilar arquitecturas visuales de InfraDraw')
  .version('1.0.0');

program
  .command('compile')
  .description('Compila un archivo infradraw.json a ficheros IaC y configuraciones')
  .argument('<file>', 'Ruta al archivo infradraw.json')
  .argument('[outDir]', 'Directorio de salida', './dist')
  .action(async (file, outDir) => {
    try {
      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        console.error(chalk.red(`Error: No se encontró el archivo ${fullPath}`));
        process.exit(1);
      }

      console.log(chalk.blue(`Iniciando compilación de ${file}...`));
      const data = await fs.readJson(fullPath);
      
      const nodes = data.nodes || [];
      const areas = data.areas || [];
      
      if (nodes.length === 0) {
        console.error(chalk.red('Error: El archivo no contiene nodos (servicios).'));
        process.exit(1);
      }

      const det = detectScenario(nodes);
      const { scenario, vpsNodes } = det;
      const vpsConfig = (vpsNodes[0] && vpsNodes[0].config) || {};
      const provider = vpsConfig.provider || 'hetzner';
      const isManual = provider === 'contabo';
      const needsTerraform = ['hetzner', 'digitalocean', 'vultr', 'linode'].includes(provider);
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
        console.log(chalk.green(`  Generado: ${relPath}`));
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
        await write('terraform/outputs.tf', generateTerraformOutputs(vpsNodes));
        const tfvarsExample = '# Copia como terraform.tfvars y completa los valores\n' +
          '# NUNCA subas terraform.tfvars a git\n\n' +
          'hcloud_token         = ""\n' +
          'ssh_public_key       = ""\n' +
          'cloudflare_api_token = ""\n' +
          'cloudflare_zone_id   = ""\n';
        await write('terraform/terraform.tfvars.example', tfvarsExample);
      }

      if (isManual) {
        await write('PROVISION_MANUAL.md', generateManualProvision(vpsConfig));
      }

      await write('.env.example', generateEnv(nodes, vpsConfig, cloudflareConfig));
      await write('.gitignore', '.env\nterraform.tfvars\n.terraform/\n*.tfstate\n*.tfstate.backup\ndist/\n');
      await write('README.md', generateReadme(nodes, scenario, vpsConfig, cloudflareConfig));
      await write('Makefile', generateMakefile(scenario, vpsConfig));

      console.log(chalk.blue.bold(`\n✨ Compilación completada con éxito en ${outDir}`));
    } catch (err) {
      console.error(chalk.red(`Error fatal:`), err);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Verifica si la arquitectura en el archivo es válida')
  .argument('<file>', 'Ruta al archivo infradraw.json')
  .action(async (file) => {
    try {
      const fullPath = path.resolve(process.cwd(), file);
      const data = await fs.readJson(fullPath);
      const nodes = data.nodes || [];
      const det = detectScenario(nodes);
      
      if (det.errors && det.errors.length > 0) {
        console.log(chalk.red('❌ Errores en la arquitectura:'));
        det.errors.forEach(e => console.log(chalk.red(`  - ${e}`)));
      } else {
        console.log(chalk.green('✅ La topología es válida.'));
      }
      
      if (det.warnings && det.warnings.length > 0) {
        console.log(chalk.yellow('\n⚠️  Advertencias:'));
        det.warnings.forEach(w => console.log(chalk.yellow(`  - ${w}`)));
      }
    } catch (err) {
      console.error(chalk.red(`Error al validar:`), err);
    }
  });

program
  .command('create')
  .description('Inicia un asistente interactivo para crear una topología de arquitectura')
  .argument('[outputFile]', 'Nombre del archivo de destino', 'infradraw.json')
  .action(async (outputFile) => {
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

program.parse(process.argv);
