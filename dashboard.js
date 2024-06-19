// Variáveis globais
let dadosCarregados = {};
let areaAtual = '';

// Função para carregar a área selecionada
async function carregarArea(area) {
  const actionsPanel = document.getElementById('actions-panel');
  actionsPanel.classList.remove('hidden'); // Mostra os botões de ações

  const panelTitle = document.getElementById('panelTitle');
  switch (area) {
    case 'tarefas':
      panelTitle.textContent = 'Tarefas Únicas';
      break;
    case 'atraso':
      panelTitle.textContent = 'Parcelas em Atraso';
      break;
    case 'renovacoes':
      panelTitle.textContent = 'Renovações';
      break;
    case 'aplices':
      panelTitle.textContent = 'Apólices Pendentes';
      break;
    case 'sinistros':
      panelTitle.textContent = 'Sinistros';
      break;
    default:
      panelTitle.textContent = 'Painel de Controle';
      break;
  }

  areaAtual = area; // Atualiza a área atual

  try {
    const response = await fetch(`http://localhost:3000/dados/${area}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const data = await response.json();
    dadosCarregados[areaAtual] = data;
    mostrarDados(dadosCarregados[areaAtual]);
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

// Função para carregar a planilha selecionada
function carregarPlanilha() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const novosDados = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      // Filtra novos dados e adiciona à área atual
      adicionarNovosDados(novosDados);
      mostrarDados(dadosCarregados[areaAtual]);
    };

    reader.readAsArrayBuffer(file);
  }
}

// Função para adicionar novos dados à área atual
async function adicionarNovosDados(novosDados) {
  const dadosExistentes = dadosCarregados[areaAtual] || [];

  // Filtra novos dados não duplicados
  const novosSemRepeticao = novosDados.filter(novo => {
    const chave = Object.values(novo).join('-'); // Cria uma chave única para cada linha
    return !dadosExistentes.some(existente => Object.values(existente).join('-') === chave);
  });

  // Adiciona os novos dados filtrados aos dados existentes
  dadosCarregados[areaAtual] = [...dadosExistentes, ...novosSemRepeticao];

  try {
    const response = await fetch(`http://localhost:3000/dados/${areaAtual}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dados: novosSemRepeticao }),
    });
    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`);
    }
    const data = await response.json();
    dadosCarregados[areaAtual] = data;
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
  }
}

// Função para mostrar os dados na tabela
function mostrarDados(dados) {
  const dadosContainer = document.getElementById('dadosContainer');
  dadosContainer.innerHTML = ''; // Limpa o conteúdo anterior

  const table = document.createElement('table');
  table.setAttribute('id', 'tabelaDados');

  const headerRow = table.insertRow(0);
  for (const col in dados[0]) {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  }

  for (let i = 0; i < dados.length; i++) {
    const dataRow = table.insertRow(i + 1);
    dataRow.setAttribute('data-row-index', i); // Adiciona o índice da linha

    for (const col in dados[i]) {
      const td = dataRow.insertCell(-1);
      td.textContent = dados[i][col];
    }

    // Adiciona o botão de marcar como concluída
    const actionCell = dataRow.insertCell(-1);
    const btnConcluir = document.createElement('button');
    btnConcluir.textContent = 'Concluir';
    btnConcluir.addEventListener('click', function() {
      marcarConcluida(dataRow);
    });
    actionCell.appendChild(btnConcluir);

    // Verifica se a linha está marcada como concluída
    verificarConcluida(dataRow, i);
  }

  dadosContainer.appendChild(table);
}

// Função para verificar se uma linha está concluída e marcar
function verificarConcluida(rowElement, rowIndex) {
  const key = `${areaAtual}-${rowIndex}`;
  const concluida = localStorage.getItem(key);

  if (concluida === 'true') {
    rowElement.classList.add('concluida');
  }
}

// Função para marcar uma linha como concluída
function marcarConcluida(rowElement) {
  rowElement.classList.toggle('concluida'); // Alterna a classe 'concluida'

  const rowIndex = rowElement.getAttribute('data-row-index'); // Índice da linha
  const key = `${areaAtual}-${rowIndex}`;

  if (rowElement.classList.contains('concluida')) {
    localStorage.setItem(key, 'true'); // Marca como concluída no localStorage
  } else {
    localStorage.removeItem(key); // Remove do localStorage se desmarcar
  }
}

// Função para excluir os dados salvos localmente
async function excluirDados() {
  try {
    const response = await fetch(`http://localhost:3000/dados/${areaAtual}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.statusText}`);
    }
    dadosCarregados[areaAtual] = [];
    const dadosContainer = document.getElementById('dadosContainer');
    dadosContainer.innerHTML = '';
    const panelTitle = document.getElementById('panelTitle');
    panelTitle.textContent = 'Painel de Controle';
  } catch (error) {
    console.error('Erro ao excluir dados:', error);
  }
}
