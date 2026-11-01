# Instagram + Claude + Clickmax

Kit para ligar o seu Instagram ao Claude sem entregar a senha. Dá para pedir um post, aprovar pelo celular, agendar e mandar DM para quem comentar uma palavra.

Quem escreveu foi o Leandro Rezende, depois de montar isso para os próprios perfis. Licença MIT.

## O que tem aqui

| Pasta | O que faz |
|---|---|
| `scripts/kit.mjs` | Conecta, agenda Reel e carrossel, consulta status e métricas pelo Post for Me |
| `prompts/automacao/` | Prompts para criar, vincular e conferir a automação no Clickmax |
| `prompts/rondas/` | Tarefas recorrentes: vinculador, aprovação, trocar foto, gravações, conferência |
| `aprovacao/` | Molde da página de aprovação |
| `templates/` | Teleprompter e pedido de imagem por arquivo |
| `AGENTS.md`, `CLAUDE.md` | Regras que o agente segue neste projeto |

## Do que você precisa

- Instagram profissional (Business ou Criador). Conta pessoal não é aceita pelo Clickmax.
- [Node 20 ou mais novo](https://nodejs.org).
- Conta no [Post for Me](https://www.postforme.dev). Confira os planos no site.
- [Conta grátis no Clickmax, ou teste grátis de 14 dias](https://app.clickmax.io/signup?a=etMmF32vLD) (link de afiliado do autor).
- Claude Code, ou outro cliente com MCP remoto.

## Passo a passo

### 1. Baixe o kit

```bash
git clone https://github.com/lbrezende/instagram-claude-clickmax.git
cd instagram-claude-clickmax
npm test
npm run kit -- ajuda
```

Não há nada para instalar. Os testes rodam sem chave.

### 2. Ligue o Instagram no Post for Me

```bash
cp .env.example .env
```

Cole a chave do Post for Me em `POSTFORME_API_KEY`. Depois:

```bash
npm run kit -- conectar
```

Abra o link. Você entra na tela do próprio Instagram e autoriza. Em seguida:

```bash
npm run kit -- contas
```

Copie o `spc_...` para `POSTFORME_ACCOUNT_ID` no `.env`.

### 3. Ligue o Instagram no Clickmax

No Clickmax: **Configurações → Conexões → Instagram → Conectar o Instagram**. Você autoriza numa janela da Meta.

### 4. Ligue o Claude no Clickmax

Este repositório já traz um `.mcp.json` com o endereço `https://mcp.clickmax.io/mcp`. No Claude Code, abra a pasta, rode `/mcp` e autorize no navegador. Depois instale as skills:

```bash
npx skills add https://docs.clickmax.io
```

Teste:

```text
Estou conectado ao Clickmax? Qual conta eu sou?
```

Guia oficial: [docs.clickmax.io/reference/api/mcp](https://docs.clickmax.io/reference/api/mcp.md).

### 5. Crie a automação em rascunho

Cole `prompts/automacao/criar-fluxo.md` no Claude.

### 6. Abra a página de aprovação

Para ver no computador:

```bash
npx serve aprovacao
```

Para usar no celular, peça ao Claude:

```text
Publique aprovacao/index.html como Artifact privado, com banco de dados para os posts e as decisões, no lugar do localStorage. Depois coloque meu primeiro post lá.
```

### 7. Agende

Sem `--confirmo`, nada é enviado:

```bash
npm run kit -- carrossel meu-post legenda.txt 2026-11-20T09:00:00-03:00 slide1.jpg slide2.jpg
```

Conferiu? Repita com `--confirmo`. Reel:

```bash
npm run kit -- reel meu-reel video.mp4 legenda.txt --quando 2026-11-20T09:00:00-03:00 --confirmo
```

Reel de teste, que aparece primeiro para quem não segue: acrescente `--trial manual`.

### 8. Quando sair, vincule e ative

```bash
npm run kit -- status meu-post
```

Pegue o `mediaId` e cole `prompts/automacao/vincular-post.md` no Claude.

### 9. Confira

Cole `prompts/automacao/conferir.md` depois do primeiro comentário.

### 10. Ligue as rondas

Veja `AGENTS.md`. Comece só com o vinculador e a conferência.

## O que dá errado

Tudo aqui aconteceu comigo, em outubro e novembro de 2026.

- **Fluxo ativo e mudo.** O filtro estava na opção `WORD_MATCH`, e com ela esse gatilho não dispara. Use `CONTAINS`, que quer dizer "contém".
- **Ronda lenta perde comentário.** O vinculador rodava de hora em hora, o post saiu e o primeiro comentário chegou antes do fluxo ativar. Baixei para 10 minutos.
- **Alguns comentários não chegam à automação, mesmo com tudo certo.** Por isso existe a conferência: comparar quem comentou com quem recebeu.
- **O Instagram pode recusar a DM** ("user not found"). Essa pessoa precisa de resposta manual.
- **Métricas vazias.** No meu perfil, a API de feed devolve os posts sem número. Desconfio que a conta foi conectada só com a permissão de postar, que é o padrão, mas ainda não reconectei para confirmar. O `conectar` deste kit já pede `feeds`. A documentação do Post for Me lista o campo `follows` por post, e eu ainda não vi esse dado chegar.
- **Dependência fora do seu controle.** Geração de imagem pode ficar sem crédito e sincronização de pasta pode parar. Deixe a página mostrar o que falta e não publique sem a arte.
- **Conexão cai.** Se a conexão com a Meta perder o acesso, o que chegar nesse intervalo não é reprocessado.

## O que este kit não faz

Não garante alcance, seguidores nem venda. A DM só sai para quem comentou. Respeite as regras do Instagram e da LGPD com os contatos que chegarem.

## Segurança

O `.env` e a pasta `estado/` ficam fora do Git. Se você fizer um fork público, rode uma varredura antes do primeiro push, com [gitleaks](https://github.com/gitleaks/gitleaks) por exemplo.
