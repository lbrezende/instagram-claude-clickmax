# Criar a automação comentário → DM no Clickmax

Cole no Claude com o MCP do Clickmax conectado. Troque o que está entre colchetes.

```text
Use a skill clickmax-flows. Workspace: [nome do seu workspace].

Crie um fluxo em RASCUNHO. Não ative.

Nome: [peça] · palavra [PALAVRA]
Gatilho: hermes.instagram.comment.received.v1, com estes filtros:
- businessId EQ, valor da minha conta conectada. Se não souber, ache em channel_instances_list ou copie de um fluxo que eu já tenho.
- commentText CONTAINS, valueJson com a palavra em minúsculas, com e sem acento: ["[palavra]"]
- Não use WORD_MATCH. Esse gatilho não dispara com ele.

Passos, nesta ordem:
1. send_message tipo instagram com este texto: [mensagem da DM, com o link]
2. instagram_comment_reply público, alternando estas respostas: "Te mandei no direct!", "Foi pro seu direct", "Chegou aí, confere o direct"
3. delay com when: 12 (são horas)
4. pela saída continue do delay, send_message tipo instagram: [DM pedindo para seguir o perfil]

Depois rode flows_validate, resolva os erros e me mostre o fluxo.
Me diga o id do fluxo. Deixe em rascunho.
```

**Link na DM:** use `{{instagram}}` no link, assim: `https://seusite.com/artigo?ig={{instagram}}&utm_source=instagram&utm_medium=dm&utm_campaign=[peça]`. Confira no próprio teste se o @ apareceu no lugar da variável.
