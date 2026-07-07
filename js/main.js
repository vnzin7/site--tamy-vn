// Estado Global
let AppState = {
    gastos: [],
    metas: [],
    presentes: [],
    musicas: [],
    fotos: [],
    eventos: [],
    tema: 'claro',
    metaMensal: 2000
};

let graficoPizza = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    mostrarSecao('dashboard');
    aplicarTema();
    configurarData();
    
    document.getElementById('btnMenu').addEventListener('click', () => {
        document.getElementById('navMobile').classList.toggle('ativo');
    });
});

function carregarDados() {
    const dados = localStorage.getItem('appState');
    if (dados) {
        try { AppState = { ...AppState, ...JSON.parse(dados) }; } catch(e) {}
    }
}

function salvarDados() {
    localStorage.setItem('appState', JSON.stringify(AppState));
}

function configurarData() {
    const hoje = new Date().toISOString().split('T')[0];
    const dataGasto = document.getElementById('dataGasto');
    const dataEvento = document.getElementById('dataEvento');
    if (dataGasto) dataGasto.value = hoje;
    if (dataEvento) dataEvento.value = hoje;
}

// Navegação
function mostrarSecao(nome) {
    document.querySelectorAll('.secao').forEach(s => s.classList.remove('ativa'));
    const secao = document.getElementById(`secao-${nome}`);
    if (secao) secao.classList.add('ativa');
    
    document.querySelectorAll('.nav a, .nav-mobile a').forEach(a => {
        a.classList.remove('ativo');
        if (a.dataset.secao === nome) a.classList.add('ativo');
    });
    
    document.getElementById('navMobile').classList.remove('ativo');
    
    if (nome === 'dashboard') atualizarDashboard();
    if (nome === 'financas') { configurarData(); atualizarFinancas(); }
    if (nome === 'metas') atualizarMetas();
    if (nome === 'presentes') atualizarPresentes();
    if (nome === 'musicas') atualizarMusicas();
    if (nome === 'galeria') atualizarGaleria();
    if (nome === 'datas') { configurarData(); atualizarEventos(); }
}

// Tema
function alternarTema() {
    AppState.tema = AppState.tema === 'claro' ? 'escuro' : 'claro';
    aplicarTema();
    salvarDados();
}

function aplicarTema() {
    document.documentElement.setAttribute('data-tema', AppState.tema);
}

// Toast
function mostrarToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle" style="color: var(--success);"></i> ${msg}`;
    document.getElementById('toastContainer').appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Utilitários
function formatarMoeda(v) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v); }
function formatarData(d) { return new Date(d).toLocaleDateString('pt-BR'); }

// ============ DASHBOARD ============
function atualizarDashboard() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    const gastosMes = AppState.gastos.filter(g => {
        const d = new Date(g.data);
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
    
    const totalGastos = gastosMes.reduce((acc, g) => acc + g.valor, 0);
    const economia = Math.max(0, AppState.metaMensal - totalGastos);
    
    document.getElementById('dashGastos').textContent = formatarMoeda(totalGastos);
    document.getElementById('dashEconomia').textContent = formatarMoeda(economia);
    document.getElementById('dashGastos2').textContent = formatarMoeda(totalGastos);
    document.getElementById('dashEconomia2').textContent = formatarMoeda(economia);
    document.getElementById('dashMetas').textContent = AppState.metas.filter(m => !m.concluida).length;
    
    // Próximo evento
    const eventosFuturos = AppState.eventos
        .filter(e => new Date(e.data) > hoje)
        .sort((a, b) => new Date(a.data) - new Date(b.data));
    
    if (eventosFuturos.length > 0) {
        const dias = Math.ceil((new Date(eventosFuturos[0].data) - hoje) / (1000 * 60 * 60 * 24));
        document.getElementById('dashEvento').textContent = `${dias} dias`;
    } else {
        document.getElementById('dashEvento').textContent = '-';
    }
    
    // Últimos gastos
    const container = document.getElementById('dashUltimosGastos');
    const ultimos = [...AppState.gastos].reverse().slice(0, 5);
    if (ultimos.length === 0) {
        container.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Nenhum gasto registrado</p>';
    } else {
        container.innerHTML = ultimos.map(g => `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--gray-200);">
                <div>
                    <div style="font-weight: 500;">${g.nome}</div>
                    <div style="font-size: 0.8rem; color: var(--gray-500);">${g.categoria} • ${formatarData(g.data)}</div>
                </div>
                <div style="font-weight: 600; color: var(--danger);">-${formatarMoeda(g.valor)}</div>
            </div>
        `).join('');
    }
    
    // Metas em progresso
    const containerMetas = document.getElementById('dashMetasProgresso');
    const metasAtivas = AppState.metas.filter(m => !m.concluida).slice(0, 3);
    if (metasAtivas.length === 0) {
        containerMetas.innerHTML = '<p style="color: var(--gray-500); text-align: center; padding: 20px;">Nenhuma meta ativa</p>';
    } else {
        containerMetas.innerHTML = metasAtivas.map(m => {
            const percentual = Math.min(100, (m.valorAtual / m.valorTotal) * 100);
            return `
                <div style="margin-bottom: 20px;">
                    <div class="progress-header">
                        <span style="font-weight: 500;">${m.nome}</span>
                        <span style="font-weight: 600;">${percentual.toFixed(0)}%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar progress-primary" style="width: ${percentual}%;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--gray-500); margin-top: 4px;">
                        <span>${formatarMoeda(m.valorAtual)}</span>
                        <span>${formatarMoeda(m.valorTotal)}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ============ FINANÇAS ============
function adicionarGasto() {
    const nome = document.getElementById('nomeGasto').value;
    const valor = parseFloat(document.getElementById('valorGasto').value);
    
    if (!nome || !valor || valor <= 0) {
        mostrarToast('Preencha todos os campos corretamente!');
        return;
    }
    
    const gasto = {
        id: Date.now(),
        nome: nome,
        valor: valor,
        categoria: document.getElementById('categoriaGasto').value,
        quemPagou: document.getElementById('quemPagou').value,
        data: document.getElementById('dataGasto').value
    };
    
    AppState.gastos.push(gasto);
    salvarDados();
    atualizarFinancas();
    
    document.getElementById('nomeGasto').value = '';
    document.getElementById('valorGasto').value = '';
    configurarData();
    mostrarToast('Gasto adicionado com sucesso!');
}

function excluirGasto(id) {
    if (confirm('Excluir este gasto?')) {
        AppState.gastos = AppState.gastos.filter(g => g.id !== id);
        salvarDados();
        atualizarFinancas();
        mostrarToast('Gasto excluído!');
    }
}

function atualizarFinancas() {
    // Tabela
    const tbody = document.getElementById('tabelaGastos');
    if (!tbody) return;
    
    const gastos = [...AppState.gastos].reverse();
    
    if (gastos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhum gasto registrado</td></tr>';
    } else {
        tbody.innerHTML = gastos.map(g => `
            <tr>
                <td style="font-weight: 500;">${g.nome}</td>
                <td>${g.categoria}</td>
                <td style="font-weight: 600; color: var(--danger);">-${formatarMoeda(g.valor)}</td>
                <td>${g.quemPagou}</td>
                <td>${formatarData(g.data)}</td>
                <td>
                    <button class="btn btn-outline btn-sm" onclick="excluirGasto(${g.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // Gráfico de Pizza
    atualizarGraficoPizza();
}

function atualizarGraficoPizza() {
    const canvas = document.getElementById('graficoPizza');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Agrupar por categoria
    const categorias = {};
    AppState.gastos.forEach(g => {
        categorias[g.categoria] = (categorias[g.categoria] || 0) + g.valor;
    });
    
    const labels = Object.keys(categorias);
    const data = Object.values(categorias);
    const total = data.reduce((a, b) => a + b, 0);
    
    if (graficoPizza) graficoPizza.destroy();
    
    if (data.length === 0) return;
    
    graficoPizza = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${context.label}: ${formatarMoeda(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ============ METAS ============
function adicionarMeta() {
    const nome = document.getElementById('nomeMeta').value;
    const valorTotal = parseFloat(document.getElementById('valorMeta').value);
    const valorAtual = parseFloat(document.getElementById('valorAtualMeta').value) || 0;
    const dataLimite = document.getElementById('dataMeta').value;
    
    if (!nome || !valorTotal || valorTotal <= 0) {
        mostrarToast('Preencha o nome e valor total da meta!');
        return;
    }
    
    const meta = {
        id: Date.now(),
        nome: nome,
        valorTotal: valorTotal,
        valorAtual: valorAtual,
        dataLimite: dataLimite,
        concluida: valorAtual >= valorTotal,
        dataCriacao: new Date().toISOString()
    };
    
    AppState.metas.push(meta);
    salvarDados();
    atualizarMetas();
    
    document.getElementById('nomeMeta').value = '';
    document.getElementById('valorMeta').value = '';
    document.getElementById('valorAtualMeta').value = '';
    document.getElementById('dataMeta').value = '';
    mostrarToast('Meta criada com sucesso! 🎯');
}

function atualizarValorMeta(id) {
    const meta = AppState.metas.find(m => m.id === id);
    if (!meta) return;
    
    const novoValor = prompt(`Quanto você já economizou para "${meta.nome}"?\nValor atual: ${formatarMoeda(meta.valorAtual)}\nMeta total: ${formatarMoeda(meta.valorTotal)}`, meta.valorAtual);
    
    if (novoValor !== null) {
        const valor = parseFloat(novoValor);
        if (isNaN(valor) || valor < 0) {
            mostrarToast('Valor inválido!');
            return;
        }
        
        meta.valorAtual = Math.min(valor, meta.valorTotal);
        meta.concluida = meta.valorAtual >= meta.valorTotal;
        salvarDados();
        atualizarMetas();
        mostrarToast('Valor atualizado! 💰');
    }
}

function excluirMeta(id) {
    if (confirm('Excluir esta meta?')) {
        AppState.metas = AppState.metas.filter(m => m.id !== id);
        salvarDados();
        atualizarMetas();
        mostrarToast('Meta excluída!');
    }
}

function atualizarMetas() {
    const container = document.getElementById('gridMetas');
    if (!container) return;
    
    if (AppState.metas.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--gray-500);">Nenhuma meta criada ainda. Crie sua primeira meta!</p>';
        return;
    }
    
    container.innerHTML = AppState.metas.map(m => {
        const percentual = Math.min(100, (m.valorAtual / m.valorTotal) * 100);
        const falta = m.valorTotal - m.valorAtual;
        
        return `
            <div class="meta-card">
                <div class="meta-card-header">
                    <div>
                        <div class="meta-card-title">${m.nome}</div>
                        ${m.dataLimite ? `<small style="color: var(--gray-500);">Até ${formatarData(m.dataLimite)}</small>` : ''}
                    </div>
                    <span class="meta-card-badge ${m.concluida ? 'concluida' : 'em-andamento'}">
                        ${m.concluida ? '✅ Concluída' : '⏳ Em andamento'}
                    </span>
                </div>
                
                <div class="progress-container">
                    <div class="progress-header">
                        <span>Progresso</span>
                        <span style="font-weight: 700;">${percentual.toFixed(1)}%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar ${m.concluida ? 'progress-success' : 'progress-primary'}" style="width: ${percentual}%;"></div>
                    </div>
                </div>
                
                <div class="meta-card-values">
                    <div>
                        <small style="color: var(--gray-500);">Economizado</small>
                        <div class="meta-card-saved">${formatarMoeda(m.valorAtual)}</div>
                    </div>
                    <div style="text-align: right;">
                        <small style="color: var(--gray-500);">Meta Total</small>
                        <div class="meta-card-goal">${formatarMoeda(m.valorTotal)}</div>
                    </div>
                </div>
                
                ${!m.concluida ? `
                    <div style="background: var(--gray-100); padding: 12px; border-radius: var(--radius-md); margin-bottom: 12px;">
                        <span style="font-size: 0.9rem;">Faltam: <strong style="color: var(--primary);">${formatarMoeda(falta)}</strong></span>
                    </div>
                ` : ''}
                
                <div class="meta-card-actions">
                    <button class="btn btn-primary btn-sm" onclick="atualizarValorMeta(${m.id})">
                        <i class="fas fa-edit"></i> Atualizar
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="excluirMeta(${m.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ============ SIMULADOR ============
function simularJuros() {
    const inicial = parseFloat(document.getElementById('simInicial').value) || 0;
    const mensal = parseFloat(document.getElementById('simMensal').value) || 0;
    const taxa = parseFloat(document.getElementById('simTaxa').value) || 0;
    const anos = parseInt(document.getElementById('simTempo').value) || 0;
    
    const taxaM = Math.pow(1 + taxa/100, 1/12) - 1;
    let montante = inicial;
    for (let i = 0; i < anos * 12; i++) {
        montante = (montante + mensal) * (1 + taxaM);
    }
    
    document.getElementById('resultadoSimulacao').textContent = formatarMoeda(montante);
    mostrarToast(`Projeção calculada: ${formatarMoeda(montante)}`);
}

// ============ PRESENTES ============
function adicionarPresente() {
    const presente = {
        id: Date.now(),
        nome: document.getElementById('nomePresente').value,
        valor: parseFloat(document.getElementById('valorPresente').value) || 0,
        prioridade: document.getElementById('prioridadePresente').value,
        link: document.getElementById('linkPresente').value
    };
    
    if (!presente.nome) {
        mostrarToast('Informe o nome do presente!');
        return;
    }
    
    AppState.presentes.push(presente);
    salvarDados();
    atualizarPresentes();
    mostrarToast('Presente adicionado! 🎁');
}

function atualizarPresentes() {
    const container = document.getElementById('gridPresentes');
    if (!container) return;
    
    if (AppState.presentes.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--gray-500);">Nenhum presente na lista</p>';
        return;
    }
    
    container.innerHTML = AppState.presentes.map(p => `
        <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <h3 style="font-size: 1.1rem;">${p.nome}</h3>
                <span class="badge badge-${p.prioridade === 'alta' ? 'danger' : p.prioridade === 'media' ? 'warning' : 'success'}">
                    ${p.prioridade === 'alta' ? '🔥 Alta' : p.prioridade === 'media' ? '⭐ Média' : '💤 Baixa'}
                </span>
            </div>
            ${p.valor > 0 ? `<p style="font-weight: 600; color: var(--primary); margin-bottom: 12px;">${formatarMoeda(p.valor)}</p>` : ''}
            ${p.link ? `<a href="${p.link}" target="_blank" style="color: var(--primary); text-decoration: none; display: block; margin-bottom: 12px;"><i class="fas fa-external-link-alt"></i> Link para compra</a>` : ''}
        </div>
    `).join('');
}

// ============ MÚSICAS ============
function adicionarMusica() {
    const musica = {
        id: Date.now(),
        nome: document.getElementById('nomeMusica').value,
        artista: document.getElementById('artistaMusica').value,
        link: document.getElementById('linkMusica').value
    };
    
    if (!musica.nome || !musica.link) {
        mostrarToast('Preencha nome e link!');
        return;
    }
    
    AppState.musicas.push(musica);
    salvarDados();
    atualizarMusicas();
    mostrarToast('Música adicionada! 🎵');
}

function atualizarMusicas() {
    const container = document.getElementById('gridMusicas');
    if (!container) return;
    
    if (AppState.musicas.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--gray-500);">Nenhuma música na playlist</p>';
        return;
    }
    
    container.innerHTML = AppState.musicas.map(m => `
        <div class="card">
            <h3 style="font-size: 1.1rem;">🎵 ${m.nome}</h3>
            <p style="color: var(--gray-500); margin-bottom: 12px;">🎤 ${m.artista}</p>
            <a href="${m.link}" target="_blank" class="btn btn-primary btn-sm">
                <i class="fas fa-play"></i> Tocar no YouTube
            </a>
        </div>
    `).join('');
}

// ============ GALERIA ============
function adicionarFoto() {
    const file = document.getElementById('uploadFoto').files[0];
    const legenda = document.getElementById('legendaFoto').value || 'Momento especial';
    
    if (!file) {
        mostrarToast('Selecione uma foto!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        AppState.fotos.push({
            id: Date.now(),
            src: e.target.result,
            legenda: legenda,
            data: new Date().toISOString()
        });
        salvarDados();
        atualizarGaleria();
        mostrarToast('Foto adicionada! 📸');
    };
    reader.readAsDataURL(file);
}

function atualizarGaleria() {
    const container = document.getElementById('gridFotos');
    if (!container) return;
    
    if (AppState.fotos.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--gray-500);">Nenhuma foto na galeria</p>';
        return;
    }
    
    container.innerHTML = AppState.fotos.map(f => `
        <div class="foto-card">
            <img src="${f.src}" alt="${f.legenda}">
            <div class="foto-info">
                <p>${f.legenda}</p>
                <small>${formatarData(f.data)}</small>
            </div>
        </div>
    `).join('');
}

// ============ DATAS ============
function adicionarDataEspecial() {
    const evento = {
        id: Date.now(),
        nome: document.getElementById('nomeEvento').value,
        data: document.getElementById('dataEvento').value
    };
    
    if (!evento.nome || !evento.data) {
        mostrarToast('Preencha todos os campos!');
        return;
    }
    
    AppState.eventos.push(evento);
    salvarDados();
    atualizarEventos();
    mostrarToast('Data adicionada! 💝');
}

function atualizarEventos() {
    const container = document.getElementById('gridEventos');
    if (!container) return;
    
    if (AppState.eventos.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 40px; color: var(--gray-500);">Nenhuma data especial</p>';
        return;
    }
    
    const hoje = new Date();
    
    container.innerHTML = AppState.eventos.map(e => {
        const dias = Math.ceil((new Date(e.data) - hoje) / (1000 * 60 * 60 * 24));
        let status = '';
        let cor = '';
        
        if (dias > 30) { status = `${dias} dias`; cor = 'var(--info)'; }
        else if (dias > 7) { status = `${dias} dias`; cor = 'var(--warning)'; }
        else if (dias > 0) { status = `${dias} dias!`; cor = 'var(--danger)'; }
        else if (dias === 0) { status = 'É HOJE! 🎉'; cor = 'var(--success)'; }
        else { status = 'Já passou'; cor = 'var(--gray-500)'; }
        
        return `
            <div class="card" style="border-left: 4px solid ${cor};">
                <h3>${e.nome}</h3>
                <p style="color: var(--gray-500);">📅 ${formatarData(e.data)}</p>
                <p style="font-weight: 600; color: ${cor}; font-size: 1.1rem;">${status}</p>
            </div>
        `;
    }).join('');
}

// Exportar dados
function exportarDados() {
    const blob = new Blob([JSON.stringify(AppState, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    mostrarToast('Dados exportados! 💾');
}

// Funções globais
window.mostrarSecao = mostrarSecao;
window.alternarTema = alternarTema;
window.adicionarGasto = adicionarGasto;
window.excluirGasto = excluirGasto;
window.adicionarMeta = adicionarMeta;
window.atualizarValorMeta = atualizarValorMeta;
window.excluirMeta = excluirMeta;
window.simularJuros = simularJuros;
window.adicionarPresente = adicionarPresente;
window.adicionarMusica = adicionarMusica;
window.adicionarFoto = adicionarFoto;
window.adicionarDataEspecial = adicionarDataEspecial;
window.exportarDados = exportarDados;