import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const KIT = path.resolve('scripts/kit.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-'));
const rodar = (...a) => spawnSync('node', [KIT, ...a], {encoding: 'utf8', env: {PATH: process.env.PATH, KIT_ESTADO: path.join(tmp, 'estado')}});
const video = path.join(tmp, 'v.mp4'), img = path.join(tmp, 'a.jpg'), leg = path.join(tmp, 'l.txt');
fs.writeFileSync(video, 'x'); fs.writeFileSync(img, 'x'); fs.writeFileSync(leg, 'Legenda de teste');

test('ajuda roda sem chave', () => {
  const r = rodar('ajuda');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /conectar/);
});

test('reel em modo seco não precisa de chave e não envia', () => {
  const r = rodar('reel', 'teste', video, leg, '--quando', '2099-01-01T09:00:00-03:00', '--trial', 'manual');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /MODO SECO/);
  assert.equal(fs.existsSync(path.join(tmp, 'estado', 'teste.json')), false);
});

test('carrossel em modo seco', () => {
  const r = rodar('carrossel', 'teste2', leg, '2099-01-01T09:00:00-03:00', img, img);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /MODO SECO/);
});

test('horário sem fuso é recusado', () => {
  const r = rodar('carrossel', 'teste3', leg, '2099-01-01 09:00', img, img);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /fuso/);
});

test('sem chave o envio para com mensagem clara', () => {
  const r = rodar('reel', 'teste4', video, leg, '--confirmo');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /POSTFORME/);
});
