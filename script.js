// =============================================
// DADOS (simulando um pequeno banco de dados)
// =============================================
const servicesData = [
    { id: 1, name: 'Corte Feminino', icon: '✂️', price: 'R$ 60,00', duration: '45 min' },
    { id: 2, name: 'Corte Masculino', icon: '💈', price: 'R$ 45,00', duration: '30 min' },
    { id: 3, name: 'Escova / Prancha', icon: '🌀', price: 'R$ 50,00', duration: '40 min' },
    { id: 4, name: 'Coloração', icon: '🎨', price: 'R$ 120,00', duration: '1h30' },
    { id: 5, name: 'Manicure', icon: '💅', price: 'R$ 35,00', duration: '40 min' },
    { id: 6, name: 'Pedicure', icon: '🦶', price: 'R$ 40,00', duration: '45 min' },
    { id: 7, name: 'Design de Sobrancelhas', icon: '👁️', price: 'R$ 30,00', duration: '25 min' },
    { id: 8, name: 'Hidratação Capilar', icon: '💧', price: 'R$ 70,00', duration: '1h' }
];

const hoursData = [
    { day: 'Segunda', time: '9h – 20h' },
    { day: 'Terça', time: '9h – 20h' },
    { day: 'Quarta', time: '9h – 20h' },
    { day: 'Quinta', time: '9h – 20h' },
    { day: 'Sexta', time: '9h – 20h' },
    { day: 'Sábado', time: '8h – 18h' },
    { day: 'Domingo', time: 'Fechado' }
];

// =============================================
// 1. RENDERIZAÇÃO DOS SERVIÇOS (INTERAÇÃO 1)
// =============================================
function renderServices() {
    const container = document.getElementById('servicesList');
    if (!container) return;
    
    container.innerHTML = servicesData.map(service => `
        <div class="service-card" data-id="${service.id}">
            <div class="icon">${service.icon}</div>
            <h3>${service.name}</h3>
            <div class="price">${service.price}</div>
            <div class="duration">⏱ ${service.duration}</div>
        </div>
    `).join('');
}

// =============================================
// 2. RENDERIZAÇÃO DOS HORÁRIOS
// =============================================
function renderHours() {
    const container = document.getElementById('hoursList');
    if (!container) return;
    
    container.innerHTML = hoursData.map(item => `
        <div class="hours-item">
            <div class="day">${item.day}</div>
            <div class="time">${item.time}</div>
        </div>
    `).join('');
}

// =============================================
// 3. POPULAR SELECT DE SERVIÇOS
// =============================================
function populateServiceSelect() {
    const select = document.getElementById('serviceSelect');
    if (!select) return;
    
    servicesData.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.name} - ${service.price}`;
        select.appendChild(option);
    });
}

// =============================================
// 4. VALIDAÇÃO DE FORMULÁRIO (INTERAÇÃO 2)
// =============================================
function validateField(inputId, errorId, validationFn, errorMessage) {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    
    if (!input || !error) return false;
    
    const isValid = validationFn(input.value);
    
    if (!isValid) {
        input.classList.add('error');
        error.textContent = errorMessage;
        error.classList.add('visible');
        return false;
    } else {
        input.classList.remove('error');
        error.classList.remove('visible');
        return true;
    }
}

// Validações específicas
function isValidName(value) {
    return value.trim().length >= 3 && /^[a-zA-ZÀ-ÿ\s]+$/.test(value.trim());
}

function isValidPhone(value) {
    const clean = value.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 11;
}

function isValidDate(value) {
    if (!value) return false;
    const selected = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
}

function isValidTime(value) {
    return value && value.length > 0;
}

function isValidService(value) {
    return value !== '' && value !== null;
}

// =============================================
// 5. ENVIO DO FORMULÁRIO (INTERAÇÃO 3)
// =============================================
function handleFormSubmit(event) {
    event.preventDefault();
    
    const feedback = document.getElementById('feedback');
    feedback.className = 'feedback';
    
    // Validar todos os campos
    const isNameValid = validateField(
        'clientName', 'nameError', 
        isValidName, 'Nome deve ter pelo menos 3 caracteres e apenas letras.'
    );
    
    const isPhoneValid = validateField(
        'clientPhone', 'phoneError',
        isValidPhone, 'Telefone inválido. Use (DDD) + número (mínimo 10 dígitos).'
    );
    
    const isServiceValid = validateField(
        'serviceSelect', 'serviceError',
        isValidService, 'Por favor, selecione um serviço.'
    );
    
    const isDateValid = validateField(
        'dateSelect', 'dateError',
        isValidDate, 'Data deve ser hoje ou futura.'
    );
    
    const isTimeValid = validateField(
        'timeSelect', 'timeError',
        isValidTime, 'Por favor, selecione um horário.'
    );
    
    // Se algum campo for inválido, interrompe
    if (!isNameValid || !isPhoneValid || !isServiceValid || !isDateValid || !isTimeValid) {
        feedback.className = 'feedback error';
        feedback.textContent = '❌ Por favor, corrija os campos destacados em vermelho.';
        return;
    }
    
    // Capturar dados
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const serviceId = document.getElementById('serviceSelect').value;
    const date = document.getElementById('dateSelect').value;
    const time = document.getElementById('timeSelect').value;
    const obs = document.getElementById('observations').value.trim();
    
    const service = servicesData.find(s => s.id == serviceId);
    const serviceName = service ? service.name : 'Serviço não identificado';
    
    // Montar objeto da solicitação
    const request = {
        cliente: name,
        telefone: phone,
        servico: serviceName,
        data: date,
        horario: time,
        observacoes: obs || 'Nenhuma',
        dataSolicitacao: new Date().toLocaleString()
    };
    
    // Simular envio (mostrar no console)
    console.log('📋 Solicitação de agendamento:', request);
    
    // Feedback de sucesso
    feedback.className = 'feedback success';
    feedback.innerHTML = `
        ✅ <strong>Solicitação enviada com sucesso!</strong><br>
        <span style="font-size:0.95rem;">
            Olá ${name}, seu agendamento para <strong>${serviceName}</strong> no dia 
            ${formatDate(date)} às ${time} foi registrado.<br>
            Entraremos em contato em breve para confirmar.
        </span>
    `;
    
    // Resetar formulário (opcional - manter dados para teste)
    // document.getElementById('scheduleForm').reset();
    // document.getElementById('serviceSelect').selectedIndex = 0;
}

// =============================================
// 6. FUNÇÕES AUXILIARES
// =============================================
function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

// =============================================
// 7. INICIALIZAÇÃO E EVENTOS (INTERAÇÃO 4)
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    // Renderizar dados
    renderServices();
    renderHours();
    populateServiceSelect();
    
    // Definir data mínima como hoje
    const dateInput = document.getElementById('dateSelect');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }
    
    // Adicionar evento de submit ao formulário
    const form = document.getElementById('scheduleForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Adicionar validação em tempo real nos campos (interação extra)
    const nameInput = document.getElementById('clientName');
    if (nameInput) {
        nameInput.addEventListener('blur', function() {
            validateField('clientName', 'nameError', isValidName, 
                'Nome deve ter pelo menos 3 caracteres e apenas letras.');
        });
    }
    
    const phoneInput = document.getElementById('clientPhone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            validateField('clientPhone', 'phoneError', isValidPhone,
                'Telefone inválido. Use (DDD) + número (mínimo 10 dígitos).');
        });
    }
    
    console.log('✨ Agenda Fácil carregada com sucesso!');
});