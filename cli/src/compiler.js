function detectScenario(nodes) {
  var vpsNodes = nodes.filter(function(n){return n.type==='vps';});
  var appVPS   = vpsNodes.filter(function(n){return ['app','app+db'].indexOf((n.config&&n.config.role)||'app+db')!==-1;});
  var dbVPS    = vpsNodes.filter(function(n){return ['db'].indexOf(n.config&&n.config.role)!==-1;});
  if (vpsNodes.length === 1) return { scenario: 1, appVPS: appVPS, dbVPS: dbVPS, vpsNodes: vpsNodes };
  if (vpsNodes.length === 2 && dbVPS.length === 1) return { scenario: 2, appVPS: appVPS, dbVPS: dbVPS, vpsNodes: vpsNodes };
  return { scenario: 3, appVPS: appVPS, dbVPS: dbVPS, vpsNodes: vpsNodes };
}

// ── Helpers de configuración ──────────────────────
function getPlanRAM(provider, plan) {
  var RAM = {
    hetzner: { cx21:4, cx31:8, cx41:16, cx51:32, ccx13:8, ccx23:16 },
    digitalocean: { 's-1vcpu-2gb':2,'s-2vcpu-4gb':4,'s-4vcpu-8gb':8,'s-8vcpu-16gb':16 },
    contabo: { 'vps-s':8,'vps-m':16,'vps-l':30,'vds-s':8 },
    vultr: { 'vc2-1c-2gb':2,'vc2-2c-4gb':4,'vc2-4c-8gb':8,'vhf-2c-4gb':4,'vhf-4c-8gb':8 },
    linode: { 'nanode-1gb':1,'linode-4gb':4,'linode-8gb':8,'linode-16gb':16,'dedicated-4gb':4,'dedicated-8gb':8 },
    gcloud: { 'e2-micro':1, 'e2-small':2, 'e2-medium':4, 'e2-standard-2':8 }
  };
  var planKey = String(plan).split(' ')[0].toLowerCase();
  return (RAM[provider] && RAM[provider][planKey]) || 8;
}

function getPlanCost(provider, plan) {
  var COST = {
    hetzner: { cx21:4.5, cx31:7.5, cx41:14.5, cx51:28.5, ccx13:14.5, ccx23:28.5 },
    digitalocean: { 's-1vcpu-2gb':12,'s-2vcpu-4gb':24,'s-4vcpu-8gb':48,'s-8vcpu-16gb':96 },
    contabo: { 'vps-s':5.5,'vps-m':10.5,'vps-l':23.5,'vds-s':47 },
    vultr: { 'vc2-1c-2gb':12,'vc2-2c-4gb':24,'vc2-4c-8gb':48,'vhf-2c-4gb':28,'vhf-4c-8gb':56 },
    linode: { 'nanode-1gb':5,'linode-4gb':24,'linode-8gb':48,'linode-16gb':96,'dedicated-4gb':36,'dedicated-8gb':72 },
    gcloud: { 'e2-micro':7, 'e2-small':12, 'e2-medium':25, 'e2-standard-2':49 }
  };
  var planKey = String(plan).split(' ')[0].toLowerCase();
  return (COST[provider] && COST[provider][planKey]) || 0;
}

function getS3Endpoint(provider) {
  var endpoints = {
    wasabi:        'https://s3.wasabisys.com',
    cloudflare_r2: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com',
    hetzner_os:    'https://s3.hetzner.com',
    backblaze_b2:  'https://s3.us-west-004.backblazeb2.com'
  };
  return endpoints[provider] || 'https://s3.provider.com';
}

// ── Generadores de archivos de configuración ──────
function generatePostgresConf(ramGB) {
  var shared   = Math.floor(ramGB * 0.25);
  var cache    = Math.floor(ramGB * 0.75);
  var workMem  = Math.floor((ramGB * 1024 * 0.25) / 10);
  var maintMem = Math.floor(ramGB * 0.125 * 1024);
  return `# postgresql.conf — generado por InfraDraw
# Optimizado para ${ramGB}GB RAM

# Memoria
shared_buffers = ${shared}GB
effective_cache_size = ${cache}GB
work_mem = ${workMem}MB
maintenance_work_mem = ${maintMem}MB

# WAL
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 2GB
min_wal_size = 512MB

# Conexiones
max_connections = 100
# idle_in_transaction_session_timeout: aborta sesiones que llevan > 10s
# bloqueadas en una transacción (equivalente servidor de connection_timeout).
# connection_timeout NO es un parámetro de postgresql.conf — es de libpq.
idle_in_transaction_session_timeout = 10000
lock_timeout = 30000

# Query planner (SSD)
default_statistics_target = 100
random_page_cost = 1.1

# Logging
log_min_duration_statement = 1000
log_checkpoints = on
log_lock_waits = on

# Locale
lc_messages = 'en_US.UTF-8'
`;
}

function generateRedisConf(maxmemory) {
  return `# redis.conf — generado por InfraDraw
appendonly yes
appendfsync everysec
maxmemory ${maxmemory}
maxmemory-policy allkeys-lru
maxclients 1000
timeout 300
tcp-keepalive 300
hz 15
loglevel notice
`;
}

function generateTraefikYml(certEmail) {
  return `# traefik.yml — generado por InfraDraw
api:
  dashboard: true
  insecure: false

providers:
  docker:
    exposedByDefault: false
    network: public
  file:
    directory: /dynamic
    watch: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true
  websecure:
    address: ":443"

certificatesResolvers:
  le:
    acme:
      email: ${certEmail}
      storage: /acme/acme.json
      httpChallenge:
        entryPoint: web

log:
  level: WARN
`;
}

function generateMiddlewaresYml() {
  return `# middlewares.yml — generado por InfraDraw
http:
  middlewares:
    security-headers:
      headers:
        stsSeconds: 31536000
        stsIncludeSubdomains: true
        stsPreload: true
        forceSTSHeader: true
        contentTypeNosniff: true
        browserXssFilter: true
        referrerPolicy: "strict-origin-when-cross-origin"
        customResponseHeaders:
          X-Powered-By: ""
          Server: ""
    rate-limit:
      rateLimit:
        average: 100
        burst: 50
        period: 1m
    compress:
      compress: {}
`;
}

// ── docker-compose.yml ────────────────────────────
function generateCompose(nodes, areas, scenario, vpsConfig) {
  var hasType = function(t){return nodes.some(function(n){return n.type===t;});};
  var getNode = function(t){return nodes.find(function(n){return n.type===t;});};
  var pgNode  = getNode('postgres');
  var rdNode  = getNode('redis');
  var trNode  = getNode('traefik');
  var pgVersion = (pgNode&&pgNode.config&&pgNode.config.version) || '16';
  var rdVersion = (rdNode&&rdNode.config&&rdNode.config.version) || '7';
  var pgBouncer = (pgNode&&pgNode.config&&pgNode.config.pgbouncer_enabled) || false;
  var ramGB     = getPlanRAM((vpsConfig&&vpsConfig.provider) || 'hetzner', (vpsConfig&&vpsConfig.plan) || 'cx31');

  var hasPublic   = areas.some(function(a){return a.type==='net-public';});
  var hasInternal = areas.some(function(a){return a.type==='net-internal';});
  var hasDB       = areas.some(function(a){return a.type==='net-db';});

  // BUG-5 FIX: Si no se añadieron áreas de red explícitas, definir las redes estándar
  // para que los servicios que las referencian (traefik→public, postgres/redis→internal)
  // sean válidos. Un networks: vacío genera "networks must be a mapping" en docker compose.
  var effectivePublic   = hasPublic   || (!hasPublic && !hasInternal && !hasDB);
  var effectiveInternal = hasInternal || (!hasPublic && !hasInternal && !hasDB);

  var out = `# docker-compose.yml — generado por InfraDraw
# Escenario ${scenario} | ${(vpsConfig&&vpsConfig.provider) || 'hetzner'} ${(vpsConfig&&vpsConfig.plan) || 'cx31'}
# RAM detectada: ${ramGB}GB

networks:
`;

  if (effectivePublic)  out += `  public:\n    driver: bridge\n`;
  if (effectiveInternal) out += `  internal:\n    driver: bridge\n    internal: true\n`;
  if (hasDB)            out += `  db:\n    driver: bridge\n    internal: true\n`;

  out += `\nservices:\n`;

  if (hasType('traefik')) {
    out += `
  traefik:
    image: traefik:${(trNode&&trNode.config&&trNode.config.version) || 'v3.0'}
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik_acme:/acme
      - ./config/traefik.yml:/traefik.yml:ro
      - ./config/middlewares.yml:/dynamic/middlewares.yml:ro
    networks: [public]
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(\`traefik.\${DOMAIN}\`)"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls.certresolver=le"
      - "traefik.http.routers.traefik.middlewares=dashboard-auth"
      - "traefik.http.middlewares.dashboard-auth.basicauth.users=\${TRAEFIK_DASHBOARD_AUTH}"
      - "traefik.http.services.traefik.loadbalancer.server.port=8080"\n`;
  }

  if (hasType('frontend')) {
    var fNets = hasPublic ? '[public]' : '[public, internal]';
    out += `
  frontend:
    image: \${REGISTRY}/frontend:\${VERSION:-latest}
    restart: unless-stopped
    networks: ${fNets}
    environment:
      - NEXT_PUBLIC_API_URL=https://api.\${DOMAIN}
    healthcheck:
      test: ["CMD","curl","-f","http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(\`\${DOMAIN}\`) || Host(\`www.\${DOMAIN}\`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=le"
      - "traefik.http.routers.frontend.middlewares=security-headers,compress"
      - "traefik.http.services.frontend.loadbalancer.server.port=3000"\n`;
  }

  if (hasType('backend')) {
    var bNets = [effectivePublic?'public':null, effectiveInternal?'internal':null, hasDB?'db':null].filter(Boolean).join(', ');
    out += `
  backend:
    image: \${REGISTRY}/backend:\${VERSION:-latest}
    restart: unless-stopped
    networks: [${bNets}]
    environment:
      - DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@${pgBouncer?'pgbouncer':'postgres'}:${pgBouncer?'5433':'5432'}/\${DB_NAME}
      - REDIS_URL=redis://:\${REDIS_PASSWORD}@redis:6379
      - JWT_SECRET=\${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD","curl","-f","http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(\`api.\${DOMAIN}\`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=le"
      - "traefik.http.routers.backend.middlewares=security-headers,rate-limit"
      - "traefik.http.services.backend.loadbalancer.server.port=3001"\n`;
  }

  if (hasType('ai')) {
    out += `
  ai-service:
    image: \${REGISTRY}/ai-service:\${VERSION:-latest}
    restart: unless-stopped
    networks: [internal, db]
    environment:
      - GEMINI_API_KEY=\${GEMINI_API_KEY}
      - REDIS_URL=redis://:\${REDIS_PASSWORD}@redis:6379
      - DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@postgres:5432/\${DB_NAME}
    healthcheck:
      test: ["CMD","curl","-f","http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          memory: 512M\n`;
  }

  if (hasType('postgres')) {
    out += `
  postgres:
    image: postgres:${pgVersion}-alpine
    restart: unless-stopped
    networks: [${hasDB?'db':'internal'}]
    environment:
      - POSTGRES_USER=\${DB_USER}
      - POSTGRES_PASSWORD=\${DB_PASSWORD}
      - POSTGRES_DB=\${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./config/postgresql.conf:/etc/postgresql/postgresql.conf
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    healthcheck:
      test: ["CMD-SHELL","pg_isready -U \${DB_USER} -d postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s\n`;

    if (pgBouncer) {
      var poolMode = (pgNode&&pgNode.config&&pgNode.config.pgbouncer_pool_mode) || 'transaction';
      var maxConn  = (pgNode&&pgNode.config&&pgNode.config.pgbouncer_max_conn) || '100';
      out += `
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    restart: unless-stopped
    networks: [${hasDB?'db':'internal'}, internal]
    environment:
      - DATABASE_URL=postgres://\${DB_USER}:\${DB_PASSWORD}@postgres:5432/\${DB_NAME}
      - POOL_MODE=${poolMode}
      - MAX_CLIENT_CONN=${maxConn}
      - DEFAULT_POOL_SIZE=20
    depends_on:
      postgres:
        condition: service_healthy\n`;
    }
  }

  if (hasType('redis')) {
    out += `
  redis:
    image: redis:${rdVersion}-alpine
    restart: unless-stopped
    networks: [internal]
    volumes:
      - redis_data:/data
      - ./config/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD","redis-cli","ping"]
      interval: 10s
      timeout: 5s
      retries: 5\n`;
  }

  if (hasType('meilisearch')) {
    var msNode = getNode('meilisearch');
    out += `
  meilisearch:
    image: getmeili/meilisearch:${(msNode&&msNode.config&&msNode.config.version) || 'latest'}
    restart: unless-stopped
    networks: [internal]
    environment:
      - MEILI_MASTER_KEY=\${MEILI_MASTER_KEY}
    volumes:
      - meilisearch_data:/meili_data
    healthcheck:
      test: ["CMD","curl","-f","http://localhost:7700/health"]
      interval: 30s
      timeout: 10s
      retries: 3\n`;
  }

  if (hasType('prometheus')) {
    out += `
  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    networks: [internal]
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'\n`;
  }

  if (hasType('grafana')) {
    out += `
  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    networks: [public, internal]
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(\`monitor.\${DOMAIN}\`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls.certresolver=le"\n`;
  }

  if (hasType('loki')) {
    out += `
  loki:
    image: grafana/loki:latest
    restart: unless-stopped
    networks: [internal]
    volumes:
      - loki_data:/loki

  promtail:
    image: grafana/promtail:latest
    restart: unless-stopped
    networks: [internal]
    volumes:
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro\n`;
  }

  out += `\nvolumes:\n`;
  if (hasType('postgres'))    out += `  postgres_data:\n`;
  if (hasType('redis'))       out += `  redis_data:\n`;
  if (hasType('traefik'))     out += `  traefik_acme:\n`;
  if (hasType('meilisearch')) out += `  meilisearch_data:\n`;
  if (hasType('prometheus'))  out += `  prometheus_data:\n`;
  if (hasType('grafana'))     out += `  grafana_data:\n`;
  if (hasType('loki'))        out += `  loki_data:\n`;

  return out;
}
function generateSetup(vpsConfig, nodes) {
  var provider = (vpsConfig && vpsConfig.provider) || 'hetzner';
  var plan     = (vpsConfig && vpsConfig.plan) || 'cx31';
  var os       = (vpsConfig && vpsConfig.os) || 'ubuntu-24.04';
  var hasRedis = nodes.some(function(n){return n.type==='redis';});
  var hasStorage = nodes.some(function(n){return n.type==='storage';});
  return `#!/bin/bash
# setup.sh — generado por InfraDraw
# Proveedor: ${provider} | Plan: ${plan} | OS: ${os}
# EJECUTAR COMO ROOT EN VPS NUEVO

set -e

echo "🚀 Iniciando setup de infraestructura..."

# ── Sistema ─────────────────────────────────────────────
apt-get update && apt-get upgrade -y

# ── Usuario deploy ───────────────────────────────────────
if ! id "deploy" &>/dev/null; then
  useradd -m -s /bin/bash deploy
  usermod -aG sudo deploy
  echo "deploy ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/deploy
fi

mkdir -p /home/deploy/.ssh
if [ -f /root/.ssh/authorized_keys ]; then
  cp /root/.ssh/authorized_keys /home/deploy/.ssh/
  chown -R deploy:deploy /home/deploy/.ssh
  chmod 700 /home/deploy/.ssh
  chmod 600 /home/deploy/.ssh/authorized_keys
fi

# ── SSH hardening ────────────────────────────────────────
sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
echo "MaxAuthTries 3" >> /etc/ssh/sshd_config
echo "ClientAliveInterval 300" >> /etc/ssh/sshd_config
systemctl restart sshd

# ── Firewall ─────────────────────────────────────────────
ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ── Fail2ban ─────────────────────────────────────────────
apt-get install -y fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 3600
EOF
systemctl enable fail2ban
systemctl start fail2ban

# ── Docker ───────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker deploy
fi

cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "3" },
  "metrics-addr": "127.0.0.1:9323"
}
EOF
systemctl restart docker

${hasRedis ? `# ── Redis overcommit ─────────────────────────────────────
if ! grep -q "vm.overcommit_memory" /etc/sysctl.conf; then
  echo "vm.overcommit_memory=1" >> /etc/sysctl.conf
  sysctl -p
fi` : ''}

# ── Directorio del proyecto ──────────────────────────────
mkdir -p /opt/proyecto
chown deploy:deploy /opt/proyecto

# ── Herramientas ─────────────────────────────────────────
apt-get install -y htop curl wget git unzip
${hasStorage ? `
# ── AWS CLI v2 (para backups S3-compatible) ──────────────
if ! command -v aws &>/dev/null; then
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" \\
    -o "/tmp/awscliv2.zip"
  unzip -q /tmp/awscliv2.zip -d /tmp
  /tmp/aws/install
  rm -rf /tmp/awscliv2.zip /tmp/aws
  echo "✅ AWS CLI instalado: $(aws --version)"
fi` : ''}

echo ""
echo "✅ VPS listo."
echo "👉 Conectar como: ssh -p 2222 deploy@$(curl -s ifconfig.me)"
${provider === 'hetzner' ? `echo "💡 Tip Hetzner: activa backups automáticos en la consola (+20% del costo)"` : ''}
${provider === 'contabo' ? `echo "💡 Tip Contabo: snapshots y red privada son manuales desde el panel web"` : ''}
${provider === 'digitalocean' ? `echo "💡 Tip DigitalOcean: habilita backups semanales en el panel Droplet (+20%)"` : ''}
`;
}
function generateManualProvision(vpsConfig) {
  var plan   = (vpsConfig && vpsConfig.plan) || 'vps-s';
  var region = (vpsConfig && vpsConfig.region) || 'EU — Alemania';
  return `# Provision Manual — Contabo
## Pasos para crear el servidor en Contabo

Contabo no tiene API pública. Sigue estos pasos manualmente:

1. Ve a https://contabo.com y accede a tu cuenta
2. Compra un **${plan}** con estas especificaciones:
   - OS: Ubuntu 24.04 LTS
   - Region: ${region}
3. En el email de confirmación recibirás:
   - IP del servidor
   - Contraseña root inicial
4. Copia la IP aquí: ___________________
5. Conéctate: \`ssh root@<IP>\`
6. Ejecuta: \`bash setup.sh\`

## Limitaciones de Contabo vs Hetzner/DigitalOcean
- ❌ Sin red privada entre servidores (multi-VPS va por internet público)
- ❌ Sin API para automatización
- ❌ Sin Terraform provider oficial
- ✅ Mejor precio por GB de RAM
- ✅ Opción VDS (CPU dedicado) económica
`;
}
function generateTerraform(nodes, vpsConfig, cloudflareConfig) {
  var provider    = (vpsConfig && vpsConfig.provider) || 'hetzner';
  var plan        = String((vpsConfig && vpsConfig.plan) || 'e2-medium').split(' ')[0];
  var region      = String((vpsConfig && vpsConfig.region) || 'us-central1').split(' ')[0];
  var os          = (vpsConfig && vpsConfig.os) || 'ubuntu-24.04';
  var zone        = (cloudflareConfig && cloudflareConfig.zone) || 'tudominio.com';
  var vpsNodes    = nodes.filter(function(n){return n.type==='vps';});
  var multiVPS    = vpsNodes.length > 1;
  var hasStorage  = nodes.some(function(n){return n.type==='storage';});
  var storageNode = nodes.find(function(n){return n.type==='storage';});
  var role0 = (vpsNodes[0] && vpsNodes[0].config && vpsNodes[0].config.role) || 'app';

  if (provider === 'hetzner') {
    return `# terraform/main.tf — generado por InfraDraw
# Proveedor: Hetzner Cloud

terraform {
  required_version = ">= 1.5"
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "hcloud" {
  token = var.hcloud_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

# ── SSH Key ───────────────────────────────────────────────
resource "hcloud_ssh_key" "default" {
  name       = "infradraw-key"
  public_key = var.ssh_public_key
}

# ── Firewall ──────────────────────────────────────────────
resource "hcloud_firewall" "main" {
  name = "main-firewall"
  rule { direction = "in"; protocol = "tcp"; port = "2222"; source_ips = ["0.0.0.0/0","::/0"] }
  rule { direction = "in"; protocol = "tcp"; port = "80";   source_ips = ["0.0.0.0/0","::/0"] }
  rule { direction = "in"; protocol = "tcp"; port = "443";  source_ips = ["0.0.0.0/0","::/0"] }
}

${multiVPS ? `# ── Red Privada ──────────────────────────────────────────
resource "hcloud_network" "private" {
  name     = "private-network"
  ip_range = "10.0.0.0/8"
}

resource "hcloud_network_subnet" "main" {
  network_id   = hcloud_network.private.id
  type         = "cloud"
  network_zone = "eu-central"
  ip_range     = "10.0.1.0/24"
}` : ''}

${vpsNodes.map(function(vps, i){ var role=(vps.config&&vps.config.role)||'app'; return `
# ── Servidor ${i === 0 ? 'Principal' : '#'+(i+1)} ─────────────────────────────────────
resource "hcloud_server" "${role}_${i+1}" {
  name        = "proyecto-${role}-${i+1}"
  image       = "${os}"
  server_type = "${plan}"
  location    = "${region}"
  ssh_keys    = [hcloud_ssh_key.default.id]
  firewall_ids = [hcloud_firewall.main.id]
  user_data   = file("../scripts/setup.sh")
}
${multiVPS ? `
resource "hcloud_server_network" "${role}_${i+1}_net" {
  server_id  = hcloud_server.${role}_${i+1}.id
  network_id = hcloud_network.private.id
  ip         = "10.0.1.${i+1}"
}` : ''}`; }).join('\n')}

# ── Cloudflare DNS ────────────────────────────────────────
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = hcloud_server.${role0}_1.ipv4_address
  type    = "A"
  proxied = true
}

resource "cloudflare_record" "api" {
  zone_id = var.cloudflare_zone_id
  name    = "api"
  value   = hcloud_server.${role0}_1.ipv4_address
  type    = "A"
  proxied = true
}

resource "cloudflare_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  value   = "${zone}"
  type    = "CNAME"
  proxied = true
}

${hasStorage && storageNode && storageNode.config && storageNode.config.provider === 'cloudflare_r2' ? `
# ── Cloudflare R2 ─────────────────────────────────────────
resource "cloudflare_r2_bucket" "storage" {
  account_id = var.cloudflare_account_id
  name       = var.r2_bucket_name
  location   = "WEUR"
}` : ''}
`;
  }

  if (provider === 'gcloud') {
    return `# terraform/main.tf — generado por InfraDraw
# Proveedor: Google Cloud (GCP)

terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  credentials = file(var.gcp_credentials_file)
  project     = var.gcp_project_id
  region      = "${region}"
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

${multiVPS ? `# ── Red VPC ──────────────────────────────────────────────────
resource "google_compute_network" "vpc_network" {
  name                    = "proyecto-vpc"
  auto_create_subnetworks = "true"
}

resource "google_compute_subnetwork" "subnet" {
  name          = "proyecto-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = "${region}"
  network       = google_compute_network.vpc_network.id
}` : ''}

# ── Firewall ──────────────────────────────────────────────
resource "google_compute_firewall" "allow_http_ssh" {
  name    = "allow-http-ssh"
  network = ${multiVPS ? 'google_compute_network.vpc_network.name' : '"default"'}

  allow { protocol = "tcp"; ports    = ["2222", "80", "443"] }
  source_ranges = ["0.0.0.0/0"]
}

${vpsNodes.map(function(vps, i){ var role=(vps.config&&vps.config.role)||'app'; return `
# ── Instancia ${role}_${i+1} ───────────────────────────────────────
resource "google_compute_instance" "${role}_${i+1}" {
  name         = "proyecto-${role}-${i+1}"
  machine_type = "${plan}"
  zone         = "${region}-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2404-lts-amd64"
    }
  }

  network_interface {
    network = ${multiVPS ? 'google_compute_network.vpc_network.name' : '"default"'}
    ${multiVPS ? 'subnetwork = google_compute_subnetwork.subnet.name' : ''}
    access_config { }
  }

  metadata = {
    ssh-keys = "deploy:\${var.ssh_public_key}"
  }

  metadata_startup_script = file("../scripts/setup.sh")
}`; }).join('\n')}

# ── Cloudflare DNS ────────────────────────────────────────
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = google_compute_instance.${role0}_1.network_interface.0.access_config.0.nat_ip
  type    = "A"
  proxied = true
}
`;
  }

  if (provider === 'digitalocean') {
    return `# terraform/main.tf — generado por InfraDraw
# Proveedor: DigitalOcean

terraform {
  required_version = ">= 1.5"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

${multiVPS ? `# ── VPC ──────────────────────────────────────────────────
resource "digitalocean_vpc" "main" {
  name   = "proyecto-vpc"
  region = "${region}"
}` : ''}

${vpsNodes.map(function(vps, i){ var role=(vps.config&&vps.config.role)||'app'; return `
resource "digitalocean_droplet" "${role}_${i+1}" {
  name   = "proyecto-${role}-${i+1}"
  image  = "ubuntu-24-04-x64"
  size   = "${plan}"
  region = "${region}"
  ssh_keys = [var.ssh_fingerprint]
  ${multiVPS ? 'vpc_uuid = digitalocean_vpc.main.id' : ''}
  user_data = file("../scripts/setup.sh")
}`; }).join('\n')}

# ── Cloudflare DNS ────────────────────────────────────────
resource "cloudflare_record" "root" {
  zone_id = var.cloudflare_zone_id
  name    = "@"
  value   = digitalocean_droplet.${role0}_1.ipv4_address
  type    = "A"
  proxied = true
}
`;
  }

  return `# terraform/main.tf — ${provider}
# Provider Terraform oficial disponible para ${provider}
# Consulta: https://registry.terraform.io/providers/${provider}
# La estructura es similar a Hetzner — adapta los resource types.
`;
}
function generateTerraformVars(vpsConfig, cloudflareConfig) {
  var provider = (vpsConfig && vpsConfig.provider) || 'hetzner';
  var hasR2 = (cloudflareConfig && cloudflareConfig.storage_provider) === 'cloudflare_r2';
  var out = `# terraform/variables.tf — generado por InfraDraw\n\n`;
  if (provider === 'hetzner') {
    out += `variable "hcloud_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
  # Obtener en: https://console.hetzner.cloud → Security → API Tokens
}

`;
  }
  if (provider === 'gcloud') {
    out += `variable "gcp_project_id" {
  description = "ID del proyecto en Google Cloud"
  type        = string
}

variable "gcp_credentials_file" {
  description = "Ruta al archivo JSON de credenciales de la cuenta de servicio de GCP"
  type        = string
  default     = "../gcp-credentials.json"
}

`;
  }
  if (provider === 'digitalocean') {
    out += `variable "do_token" {
  description = "DigitalOcean API Token"
  type        = string
  sensitive   = true
  # Obtener en: https://cloud.digitalocean.com/account/api/tokens
}

variable "ssh_fingerprint" {
  description = "MD5 fingerprint de tu SSH key en DigitalOcean"
  type        = string
  # Obtener en: https://cloud.digitalocean.com/account/security
}

`;
  }
  out += `variable "ssh_public_key" {
  description = "Contenido de tu clave SSH pública"
  type        = string
  # Obtener con: cat ~/.ssh/id_rsa.pub
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token con permisos DNS:Edit, Zone:Read"
  type        = string
  sensitive   = true
  # Obtener en: https://dash.cloudflare.com/profile/api-tokens
}

variable "cloudflare_zone_id" {
  description = "Zone ID de tu dominio en Cloudflare"
  type        = string
  # Obtener en: Cloudflare Dashboard → tu dominio → Overview (barra lateral derecha)
}

${hasR2 ? `variable "cloudflare_account_id" {
  description = "Account ID de Cloudflare"
  type        = string
  # Obtener en: Cloudflare Dashboard → barra lateral derecha
}

variable "r2_bucket_name" {
  description = "Nombre del bucket R2"
  type        = string
  default     = "proyecto-backups"
}
` : ''}`;
  return out;
}
function generateTerraformOutputs(vpsNodes, vpsConfig) {
  var provider = (vpsConfig && vpsConfig.provider) || 'hetzner';
  var out = `# terraform/outputs.tf — generado por InfraDraw\n\n`;
  vpsNodes.forEach(function(vps, i){
    var role = (vps.config && vps.config.role) || 'app';
    var ip_value = \`hcloud_server.\${role}_\${i+1}.ipv4_address\`;
    if (provider === 'digitalocean') ip_value = \`digitalocean_droplet.\${role}_\${i+1}.ipv4_address\`;
    if (provider === 'gcloud') ip_value = \`google_compute_instance.\${role}_\${i+1}.network_interface.0.access_config.0.nat_ip\`;
    out += `output "${role}_${i+1}_ip" {
  description = "IP pública del servidor ${role} #${i+1}"
  value       = ${ip_value}
}

`;
  });
  out += `# Usa estos outputs para:
# 1. Configurar DOMAIN en .env
# 2. Correr: ssh -p 2222 deploy@<IP> 'cd /opt/proyecto && docker compose up -d'
`;
  return out;
}
function generateEnv(nodes, vpsConfig, cloudflareConfig) {
  var hasType = function(t){return nodes.some(function(n){return n.type===t;});};
  var getNode = function(t){return nodes.find(function(n){return n.type===t;});};
  var pgNode  = getNode('postgres');
  var stNode  = getNode('storage');
  var emNode  = getNode('email');
  var zone    = (cloudflareConfig && cloudflareConfig.zone) || 'tudominio.com';
  var out = `# .env.example — generado por InfraDraw
# 1. Copia: cp .env.example .env
# 2. Completa TODOS los valores marcados como REQUERIDO
# 3. NUNCA subas .env a git — ya está en .gitignore

# ── App ──────────────────────────────────────────────────
NODE_ENV=production
VERSION=latest
REGISTRY=ghcr.io/TU_USUARIO_GITHUB
DOMAIN=${zone}

`;
  if (hasType('traefik')) {
    out += `# ── Traefik ─────────────────────────────────────────────
# Generar con: htpasswd -nb admin tu_password
TRAEFIK_DASHBOARD_AUTH=    # REQUERIDO

`;
  }
  if (hasType('postgres')) {
    var pgHost = (pgNode && pgNode.config && pgNode.config.pgbouncer_enabled) ? 'pgbouncer:5433' : 'postgres:5432';
    out += `# ── PostgreSQL ──────────────────────────────────────────
DB_USER=appuser
DB_PASSWORD=               # REQUERIDO — generar: openssl rand -base64 32
DB_NAME=appdb
DATABASE_URL=postgresql://\${DB_USER}:\${DB_PASSWORD}@${pgHost}/\${DB_NAME}

`;
  }
  if (hasType('redis')) {
    out += `# ── Redis ───────────────────────────────────────────────
REDIS_PASSWORD=            # REQUERIDO — generar: openssl rand -base64 24
REDIS_URL=redis://:\${REDIS_PASSWORD}@redis:6379

`;
  }
  if (hasType('ai')) {
    out += `# ── AI Service ──────────────────────────────────────────
GEMINI_API_KEY=            # REQUERIDO — https://aistudio.google.com/apikey
# OPENAI_API_KEY=          # Alternativa a Gemini

`;
  }
  if (hasType('storage') && stNode) {
    var stProv   = (stNode.config && stNode.config.provider) || 'wasabi';
    var endpoint = getS3Endpoint(stProv);
    out += `# ── Object Storage (${stProv}) ──────────────────
S3_ACCESS_KEY=             # REQUERIDO — desde el panel del proveedor
S3_SECRET_KEY=             # REQUERIDO — desde el panel del proveedor
S3_BUCKET=${(stNode.config && stNode.config.bucket) || 'proyecto-backups'}
S3_ENDPOINT=${endpoint}
S3_REGION=${(stNode.config && stNode.config.region) || 'us-east-1'}

`;
  }
  if (hasType('email') && emNode) {
    var emProv = (emNode.config && emNode.config.provider) || 'resend';
    var emFrom = (emNode.config && emNode.config.from_domain) || 'noreply@tudominio.com';
    out += `# ── Email (${emProv}) ─────────────────────────────
EMAIL_PROVIDER=${emProv}
EMAIL_FROM=${emFrom}
${emProv === 'resend' ? 'RESEND_API_KEY=             # REQUERIDO — https://resend.com/api-keys' : 'EMAIL_API_KEY=              # REQUERIDO — desde el panel del proveedor'}

`;
  }
  if (hasType('meilisearch')) {
    out += `# ── Meilisearch ─────────────────────────────────────────
MEILI_MASTER_KEY=          # REQUERIDO — generar: openssl rand -base64 32

`;
  }
  if (hasType('grafana')) {
    out += `# ── Grafana ─────────────────────────────────────────────
GRAFANA_PASSWORD=          # REQUERIDO

`;
  }
  out += `# ── JWT ─────────────────────────────────────────────────
JWT_SECRET=                # REQUERIDO — generar: openssl rand -base64 64
`;
  if (hasType('devopsbot')) {
    var botNode = getNode('devopsbot');
    var token = (botNode && botNode.config && botNode.config.telegram_token) || 'TU_TOKEN';
    var chatId = (botNode && botNode.config && botNode.config.chat_id) || 'TU_CHAT_ID';
    out += `
# ── DevOps Bot ──────────────────────────────────────────
TELEGRAM_BOT_TOKEN=${token}
TELEGRAM_CHAT_ID=${chatId}
GEMINI_API_KEY=            # Añadir si se requieren sugerencias de IA
`;
  }
  return out;
}
function generateMakefile(scenario, vpsConfig) {
  var provider = (vpsConfig && vpsConfig.provider) || 'hetzner';
  var isManual = provider === 'contabo';
  var IP = '$$(cd terraform && terraform output -raw app_1_ip)';
  var L = [];
  L.push('.PHONY: provision setup deploy logs backup rollback status ssh-app');
  L.push('');
  L.push('# ── Provisioning ─────────────────────────────────────────');
  if (isManual) {
    L.push('provision:');
    L.push('\t@echo "⚠️  ' + provider + ' requiere provisioning manual"');
    L.push('\t@echo "Ver PROVISION_MANUAL.md para los pasos"');
  } else {
    L.push('provision:');
    L.push('\tcd terraform && terraform init && terraform apply');
  }
  L.push('');
  L.push('# ── Setup del servidor ───────────────────────────────────');
  L.push('setup:');
  L.push('\tssh -p 2222 root@' + IP + " 'bash -s' < scripts/setup.sh");
  L.push('');
  L.push('# ── Deploy ───────────────────────────────────────────────');
  L.push('deploy:');
  if (scenario === 3) {
    L.push('\tssh -p 2222 deploy@' + IP + " 'cd /opt/proyecto && docker stack deploy -c docker-compose.yml proyecto'");
  } else {
    L.push('\tssh -p 2222 deploy@' + IP + " 'cd /opt/proyecto && docker compose up -d'");
  }
  L.push('');
  L.push('# ── Operaciones ──────────────────────────────────────────');
  L.push('logs:');
  L.push('\tssh -p 2222 deploy@' + IP + " 'cd /opt/proyecto && docker compose logs -f --tail=50'");
  L.push('');
  L.push('status:');
  L.push('\tssh -p 2222 deploy@' + IP + " 'cd /opt/proyecto && docker compose ps && docker stats --no-stream'");
  L.push('');
  L.push('backup:');
  L.push('\tssh -p 2222 deploy@' + IP + " 'cd /opt/proyecto && bash scripts/backup.sh'");
  L.push('');
  L.push('rollback:');
  L.push('\tssh -p 2222 deploy@' + IP + " 'cd /opt/proyecto && docker compose pull && docker compose up -d'");
  L.push('');
  L.push('# ── SSH shortcuts ─────────────────────────────────────────');
  L.push('ssh-app:');
  L.push('\tssh -p 2222 deploy@' + IP);
  return L.join('\n') + '\n';
}
function generateBackup(nodes, vpsConfig) {
  var stNode   = nodes.find(function(n){return n.type==='storage';});
  var provider = (stNode && stNode.config && stNode.config.provider) || 'wasabi';
  var endpoint = getS3Endpoint(provider);
  return `#!/usr/bin/env bash
# backup.sh — generado por InfraDraw
# Backup automático de PostgreSQL → Object Storage (S3-compatible)
# Proveedor de storage detectado: ${provider}
set -euo pipefail

# ── Configuración ────────────────────────────────────────
PROJECT_DIR="/opt/proyecto"
BACKUP_DIR="\${PROJECT_DIR}/backups"
LOG_FILE="/var/log/backup.log"
RETENTION_LOCAL_DAYS=2
RETENTION_REMOTE_DAYS=30
S3_PREFIX="postgres"
S3_ENDPOINT_DEFAULT="${endpoint}"
CRON_SCHEDULE="0 3 * * *"

# ── Logging ──────────────────────────────────────────────
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "\$LOG_FILE"; }

mkdir -p "\$BACKUP_DIR"
touch "\$LOG_FILE"

command -v docker >/dev/null || { log "ERROR: docker no disponible"; exit 1; }
command -v aws    >/dev/null || { log "ERROR: aws-cli no instalado (apt install awscli)"; exit 1; }

# ── Cargar variables de entorno ──────────────────────────
if [ -f "\${PROJECT_DIR}/.env" ]; then
  set -a; . "\${PROJECT_DIR}/.env"; set +a
fi
DB_USER="\${DB_USER:-appuser}"
DB_NAME="\${DB_NAME:-appdb}"
S3_BUCKET="\${S3_BUCKET:?S3_BUCKET no definido en .env}"
S3_ENDPOINT="\${S3_ENDPOINT:-\$S3_ENDPOINT_DEFAULT}"
S3_REGION="\${S3_REGION:-us-east-1}"

TS="$(date '+%Y%m%d_%H%M%S')"
DUMP_FILE="\${BACKUP_DIR}/\${DB_NAME}_\${TS}.dump"

log "──────── Inicio de backup ────────"

# ── 1. Dump de PostgreSQL (formato custom, compress=9) ───
log "pg_dump de '\$DB_NAME' (formato custom, compress=9)"
docker exec postgres pg_dump -U "\$DB_USER" -d "\$DB_NAME" -Fc -Z 9 > "\$DUMP_FILE"
log "Dump completado ($(du -h "\$DUMP_FILE" | cut -f1))"

# ── 2. Subida a Object Storage ───────────────────────────
log "Subiendo a s3://\${S3_BUCKET}/\${S3_PREFIX}/"
aws s3 cp "\$DUMP_FILE" "s3://\${S3_BUCKET}/\${S3_PREFIX}/$(basename "\$DUMP_FILE")" \\
  --endpoint-url "\$S3_ENDPOINT" --region "\$S3_REGION"
log "Subida completada"

# ── 3. Limpieza local (> RETENTION_LOCAL_DAYS días) ──────
log "Limpiando backups locales > \${RETENTION_LOCAL_DAYS}d"
find "\$BACKUP_DIR" -maxdepth 1 -name '*.dump' -type f -mtime +\$RETENTION_LOCAL_DAYS -print -delete \\
  | while read -r f; do log "  borrado local: \$f"; done

# ── 4. Limpieza remota (> RETENTION_REMOTE_DAYS días) ────
log "Limpiando backups remotos > \${RETENTION_REMOTE_DAYS}d"
CUTOFF="$(date -d "-\${RETENTION_REMOTE_DAYS} days" '+%s')"
aws s3api list-objects-v2 --bucket "\$S3_BUCKET" --prefix "\${S3_PREFIX}/" \\
  --endpoint-url "\$S3_ENDPOINT" --region "\$S3_REGION" \\
  --query 'Contents[].[Key,LastModified]' --output text 2>/dev/null \\
  | while read -r KEY LASTMOD; do
      [ -z "\$KEY" ] && continue
      [ "\$KEY" = "None" ] && continue
      OBJ_TS="$(date -d "\$LASTMOD" '+%s' 2>/dev/null || echo 0)"
      if [ "\$OBJ_TS" -gt 0 ] && [ "\$OBJ_TS" -lt "\$CUTOFF" ]; then
        aws s3 rm "s3://\${S3_BUCKET}/\$KEY" --endpoint-url "\$S3_ENDPOINT" --region "\$S3_REGION"
        log "  borrado remoto: \$KEY"
      fi
    done

log "──────── Backup finalizado ✓ ────────"

# ── 5. Auto-registro en crontab (idempotente) ────────────
CRON_LINE="\${CRON_SCHEDULE} cd \${PROJECT_DIR} && bash scripts/backup.sh >> \${LOG_FILE} 2>&1"
if ! crontab -l 2>/dev/null | grep -Fq "scripts/backup.sh"; then
  ( crontab -l 2>/dev/null; echo "\$CRON_LINE" ) | crontab -
  log "Cron instalado: \$CRON_LINE"
fi
`;
}
function generateRestore(nodes, vpsConfig) {
  var stNode   = nodes.find(function(n){return n.type==='storage';});
  var provider = (stNode && stNode.config && stNode.config.provider) || 'wasabi';
  var endpoint = getS3Endpoint(provider);
  return `#!/usr/bin/env bash
# restore.sh — generado por InfraDraw
# Restaura un backup de PostgreSQL desde Object Storage (o local).
# Uso: bash scripts/restore.sh <nombre_archivo>
set -euo pipefail

PROJECT_DIR="/opt/proyecto"
BACKUP_DIR="\${PROJECT_DIR}/backups"
LOG_FILE="/var/log/backup.log"
S3_PREFIX="postgres"
S3_ENDPOINT_DEFAULT="${endpoint}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "\$LOG_FILE"; }

mkdir -p "\$BACKUP_DIR"; touch "\$LOG_FILE"

command -v docker >/dev/null || { echo "ERROR: docker no disponible"; exit 1; }
command -v aws    >/dev/null || { echo "ERROR: aws-cli no instalado"; exit 1; }

# ── Cargar variables de entorno ──────────────────────────
if [ -f "\${PROJECT_DIR}/.env" ]; then
  set -a; . "\${PROJECT_DIR}/.env"; set +a
fi
DB_USER="\${DB_USER:-appuser}"
DB_NAME="\${DB_NAME:-appdb}"
S3_BUCKET="\${S3_BUCKET:?S3_BUCKET no definido en .env}"
S3_ENDPOINT="\${S3_ENDPOINT:-\$S3_ENDPOINT_DEFAULT}"
S3_REGION="\${S3_REGION:-us-east-1}"

# ── Sin argumento: listar backups disponibles ────────────
if [ \$# -lt 1 ]; then
  echo "Uso: bash scripts/restore.sh <nombre_archivo>"
  echo ""
  echo "Backups remotos en s3://\${S3_BUCKET}/\${S3_PREFIX}/:"
  aws s3 ls "s3://\${S3_BUCKET}/\${S3_PREFIX}/" --endpoint-url "\$S3_ENDPOINT" --region "\$S3_REGION" | sort || true
  exit 1
fi

FILE="$(basename "\$1")"
DUMP_PATH="\${BACKUP_DIR}/\${FILE}"

# ── Descargar desde S3 si no existe en local ─────────────
if [ ! -f "\$DUMP_PATH" ]; then
  log "Descargando \$FILE desde s3://\${S3_BUCKET}/\${S3_PREFIX}/"
  aws s3 cp "s3://\${S3_BUCKET}/\${S3_PREFIX}/\${FILE}" "\$DUMP_PATH" \\
    --endpoint-url "\$S3_ENDPOINT" --region "\$S3_REGION"
fi
[ -f "\$DUMP_PATH" ] || { echo "ERROR: no se encontró el backup '\$FILE'"; exit 1; }

# ── Confirmación explícita (restore DESTRUCTIVO) ─────────
echo ""
echo "⚠️  ADVERTENCIA — RESTORE DESTRUCTIVO"
echo "Se SOBREESCRIBIRÁ la base de datos '\$DB_NAME' con el contenido de:"
echo "    \$DUMP_PATH ($(du -h "\$DUMP_PATH" 2>/dev/null | cut -f1))"
echo "Todos los datos actuales de '\$DB_NAME' se PERDERÁN de forma irreversible."
echo ""
read -r -p "Escribe el nombre de la base ('\$DB_NAME') para confirmar: " CONFIRM
if [ "\$CONFIRM" != "\$DB_NAME" ]; then
  echo "Confirmación incorrecta. Restore CANCELADO."
  exit 1
fi

log "──────── Inicio de restore desde \$FILE ────────"
docker exec -i postgres pg_restore -U "\$DB_USER" -d "\$DB_NAME" \\
  --clean --if-exists --no-owner < "\$DUMP_PATH"
log "──────── Restore finalizado ✓ ────────"
echo "✅ Base de datos '\$DB_NAME' restaurada desde \$FILE"
`;
}
function generateReadme(nodes, scenario, vpsConfig, cloudflareConfig) {
  var provider = (vpsConfig && vpsConfig.provider) || 'hetzner';
  var plan     = (vpsConfig && vpsConfig.plan) || 'cx31';
  var isManual = provider === 'contabo';
  var zone     = (cloudflareConfig && cloudflareConfig.zone) || 'tudominio.com';
  var hasType  = function(t){return nodes.some(function(n){return n.type===t;});};
  var scenarioName = scenario === 1 ? 'Single Node' : scenario === 2 ? 'Multi Node (App + DB separado)' : 'Multi Node HA';
  return `# Infraestructura — generada por InfraDraw

**Escenario:** ${scenarioName}
**Proveedor:** ${provider} | **Plan:** ${plan}
**Dominio:** ${zone}

---

## Prerrequisitos

| Herramienta | Versión mínima | Instalar |
|---|---|---|
| Terraform | >= 1.5 | https://terraform.io/downloads |
| Docker | >= 24.0 | https://get.docker.com |
| Make | cualquiera | \`apt install make\` |
| jq | cualquiera | \`apt install jq\` |

---

## Orden de deploy

\`\`\`bash
# 1. Configurar variables
cp .env.example .env
# Editar .env y completar TODOS los valores REQUERIDO

# 2. Configurar Terraform
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
# Editar terraform.tfvars con tus tokens

${isManual ? `# 3. Crear el servidor manualmente (ver PROVISION_MANUAL.md)
# Una vez creado, copiar la IP en terraform.tfvars

# 4. Setup del servidor
make setup` : `# 3. Crear la infraestructura
make provision
# Nota: guarda las IPs del output para el siguiente paso

# 4. Setup del servidor
make setup`}

# 5. Copiar archivos al servidor
rsync -avz --exclude='.git' --exclude='node_modules' \\
  -e 'ssh -p 2222' . deploy@<IP>:/opt/proyecto/

# 6. Deploy
make deploy

# 7. Verificar
curl https://${zone}/health
\`\`\`

---

## Variables de entorno — dónde obtener cada valor

| Variable | Cómo obtenerla |
|---|---|
${hasType('traefik') ? `| TRAEFIK_DASHBOARD_AUTH | \`htpasswd -nb admin tu_password\` |
` : ''}${hasType('postgres') ? `| DB_PASSWORD | \`openssl rand -base64 32\` |
` : ''}${hasType('redis') ? `| REDIS_PASSWORD | \`openssl rand -base64 24\` |
` : ''}| JWT_SECRET | \`openssl rand -base64 64\` |
${provider === 'hetzner' ? `| HCLOUD_TOKEN | https://console.hetzner.cloud → Security → API Tokens |
` : ''}${provider === 'digitalocean' ? `| DO_TOKEN | https://cloud.digitalocean.com/account/api/tokens |
` : ''}| CLOUDFLARE_API_TOKEN | https://dash.cloudflare.com/profile/api-tokens |
| CLOUDFLARE_ZONE_ID | Cloudflare Dashboard → tu dominio → Overview (sidebar) |
${hasType('ai') ? `| GEMINI_API_KEY | https://aistudio.google.com/apikey |
` : ''}${hasType('storage') ? `| S3_ACCESS_KEY / S3_SECRET_KEY | Panel del proveedor de storage |
` : ''}${hasType('email') ? `| RESEND_API_KEY | https://resend.com/api-keys |
` : ''}

---

## Operaciones comunes

\`\`\`bash
make logs      # Ver logs en tiempo real
make status    # Estado de contenedores + recursos
make backup    # Backup manual de PostgreSQL
make rollback  # Volver a la versión anterior
make ssh-app   # SSH directo al servidor
\`\`\`
${hasType('postgres') ? `
---

## Backups

Backup automático de PostgreSQL hacia Object Storage (S3-compatible),
programado vía cron a las **3:00 AM diario** (\`scripts/backup.sh\` se
auto-registra en el crontab la primera vez que se ejecuta).

**Dónde se guardan:**
- Remoto: \`s3://$S3_BUCKET/postgres/\` — retención **30 días**
- Local: \`/opt/proyecto/backups/\` — retención **2 días**
- Logs: \`/var/log/backup.log\`

**Backup manual:**
\`\`\`bash
make backup
# o, dentro del servidor:
cd /opt/proyecto && bash scripts/backup.sh
\`\`\`

**Restaurar un backup:**
\`\`\`bash
# Sin argumentos: lista los backups remotos disponibles
bash scripts/restore.sh

# Restaura uno concreto (descarga de S3 si no está en local):
bash scripts/restore.sh appdb_20260607_030000.dump
\`\`\`
El restore es **destructivo**: sobreescribe la base de datos actual. El script
exige escribir el nombre de la base de datos para confirmar antes de continuar.

**Verificar el último backup:**
\`\`\`bash
# Último objeto remoto y su tamaño:
aws s3 ls s3://$S3_BUCKET/postgres/ --endpoint-url $S3_ENDPOINT --recursive | sort | tail -n1

# En el servidor, tamaño de los dumps locales y log reciente:
make ssh-app
ls -lh /opt/proyecto/backups/   # un dump válido pesa >> 1 KB; ~0 indica fallo
tail -n 20 /var/log/backup.log
\`\`\`
` : ''}
---

## Troubleshooting

**SSL no renueva:**
Cloudflare debe estar en modo DNS-only (gris) durante la primera renovación ACME.
\`docker compose logs traefik | grep acme\`

**Contenedor en restart loop:**
\`docker compose logs --tail=50 <servicio>\`
\`dmesg | grep -i oom\` — verificar si es OOM Kill

**PostgreSQL sin conexiones disponibles:**
\`docker exec postgres psql -U $DB_USER -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"\`
Solución inmediata: reiniciar backend. Solución permanente: habilitar PgBouncer.

**Deploy falla en CI/CD:**
Verificar que \`REGISTRY\`, \`HCLOUD_TOKEN\` y \`SSH_PRIVATE_KEY\` están en GitHub Secrets.
`;
}


export { detectScenario, getPlanRAM, getPlanCost, getS3Endpoint, generatePostgresConf, generateRedisConf, generateTraefikYml, generateMiddlewaresYml, generateCompose, generateSetup, generateManualProvision, generateTerraform, generateTerraformVars, generateTerraformOutputs, generateEnv, generateMakefile, generateBackup, generateRestore, generateReadme };