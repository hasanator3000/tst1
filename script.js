// ------------ Глобальные переменные ------------
let db; // База данных
let currentDayOffset = 0; // Смещение для выбора даты

// ------------ Общие функции интерфейса ------------
function toggleVisibility(elements) {
    elements.forEach(({element, visible}) => {
        element.style.display = visible ? 'block' : 'none';
    });
}

function toggleReadMore() {
    toggleVisibility([
        {element: document.getElementById('hidden-text'), visible: hiddenText.style.display === 'none'},
        {element: document.getElementById('text1'), visible: hiddenText.style.display !== 'none'},
        {element: document.getElementById('hide-button'), visible: hiddenText.style.display === 'none'},
        {element: document.getElementById('gradient-overlay'), visible: hiddenText.style.display !== 'none'}
    ]);
}

// ------------ Функции для модального окна ------------
function manageModalSteps(step) {
    // Управление отображением шагов
    document.querySelectorAll('.step').forEach(stepElement => {
        stepElement.style.display = 'none';
    });
    document.getElementById(`step${step}`).style.display = 'flex';

    // Управление кнопками навигации
    const backButton = document.querySelector('.back-button');
    const closeButton = document.querySelector('.close-modal');
    backButton.style.display = step === 1 || step === 5 ? 'none' : 'block';
    closeButton.style.display = step === 5 ? 'none' : 'block';

    // Инициализация специфичных для шага обработчиков
    if (step === 4) {
        initStep4Validation();
    }
    
    // Активация кнопки "Продолжить" для текущего шага
    updateContinueButton(step);
}

function updateContinueButton(step) {
    const nextButtons = document.querySelectorAll('[id^="next"]');
    nextButtons.forEach(button => button.disabled = true);
    
    switch(step) {
        case 1:
            document.getElementById('next1').disabled = !document.getElementById('model').value;
            break;
        case 2:
            const hasSelectedServices = document.querySelectorAll('input[name="service"]:checked').length > 0;
            document.getElementById('next2').disabled = !hasSelectedServices;
            break;
        case 3:
            document.getElementById('next3').disabled = !document.querySelector('.time-slot.selected');
            break;
    }
}

function nextStep(step) {
    if (step === 5) {
        saveAppointment();
    } else {
        manageModalSteps(step + 1);
    }
}

function prevStep() {
    const currentStep = Array.from(document.querySelectorAll('.step'))
        .findIndex(el => el.style.display === 'flex') + 1;
    if (currentStep > 1) manageModalSteps(currentStep - 1);
}

// ------------ Работа с данными ------------
async function populateOptions(config) {
    const {container, items, template, emptyMessage} = config;
    container.innerHTML = '';

    if (!items?.length) {
        container.innerHTML = emptyMessage || '<p>Нет доступных данных</p>';
        return;
    }

    items.forEach(item => {
        container.insertAdjacentHTML('beforeend', template(item));
    });
}

async function loadStepData(step) {
    try {
        switch(step) {
            case 1:
                const brands = await dbFunctions.getBrands(db);
                await populateOptions({
                    container: document.getElementById('brand'),
                    items: brands,
                    template: brand => `<option value="${brand.id}">${brand.name}</option>`
                });
                break;
            
            case 2:
                const modelId = document.getElementById('model').value;
                const services = await dbFunctions.getServices(db, modelId);
                await populateOptions({
                    container: document.getElementById('services-container'),
                    items: services,
                    template: service => `
                        <label>
                            <input type="checkbox" name="service" 
                                   value="${service.id}" 
                                   data-price="${service.price}" 
                                   data-duration="${service.duration}"
                                   onchange="updateTotal()">
                            ${service.name} (${service.price}₽, ${service.duration} мин)
                        </label>
                    `,
                    emptyMessage: '<p>Услуги для данного авто пока что добавляются, скоро все исправим)</p>'
                });
                break;
        }
    } catch (error) {
        console.error(`Ошибка загрузки данных для шага ${step}:`, error);
    }
}

// ------------ Валидация и форматирование ------------
function createInputHandler({validate, format}) {
    return function(e) {
        if (validate) validate(e.target);
        if (format) format(e.target);
        updateContinueButton(getCurrentStep());
    }
}

function initStep4Validation() {
    const handlers = {
        validate: input => {
            input.value = input.id === 'clientName' 
                ? input.value.replace(/[^а-яА-ЯёЁ\s]/g, '') 
                : input.value;
        },
        format: input => {
            if (input.id === 'clientName') {
                input.value = input.value.toLowerCase()
                    .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
            if (input.id === 'clientPhone') {
                // Форматирование телефона
            }
        }
    };

    ['clientName', 'clientPhone', 'clientCarNumber'].forEach(id => {
        document.getElementById(id).addEventListener('input', createInputHandler(handlers));
    });
}

// ------------ Инициализация и обработчики ------------
document.getElementById('fixed-button').addEventListener('click', async () => {
    try {
        db = await dbFunctions.initDatabase();
        await loadStepData(1);
        manageModalSteps(1);
    } catch (error) {
        console.error("Ошибка инициализации:", error);
    }
});

document.getElementById('brand').addEventListener('change', async function() {
    await loadStepData(1);
    document.getElementById('model').disabled = !this.value;
    updateContinueButton(1);
});

document.getElementById('model').addEventListener('change', async function() {
    await loadStepData(2);
    updateContinueButton(2);
});

document.querySelector('.time-slots').addEventListener('click', e => {
    if (e.target.classList.contains('time-slot')) {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        e.target.classList.add('selected');
        updateContinueButton(3);
    }
});

// ------------ Вспомогательные функции ------------
function getCurrentStep() {
    return Array.from(document.querySelectorAll('.step'))
        .findIndex(el => el.style.display === 'flex') + 1;
}

function updateDayDisplay() {
    const date = new Date();
    date.setDate(date.getDate() + currentDayOffset);
    document.getElementById('current-day').textContent = 
        date.toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit', year: 'numeric'});
}

function calculateTimeSlots(duration) {
    const slots = [];
    let startTime = new Date().setHours(9, 0, 0);
    
    while (new Date(startTime).getHours() < 20) {
        const endTime = new Date(startTime + duration * 60000);
        slots.push({
            start: new Date(startTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'}),
            end: endTime.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})
        });
        startTime = endTime.getTime();
    }
    return slots;
}

function updateTotal() {
    const services = Array.from(document.querySelectorAll('input[name="service"]:checked'));
    const total = services.reduce((sum, s) => sum + parseInt(s.dataset.price), 0);
    const duration = services.reduce((sum, s) => sum + parseInt(s.dataset.duration), 0);
    
    document.getElementById('total').textContent = `${total}₽`;
    populateTimeSlots(duration);
    updateContinueButton(2);
}
