# ChipSplit — fichas e partida de poker (versão de teste v0.9)

Site em HTML + JavaScript puro, sem instalar nada. Serve para testar a lógica antes de virar app em Flutter.

## Como abrir

1. Descompacte a pasta `chipsplit` e abra no VS Code (**File › Open Folder**).
2. Abra o `index.html` no navegador:
   - dois cliques no arquivo, **ou**
   - extensão **Live Server** → botão direito no `index.html` → *Open with Live Server*.
3. Testes:
   - no terminal do VS Code: `node tests/run-tests.js` (Node 16+)
   - ou no navegador: abra `tests.html`.

> Os jogos ficam salvos no navegador. Se abrir por dois cliques e depois pelo Live Server, são "endereços" diferentes e cada um tem seu próprio histórico. Use sempre o mesmo jeito, ou passe os jogos com **Exportar/Importar backup**.

## Atualizar para uma versão nova

1. Baixe o **chipsplit.zip** novo do chat (vai para Downloads; pode ficar como `chipsplit (1).zip`, tudo bem).
2. Dê **dois cliques em `atualizar.bat`** dentro de `C:\dev\chipsplit` (pelo Explorador de Arquivos).
   - Se preferir o PowerShell, dentro da pasta digite `.\atualizar.bat` (com o `.\` na frente).

Ele pega o zip mais novo de Downloads, atualiza a pasta, roda os testes e abre o app. Seus jogos salvos não são afetados (ficam no navegador).

## Arquivos

| Arquivo | O que faz |
|---|---|
| `index.html` | Telas: Calcular, Jogo e Histórico |
| `styles.css` | Visual (tema escuro, funciona no celular) |
| `chipsplit-core.js` | **Algoritmo das fichas** (distribuição inicial e montar qualquer valor com o banco) |
| `session-core.js` | **Lógica da partida**: entradas, rebuys, saques, banco, divisão e log |
| `account.js` | Entrada sem conta (convidado), anúncios, Pro simulado |
| `i18n.js` | Todas as frases nos 4 idiomas (português, inglês, espanhol, chinês) |
| `ui-i18n.js` | Seletor de idioma e tradução da tela |
| `profile.js` | Tela de perfil: foto, nome, @, estatísticas, jogadores frequentes, preferências, dados |
| `privacidade.html` / `termos.html` / `legal.js` | Política de Privacidade e Termos de Uso (PT e EN) |
| `ONLINE.md` | Plano técnico para contas, amigos e sincronização (Firebase) |
| `fx.js` | Animações de confirmação (ondinha nos botões, fichas distribuídas, destaque nos cartões) |
| `config.js` | Liga/desliga anúncios, Pro e login (Firebase). `?dev=1` no endereço mostra anúncios e Pro simulados |
| `auth.js` | Login com Google e jogos na nuvem (Firebase), liga quando `config.js` tiver o projeto |
| `firestore.rules` | Regras de segurança do banco: cada pessoa só acessa os próprios dados |
| `sw.js` / `manifest.webmanifest` / `pwa.js` / `icons/` | App instalável e funcionando sem internet |
| `app.js` | Tela Calcular |
| `live.js` | Telas Jogo e Histórico, diálogos, animação, salvar e backup |
| `examples.js` | Cenários prontos (menu "Exemplos" e testes) |
| `tests/run-tests.js` | 38 testes (Node e navegador) |
| `tests.html` | Roda os testes no navegador |
| `atualizar.bat` | Atualiza a pasta com o zip mais novo de Downloads e roda os testes |

`chipsplit-core.js` e `session-core.js` não mexem na tela; são eles que você porta para Dart.

---

## O que está funcionando

### Animações de confirmação
- **Começar jogo:** mesa de poker com as fichas indo para cada jogador ("Distribuindo as fichas…").
- **Rebuy, jogador entra, saque, trocar nome, desfazer:** o cartão do jogador pisca em dourado.
- **Fixar/Soltar e + Adicionar ficha:** a linha da ficha pisca.
- **Salvar perfil e Copiar resumo:** o botão mostra ✓.
- **Todos os botões:** afundam e fazem uma ondinha ao tocar. Telas e janelas entram com transição suave.
- Quem ativa "reduzir movimento" no celular/PC vê tudo sem animação.

### 0. Idiomas e moedas
- **Português, English, Español e 中文** — seletor no topo e na tela de boas-vindas. Na primeira vez escolhe sozinho pelo idioma do navegador; depois fica salvo.
- Tudo é traduzido: telas, avisos do cálculo, registro da partida, resumo para copiar, datas e formato de dinheiro.
- Os nomes padrão das fichas (Branca/White/Blanca/白色…) mudam junto com o idioma; nomes que você digitou ficam como estão.
- Moedas: BRL, USD, EUR, GBP, CNY, MXN, ARS e JPY, com o nome no idioma escolhido. Na primeira vez a moeda segue o idioma (pt → R$, en → US$, es → €, zh → ¥); depois é escolha sua.

### 1. Calcular (aba Calcular)
- Jogadores, entrada por jogador, moeda.
- **Kit padrão: 30 fichas de cada cor** (Branca, Vermelha, Azul, Preta). "+ Adicionar ficha" também já vem com 30.
- **Big blind** digitado; vazio = sem blinds.
- **Small blind** liga e desliga. Ligado = metade do big e é o valor da menor ficha. Desligado = a menor ficha vale o big.
- Kit de fichas: cor, nome, quantidade e valor. Valor vazio = automático; valor digitado = fixo, com **prioridade**: o resto se recalcula em volta dele.
- Pote estimado com rebuys, avisos (stack curto, blind que não dá para pagar, conta que não fecha, falta de ficha).
- Botões **Fixar/Soltar** e o botão **Começar jogo com essa distribuição**.

### 2. Jogo ao vivo (aba Jogo)
- Cria **Jogador 1, 2, 3…** com a pilha inicial. Toque no nome para trocar.
- **Rebuy**: o app sugere as fichas para o valor usando **o que sobrou no banco**. Se faltar alguma cor, você ajusta com − / + (limitado ao banco) e ele mostra se fecha exato, falta ou passou.
- **Jogador entra no meio**: nome + valor (pode ser diferente da entrada), e o app calcula as fichas.
- **Sair / sacar** (tirar dinheiro): conta **por fichas** (as fichas voltam ao banco) ou **por valor**. Quem saiu pode **voltar ao jogo**.
- Painel **Fichas no banco**: quanto sobrou de cada cor (amarelo = acabando).
- Números ao vivo: duração, total que entrou, quanto está na mesa, quantos jogando.
- **Registro** com hora exata (hh:mm:ss) e tempo desde o início de cada evento.
- **Desfazer último** evento.

### 2b. Trocar nome durante o jogo
- Toque no nome, digite e confirme no botão **✓** que aparece ao lado (ou aperte Enter). Esc desfaz.
- Ao digitar, o app sugere nomes de quem já jogou com você.

### 3. Fim do jogo
- **Contagem final**: para cada um, conta por fichas (− / +) ou digita o valor. As **pilhas de fichas aparecem na frente do jogador**, ordenadas da menor para a maior, com a quantidade.
- Mostra se a contagem **bate** com o que está na mesa (ou quanto sobra/falta).
- **Resultado**: cartões por jogador com **animação das fichas caindo** e o valor subindo até o final, quanto colocou, com quanto saiu e o **+/−**.
- **Quem paga quem**, com o menor número de transferências, e a lista para quando uma pessoa (banca) guardou todo o dinheiro.
- **Copiar resumo** (texto pronto para mandar no grupo), **Baixar arquivo do jogo** e **Reabrir contagem** se errou.

### Perfil (botão de conta no topo)
- **Foto** (corta quadrada e reduz automaticamente), **nome** e **@** (3 a 20 letras, números, ponto e _).
- **Suas estatísticas** nos jogos encerrados com o seu nome: jogos, vitórias, % de vitórias, saldo por moeda, maior ganho e tempo jogado.
- **Jogadores frequentes**: quem mais joga com você.
- **Amigos**: tela pronta, liberada quando houver login (veja `ONLINE.md`).
- **Preferências**: idioma, moeda padrão e "Colocar meu nome como Jogador 1".
- **Dados e privacidade**: exportar backup, **apagar todos os meus dados**, links para Política e Termos.

### Política de Privacidade e Termos de Uso
- `privacidade.html` e `termos.html`, em português e inglês (espanhol e chinês mostram o inglês com aviso).
- Seguem a estrutura de empresas grandes: resumo no topo, índice, bases legais da LGPD em tabela, direitos (LGPD, GDPR, CCPA), retenção, menores, contato do Encarregado (DPO); nos Termos, o app não é casa de apostas, 18+, assinatura com renovação automática, direito de arrependimento (CDC art. 49), limitação de responsabilidade e foro.
- **São modelos**: preencha os campos entre [colchetes] e peça para um advogado revisar antes de publicar na loja.

### 4. Entrar sem conta (convidado)
- Na primeira vez aparece **Bem-vindo**: "Entrar com Google" (marcado como *em breve*) e **Continuar sem conta**.
- Sem conta, tudo fica **salvo neste aparelho** e a versão grátis tem **anúncios**:
  - banner fixo embaixo (320×50);
  - anúncio rápido de tela cheia ao **começar o jogo** e ao **ver o resultado**, pulável depois de 3 s, no máximo 1 a cada 3 minutos.
- Botão de conta no topo: mostra o modo e tem **Remover anúncios — Pro (simular)**, que liga e desliga os anúncios para testar.
- **Reabre onde parou**: se tiver jogo em andamento, abre direto na aba Jogo; senão volta na última aba usada. A tela de boas-vindas só aparece uma vez.

### 5. Salvar e histórico (aba Histórico)
- Tudo é salvo **automaticamente neste aparelho** a cada ação. Fechar a aba ou recarregar não perde nada.
- Lista de jogos (ao vivo e encerrados): abrir, continuar ou excluir.
- **Exportar backup** (arquivo .json) e **Importar backup**: para guardar ou passar para outro aparelho.

### Como a partida é guardada
Cada jogo é uma **lista de eventos com horário exato**: começou, entrou, rebuy, sacou, renomeou, encerrou. Tudo o resto (quanto cada um colocou, banco de fichas, divisão) é recalculado a partir dela. Por isso o log é sempre confiável, o "desfazer" é simples e esse formato vai direto para um banco de dados quando tiver login.

---

## Exemplos e o que devem retornar

### Kit padrão (ao abrir o app)
6 jogadores, 50, big 0,50, 30 de cada cor → cada um recebe **Branca 0,25 × 4 · Vermelha 1 × 4 · Azul 5 × 5 · Preta 20 × 1 = 50** (14 fichas, 100 big blinds).
Com kit pequeno sobra pouca ficha no banco para rebuys: o app avisa quando a sugestão não fecha exato. Para mais rebuys, use "Rebuys estimados" na hora de calcular (ele já reserva fichas) ou um kit maior.

### Calcular (kit Branca 100, Vermelha 100, Azul 100, Preta 50)

| Exemplo | Entrada | Retorno esperado por jogador | Fichas | Pote |
|---|---|---|---|---|
| **A** | 6 jog., R$ 50, big 0,50, small ligado | Branca 0,25 × 16 · Vermelha 1 × 11 · Azul 5 × 3 · Preta 20 × 1 | 31 | R$ 300 |
| **B** | igual A, **small desligado** | Branca 0,50 × 16 · Vermelha 1 × 4 · Azul 2 × 4 · Preta 5 × 6 | 30 | R$ 300 |
| **C** | igual A, **Vermelha digitada 2,00** | Branca 0,25 × 16 · Azul 1 × 3 · Vermelha 2 × 4 · Preta 5 × 7 | 30 | R$ 300 |
| **D** | igual A, **Vermelha 1 e Preta 10 digitadas** | Branca 0,25 × 12 · Vermelha 1 × 12 · Azul 5 × 5 · Preta 10 × 1 | 30 | R$ 300 |
| **E** | 8 jog., R$ 20, big 0,20 | Branca 0,10 × 10 · Vermelha 0,25 × 12 · Azul 1 × 1 · Preta 2,50 × 6 | 29 | R$ 160 |
| **F** | igual A, **2 rebuys** | Branca 0,25 × 12 · Vermelha 1 × 12 · Azul 2,50 × 2 · Preta 10 × 3 | 29 | R$ 400 |
| **G** | 10 jog., US$ 100, big 1 (kit 150/150/100/100) | White 0.50 × 14 · Red 2 × 9 · Green 5 × 3 · Black 20 × 3 | 29 | US$ 1,000 |
| **H** | igual A, **sem blinds** | Branca 0,50 × 16 · Vermelha 1 × 4 · Azul 2 × 4 · Preta 5 × 6 | 30 | R$ 300 |

### Partida completa (teste automático, dá para repetir na tela)

Kit Branca 300, Vermelha 200, Azul 150, Preta 100. 4 jogadores (Ana, Beto, Caio, Duda), R$ 50, big 0,50.

| Passo | O que fazer | Retorno esperado |
|---|---|---|
| 1 | Começar jogo | Cada um: Branca 0,25 × 20 · Vermelha 1 × 5 · Azul 5 × 4 · Preta 20 × 1 = R$ 50. Banco: 220 / 180 / 134 / 96 |
| 2 | Beto faz rebuy de R$ 50 | Sugestão igual à pilha inicial (30 fichas), "✓ fecha exato" |
| 3 | Edu entra com R$ 20 | 11 fichas, fecha exato (Branca ×4, Vermelha ×4, Azul ×3) |
| 4 | Caio sai com Preta ×2, Azul ×6, Vermelha ×10 | Sacou **R$ 80**. Na mesa: **R$ 190** |
| 5 | Contagem final: Ana (fichas) Branca 20, Vermelha 10, Azul 4, Preta 2; Beto R$ 10; Duda R$ 75; Edu R$ 30 | Ana = R$ 75. Contado R$ 190 → **bate certinho** |
| 6 | Resultado | Ana +25 · Beto −90 · Caio +30 · Duda +25 · Edu +10 (soma = 0) |
| 7 | Quem paga quem | Beto → Caio **R$ 30** · Beto → Ana **R$ 25** · Beto → Duda **R$ 25** · Beto → Edu **R$ 10** |

Conta do passo 5 (Ana): 20 × 0,25 + 10 × 1 + 4 × 5 + 2 × 20 = 5 + 10 + 20 + 40 = **R$ 75** ✓

## Testes (47)

**Cálculo (23)**
- Conversão de dinheiro e pagamento de blinds.
- Os 8 exemplos com números exatos.
- Em todo cálculo: soma = entrada, estoque respeitado, valor digitado intacto, valores sem repetir, pote correto.
- Small ligado e desligado, big maior que a entrada, stack curto, prioridade das digitadas, rebuys, entradas inválidas e velocidade.

**Idiomas e kit padrão (7)**
- Toda frase existe nos 4 idiomas, com os mesmos {campos}.
- Avisos, log e resumo saem no idioma escolhido (com exemplos exatos em pt, en, es e zh).
- Kit padrão de 30 por cor fecha exato.

**Perfil (2)**
- Estatísticas pelo nome só em jogos encerrados; jogadores frequentes sem nomes padrão.

**Partida (15)**
- Pilha inicial e banco.
- Sugestão de rebuy exata, inclusive quando acaba uma cor no banco.
- Jogador entra no meio.
- Saque por fichas devolve ao banco; por valor não.
- Quem saiu pode voltar.
- Partida completa com divisão.
- Soma dos resultados = 0.
- Contagem errada vira "diferença".
- Desfazer e reabrir contagem.
- Não aceita ação depois de encerrar.
- Renomear aparece no log.
- Horários exatos.
- Resumo para copiar.
- Salvar e recarregar sem perder nada.

Além disso, a interface foi testada (incluindo boas-vindas, anúncio com "Pular em 3s", Pro e reabrir após recarregar) num navegador automático com o fluxo inteiro no tamanho de celular, sem erros: começar, renomear, rebuy, entrada, saque, recarregar a página, contagem, resultado e histórico.

## Limitações atuais

- **Login com Google, amigos e jogo online ainda não existem**: precisam de servidor. O plano completo está em `ONLINE.md`. Hoje salva só no aparelho, com backup por arquivo. Plano para o app: Firebase Auth (login Google) + Firestore guardando cada jogo como a mesma lista de eventos, sincronizando entre aparelhos.
- Small = metade exata do big.
- Valores das fichas automáticas seguem a ordem da lista (de cima = menor).
- Formato "1,000.50" (milhar americano) ainda não é lido.
- Saque "por valor" não devolve fichas ao banco, porque não se sabe quais cores eram.
- Anúncios e plano Pro estão só no protótipo de design.

## Histórico de versões

- **v0.9 (05/10/2026)**: começar jogo abre direto o jogo (sem anúncio no meio); telas deslizam ao trocar de aba e o marcador da aba anda junto; anúncios e Pro simulados saem do site público (só com `?dev=1`); login com Google + nuvem prontos para ligar (Firebase); regras de segurança do banco.
- **v0.8 (05/10/2026)**: app instalável (PWA), funciona sem internet, ícone novo.
- **v0.7 (05/10/2026)**: animações de confirmação em botões e ações importantes; site público no GitHub Pages.
- **v0.6 (02/10/2026)**: botão ✓ para trocar nome no jogo, perfil completo (foto, @, estatísticas, frequentes, preferências, apagar dados), Política de Privacidade e Termos de Uso, plano online, 47 testes.
- **v0.5 (02/10/2026)**: idiomas (português, inglês, espanhol, chinês), mais moedas, kit padrão com 30 fichas de cada cor, 45 testes.
- **v0.4.1 (02/10/2026)**: confirmações dentro do app (no lugar das caixas do navegador), `atualizar.bat`.
- **v0.4 (02/10/2026)**: entrada sem conta (convidado) salva no aparelho, anúncios (banner + intersticial com limite), Pro simulado, reabre onde parou.
- **v0.3 (02/10/2026)**: partida ao vivo (rebuy, entrada no meio, saque, banco de fichas), contagem final por fichas ou valor, animação das pilhas, divisão quem paga quem, log com hora exata, desfazer, histórico salvo no aparelho, backup, 38 testes.
- **v0.2**: big blind, small opcional, pote, prioridade para valores digitados, Fixar/Soltar.
- **v0.1**: protótipo de telas no canvas de design.
