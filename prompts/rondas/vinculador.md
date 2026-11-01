Ronda do vinculador. Rode a cada 10 minutos.

Leia estado/vinculos.json: cada peça tem o id do fluxo e a palavra. Para cada peça com fluxo ainda não vinculado:
1. Veja se o post já saiu (npm run kit -- status <id>, ou instagram_posts_list).
2. Se saiu, acrescente o mediaId ao gatilho, com commentText em CONTAINS, e ative o fluxo, se esta peça estiver marcada como aprovada para ativar.
3. Grave no estado que foi vinculado, com a hora.
4. Se o post saiu e algo falhou, me avise na hora.
Nunca publique nada nesta ronda. Se nada mudou, termine sem me avisar.
