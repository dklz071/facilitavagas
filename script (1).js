(() => {
  'use strict';

  const API_URL = 'https://www.arbeitnow.com/api/job-board-api';
  const FAV_KEY = 'facilita-vagas:favoritas';
  const POR_EXIBICAO = 20;

  const $ = (id) => document.getElementById(id);

  const campoBusca = $('campo-busca');
  const filtroModalidade = $('filtro-modalidade');
  const filtroTipo = $('filtro-tipo');
  const filtroTag = $('filtro-tag');
  const ordenar = $('ordenar');
  const btnLimpar = $('limpar-filtros');

  const abaTodas = $('aba-todas');
  const abaFavoritas = $('aba-favoritas');
  const contagemFavoritas = $('contagem-favoritas');

  const avisoErro = $('aviso-erro');
  const textoErro = $('texto-erro');
  const btnTentar = $('tentar-novamente');
  const statusEl = $('status');
  const listaEl = $('lista-vagas');
  const vazioEl = $('vazio');
  const btnMais = $('btn-mais');

  const modal = $('modal');
  const modalTitulo = $('modal-titulo');
  const modalMeta = $('modal-meta');
  const modalBadges = $('modal-badges');
  const modalDescricao = $('modal-descricao');
  const modalAplicar = $('modal-aplicar');
  const modalFav = $('modal-fav');
  const modalFechar = $('modal-fechar');

  let vagas = [];
  let favoritas = carregarFavoritas();
  let paginaApi = 0;
  let fimDosDados = false;
  let carregando = false;
  let usandoExemplo = false;
  let aba = 'todas';
  let limiteExibicao = POR_EXIBICAO;
  let modalId = null;

  /* ---------- Dados de exemplo (usados só se a API estiver indisponível) ---------- */

  function gerarExemplos() {
    const agora = Math.floor(Date.now() / 1000);
    const dia = 86400;
    const base = [
      ['Desenvolvedor Front-end', 'Studio Aurora', 'São Paulo', true, ['javascript', 'react'], ['Full Time']],
      ['Desenvolvedora Back-end', 'Nuvem Tech', 'Porto Alegre', true, ['node.js', 'api'], ['Full Time']],
      ['Analista de Dados', 'Dados & Co', 'Curitiba', false, ['sql', 'python'], ['Full Time']],
      ['Designer de Produto', 'Pixel Lab', 'Belo Horizonte', true, ['design', 'figma'], ['Contract']],
      ['Engenheiro de Software', 'Orbita Sistemas', 'Florianópolis', false, ['java', 'spring'], ['Full Time']],
      ['Estagiário de Tecnologia', 'Inova Hub', 'Recife', false, ['javascript', 'html'], ['Internship']],
    ];
    return base.map((b, i) => ({
      slug: `exemplo-${i + 1}`,
      title: b[0],
      company_name: b[1],
      location: b[2],
      remote: b[3],
      tags: b[4],
      job_types: b[5],
      created_at: agora - i * dia,
      url: 'https://www.arbeitnow.com',
      description:
        '<p>Esta é uma vaga de exemplo, exibida porque não foi possível acessar a API.</p><p>Tente novamente mais tarde para ver as vagas reais.</p>',
    }));
  }

  /* ---------- Utilitários ---------- */

  function criar(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function normalizarTexto(txt) {
    return String(txt)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function urlSegura(u) {
    try {
      const x = new URL(u);
      return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : '';
    } catch (erro) {
      return '';
    }
  }

  function htmlParaTexto(html) {
    if (!html) return '';
    const comQuebras = String(html).replace(/<\/(p|div|li|h[1-6]|ul|ol)>|<br\s*\/?>/gi, '\n');
    const doc = new DOMParser().parseFromString(comQuebras, 'text/html');
    return (doc.body.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
  }

  function dataRelativa(segundos) {
    if (!segundos) return '';
    const dias = Math.floor((Date.now() / 1000 - segundos) / 86400);
    if (dias <= 0) return 'Publicada hoje';
    if (dias === 1) return 'Publicada ontem';
    if (dias < 30) return `Publicada há ${dias} dias`;
    return `Publicada em ${new Date(segundos * 1000).toLocaleDateString('pt-BR')}`;
  }

  function listaDeTextos(valor) {
    return Array.isArray(valor) ? valor.map(String).filter(Boolean) : [];
  }

  /* Converte um item da API (ou salvo) para o formato interno */
  function normalizarVaga(j) {
    if (!j || typeof j !== 'object') return null;
    const id = j.id || j.slug;
    if (!id) return null;
    return {
      id: String(id),
      titulo: String(j.titulo || j.title || 'Vaga sem título'),
      empresa: String(j.empresa || j.company_name || 'Empresa não informada'),
      local: String(j.local !== undefined ? j.local : j.location || ''),
      remoto: Boolean(j.remoto !== undefined ? j.remoto : j.remote),
      url: urlSegura(j.url),
      tags: listaDeTextos(j.tags),
      tipos: listaDeTextos(j.tipos || j.job_types),
      data: Number(j.data !== undefined ? j.data : j.created_at) || 0,
      descricao: j.descricao !== undefined ? String(j.descricao) : htmlParaTexto(j.description),
    };
  }

  /* ---------- Favoritas ---------- */

  function carregarFavoritas() {
    try {
      const bruto = localStorage.getItem(FAV_KEY);
      if (!bruto) return [];
      const dados = JSON.parse(bruto);
      if (!Array.isArray(dados)) return [];
      return dados.map(normalizarVaga).filter(Boolean);
    } catch (erro) {
      console.error('Não foi possível ler as favoritas:', erro);
      return [];
    }
  }

  function salvarFavoritas() {
    try {
      const leves = favoritas.map((v) => ({ ...v, descricao: v.descricao.slice(0, 3000) }));
      localStorage.setItem(FAV_KEY, JSON.stringify(leves));
    } catch (erro) {
      console.error('Não foi possível salvar as favoritas:', erro);
    }
  }

  function ehFavorita(id) {
    return favoritas.some((f) => f.id === id);
  }

  function buscarVagaPorId(id) {
    return vagas.find((v) => v.id === id) || favoritas.find((v) => v.id === id) || null;
  }

  function alternarFavorita(id) {
    const indice = favoritas.findIndex((f) => f.id === id);
    if (indice >= 0) {
      favoritas.splice(indice, 1);
    } else {
      const vaga = buscarVagaPorId(id);
      if (vaga) favoritas.push(vaga);
    }
    salvarFavoritas();
    renderizar();
    if (modalId === id) atualizarBotaoModal();
  }

  /* ---------- API REST ---------- */

  async function buscarPagina(pagina) {
    const resposta = await fetch(`${API_URL}?page=${pagina}`);
    if (!resposta.ok) throw new Error(`Erro HTTP ${resposta.status}`);
    const json = await resposta.json();
    if (!json || !Array.isArray(json.data)) throw new Error('Resposta inesperada da API');
    return json.data;
  }

  async function carregarMais() {
    if (carregando || fimDosDados) return;
    carregando = true;
    renderizar();

    try {
      const proxima = paginaApi + 1;
      const dados = await buscarPagina(proxima);
      paginaApi = proxima;

      const existentes = new Set(vagas.map((v) => v.id));
      let novas = 0;
      dados.forEach((item) => {
        const vaga = normalizarVaga(item);
        if (vaga && !existentes.has(vaga.id)) {
          vagas.push(vaga);
          existentes.add(vaga.id);
          novas += 1;
        }
      });
      if (novas === 0) fimDosDados = true;

      avisoErro.hidden = true;
      usandoExemplo = false;
    } catch (erro) {
      console.error('Falha ao buscar vagas:', erro);
      if (vagas.length === 0) {
        vagas = gerarExemplos().map(normalizarVaga);
        usandoExemplo = true;
        fimDosDados = true;
        textoErro.textContent =
          'Não foi possível acessar a API de vagas. Estou mostrando vagas de exemplo.';
      } else {
        textoErro.textContent = 'Não foi possível carregar mais vagas agora.';
      }
      avisoErro.hidden = false;
    } finally {
      carregando = false;
    }

    atualizarFiltrosDinamicos();
    renderizar();
  }

  /* ---------- Filtros ---------- */

  function preencherSelect(select, valorPadrao, rotuloPadrao, itens) {
    const atual = select.value;
    select.innerHTML = '';

    const padrao = document.createElement('option');
    padrao.value = valorPadrao;
    padrao.textContent = rotuloPadrao;
    select.appendChild(padrao);

    itens.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item;
      opt.textContent = item;
      select.appendChild(opt);
    });

    select.value = itens.includes(atual) ? atual : valorPadrao;
  }

  function atualizarFiltrosDinamicos() {
    const todas = [...vagas, ...favoritas];

    const tipos = Array.from(new Set(todas.flatMap((v) => v.tipos))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );

    const contagemTags = {};
    todas.forEach((v) => {
      v.tags.forEach((t) => {
        contagemTags[t] = (contagemTags[t] || 0) + 1;
      });
    });
    const tags = Object.keys(contagemTags)
      .sort((a, b) => contagemTags[b] - contagemTags[a] || a.localeCompare(b, 'pt-BR'))
      .slice(0, 40)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));

    preencherSelect(filtroTipo, 'todos', 'Todos', tipos);
    preencherSelect(filtroTag, 'todas', 'Todas', tags);
  }

  function filtrar(lista) {
    const palavras = normalizarTexto(campoBusca.value).split(/\s+/).filter(Boolean);
    const modalidade = filtroModalidade.value;
    const tipo = filtroTipo.value;
    const tag = filtroTag.value;

    return lista.filter((v) => {
      if (palavras.length > 0) {
        const alvo = normalizarTexto([v.titulo, v.empresa, v.local, v.tags.join(' ')].join(' '));
        if (!palavras.every((p) => alvo.includes(p))) return false;
      }
      if (modalidade === 'remoto' && !v.remoto) return false;
      if (modalidade === 'presencial' && v.remoto) return false;
      if (tipo !== 'todos' && !v.tipos.includes(tipo)) return false;
      if (tag !== 'todas' && !v.tags.includes(tag)) return false;
      return true;
    });
  }

  function ordenarLista(lista) {
    const copia = [...lista];
    const criterio = ordenar.value;
    if (criterio === 'titulo') {
      copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
    } else if (criterio === 'empresa') {
      copia.sort((a, b) => a.empresa.localeCompare(b.empresa, 'pt-BR'));
    } else {
      copia.sort((a, b) => b.data - a.data);
    }
    return copia;
  }

  /* ---------- Renderização ---------- */

  function criarBadges(vaga, incluirTags) {
    const frag = document.createDocumentFragment();
    frag.appendChild(
      criar('span', `badge ${vaga.remoto ? 'badge-remoto' : 'badge-presencial'}`, vaga.remoto ? 'Remoto' : 'Presencial')
    );
    vaga.tipos.forEach((t) => frag.appendChild(criar('span', 'badge', t)));
    if (incluirTags) {
      vaga.tags.slice(0, 5).forEach((t) => frag.appendChild(criar('span', 'badge badge-tag', t)));
    }
    return frag;
  }

  function criarCard(vaga) {
    const card = criar('article', 'vaga');

    const topo = criar('div', 'vaga-topo');
    const info = criar('div');
    info.appendChild(criar('h3', '', vaga.titulo));
    const meta = vaga.local ? `${vaga.empresa} · ${vaga.local}` : vaga.empresa;
    info.appendChild(criar('p', 'vaga-empresa', meta));
    topo.appendChild(info);

    const fav = ehFavorita(vaga.id);
    const btnFav = criar('button', `btn-fav${fav ? ' ativa' : ''}`, fav ? '★' : '☆');
    btnFav.type = 'button';
    btnFav.dataset.acao = 'favoritar';
    btnFav.dataset.id = vaga.id;
    btnFav.setAttribute('aria-pressed', String(fav));
    btnFav.setAttribute('aria-label', `${fav ? 'Remover dos favoritos' : 'Favoritar'}: ${vaga.titulo}`);
    topo.appendChild(btnFav);
    card.appendChild(topo);

    const badges = criar('div', 'badges');
    badges.appendChild(criarBadges(vaga, true));
    card.appendChild(badges);

    const rodape = criar('div', 'vaga-rodape');
    rodape.appendChild(criar('span', 'vaga-data', dataRelativa(vaga.data)));
    const btnDetalhes = criar('button', 'btn btn-secundario btn-pequeno', 'Ver detalhes');
    btnDetalhes.type = 'button';
    btnDetalhes.dataset.acao = 'detalhes';
    btnDetalhes.dataset.id = vaga.id;
    rodape.appendChild(btnDetalhes);
    card.appendChild(rodape);

    return card;
  }

  function renderizar() {
    const base = aba === 'favoritas' ? favoritas : vagas;
    const resultado = ordenarLista(filtrar(base));
    const visiveis = resultado.slice(0, limiteExibicao);

    listaEl.innerHTML = '';
    visiveis.forEach((v) => listaEl.appendChild(criarCard(v)));

    contagemFavoritas.textContent = String(favoritas.length);

    vazioEl.hidden = carregando || resultado.length > 0;
    if (aba === 'favoritas' && favoritas.length === 0) {
      vazioEl.textContent = 'Você ainda não favoritou nenhuma vaga.';
    } else {
      vazioEl.textContent = 'Nenhuma vaga encontrada com esses filtros.';
    }

    if (carregando) {
      statusEl.textContent = 'Carregando vagas...';
    } else if (resultado.length > 0) {
      statusEl.textContent = `Mostrando ${visiveis.length} de ${resultado.length} vaga(s)${usandoExemplo ? ' (exemplos)' : ''}.`;
    } else {
      statusEl.textContent = '';
    }

    const temMaisLocal = resultado.length > visiveis.length;
    const podeBuscarApi = aba === 'todas' && !fimDosDados && !usandoExemplo;
    if (carregando) {
      btnMais.hidden = true;
    } else if (temMaisLocal) {
      btnMais.hidden = false;
      btnMais.textContent = 'Mostrar mais';
      btnMais.dataset.modo = 'local';
    } else if (podeBuscarApi) {
      btnMais.hidden = false;
      btnMais.textContent = 'Carregar mais vagas';
      btnMais.dataset.modo = 'api';
    } else {
      btnMais.hidden = true;
    }
  }

  function resetarExibicao() {
    limiteExibicao = POR_EXIBICAO;
    renderizar();
  }

  /* ---------- Modal ---------- */

  function atualizarBotaoModal() {
    const fav = modalId !== null && ehFavorita(modalId);
    modalFav.textContent = fav ? '★ Remover dos favoritos' : '☆ Favoritar';
  }

  function abrirModal(id) {
    const vaga = buscarVagaPorId(id);
    if (!vaga) return;

    modalId = id;
    modalTitulo.textContent = vaga.titulo;
    modalMeta.textContent = [vaga.empresa, vaga.local, dataRelativa(vaga.data)].filter(Boolean).join(' · ');
    modalBadges.innerHTML = '';
    modalBadges.appendChild(criarBadges(vaga, true));
    modalDescricao.textContent = vaga.descricao || 'Esta vaga não tem descrição. Acesse o link para ver mais detalhes.';

    if (vaga.url) {
      modalAplicar.href = vaga.url;
      modalAplicar.hidden = false;
    } else {
      modalAplicar.removeAttribute('href');
      modalAplicar.hidden = true;
    }
    atualizarBotaoModal();

    if (typeof modal.showModal === 'function') {
      modal.showModal();
    } else if (vaga.url) {
      window.open(vaga.url, '_blank', 'noopener,noreferrer');
    }
  }

  function fecharModal() {
    if (modal.open) modal.close();
  }

  /* ---------- Eventos ---------- */

  campoBusca.addEventListener('input', resetarExibicao);
  [filtroModalidade, filtroTipo, filtroTag, ordenar].forEach((campo) => {
    campo.addEventListener('change', resetarExibicao);
  });

  btnLimpar.addEventListener('click', () => {
    campoBusca.value = '';
    filtroModalidade.value = 'todas';
    filtroTipo.value = 'todos';
    filtroTag.value = 'todas';
    ordenar.value = 'recentes';
    resetarExibicao();
  });

  function trocarAba(nova) {
    aba = nova;
    abaTodas.classList.toggle('ativa', nova === 'todas');
    abaFavoritas.classList.toggle('ativa', nova === 'favoritas');
    abaTodas.setAttribute('aria-selected', String(nova === 'todas'));
    abaFavoritas.setAttribute('aria-selected', String(nova === 'favoritas'));
    resetarExibicao();
  }

  abaTodas.addEventListener('click', () => trocarAba('todas'));
  abaFavoritas.addEventListener('click', () => trocarAba('favoritas'));

  listaEl.addEventListener('click', (evento) => {
    const alvo = evento.target.closest('button[data-acao]');
    if (!alvo) return;
    const id = alvo.dataset.id;
    if (alvo.dataset.acao === 'favoritar') alternarFavorita(id);
    if (alvo.dataset.acao === 'detalhes') abrirModal(id);
  });

  btnMais.addEventListener('click', () => {
    if (btnMais.dataset.modo === 'api') {
      carregarMais();
    } else {
      limiteExibicao += POR_EXIBICAO;
      renderizar();
    }
  });

  btnTentar.addEventListener('click', () => {
    if (usandoExemplo) {
      vagas = [];
      paginaApi = 0;
      usandoExemplo = false;
      fimDosDados = false;
    }
    avisoErro.hidden = true;
    carregarMais();
  });

  modalFechar.addEventListener('click', fecharModal);
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) fecharModal();
  });
  modal.addEventListener('close', () => {
    modalId = null;
  });
  modalFav.addEventListener('click', () => {
    if (modalId !== null) alternarFavorita(modalId);
  });

  /* ---------- Início ---------- */

  atualizarFiltrosDinamicos();
  renderizar();
  carregarMais();
})();
