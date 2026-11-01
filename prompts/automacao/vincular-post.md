# Vincular o fluxo ao post e ativar

Só depois que o post está no ar. Antes disso ele não tem `mediaId`.

```text
Use a skill clickmax-flows. O post [link do post] saiu.

1. Ache o mediaId com instagram_posts_list. Se o post existir em duas versões (Reel de teste e Reel principal), pegue os dois.
2. No fluxo [id], acrescente ao gatilho: mediaId IN com esses ids. Se já houver id ali, acrescente; nunca troque.
3. Se o fluxo estiver ativo, pause com flows_close antes de editar, e use flows_graph_apply com setTriggers.
4. Confirme que commentText está em CONTAINS.
5. Rode flows_validate.
6. Me mostre o gatilho final e peça meu OK para ativar. Com o OK, rode flows_activate.
```

**Por que prender ao post:** palavra comum (VALOR, DINHEIRO) em fluxo sem `mediaId` responde comentário de qualquer post seu.
