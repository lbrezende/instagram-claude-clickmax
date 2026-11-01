#!/usr/bin/env node
// Kit Instagram + Claude + Clickmax. Sem dependências: só Node 20 ou mais novo.
// Tudo que muda alguma coisa roda em modo seco, a menos que você passe --confirmo.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://api.postforme.dev';
const PASTA_ESTADO = process.env.KIT_ESTADO || path.join(RAIZ, 'estado');

const AJUDA = `Kit Instagram + Claude + Clickmax

  npm run kit -- <comando>

Ligar a conta
  conectar                      gera o link de login oficial do Instagram
  contas                        lista as contas conectadas e seus ids (spc_...)

Agendar (sem --confirmo, só mostra o que faria)
  reel <id> <video.mp4> <legenda.txt> [--quando ISO] [--trial manual|performance] [--confirmo]
  carrossel <id> <legenda.txt> <quando ISO> <arq1> <arq2> ... [--confirmo]

Acompanhar
  status <id>                   diz se o post saiu e grava o id e o link dele
  metricas [--limite 25]        lista os posts da conta com os números que a API devolver

Id é um nome seu para o post, por exemplo reel-agenda-01.
Horário sempre com fuso: 2026-11-20T09:00:00-03:00
Chave e conta ficam no .env. Copie o .env.example.`;

function carregarEnv() {
  const arq = path.join(RAIZ, '.env');
  if (!fs.existsSync(arq)) return;
  for (const linha of fs.readFileSync(arq, 'utf8').split('\n')) {
    const m = linha.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[2] && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

function sair(msg, codigo = 1) {
  console.error(msg);
  process.exit(codigo);
}

function exigir(nome) {
  const v = process.env[nome];
  if (!v) sair(`Falta ${nome} no .env. Copie o .env.example e preencha. Veja o passo a passo no README.`);
  return v;
}

export function separarArgs(argv) {
  const pos = [], flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { pos.push(a); continue; }
    const nome = a.slice(2);
    if (nome === 'confirmo') flags.confirmo = true;
    else flags[nome] = argv[++i];
  }
  return {pos, flags};
}

export function validarQuando(q) {
  if (!q) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})$/.test(q)) sair(`Horário sem fuso: ${q}. Use algo como 2026-11-20T09:00:00-03:00`);
  if (new Date(q).getTime() < Date.now()) sair(`Esse horário já passou: ${q}`);
  return q;
}

export function tipoDoArquivo(f) {
  const ext = path.extname(f).toLowerCase();
  const tipos = {'.mp4': 'video/mp4', '.mov': 'video/quicktime', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png'};
  if (!tipos[ext]) sair(`Formato não aceito pelo kit: ${f}`);
  return tipos[ext];
}

async function api(metodo, rota, corpo, tentativa = 0) {
  const r = await fetch(BASE + rota, {
    method: metodo,
    headers: {authorization: 'Bearer ' + exigir('POSTFORME_API_KEY'), ...(corpo ? {'content-type': 'application/json'} : {})},
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (r.status === 429 && tentativa < 6) {
    await new Promise(ok => setTimeout(ok, 15000 * (tentativa + 1)));
    return api(metodo, rota, corpo, tentativa + 1);
  }
  if (!r.ok) sair(`Post for Me ${metodo} ${rota}: HTTP ${r.status} ${JSON.stringify(j).slice(0, 300)}`, 2);
  return j;
}

async function subir(arquivo) {
  const {upload_url, media_url} = await api('POST', '/v1/media/create-upload-url');
  const put = await fetch(upload_url, {method: 'PUT', headers: {'content-type': tipoDoArquivo(arquivo)}, body: fs.readFileSync(arquivo)});
  if (!put.ok) sair(`Upload falhou: ${arquivo} (HTTP ${put.status})`, 2);
  return media_url;
}

function estadoDe(id) {
  const arq = path.join(PASTA_ESTADO, id + '.json');
  return fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : {id, historico: []};
}

function gravarEstado(est) {
  fs.mkdirSync(PASTA_ESTADO, {recursive: true});
  fs.writeFileSync(path.join(PASTA_ESTADO, est.id + '.json'), JSON.stringify(est, null, 1));
}

function conferirArquivos(lista) {
  for (const f of lista) if (!fs.existsSync(f)) sair(`Arquivo não encontrado: ${f}`);
}

async function conectar() {
  const corpo = {platform: 'instagram', permissions: ['posts', 'feeds'], platform_data: {instagram: {connection_type: 'instagram'}}};
  const {url} = await api('POST', '/v1/social-accounts/auth-url', corpo);
  console.log('Abra este link, entre na tela do próprio Instagram e autorize:\n\n' + url + '\n\nDepois rode: npm run kit -- contas');
}

async function contas() {
  const {data = []} = await api('GET', '/v1/social-accounts');
  if (!data.length) return console.log('Nenhuma conta conectada. Rode: npm run kit -- conectar');
  for (const c of data) console.log(`${c.id}  ${c.platform}  ${c.username || ''}  ${c.status || ''}`);
}

async function reel({pos, flags}) {
  const [id, video, arqLegenda] = pos;
  if (!id || !video || !arqLegenda) sair('Uso: reel <id> <video.mp4> <legenda.txt> [--quando ISO] [--trial manual|performance] [--confirmo]');
  conferirArquivos([video, arqLegenda]);
  const quando = validarQuando(flags.quando);
  const trial = flags.trial;
  if (trial && !['manual', 'performance'].includes(trial)) sair('--trial aceita manual ou performance');
  const legenda = fs.readFileSync(arqLegenda, 'utf8').trim();
  const est = estadoDe(id);
  if (est.post_id) sair(`Esse id já foi enviado: ${est.post_id}`);
  const configuration = {placement: 'reels', ...(trial ? {trial_reel_type: trial} : {})};
  if (!flags.confirmo) return console.log('MODO SECO, nada foi enviado. Com --confirmo:', JSON.stringify({id, video, quando: quando || 'agora', configuration, legenda_chars: legenda.length}, null, 1));
  const conta = exigir('POSTFORME_ACCOUNT_ID');
  const media_url = await subir(video);
  const post = await api('POST', '/v1/social-posts', {
    caption: legenda, social_accounts: [conta], media: [{url: media_url}], external_id: id,
    ...(quando ? {scheduled_at: quando} : {}),
    account_configurations: [{social_account_id: conta, configuration}],
  });
  Object.assign(est, {post_id: post.id, agendado_para: quando, formato: 'reel', trial: trial || null});
  est.historico.push({em: new Date().toISOString(), evento: 'enviado', status: post.status});
  gravarEstado(est);
  console.log(`Enviado: ${post.id}. Acompanhe: npm run kit -- status ${id}`);
}

async function carrossel({pos, flags}) {
  const [id, arqLegenda, quandoBruto, ...midias] = pos;
  if (!id || !arqLegenda || !quandoBruto || !midias.length) sair('Uso: carrossel <id> <legenda.txt> <quando ISO> <arq1> <arq2> ... [--confirmo]');
  if (midias.length < 2 || midias.length > 20) sair('Carrossel aqui aceita de 2 a 20 itens.');
  conferirArquivos([arqLegenda, ...midias]);
  midias.forEach(tipoDoArquivo);
  const quando = validarQuando(quandoBruto);
  const legenda = fs.readFileSync(arqLegenda, 'utf8').trim();
  const est = estadoDe(id);
  if (est.post_id) sair(`Esse id já foi enviado: ${est.post_id}`);
  if (!flags.confirmo) return console.log('MODO SECO, nada foi enviado. Com --confirmo:', JSON.stringify({id, quando, itens: midias.length, legenda_chars: legenda.length}, null, 1));
  const conta = exigir('POSTFORME_ACCOUNT_ID');
  const urls = [];
  for (const f of midias) urls.push(await subir(f));
  const post = await api('POST', '/v1/social-posts', {caption: legenda, social_accounts: [conta], media: urls.map(url => ({url})), scheduled_at: quando, external_id: id});
  Object.assign(est, {post_id: post.id, agendado_para: quando, formato: 'carrossel'});
  est.historico.push({em: new Date().toISOString(), evento: 'enviado', status: post.status});
  gravarEstado(est);
  console.log(`Enviado: ${post.id}, ${urls.length} itens. Acompanhe: npm run kit -- status ${id}`);
}

async function status({pos}) {
  const [id] = pos;
  if (!id) sair('Uso: status <id>');
  const est = estadoDe(id);
  if (!est.post_id) sair(`Não achei envio para ${id}. Ele já foi mandado com --confirmo?`);
  const {data = []} = await api('GET', '/v1/social-post-results?post_id=' + encodeURIComponent(est.post_id));
  const r = data[0];
  if (!r) return console.log('Ainda sem resultado: agendado ou processando.');
  if (!r.success) sair('O Instagram recusou: ' + JSON.stringify(r.error), 2);
  est.media_id = r.platform_data?.id;
  est.link = r.platform_data?.url;
  est.historico.push({em: new Date().toISOString(), evento: 'no_ar'});
  gravarEstado(est);
  console.log(`No ar: ${est.link}\nmediaId para a automação: ${est.media_id}`);
}

async function metricas({flags}) {
  const conta = exigir('POSTFORME_ACCOUNT_ID');
  const limite = Number(flags.limite || 25);
  const {data = []} = await api('GET', `/v1/social-account-feeds/${conta}?expand=metrics&limit=${limite}`);
  let comNumero = 0;
  for (const p of data) {
    const m = p.metrics || {};
    if (Object.keys(m).length) comNumero++;
    console.log(JSON.stringify({quando: p.posted_at, link: p.platform_url, views: m.views, alcance: m.reach, seguidores: m.follows, salvos: m.saved, compart: m.shares}));
  }
  if (data.length && !comNumero) console.log('\nA API devolveu os posts sem nenhum número. Reconecte a conta pedindo a permissão feeds (o comando conectar já pede) e teste de novo. Enquanto isso, use instagram_posts_list no Clickmax.');
}

const COMANDOS = {conectar, contas, reel, carrossel, status, metricas};

async function principal() {
  carregarEnv();
  const [cmd, ...resto] = process.argv.slice(2);
  if (!cmd || ['ajuda', '--help', '-h'].includes(cmd)) return console.log(AJUDA);
  if (!COMANDOS[cmd]) sair(`Comando desconhecido: ${cmd}\n\n${AJUDA}`);
  await COMANDOS[cmd](separarArgs(resto));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await principal();
