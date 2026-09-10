// =============================================
// DADOS
// =============================================
const servicesData = [
    { id: 1, name: 'Corte Feminino', icon: 'fa-cut', price: 'R$ 60,00', duration: '45 min' },
    { id: 2, name: 'Corte Masculino', icon: 'fa-cut', price: 'R$ 45,00', duration: '30 min' },
    { id: 3, name: 'Escova / Prancha', icon: 'fa-wind', price: 'R$ 50,00', duration: '40 min' },
    { id: 4, name: 'Coloração', icon: 'fa-palette', price: 'R$ 120,00', duration: '1h30' },
    { id: 5, name: 'Manicure', icon: 'fa-hand-sparkles', price: 'R$ 35,00', duration: '40 min' },
    { id: 6, name: 'Pedicure', icon: 'fa-shoe-prints', price: 'R$ 40,00', duration: '45 min' }, // CORRIGIDO
    { id: 7, name: 'Design de Sobrancelhas', icon: 'fa-eye', price: 'R$ 30,00', duration: '25 min' },
    { id: 8, name: 'Hidratação Capilar', icon: 'fa-droplet', price: 'R$ 70,00', duration: '1h' }
];

// Mapeamento de dias da semana (0=domingo, 1=segunda, ...)
const hoursMap = {
    1: { open: 9, close: 20 },  // Segunda
    2: { open: 9, close: 20 },  // Terça
    3: { open: 9, close: 20 },  // Quarta
    4: { open: 9, close: 20 },  // Quinta
    5: { open: 9, close: 20 },  // Sexta
    6: { open: 8, close: 18 },  // Sábado
    0: null                     // Domingo (fechado)
};

// =============================================
// RENDERIZAÇÃO DOS SERVIÇOS (Font Awesome)
// =============================================
function renderServices() {
    const container = document.getElementById('servicesList');
    if (!container) return;
    container.innerHTML = servicesData.map(service => `
        <div class="service-card" data-id="${service.id}">
            <div class="icon"><i class="fas ${service.icon}"></i></div>
            <h3>${service.name}</h3>
            <div class="price">${service.price}</div>
            <div class="duration">⏱ ${service.duration}</div>
        </div>
    `).join('');
}

// =============================================
// RENDERIZAÇÃO DOS HORÁRIOS (estático)
// =============================================
function renderHours() {
    const container = document.getElementById('hoursList');
    if (!container) return;
    const display = [
        { day: 'Segunda a Sexta', time: '9h – 20h' },
        { day: 'Sábado', time: '8h – 18h' },
        { day: 'Domingo', time: 'Fechado' }
    ];
    container.innerHTML = display.map(item => `
        <div class="hours-item">
            <div class="day">${item.day}</div>
            <div class="time">${item.time}</div>
        </div>
    `).join('');
}

// =============================================
// POPULAR SELECT DE SERVIÇOS (sem opção vazia)
// =============================================
function populateServiceSelect() {
    const select = document.getElementById('serviceSelect');
    if (!select) return;
    select.innerHTML = ''; // limpa
    servicesData.forEach(service => {
        const opt = document.createElement('option');
        opt.value = service.id;
        opt.textContent = `${service.name} - ${service.price}`;
        select.appendChild(opt);
    });
    // Seleciona o primeiro
    if (select.options.length > 0) select.selectedIndex = 0;
}

// =============================================
// GERAR SLOTS DE HORÁRIOS (15 em 15 min)
// =============================================
function generateTimeSlots(openHour, closeHour) {
    const slots = [];
    let current = openHour * 60; // minutos
    const end = closeHour * 60;
    while (current < end) {
        const h = Math.floor(current / 60);
        const m = current % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        current += 15;
    }
    return slots;
}

// =============================================
// ATUALIZAR SELECT DE HORÁRIOS CONFORME DATA
// =============================================
function updateTimeSlots(dateStr) {
    const timeSelect = document.getElementById('timeSelect');
    const timeError = document.getElementById('timeError');
    if (!timeSelect) return;

    // Limpa
    timeSelect.innerHTML = '<option value="">-- Selecione um horário --</option>';
    timeError.classList.remove('visible');
    timeSelect.classList.remove('error');

    if (!dateStr) return;

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay(); // 0=domingo

    const hours = hoursMap[dayOfWeek];
    if (!hours) {
        // Domingo fechado
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Fechado';
        opt.disabled = true;
        timeSelect.appendChild(opt);
        return;
    }

    // Gera todos os slots do dia
    let slots = generateTimeSlots(hours.open, hours.close);

    // Se for hoje, filtra horários já passados (com margem de 5 min)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.getTime() === today.getTime();
    if (isToday) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes() + 5; // margem
        slots = slots.filter(time => {
            const [h, m] = time.split(':').map(Number);
            return (h * 60 + m) >= currentMinutes;
        });
    }

    if (slots.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'Nenhum horário disponível';
        opt.disabled = true;
        timeSelect.appendChild(opt);
        return;
    }

    slots.forEach(time => {
        const opt = document.createElement('option');
        opt.value = time;
        opt.textContent = time;
        timeSelect.appendChild(opt);
    });

    // Seleciona o primeiro disponível
    if (timeSelect.options.length > 1) timeSelect.selectedIndex = 1;
}

// =============================================
// VALIDAÇÕES
// =============================================
function validateField(inputId, errorId, validator, msg) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    if (!input || !error) return false;
    const isValid = validator(input.value);
    if (!isValid) {
        input.classList.add('error');
        error.textContent = msg;
        error.classList.add('visible');
        return false;
    } else {
        input.classList.remove('error');
        error.classList.remove('visible');
        return true;
    }
}
const isValidName = v => v.trim().length >= 3 && /^[a-zA-ZÀ-ÿ\s]+$/.test(v.trim());
const isValidPhone = v => v.replace(/\D/g, '').length >= 10;
const isValidDate = v => new Date(v) >= new Date(new Date().setHours(0,0,0,0));
const isValidTime = v => v && v !== '';
const isValidService = v => v && v !== '';

// =============================================
// SUBMIT DO FORMULÁRIO
// =============================================
function handleSubmit(e) {
    e.preventDefault();
    const feedback = document.getElementById('feedback');
    feedback.className = 'feedback';

    const nameOk = validateField('clientName', 'nameError', isValidName, 'Nome deve ter pelo menos 3 letras.');
    const phoneOk = validateField('clientPhone', 'phoneError', isValidPhone, 'Telefone inválido (mínimo 10 dígitos).');
    const serviceOk = validateField('serviceSelect', 'serviceError', isValidService, 'Selecione um serviço.');
    const dateOk = validateField('dateSelect', 'dateError', isValidDate, 'Data deve ser hoje ou futura.');
    const timeOk = validateField('timeSelect', 'timeError', isValidTime, 'Selecione um horário disponível.');

    if (!nameOk || !phoneOk || !serviceOk || !dateOk || !timeOk) {
        feedback.className = 'feedback error';
        feedback.textContent = '❌ Corrija os campos destacados.';
        return;
    }

    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const serviceId = document.getElementById('serviceSelect').value;
    const date = document.getElementById('dateSelect').value;
    const time = document.getElementById('timeSelect').value;
    const obs = document.getElementById('observations').value.trim();

    const service = servicesData.find(s => s.id == serviceId);
    const serviceName = service ? service.name : '';

    const request = {
        cliente: name,
        telefone: phone,
        servico: serviceName,
        data: date,
        horario: time,
        observacoes: obs || 'Nenhuma',
        dataSolicitacao: new Date().toLocaleString()
    };
    console.log('📋 Solicitação:', request);

    feedback.className = 'feedback success';
    feedback.innerHTML = `
        ✅ <strong>Solicitação enviada com sucesso!</strong><br>
        Olá ${name}, seu agendamento para <strong>${serviceName}</strong> no dia 
        ${formatDate(date)} às ${time} foi registrado.<br>
        Entraremos em contato em breve.
    `;
}

function formatDate(s) {
    const [y,m,d] = s.split('-');
    return `${d}/${m}/${y}`;
}

// =============================================
// INICIALIZAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    renderServices();
    renderHours();
    populateServiceSelect();

    const dateInput = document.getElementById('dateSelect');
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
    dateInput.value = today;
    // Atualiza horários para hoje
    updateTimeSlots(today);

    // Quando a data mudar, atualiza horários
    dateInput.addEventListener('change', function() {
        const selected = this.value;
        if (!selected) return;
        updateTimeSlots(selected);
        // Limpa feedback
        const feedback = document.getElementById('feedback');
        feedback.className = 'feedback';
        feedback.textContent = '';
    });

    // Submit
    document.getElementById('scheduleForm').addEventListener('submit', handleSubmit);

    // Validações em blur
    document.getElementById('clientName').addEventListener('blur', function() {
        validateField('clientName', 'nameError', isValidName, 'Nome com pelo menos 3 letras.');
    });
    document.getElementById('clientPhone').addEventListener('blur', function() {
        validateField('clientPhone', 'phoneError', isValidPhone, 'Telefone inválido.');
    });
    document.getElementById('dateSelect').addEventListener('blur', function() {
        validateField('dateSelect', 'dateError', isValidDate, 'Data deve ser hoje ou futura.');
    });
});