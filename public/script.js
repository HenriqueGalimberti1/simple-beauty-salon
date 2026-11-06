/**
 * =========================================================================
 * AGENDA FÁCIL - SISTEMA DE AGENDAMENTO (SALÃO DE BELEZA & ESTÉTICA)
 * Disciplina: Programação para Internet (Multivix 2026)
 * Arquitetura: ES6+ Moderno • Fetch API • CRUD no DOM • Fallback Offline
 * =========================================================================
 */

// Limpeza de chaves antigas de teste do navegador
localStorage.removeItem('agenda_facil_agendamentos');
localStorage.removeItem('agenda_facil_agendamentos_v2');

// Detecção inteligente da URL base da API
const isLiveServer = window.location.port === '5500' || window.location.port === '5501' || window.location.protocol === 'file:';
const API_BASE_URL = isLiveServer ? 'http://localhost:3000/api' : '/api';

const STORAGE_KEYS = {
    APPOINTMENTS: 'agenda_facil_agendamentos_v3',
    THEME: 'agenda_facil_theme_v2'
};

// Horários de funcionamento (0 = Domingo fechado)
const BUSINESS_HOURS = {
    1: { open: 9, close: 20, name: 'Segunda-feira' },
    2: { open: 9, close: 20, name: 'Terça-feira' },
    3: { open: 9, close: 20, name: 'Quarta-feira' },
    4: { open: 9, close: 20, name: 'Quinta-feira' },
    5: { open: 9, close: 20, name: 'Sexta-feira' },
    6: { open: 8, close: 18, name: 'Sábado' },
    0: null // Domingo fechado
};

// Estado centralizado da aplicação (inicia sem nenhum agendamento pré-carregado)
const state = {
    services: [],
    appointments: [],
    activeFilterCategory: 'todos',
    searchTerm: '',
    statusFilter: 'todos',
    sortBy: 'data-asc',
    deletingId: null
};

// =========================================================================
// 2. FUNÇÕES UTILITÁRIAS
// =========================================================================

function getTodayIsoString() {
    return new Date().toISOString().split('T')[0];
}

function formatCurrency(val) {
    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDatePtBr(isoDate) {
    if (!isoDate) return '-';
    const parts = isoDate.split('T')[0].split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
}

function timeStringToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
}

function minutesToTimeString(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Máscara dinâmica para Telefone / WhatsApp: (99) 99999-9999
function applyPhoneMask(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
        input.value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
        input.value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
        input.value = `(${value}`;
    } else {
        input.value = '';
    }
}

// =========================================================================
// 3. SISTEMA DE NOTIFICAÇÕES TOAST (3 SEGUNDOS COM PROGRESSO)
// =========================================================================

function showToast(title, message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const iconMap = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${iconMap[type] || 'fa-bell'} toast-icon"></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-leave');
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// =========================================================================
// 4. LEITURA ASSÍNCRONA DOS SERVIÇOS (FETCH API + FALLBACK)
// =========================================================================

async function fetchServices() {
    const loadingEl = document.getElementById('servicesLoading');
    const listEl = document.getElementById('servicesList');
    const errorEl = document.getElementById('servicesError');
    const errorMsgEl = document.getElementById('servicesErrorMessage');

    if (loadingEl) {
        loadingEl.hidden = false;
        loadingEl.style.display = 'flex';
    }
    if (listEl) {
        listEl.hidden = true;
        listEl.style.display = 'none';
    }
    if (errorEl) {
        errorEl.hidden = true;
        errorEl.style.display = 'none';
    }

    try {
        let servicesData = null;

        // Tenta buscar da API REST (Node.js / SQL Server)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        try {
            const response = await fetch(`${API_BASE_URL}/servicos`, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Servidor respondeu com status ${response.status}`);
            }

            const json = await response.json();
            servicesData = json.dados || json;
        } catch (fetchErr) {
            clearTimeout(timeoutId);
            // Fallback: carregar de data/servicos.json
            const fallbackResp = await fetch('data/servicos.json');
            if (!fallbackResp.ok) {
                throw new Error('Não foi possível ler o arquivo servicos.json local.');
            }
            servicesData = await fallbackResp.json();
        }

        if (!Array.isArray(servicesData) || servicesData.length === 0) {
            throw new Error('Nenhum serviço disponível.');
        }

        state.services = servicesData;

        // Oculta loading completamente e exibe catálogo
        if (loadingEl) {
            loadingEl.hidden = true;
            loadingEl.style.display = 'none';
        }
        if (errorEl) {
            errorEl.hidden = true;
            errorEl.style.display = 'none';
        }
        if (listEl) {
            listEl.hidden = false;
            listEl.style.display = 'grid';
        }

        renderServices();
        populateServiceSelects();
        return true;
    } catch (err) {
        console.error('Erro ao carregar serviços:', err);
        if (loadingEl) {
            loadingEl.hidden = true;
            loadingEl.style.display = 'none';
        }
        if (listEl) {
            listEl.hidden = true;
            listEl.style.display = 'none';
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.style.display = 'block';
            if (errorMsgEl) errorMsgEl.textContent = `Falha ao conectar: ${err.message}.`;
        }
        return false;
    }
}

// =========================================================================
// 5. RENDERIZAÇÃO DO CATÁLOGO DE SERVIÇOS
// =========================================================================

function renderServices() {
    const listEl = document.getElementById('servicesList');
    if (!listEl) return;

    let filtered = state.services;
    if (state.activeFilterCategory !== 'todos') {
        filtered = filtered.filter(s => s.categoria.toLowerCase() === state.activeFilterCategory.toLowerCase());
    }

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><p>Nenhum serviço nesta categoria.</p></div>`;
        return;
    }

    listEl.innerHTML = filtered.map(service => `
        <article class="service-card" data-id="${service.id}" data-category="${service.categoria}">
            <div>
                <div class="service-card-top">
                    <div class="service-icon-box" aria-hidden="true">
                        <i class="fas ${service.icone || 'fa-spa'}"></i>
                    </div>
                    <span class="service-category-tag">${service.categoria}</span>
                </div>
                <h3>${service.nome}</h3>
                <p class="service-desc">${service.descricao || 'Atendimento exclusivo com produtos selecionados.'}</p>
            </div>
            <div>
                <div class="service-card-meta">
                    <span class="price">${formatCurrency(service.preco)}</span>
                    <span class="duration"><i class="fas fa-clock"></i> ${service.duracao_minutos} min</span>
                </div>
                <button type="button" class="btn-book-service" data-select-service="${service.id}">
                    <i class="fas fa-calendar-plus"></i> Agendar Este Serviço
                </button>
            </div>
        </article>
    `).join('');

    listEl.querySelectorAll('[data-select-service]').forEach(btn => {
        btn.addEventListener('click', () => {
            const serviceId = btn.getAttribute('data-select-service');
            selectServiceInForm(serviceId);
        });
    });
}

function selectServiceInForm(serviceId) {
    const select = document.getElementById('serviceSelect');
    if (!select) return;
    select.value = serviceId;
    select.dispatchEvent(new Event('change'));

    const formSec = document.getElementById('agendamento');
    if (formSec) {
        formSec.scrollIntoView({ behavior: 'smooth' });
    }
    showToast('Serviço Selecionado', 'Preencha a data e o melhor horário para agendar.', 'info');
}

function populateServiceSelects() {
    const mainSelect = document.getElementById('serviceSelect');
    const editSelect = document.getElementById('editServiceSelect');

    const optionsHtml = `
        <option value="" disabled selected>-- Selecione um serviço do catálogo --</option>
        ${state.services.map(s => `
            <option value="${s.id}" data-duration="${s.duracao_minutos}" data-price="${s.preco}">
                ${s.nome} • ${formatCurrency(s.preco)} (${s.duracao_minutos} min)
            </option>
        `).join('')}
    `;

    if (mainSelect) mainSelect.innerHTML = optionsHtml;
    if (editSelect) {
        editSelect.innerHTML = `
            <option value="" disabled>-- Selecione um serviço --</option>
            ${state.services.map(s => `
                <option value="${s.id}" data-duration="${s.duracao_minutos}" data-price="${s.preco}">
                    ${s.nome} • ${formatCurrency(s.preco)}
                </option>
            `).join('')}
        `;
    }
}

// =========================================================================
// 6. GERAÇÃO DINÂMICA DE HORÁRIOS & REGRAS DE NEGÓCIO
// =========================================================================

function checkScheduleConflict(dateStr, timeStr, durationMinutes, excludeAppointmentId = null) {
    const novoInicio = timeStringToMinutes(timeStr);
    const novoFim = novoInicio + durationMinutes;

    return state.appointments.some(app => {
        if (app.status === 'Cancelado') return false;
        if (excludeAppointmentId && String(app.id) === String(excludeAppointmentId)) return false;
        const appDate = app.data_agendamento ? app.data_agendamento.split('T')[0] : '';
        if (appDate !== dateStr) return false;

        const exInicio = timeStringToMinutes(app.horario_agendamento);
        const exDuracao = app.duracao_minutos || 45;
        const exFim = exInicio + exDuracao;

        return (novoInicio < exFim && novoFim > exInicio);
    });
}

function validateDateAndTimeRules(dateStr, timeStr, durationMinutes) {
    if (!dateStr || !timeStr) {
        return { valid: false, message: 'Data e horário são obrigatórios.' };
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    const selectedDate = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
        return { valid: false, message: 'A data do agendamento não pode ser no passado.' };
    }

    const dayOfWeek = selectedDate.getDay();
    const schedule = BUSINESS_HOURS[dayOfWeek];
    if (!schedule) {
        return { valid: false, message: 'O salão não abre aos domingos. Selecione de segunda a sábado.' };
    }

    const startMinutes = timeStringToMinutes(timeStr);
    const endMinutes = startMinutes + (durationMinutes || 45);
    const openMinutes = schedule.open * 60;
    const closeMinutes = schedule.close * 60;

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
        return {
            valid: false,
            message: `Atendimento fora do horário comercial (${schedule.open}h às ${schedule.close}h). O serviço termina às ${minutesToTimeString(endMinutes)}.`
        };
    }

    // Antecedência mínima de 1 hora se for para hoje
    const now = new Date();
    const isToday = selectedDate.getTime() === today.getTime();
    if (isToday) {
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
        const minAllowedMinutes = currentTotalMinutes + 60;

        if (startMinutes < minAllowedMinutes) {
            return {
                valid: false,
                message: `Agendamentos para hoje exigem no mínimo 1 hora de antecedência (a partir das ${minutesToTimeString(minAllowedMinutes)}).`
            };
        }
    }

    return { valid: true };
}

function updateAvailableTimeSlots(dateStr, selectElementId, currentSelectedTime = null, excludeId = null) {
    const timeSelect = document.getElementById(selectElementId);
    if (!timeSelect) return;

    timeSelect.innerHTML = '<option value="" selected disabled>-- Selecione um horário --</option>';
    if (!dateStr) return;

    const [y, m, d] = dateStr.split('-').map(Number);
    const selectedDate = new Date(y, m - 1, d);
    const dayOfWeek = selectedDate.getDay();
    const schedule = BUSINESS_HOURS[dayOfWeek];

    if (!schedule) {
        timeSelect.innerHTML = '<option value="" disabled selected>Fechado aos Domingos</option>';
        return;
    }

    const serviceSelectId = selectElementId === 'editTimeSelect' ? 'editServiceSelect' : 'serviceSelect';
    const sSelect = document.getElementById(serviceSelectId);
    const selectedOpt = sSelect ? sSelect.selectedOptions[0] : null;
    const duration = selectedOpt ? parseInt(selectedOpt.getAttribute('data-duration') || '45', 10) : 45;

    const openMin = schedule.open * 60;
    const closeMin = schedule.close * 60;
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();
    const minTimeToday = isToday ? (now.getHours() * 60 + now.getMinutes() + 60) : 0;

    let availableCount = 0;

    for (let m = openMin; m + duration <= closeMin; m += 15) {
        const slotTimeStr = minutesToTimeString(m);

        if (isToday && m < minTimeToday) {
            continue;
        }

        const isConflict = checkScheduleConflict(dateStr, slotTimeStr, duration, excludeId);
        const opt = document.createElement('option');
        opt.value = slotTimeStr;

        if (isConflict) {
            opt.textContent = `${slotTimeStr} (Ocupado / Indisponível)`;
            opt.disabled = true;
        } else {
            opt.textContent = `${slotTimeStr} - Livre (${duration} min)`;
            availableCount++;
        }

        if (currentSelectedTime && slotTimeStr === currentSelectedTime) {
            opt.selected = true;
        }

        timeSelect.appendChild(opt);
    }

    if (availableCount === 0) {
        timeSelect.innerHTML = '<option value="" disabled selected>Nenhum horário livre para este dia</option>';
    }
}

function updateServicePreview() {
    const select = document.getElementById('serviceSelect');
    const preview = document.getElementById('servicePreview');
    const catEl = document.getElementById('previewCategory');
    const durEl = document.getElementById('previewDuration');
    const priceEl = document.getElementById('previewPrice');

    if (!select || !select.value) {
        if (preview) preview.hidden = true;
        return;
    }

    const service = state.services.find(s => s.id === parseInt(select.value, 10));
    if (!service) {
        if (preview) preview.hidden = true;
        return;
    }

    if (preview) {
        preview.hidden = false;
        catEl.innerHTML = `<i class="fas fa-layer-group"></i> ${service.categoria}`;
        durEl.innerHTML = `<i class="fas fa-stopwatch"></i> Duração: ${service.duracao_minutos} min`;
        priceEl.innerHTML = `<i class="fas fa-brazilian-real-sign"></i> ${formatCurrency(service.preco)}`;
    }

    const dateInput = document.getElementById('dateSelect');
    if (dateInput && dateInput.value) {
        updateAvailableTimeSlots(dateInput.value, 'timeSelect');
    }
    updateSlotSummary();
}

function updateSlotSummary() {
    const summaryBox = document.getElementById('slotSummaryBox');
    const summaryText = document.getElementById('slotSummaryText');
    const timeSelect = document.getElementById('timeSelect');
    const serviceSelect = document.getElementById('serviceSelect');

    if (!summaryBox || !summaryText || !timeSelect || !timeSelect.value || !serviceSelect || !serviceSelect.value) {
        if (summaryBox) summaryBox.hidden = true;
        return;
    }

    const service = state.services.find(s => s.id === parseInt(serviceSelect.value, 10));
    const duration = service ? service.duracao_minutos : 45;
    const startMin = timeStringToMinutes(timeSelect.value);
    const endMin = startMin + duration;

    summaryBox.hidden = false;
    summaryText.innerHTML = `<strong>Janela reservada:</strong> ${timeSelect.value} até as ${minutesToTimeString(endMin)} (${duration} min de atendimento).`;
}

// =========================================================================
// 7. VALIDAÇÃO DOS CAMPOS
// =========================================================================

function validateField(inputElement, errorElement, validatorFn, errorMessage) {
    if (!inputElement || !errorElement) return false;
    const valid = validatorFn(inputElement.value);
    if (!valid) {
        inputElement.classList.add('error');
        errorElement.textContent = errorMessage;
        errorElement.classList.add('visible');
        return false;
    } else {
        inputElement.classList.remove('error');
        errorElement.textContent = '';
        errorElement.classList.remove('visible');
        return true;
    }
}

const validators = {
    name: v => v && v.trim().length >= 3 && /^[a-zA-ZÀ-ÿ\s]+$/.test(v.trim()),
    phone: v => v && v.replace(/\D/g, '').length >= 10,
    required: v => v && v.trim() !== ''
};

// =========================================================================
// 8. CRUD DE AGENDAMENTOS (INICIA SEM DADOS PRÉ-REGISTRADOS)
// =========================================================================

async function loadAppointments() {
    try {
        const resp = await fetch(`${API_BASE_URL}/agendamentos`);
        if (!resp.ok) throw new Error('API offline');
        const json = await resp.json();
        state.appointments = json.dados || [];
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(state.appointments));
    } catch (err) {
        const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
        if (saved) {
            try {
                state.appointments = JSON.parse(saved);
            } catch (e) {
                state.appointments = [];
            }
        } else {
            state.appointments = [];
            localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]));
        }
    }
    renderAppointmentsTable();
    updateMetrics();
}

async function handleCreateAppointment(e) {
    e.preventDefault();
    const feedback = document.getElementById('feedback');
    feedback.className = 'feedback';
    feedback.textContent = '';

    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const serviceSelect = document.getElementById('serviceSelect');
    const dateInput = document.getElementById('dateSelect');
    const timeSelect = document.getElementById('timeSelect');
    const obsInput = document.getElementById('observations');

    const isNameOk = validateField(nameInput, document.getElementById('nameError'), validators.name, 'Nome deve conter pelo menos 3 letras.');
    const isPhoneOk = validateField(phoneInput, document.getElementById('phoneError'), validators.phone, 'Informe um telefone válido com DDD (mínimo 10 dígitos).');
    const isServiceOk = validateField(serviceSelect, document.getElementById('serviceError'), validators.required, 'Por favor, selecione um serviço.');
    const isDateOk = validateField(dateInput, document.getElementById('dateError'), validators.required, 'Selecione uma data para o atendimento.');
    const isTimeOk = validateField(timeSelect, document.getElementById('timeError'), validators.required, 'Escolha um horário disponível.');

    if (!isNameOk || !isPhoneOk || !isServiceOk || !isDateOk || !isTimeOk) {
        feedback.className = 'feedback error';
        feedback.innerHTML = '<i class="fas fa-circle-exclamation"></i> <strong>Atenção:</strong> Preencha corretamente os campos destacados em vermelho.';
        showToast('Campos Inválidos', 'Verifique os dados informados no formulário.', 'warning');
        return;
    }

    const service = state.services.find(s => s.id === parseInt(serviceSelect.value, 10));
    const duration = service ? service.duracao_minutos : 45;

    const ruleCheck = validateDateAndTimeRules(dateInput.value, timeSelect.value, duration);
    if (!ruleCheck.valid) {
        feedback.className = 'feedback error';
        feedback.innerHTML = `<i class="fas fa-triangle-exclamation"></i> <strong>Regra de Agendamento:</strong> ${ruleCheck.message}`;
        showToast('Horário Inválido', ruleCheck.message, 'error');
        return;
    }

    const hasConflict = checkScheduleConflict(dateInput.value, timeSelect.value, duration);
    if (hasConflict) {
        feedback.className = 'feedback error';
        feedback.innerHTML = '<i class="fas fa-calendar-xmark"></i> <strong>Conflito Detectado:</strong> Já existe outro agendamento cadastrado neste dia e horário.';
        showToast('Conflito de Agenda', 'Este horário já está ocupado. Por favor, escolha outro slot.', 'error');
        return;
    }

    const newAppointment = {
        cliente_nome: nameInput.value.trim(),
        cliente_telefone: phoneInput.value.trim(),
        servico_id: parseInt(serviceSelect.value, 10),
        data_agendamento: dateInput.value,
        horario_agendamento: timeSelect.value,
        observacoes: obsInput.value.trim() || 'Nenhuma',
        status: 'Confirmado'
    };

    let savedItem = null;

    try {
        const resp = await fetch(`${API_BASE_URL}/agendamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAppointment)
        });

        if (resp.status === 409) {
            const errJson = await resp.json();
            throw new Error(errJson.erro || 'Conflito de horário no servidor.');
        }

        if (!resp.ok) {
            throw new Error(`Erro ${resp.status} ao salvar no servidor.`);
        }

        const json = await resp.json();
        savedItem = json.dado;
        showToast('Agendamento Confirmado', 'Horário agendado com sucesso!', 'success');
    } catch (err) {
        savedItem = {
            id: Date.now(),
            ...newAppointment,
            servico_nome: service ? service.nome : 'Serviço',
            servico_preco: service ? service.preco : 50.0,
            servico_duracao: duration,
            servico_categoria: service ? service.categoria : 'Geral',
            servico_icone: service ? service.icone : 'fa-spa',
            duracao_minutos: duration,
            criado_em: new Date().toISOString()
        };
        showToast('Agendamento Salvo', 'Horário registrado no sistema.', 'success');
    }

    state.appointments.unshift(savedItem);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(state.appointments));

    feedback.className = 'feedback success';
    feedback.innerHTML = `
        <i class="fas fa-circle-check"></i> <strong>Agendamento Confirmado com Sucesso!</strong><br>
        O atendimento para <strong>${savedItem.cliente_nome}</strong> (${service ? service.nome : 'Serviço'}) 
        no dia <strong>${formatDatePtBr(savedItem.data_agendamento)}</strong> às <strong>${savedItem.horario_agendamento}</strong> 
        está registrado em nosso sistema.
    `;

    document.getElementById('scheduleForm').reset();
    document.getElementById('servicePreview').hidden = true;
    document.getElementById('slotSummaryBox').hidden = true;

    dateInput.value = getTodayIsoString();
    updateAvailableTimeSlots(getTodayIsoString(), 'timeSelect');

    renderAppointmentsTable();
    updateMetrics();

    const tableSection = document.getElementById('painel-agendamentos');
    if (tableSection) {
        setTimeout(() => tableSection.scrollIntoView({ behavior: 'smooth' }), 500);
    }
}

function renderAppointmentsTable() {
    const tbody = document.getElementById('appointmentsTableBody');
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('appointmentsTable');
    if (!tbody || !table || !emptyState) return;

    let list = [...state.appointments];

    if (state.searchTerm.trim() !== '') {
        const term = state.searchTerm.toLowerCase().trim();
        list = list.filter(item => {
            const client = (item.cliente_nome || '').toLowerCase();
            const service = (item.servico_nome || '').toLowerCase();
            return client.includes(term) || service.includes(term);
        });
    }

    if (state.statusFilter !== 'todos') {
        list = list.filter(item => (item.status || '').toLowerCase() === state.statusFilter.toLowerCase());
    }

    list.sort((a, b) => {
        if (state.sortBy === 'data-asc') {
            const dtA = `${a.data_agendamento} ${a.horario_agendamento}`;
            const dtB = `${b.data_agendamento} ${b.horario_agendamento}`;
            return dtA.localeCompare(dtB);
        } else if (state.sortBy === 'data-desc') {
            const dtA = `${a.data_agendamento} ${a.horario_agendamento}`;
            const dtB = `${b.data_agendamento} ${b.horario_agendamento}`;
            return dtB.localeCompare(dtA);
        } else if (state.sortBy === 'valor-desc') {
            return (b.servico_preco || 0) - (a.servico_preco || 0);
        } else if (state.sortBy === 'valor-asc') {
            return (a.servico_preco || 0) - (b.servico_preco || 0);
        } else if (state.sortBy === 'nome-asc') {
            return (a.cliente_nome || '').localeCompare(b.cliente_nome || '');
        }
        return 0;
    });

    if (list.length === 0) {
        tbody.innerHTML = '';
        table.hidden = true;
        table.style.display = 'none';
        emptyState.hidden = false;
        emptyState.style.display = 'block';
        return;
    }

    table.hidden = false;
    table.style.display = 'table';
    emptyState.hidden = true;
    emptyState.style.display = 'none';

    tbody.innerHTML = list.map(item => {
        const statusClass = (item.status || 'Confirmado').toLowerCase();
        const icon = item.servico_icone || 'fa-cut';
        const preco = item.servico_preco || 0;
        const duracao = item.duracao_minutos || item.servico_duracao || 45;

        return `
            <tr data-appointment-id="${item.id}">
                <td class="client-name-cell">${item.cliente_nome}</td>
                <td>
                    <a href="https://wa.me/55${(item.cliente_telefone || '').replace(/\D/g, '')}" target="_blank" rel="noopener" style="color: inherit; text-decoration: none;" title="Abrir no WhatsApp">
                        <i class="fab fa-whatsapp" style="color: #22c55e;"></i> ${item.cliente_telefone}
                    </a>
                </td>
                <td>
                    <div class="service-cell">
                        <i class="fas ${icon}"></i>
                        <span>${item.servico_nome || 'Serviço'}</span>
                    </div>
                </td>
                <td>
                    <strong>${formatDatePtBr(item.data_agendamento)}</strong> às ${item.horario_agendamento}
                </td>
                <td><i class="fas fa-clock text-muted"></i> ${duracao} min</td>
                <td><strong>${formatCurrency(preco)}</strong></td>
                <td>
                    <span class="status-badge ${statusClass}">
                        <i class="fas ${statusClass === 'confirmado' ? 'fa-check' : statusClass === 'pendente' ? 'fa-clock' : 'fa-ban'}"></i>
                        ${item.status || 'Confirmado'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons-group">
                        <button type="button" class="btn-action edit" data-edit-id="${item.id}" title="Editar agendamento" aria-label="Editar">
                            <i class="fas fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-action delete" data-delete-id="${item.id}" title="Excluir agendamento" aria-label="Excluir">
                            <i class="fas fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('[data-edit-id]').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-edit-id')));
    });

    tbody.querySelectorAll('[data-delete-id]').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-delete-id')));
    });
}

function openEditModal(id) {
    const item = state.appointments.find(a => String(a.id) === String(id));
    if (!item) {
        showToast('Erro', 'Agendamento não encontrado para edição.', 'error');
        return;
    }

    document.getElementById('editAppointmentId').value = item.id;
    document.getElementById('editClientName').value = item.cliente_nome;
    document.getElementById('editClientPhone').value = item.cliente_telefone;
    document.getElementById('editServiceSelect').value = item.servico_id;
    document.getElementById('editStatusSelect').value = item.status || 'Confirmado';
    document.getElementById('editDateSelect').value = item.data_agendamento ? item.data_agendamento.split('T')[0] : getTodayIsoString();
    document.getElementById('editObservations').value = item.observacoes || '';

    updateAvailableTimeSlots(document.getElementById('editDateSelect').value, 'editTimeSelect', item.horario_agendamento, item.id);

    const editTimeSelect = document.getElementById('editTimeSelect');
    if (editTimeSelect) {
        editTimeSelect.value = item.horario_agendamento;
    }

    const modal = document.getElementById('editModal');
    modal.hidden = false;
    modal.style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
    }
}

async function handleSaveEdit(e) {
    e.preventDefault();
    const id = document.getElementById('editAppointmentId').value;
    const name = document.getElementById('editClientName').value.trim();
    const phone = document.getElementById('editClientPhone').value.trim();
    const serviceId = parseInt(document.getElementById('editServiceSelect').value, 10);
    const status = document.getElementById('editStatusSelect').value;
    const date = document.getElementById('editDateSelect').value;
    const time = document.getElementById('editTimeSelect').value;
    const obs = document.getElementById('editObservations').value.trim();

    if (!name || !phone || !serviceId || !date || !time) {
        showToast('Campos Obrigatórios', 'Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    const service = state.services.find(s => s.id === serviceId);
    const duration = service ? service.duracao_minutos : 45;

    if (status !== 'Cancelado') {
        const ruleCheck = validateDateAndTimeRules(date, time, duration);
        if (!ruleCheck.valid) {
            showToast('Horário Inválido', ruleCheck.message, 'error');
            return;
        }

        const conflict = checkScheduleConflict(date, time, duration, id);
        if (conflict) {
            showToast('Conflito de Horário', 'Já existe outro agendamento neste horário.', 'error');
            return;
        }
    }

    const updatePayload = {
        cliente_nome: name,
        cliente_telefone: phone,
        servico_id: serviceId,
        data_agendamento: date,
        horario_agendamento: time,
        observacoes: obs,
        status: status
    };

    try {
        const resp = await fetch(`${API_BASE_URL}/agendamentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });

        if (!resp.ok) throw new Error('Falha no servidor.');
        const json = await resp.json();
        const updated = json.dado;

        const idx = state.appointments.findIndex(a => String(a.id) === String(id));
        if (idx !== -1) {
            state.appointments[idx] = updated;
        }
        showToast('Atualizado!', 'Agendamento atualizado com sucesso.', 'success');
    } catch (err) {
        const idx = state.appointments.findIndex(a => String(a.id) === String(id));
        if (idx !== -1) {
            state.appointments[idx] = {
                ...state.appointments[idx],
                ...updatePayload,
                servico_nome: service ? service.nome : state.appointments[idx].servico_nome,
                servico_preco: service ? service.preco : state.appointments[idx].servico_preco,
                servico_duracao: duration,
                duracao_minutos: duration,
                servico_categoria: service ? service.categoria : state.appointments[idx].servico_categoria,
                servico_icone: service ? service.icone : state.appointments[idx].servico_icone
            };
        }
        showToast('Atualizado!', 'Alterações salvas com sucesso.', 'info');
    }

    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(state.appointments));
    closeEditModal();
    renderAppointmentsTable();
    updateMetrics();
}

function openDeleteModal(id) {
    const item = state.appointments.find(a => String(a.id) === String(id));
    if (!item) return;

    state.deletingId = id;
    const previewEl = document.getElementById('deleteItemPreview');
    if (previewEl) {
        previewEl.innerHTML = `
            <strong>Cliente:</strong> ${item.cliente_nome}<br>
            <strong>Serviço:</strong> ${item.servico_nome || 'Serviço'}<br>
            <strong>Data & Horário:</strong> ${formatDatePtBr(item.data_agendamento)} às ${item.horario_agendamento}
        `;
    }

    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.hidden = false;
        modal.style.display = 'flex';
    }
}

function closeDeleteModal() {
    state.deletingId = null;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
    }
}

async function handleConfirmDelete() {
    const id = state.deletingId;
    if (!id) return;

    try {
        await fetch(`${API_BASE_URL}/agendamentos/${id}`, { method: 'DELETE' });
        showToast('Excluído', 'Agendamento removido com sucesso.', 'success');
    } catch (err) {
        showToast('Excluído', 'Agendamento removido da lista.', 'info');
    }

    state.appointments = state.appointments.filter(a => String(a.id) !== String(id));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(state.appointments));

    closeDeleteModal();
    renderAppointmentsTable();
    updateMetrics();
}

// =========================================================================
// 9. MÉTRICAS EM TEMPO REAL
// =========================================================================

function updateMetrics() {
    const totalEl = document.getElementById('metricTotal');
    const revenueEl = document.getElementById('metricRevenue');
    const topServiceEl = document.getElementById('metricTopService');
    const splitEl = document.getElementById('metricStatusSplit');

    const nonCancelled = state.appointments.filter(a => a.status !== 'Cancelado');
    const totalVisible = state.appointments.length;
    const revenue = nonCancelled.reduce((acc, curr) => acc + (parseFloat(curr.servico_preco) || 0), 0);

    const serviceCounts = {};
    nonCancelled.forEach(item => {
        const name = item.servico_nome || 'Outro';
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });

    let topService = '-';
    let maxCount = 0;
    for (const [name, count] of Object.entries(serviceCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topService = `${name} (${count}x)`;
        }
    }

    const confirmedCount = state.appointments.filter(a => a.status === 'Confirmado').length;
    const pendingCount = state.appointments.filter(a => a.status === 'Pendente').length;

    if (totalEl) totalEl.textContent = totalVisible;
    if (revenueEl) revenueEl.textContent = formatCurrency(revenue);
    if (topServiceEl) topServiceEl.textContent = topService;
    if (splitEl) splitEl.textContent = `${confirmedCount} / ${pendingCount}`;
}

// =========================================================================
// 10. HORÁRIOS ESTÁTICOS DE FUNCIONAMENTO
// =========================================================================

function renderBusinessHours() {
    const container = document.getElementById('hoursList');
    if (!container) return;

    const display = [
        { day: 'Segunda a Sexta', time: '09:00 – 20:00' },
        { day: 'Sábado', time: '08:00 – 18:00' },
        { day: 'Domingo', time: 'Fechado (Descanso da equipe)' }
    ];

    container.innerHTML = display.map(item => `
        <div class="hours-item">
            <div class="day">${item.day}</div>
            <div class="time">${item.time}</div>
        </div>
    `).join('');
}

// =========================================================================
// 11. CONTROLE DE TEMA (CLARO / ESCURO)
// =========================================================================

function initTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;

    applyTheme(isDark);

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentDark = document.body.classList.contains('dark-theme');
            applyTheme(!currentDark);
        });
    }
}

function applyTheme(isDark) {
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');

    if (isDark) {
        document.body.classList.add('dark-theme');
        if (icon) icon.className = 'fas fa-sun';
        if (text) text.textContent = 'Modo Claro';
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        if (icon) icon.className = 'fas fa-moon';
        if (text) text.textContent = 'Modo Escuro';
        localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
}

// =========================================================================
// 12. INICIALIZAÇÃO GERAL DA APLICAÇÃO (DOM READY)
// =========================================================================

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    renderBusinessHours();
    await fetchServices();

    const dateInput = document.getElementById('dateSelect');
    if (dateInput) {
        const todayStr = getTodayIsoString();
        dateInput.setAttribute('min', todayStr);
        dateInput.value = todayStr;
        updateAvailableTimeSlots(todayStr, 'timeSelect');
    }

    const editDateInput = document.getElementById('editDateSelect');
    if (editDateInput) {
        editDateInput.setAttribute('min', getTodayIsoString());
    }

    await loadAppointments();

    document.getElementById('clientPhone')?.addEventListener('input', e => applyPhoneMask(e.target));
    document.getElementById('editClientPhone')?.addEventListener('input', e => applyPhoneMask(e.target));
    document.getElementById('serviceSelect')?.addEventListener('change', updateServicePreview);
    document.getElementById('timeSelect')?.addEventListener('change', updateSlotSummary);

    document.getElementById('dateSelect')?.addEventListener('change', e => {
        updateAvailableTimeSlots(e.target.value, 'timeSelect');
        updateSlotSummary();
    });

    document.getElementById('editDateSelect')?.addEventListener('change', e => {
        updateAvailableTimeSlots(e.target.value, 'editTimeSelect', null, document.getElementById('editAppointmentId').value);
    });

    document.getElementById('editServiceSelect')?.addEventListener('change', () => {
        const d = document.getElementById('editDateSelect').value;
        updateAvailableTimeSlots(d, 'editTimeSelect', null, document.getElementById('editAppointmentId').value);
    });

    document.getElementById('scheduleForm')?.addEventListener('submit', handleCreateAppointment);
    document.getElementById('editForm')?.addEventListener('submit', handleSaveEdit);

    document.getElementById('btnCloseModal')?.addEventListener('click', closeEditModal);
    document.getElementById('btnCancelEdit')?.addEventListener('click', closeEditModal);
    document.getElementById('btnCloseDeleteModal')?.addEventListener('click', closeDeleteModal);
    document.getElementById('btnCancelDelete')?.addEventListener('click', closeDeleteModal);
    document.getElementById('btnConfirmDelete')?.addEventListener('click', handleConfirmDelete);

    window.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeEditModal();
            closeDeleteModal();
        }
    });

    document.getElementById('clientName')?.addEventListener('blur', e => {
        validateField(e.target, document.getElementById('nameError'), validators.name, 'Nome deve conter pelo menos 3 letras.');
    });

    document.getElementById('clientPhone')?.addEventListener('blur', e => {
        validateField(e.target, document.getElementById('phoneError'), validators.phone, 'Informe um telefone válido com DDD.');
    });

    document.querySelectorAll('#categoryFilter .filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#categoryFilter .filter-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeFilterCategory = btn.getAttribute('data-cat');
            renderServices();
        });
    });

    const searchInput = document.getElementById('appointmentSearch');
    const clearSearchBtn = document.getElementById('btnClearSearch');

    if (searchInput) {
        searchInput.addEventListener('input', e => {
            state.searchTerm = e.target.value;
            if (clearSearchBtn) clearSearchBtn.hidden = state.searchTerm === '';
            renderAppointmentsTable();
            updateMetrics();
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                state.searchTerm = '';
                clearSearchBtn.hidden = true;
                renderAppointmentsTable();
                updateMetrics();
            }
        });
    }

    document.getElementById('filterStatus')?.addEventListener('change', e => {
        state.statusFilter = e.target.value;
        renderAppointmentsTable();
        updateMetrics();
    });

    document.getElementById('sortBy')?.addEventListener('change', e => {
        state.sortBy = e.target.value;
        renderAppointmentsTable();
    });

    document.getElementById('btnReloadAppointments')?.addEventListener('click', async () => {
        await loadAppointments();
        showToast('Atualizado', 'Lista de agendamentos recarregada com sucesso.', 'info');
    });

    document.getElementById('btnRetryServices')?.addEventListener('click', async () => {
        await fetchServices();
    });
});
