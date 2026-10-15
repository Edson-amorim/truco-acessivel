# 🃏 Truco Paulista Acessível

Um jogo completo de **Truco Paulista** para navegador, desenvolvido com **HTML5**, **CSS3** e **JavaScript**, com foco total em **acessibilidade para pessoas cegas e com baixa visão (leitores de tela)**.

---

## 🌟 Principais Recursos

- 🔊 **Efeitos Sonoros Sintetizados em Tempo Real (Web Audio API):**
  - Sons de embaralhamento de cartas, estalo e batida de carta na mesa, batida tensa na madeira ao pedir TRUCO, arpeggios de vitória de queda e fanfarras de vitória/derrota.
  - Não depende de arquivos externos ou links que possam quebrar: funciona 100% offline e sem latência.
- 🗣️ **Narração por Voz Integrada (Web Speech API):**
  - O bot fala e grita frases clássicas de truco em Português Brasileiro (*"TRUCO, LADRÃO!"*, *"EU QUERO!"*, *"CORRO!"*).
  - Narração opcional de todas as jogadas e avisos importantes.
- ♿ **100% Acessível para Leitores de Tela:**
  - Compatível com **NVDA**, **JAWS**, **Orca**, **VoiceOver** e **TalkBack**.
  - Regiões `aria-live="polite"` e `aria-live="assertive"` para anúncio imediato de jogadas, desafios e alterações no placar.
  - Cartas detalhadamente descritas: naipe, valor, se é Manilha (Zap, Copeta, Espadilha, Pica-fumo), sua força relativa e tecla de atalho correspondente.
- 👁️ **Modo Alto Contraste (WCAG 2.2 AAA):**
  - Fundo preto absoluto com bordas amarelas e foco de alta visibilidade em ciano (`#00ffff`), garantindo legibilidade perfeita para pessoas com baixa visão.
- ⌨️ **Controle Total por Teclado:**
  - Jogue a partida inteira sem precisar encostar no mouse.

---

## ⌨️ Atalhos de Teclado

| Tecla | Ação |
| :---: | :--- |
| `1`, `2`, `3` | Jogar a 1ª, 2ª ou 3ª carta da sua mão |
| `T` | Pedir **TRUCO** ou aumentar aposta (**SEIS**, **NOVE**, **DOZE**) |
| `A` | **Aceitar** desafio de truco do adversário |
| `C` | **Correr** (fugir) de desafio de truco ou mão de 11 |
| `R` | **Retrucar / Aumentar** o desafio proposto pelo bot |
| `O` | Ativar/desativar modo **Carta Coberta** (virada para baixo) |
| `S` | **Ouvir Resumo Completo da Partida** no leitor de tela / voz |
| `M` | Ligar ou desligar **Efeitos Sonoros** |
| `V` | Ligar ou desligar **Narração de Voz** |
| `H` ou `?` | Abrir a janela de **Ajuda e Regras** |
| `Esc` | Fechar janelas modais |

---

## 🃏 Regras do Truco Paulista

### 1. Hierarquia das Cartas Normais (do menor para o maior):
`4` < `5` < `6` < `7` < `Q` (Dama) < `J` (Valete) < `K` (Rei) < `A` < `2` < `3`

### 2. O Vira e as Manilhas:
A carta revelada no centro da mesa é o **Vira**. A carta seguinte na sequência é a **Manilha** da rodada (as cartas mais fortes do jogo).
A força entre as 4 manilhas é definida pelos naipes:
1. ♣ **Zap (Paus):** A carta mais forte de todo o jogo.
2. ♥ **Copeta (Copas):** A 2ª mais forte.
3. ♠ **Espadilha (Espadas):** A 3ª mais forte.
4. ♦ **Pica-fumo (Ouros):** A 4ª mais forte.

### 3. Dinâmica das Quedas:
- Cada mão é disputada em melhor de 3 quedas.
- Quem vencer duas quedas leva os pontos da mão.
- **Empate na 1ª queda:** Quem vencer a 2ª queda ganha a mão.
- **Empate na 2ª queda:** Quem venceu a 1ª queda ganha a mão.

### 4. Valores e Mão de 11:
- Cada mão normal vale **1 ponto**.
- Pedir Truco eleva a mão para **3 pontos** (podendo subir para **6**, **9** ou **12** pontos).
- Ao atingir **11 pontos**, o jogador entra na **Mão de 11** (vale 3 pontos automaticamente, pode ver as cartas e decidir se joga ou corre).
- Quem fizer **12 pontos** primeiro vence o jogo!

---

## 🚀 Como Jogar

1. Abra o arquivo `index.html` em qualquer navegador moderno (Chrome, Edge, Firefox, Safari).
2. Não requer instalação de dependências ou servidores backend.

---

## 👤 Autor

- **Edson Amorim**
- Email: [edsoninformatica28br@gmail.com](mailto:edsoninformatica28br@gmail.com)
- GitHub: [@Edson-amorim](https://github.com/Edson-amorim)
