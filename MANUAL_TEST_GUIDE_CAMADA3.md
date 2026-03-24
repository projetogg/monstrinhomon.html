# 🧪 GUIA DE TESTE MANUAL - CAMADA 3

## 📋 Checklist de Validação

Use este guia para testar manualmente a Camada 3 no navegador.

---

## 🚀 Preparação

### 1. Iniciar servidor local
```bash
cd /caminho/para/monstrinhomon.html
python3 -m http.server 8080
```

### 2. Abrir navegador
```
http://localhost:8080/index.html
```

### 3. Criar sessão de teste
1. Criar nova sessão
2. Criar 2-3 jogadores
3. Adicionar monstrinhos aos jogadores
4. Iniciar batalha em grupo

---

## ✅ Teste 1: ESTADO A - "Aguarde sua vez"

### Objetivo
Verificar que jogador vê mensagem de aguardar quando não é sua vez.

### Passos
1. Iniciar batalha em grupo com 2+ jogadores
2. Identificar qual jogador tem o turno atual
3. Observar painel dos OUTROS jogadores (não é turno deles)

### Resultado Esperado
✅ Painel mostra: **"⏳ Aguarde sua vez"**  
✅ **Zero botões** renderizados  
✅ Texto cinza centralizado  
✅ Cursor normal (não pointer)  
✅ Nenhuma interação possível

### Screenshots
📸 Capturar tela mostrando mensagem "Aguarde sua vez"

---

## ✅ Teste 2: ESTADO B - Painel de Ações Contextual

### Objetivo
Verificar que jogador vê botões corretos quando é sua vez.

### Passos
1. Identificar jogador com turno atual
2. Observar painel de ações deste jogador
3. Verificar quais botões aparecem

### Resultado Esperado (Cenário Normal)
✅ Título: **"⚔️ Suas Ações:"**  
✅ Botões renderizados (ordem):
  1. **⚔️ Atacar** (botão grande, vermelho)
  2. **✨ Habilidade** (se disponível, azul)
  3. **🧪 Item** (se tem item, verde)
  4. **🏃 Fugir** (amarelo)
  5. **⏭️ Passar** (cinza)

✅ **Nenhum botão disabled**  
✅ Botões grandes (~120px largura)  
✅ Ícone + texto em cada botão

### Cenários Adicionais

**A. Monstrinho sem energia:**
- ❌ Botão "Habilidade" **não aparece**

**B. Sem itens de cura:**
- ❌ Botão "Item" **não aparece**

**C. HP cheio:**
- ❌ Botão "Item" **não aparece**

**D. Monstrinho desmaiado (HP = 0):**
- ❌ Botão "Atacar" **não aparece**
- ❌ Botão "Fugir" **não aparece**
- ✅ Apenas "⏭️ Passar" aparece

### Screenshots
📸 Capturar:
1. Painel completo com todos os botões
2. Painel sem habilidades (sem energia)
3. Painel sem item (sem itens ou HP cheio)

---

## ✅ Teste 3: Modo de Seleção de Alvo (Ataque)

### Objetivo
Verificar visual e comportamento ao selecionar alvo para ataque.

### Passos
1. Clicar no botão **"⚔️ Atacar"**
2. Observar mudança visual nos cards de inimigos
3. Passar mouse sobre inimigos vivos
4. Passar mouse sobre inimigos mortos (se houver)
5. Clicar em um inimigo vivo

### Resultado Esperado

**Após clicar "Atacar":**
✅ Cards de inimigos **vivos** ganham:
  - Borda azul: `3px solid #2196F3`
  - Sombra azul: `0 0 15px rgba(33, 150, 243, 0.5)`
  - Cursor: `pointer` (mãozinha)
  - Opacidade: `1.0`

✅ Cards de inimigos **mortos**:
  - Opacidade: `0.4`
  - Cursor: `default` (seta)
  - Sem borda especial

**Após clicar em inimigo vivo:**
✅ Ataque é executado  
✅ HP do inimigo diminui  
✅ Log mostra dano causado  
✅ Visual de seleção **desaparece**  
✅ Turno avança automaticamente  
✅ Painel muda para próximo jogador ou "Aguarde"

### Screenshots
📸 Capturar:
1. Modo de seleção ativo (inimigos destacados)
2. Cursor sobre inimigo vivo (pointer)
3. Cursor sobre inimigo morto (default)

---

## ✅ Teste 4: Modo de Seleção de Alvo (Habilidade)

### Objetivo
Verificar seleção de alvo para habilidade.

### Passos
1. Garantir que monstrinho tem habilidade disponível
2. Clicar no botão **"✨ Habilidade"**
3. Observar visual (igual ao ataque)
4. Clicar em inimigo vivo

### Resultado Esperado
✅ Visual igual ao modo de ataque (borda azul, etc)  
✅ Skill é executada (ou stub é chamado)  
✅ Log mostra uso de skill  
✅ Turno avança  
✅ Visual reseta

### Screenshots
📸 Capturar modo de seleção para skill

---

## ✅ Teste 5: Travas de Segurança

### 5.1 Trava: Não agir fora do turno

**Passos:**
1. Abrir console do navegador (F12)
2. Quando **não for** o turno, tentar:
```javascript
enterAttackMode()
```

**Resultado esperado:**
✅ Alert: **"⚠️ Não é sua vez!"**  
✅ Modo de seleção **não ativa**  
✅ `isInTargetMode()` retorna `false`

---

### 5.2 Trava: Não clicar em morto

**Passos:**
1. Derrotar um inimigo (HP = 0)
2. Entrar em modo de seleção (atacar ou skill)
3. Tentar clicar no inimigo morto

**Resultado esperado:**
✅ Card morto tem `opacity: 0.4`  
✅ Cursor é `default` (não pointer)  
✅ Se clicar: Alert **"⚠️ Este inimigo já foi derrotado!"**  
✅ Ação **não é executada**

---

### 5.3 Trava: Uma ação por turno

**Passos:**
1. Executar um ataque
2. Observar painel após ação

**Resultado esperado:**
✅ Painel muda para **"Aguarde sua vez"** OU  
✅ Painel muda para **próximo jogador**  
✅ Impossível executar segunda ação  
✅ Modo de seleção está **desativado**

---

### 5.4 Trava: UI trava após ação

**Passos:**
1. Executar qualquer ação válida
2. Tentar clicar em qualquer botão

**Resultado esperado:**
✅ Painel de ações **desapareceu** OU  
✅ Painel mudou para outro jogador  
✅ Impossível interagir com botões antigos  
✅ Jogo continua fluindo normalmente

---

## ✅ Teste 6: Fluxo Completo

### Objetivo
Testar batalha completa do início ao fim.

### Passos
1. Iniciar batalha com 2-3 jogadores
2. Cada jogador:
   - Atacar inimigo
   - Usar item (se disponível)
   - Usar skill (se disponível)
   - Passar turno (opcional)
3. Continuar até vitória ou derrota

### Checklist de Validação
- [ ] Turnos avançam corretamente
- [ ] Cada jogador vê painel correto
- [ ] Inimigos mortos ficam apagados
- [ ] Log mostra todas as ações
- [ ] Batalha termina corretamente
- [ ] Recompensas são distribuídas

---

## ✅ Teste 7: Casos Extremos

### 7.1 Todos os inimigos mortos menos um
**Resultado esperado:**
✅ Apenas o vivo é clicável  
✅ Mortos têm opacidade 0.4  
✅ Vitória ao derrotar o último

---

### 7.2 Jogador sem monstrinhos válidos
**Resultado esperado:**
✅ Painel mostra erro ou botão "Trocar"  
✅ Sistema não trava

---

### 7.3 Todos os jogadores fogem
**Resultado esperado:**
✅ Batalha termina com resultado "retreat"  
✅ Log mostra "Todos fugiram"  
✅ Jogo volta ao menu principal

---

## 📊 Checklist Final de Validação

Marcar cada item após testar:

### Funcionalidades Básicas
- [ ] ESTADO A aparece corretamente (não é turno)
- [ ] ESTADO B aparece corretamente (é turno)
- [ ] Botões aparecem apenas quando válidos
- [ ] Zero botões disabled em qualquer situação

### Modo de Seleção
- [ ] Entrar em modo de ataque funciona
- [ ] Entrar em modo de skill funciona
- [ ] Visual de seleção está correto
- [ ] Inimigos vivos são clicáveis
- [ ] Inimigos mortos não são clicáveis
- [ ] Ação executa ao clicar em alvo
- [ ] Visual reseta após ação

### Travas de Segurança
- [ ] Não permite agir fora do turno
- [ ] Não permite clicar em mortos
- [ ] Não permite duas ações no turno
- [ ] UI trava após ação
- [ ] Painel muda corretamente após turno

### Fluxo Completo
- [ ] Batalha completa funciona
- [ ] Turnos avançam corretamente
- [ ] Log mostra todas as ações
- [ ] Vitória/derrota funciona
- [ ] Recompensas são distribuídas

### UX/Visual
- [ ] Botões são grandes o suficiente
- [ ] Ícones + texto estão claros
- [ ] Cores facilitam identificação
- [ ] Cursor muda corretamente
- [ ] Transições são suaves

---

## 🐛 Relatório de Bugs (se houver)

### Bug 1: [Descrever problema]
**Passos para reproduzir:**
1. 
2. 
3. 

**Resultado esperado:**


**Resultado obtido:**


**Severidade:** [Alta/Média/Baixa]

---

## ✅ Aprovação Final

**Testador:** ___________________  
**Data:** ___________________  
**Navegador:** ___________________  
**Versão:** ___________________

**Status:**
- [ ] ✅ Aprovado (todos os testes passaram)
- [ ] ⚠️ Aprovado com ressalvas (pequenos ajustes necessários)
- [ ] ❌ Reprovado (bugs críticos encontrados)

**Comentários:**
___________________________________
___________________________________
___________________________________

---

## 📸 Screenshots Obrigatórias

Anexar as seguintes capturas de tela:

1. **Estado A** - "Aguarde sua vez"
2. **Estado B** - Painel completo de ações
3. **Modo ataque** - Inimigos destacados
4. **Inimigo morto** - Opacidade 0.4
5. **Após ação** - Painel mudou

---

## 🎯 Validação Clínica

### Teste com Criança (opcional mas recomendado)

**Critérios de observação:**

1. **Independência:**
   - [ ] Criança joga sem perguntar "o que fazer?"
   - [ ] Criança entende quando é sua vez
   - [ ] Criança entende quais ações pode fazer

2. **Clareza:**
   - [ ] Visual ensina por si só
   - [ ] Criança não tenta clicar em coisas desabilitadas
   - [ ] Criança não fica confusa com muitas opções

3. **Frustração:**
   - [ ] Criança não fica frustrada com sistema
   - [ ] Não há disputas sobre "quem joga"
   - [ ] Sistema previne erros antes que aconteçam

4. **Autonomia:**
   - [ ] Terapeuta não precisa intervir
   - [ ] Criança resolve problemas sozinha
   - [ ] Fluxo é natural e intuitivo

**Notas de observação:**
___________________________________
___________________________________
___________________________________

---

**Documento preparado por:** GitHub Copilot  
**Data:** 2026-02-04  
**Versão:** 1.0.0
