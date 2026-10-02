# ChipSplit online — plano técnico

Como ligar contas, amigos e sincronização quando o app virar Flutter.
Hoje tudo roda **local** (modo convidado). Este é o caminho para a versão online, sem perder o que já existe.

## Peças

| Peça | Serviço | Para quê |
|---|---|---|
| Login | **Firebase Authentication** (Google; depois Apple, obrigatório na App Store quando há login social) | Conta com 1 toque |
| Banco | **Cloud Firestore** | Perfis, amigos, jogos |
| Fotos | **Firebase Storage** | Foto de perfil (256 px, como já fazemos) |
| Anúncios | **Google AdMob** + UMP (consentimento LGPD/GDPR) | Versão grátis |
| Assinatura | **Google Play Billing / StoreKit** (ou RevenueCat para unificar) | ChipSplit Pro |
| Erros | **Firebase Crashlytics** | Relatórios de falha |

## Modelo de dados (Firestore)

```
users/{uid}
  name, handle, photoUrl, currency, lang, createdAt, pro: { active, until }

handles/{handle}            → { uid }          // garante @ único
friendships/{uidA_uidB}     → { users: [uidA, uidB], status: 'pending'|'accepted', requestedBy, createdAt }

games/{gameId}
  ownerUid, members: [uid...], title, createdAt, config { currency, buyIn, bigBlind, smallBlind, chips[] }
  events/{seq}              → { type, at, playerId, name, amount, chips, final, initial }
```

Os **eventos já são o formato atual** (`session-core.js`): cada ação vira um documento em `games/{id}/events`. O estado (quem colocou quanto, banco, divisão) continua sendo recalculado pelo `derive()`, igual hoje. Isso deixa o modo online simples e à prova de conflito: dois celulares só acrescentam eventos.

## Regras de segurança (resumo)

- `users/{uid}`: só o dono escreve; amigos aceitos leem nome, @ e foto.
- `handles/{handle}`: criação só se não existir (transação).
- `games/{id}`: só `members` leem; só o dono e membros acrescentam eventos; eventos não podem ser editados, só acrescentados (o "desfazer" vira um evento `undo`).

## Fluxo de amigos

1. Busca por `@handle` → `handles/{handle}` → `uid`.
2. Cria `friendships/{a_b}` com `pending`.
3. O outro aceita → `accepted`.
4. Na partida, "Jogador entra" mostra os amigos para escolher (nome e foto vêm do perfil).

## Migração do modo convidado

No primeiro login: perguntar "Enviar seus jogos deste aparelho para a conta?". Se sim, cada jogo local vira `games/{id}` com os mesmos eventos. O backup `.json` atual já tem esse formato.

## Ordem sugerida

1. Portar `chipsplit-core.js` e `session-core.js` para Dart, com os mesmos 45 testes.
2. Telas em Flutter, modo convidado com armazenamento local.
3. AdMob + consentimento, depois a assinatura Pro.
4. Login Google + perfil na nuvem + migração.
5. Amigos e jogos compartilhados.
6. Publicar a Política de Privacidade e os Termos (já em `privacidade.html` e `termos.html`) num endereço público e linkar na Play Store e na App Store.
