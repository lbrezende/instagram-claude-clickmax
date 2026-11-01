# Conferir se quem comentou recebeu

Fluxo ativo e sem execução é problema. Rode isso depois do primeiro comentário e de novo no fim do dia.

```text
Use a skill clickmax-flows. Fluxo [id], palavra [PALAVRA], post [mediaId].

1. Liste os comentários reais: lead_activities_list com eventName hermes.instagram.comment.received.v1, filtrando pelo post.
2. Liste as execuções: flows_executions_list do fluxo.
3. Cruze os dois e me mostre: quantos comentaram a palavra, quantos têm execução, quantos não têm, e os erros agrupados.
4. Se alguém comentou e não recebeu, NÃO reenvie ainda. Me mostre a lista e espere meu OK.
5. Com o OK, mande uma única vez por pessoa com flows_test_run_start, usando o comentário real como payload. Se o Instagram recusar (por exemplo, user not found), me avise que essa pessoa precisa de resposta manual.

Não coloque nome de seguidor em arquivo nenhum do repositório.
```
