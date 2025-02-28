// ------------ Глобальные переменные ------------
let db; // База данных
let currentDayOffset = 0; // Смещение для выбора даты

// ------------ Общие функции интерфейса ------------
function toggleReadMore() {
    const hiddenText = document.getElementById('hidden-text');
    const readFullButton = document.getElementById('text1');
    const hideButton = document.getElementById('hide-button');
    const gradientOverlay = document.getElementById('gradient-overlay');

    const isHidden = hiddenText.style.display === 'none';
    
    hiddenText.style.display = isHidden ? 'block' : 'none';
    readFullButton.style.display = isHidden ? 'none' : 'block';
    hideButton.style.display = isHidden ? 'block' : 'none';
    gradientOverlay.style.display = isHidden ? 'none' : 'block';
}

// ------------ Функции для модального окна ------------
function manageModalSteps(step) {
    // Скрываем все шаги
    document.querySelectorAll('.step').forEach(el => el.style.display = 'none');
    
    // Показываем текущий шаг
    const currentStep = document.getElementById(`step${step}`);
    if (currentStep) currentStep.style.display = 'flex';

    // Управление кнопками навигации
    const backButton = document.querySelector('.back-button');
    const closeButton = document.querySelector('.close-modal');
    backButton.style.display = step === 1 || step === 5 ? 'none' : 'block';
    closeButton.style.display = step === 5 ? 'none' : 'block';

    // Инициализация валидации для шага 4
    if (step === 4) initStep4Validation();
    
    // Обновляем состояние кнопки "Продолжить"
    updateContinueButton(step);
}

function updateContinueButton(step) {
    let isEnabled = false;
    
    switch(step) {
        case 1:
            isEnabled = !!document.getElementById('model').value;
            break;
        case 2:
            isEnabled = document.querySelectorAll('input[name="service"]:checked').length > 0;
            break;
        case 3:
            isEnabled = !!document.querySelector('.time-slot.selected');
            break;
        case 4:
            const name = document.getElementById('clientName').value.trim();
            const phone = document.getElementById('clientPhone').value.trim();
            const carNumber = document.getElementById('clientCarNumber').value.trim();
            isEnabled = name.length > 0 && phone.length === 18 && carNumber.length > 0;
            break;
        default:
            isEnabled = true;
    }

    const nextButton = document.getElementById(`next${step}`);
    if (nextButton) nextButton.disabled = !isEnabled;
}

// ------------ Работа с данными ------------
async function loadBrands() {
    try {
        const brands = await dbFunctions.getBrands(db);
        const brandSelect = document.getElementById('brand');
        brandSelect.innerHTML = '<option value="">Выберите марку</option>';
        
        brands.forEach(brand => {
            const option = new Option(brand.name, brand.id);
            brandSelect.add(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки марок:', error);
    }
}

async function loadModels(brandId) {
    try {
        const models = await dbFunctions.getModels(db, brandId);
        const modelSelect = document.getElementById('model');
        modelSelect.innerHTML = '<option value="">Выберите модель</option>';
        
        models.forEach(model => {
            const option = new Option(model.name, model.id);
            modelSelect.add(option);
        });
        modelSelect.disabled = false;
    } catch (error) {
        console.error('Ошибка загрузки моделей:', error);
    }
}

async function loadServices(modelId) {
    try {
        const services = await dbFunctions.getServices(db, modelId);
        const container = document.getElementById('services-container');
        container.innerHTML = '';

        services.forEach(service => {
            const label = document.createElement('label');
            label.innerHTML = `
                <input type="checkbox" name="service" 
                       value="${service.id}" 
                       data-price="${service.price}" 
                       data-duration="${service.duration}"
                       onchange="updateTotal()">
                ${service.name} (${service.price}₽, ${service.duration} мин)
            `;
            container.appendChild(label);
        });
    } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
    }
}

// ------------ Валидация и обработчики ------------
function initStep4Validation() {
    const validateInputs = () => {
        const name = document.getElementById('clientName').value.trim();
        const phone = document.getElementById('clientPhone').value.trim();
        const carNumber = document.getElementById('clientCarNumber').value.trim();
        document.getElementById('next4').disabled = !(name && phone.length === 18 && carNumber);
    };

    document.getElementById('clientName').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^а-яА-ЯёЁ\s]/g, '');
        this.value = this.value.toLowerCase()
            .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        validateInputs();
    });

    document.getElementById('clientPhone').addEventListener('input', function(e) {
        let phone = this.value.replace(/\D/g, '');
        if (phone.startsWith('7') || phone.startsWith('8')) phone = phone.substring(1);
        phone = phone.substring(0, 10);
        
        let formatted = '+7';
        if (phone.length > 0) formatted += ` (${phone.substring(0, 3)}`;
        if (phone.length > 3) formatted += `) ${phone.substring(3, 6)}`;
        if (phone.length > 6) formatted += `-${phone.substring(6, 8)}`;
        if (phone.length > 8) formatted += `-${phone.substring(8, 10)}`;
        
        this.value = formatted;
        validateInputs();
    });

    document.getElementById('clientCarNumber').addEventListener('input', validateInputs);
}

// ------------ Инициализация приложения ------------
document.getElementById('fixed-button').addEventListener('click', async () => {
    try {
        db = await dbFunctions.initDatabase();
        await loadBrands();
        manageModalSteps(1);
    } catch (error) {
        console.error("Ошибка инициализации:", error);
    }
});

document.getElementById('brand').addEventListener('change', async function() {
    if (!this.value) return;
    await loadModels(this.value);
    updateContinueButton(1);
});

document.getElementById('model').addEventListener('change', async function() {
    if (!this.value) return;
    await loadServices(this.value);
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
function updateTotal() {
    const services = Array.from(document.querySelectorAll('input[name="service"]:checked'));
    const total = services.reduce((sum, s) => sum + parseInt(s.dataset.price), 0);
    const duration = services.reduce((sum, s) => sum + parseInt(s.dataset.duration), 0);
    
    document.getElementById('total').textContent = `${total}₽`;
    populateTimeSlots(duration);
    updateContinueButton(2);
}

function populateTimeSlots(duration) {
    const container = document.querySelector('.time-slots');
    container.innerHTML = '';
    
    let startTime = new Date().setHours(9, 0, 0);
    while (new Date(startTime).getHours() < 20) {
        const endTime = new Date(startTime + duration * 60000);
        const slot = document.createElement('div');
        slot.className = 'time-slot available';
        slot.textContent = `
            ${new Date(startTime).toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})} - 
            ${endTime.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
        `;
        slot.addEventListener('click', () => {
            container.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            slot.classList.add('selected');
            updateContinueButton(3);
        });
        container.appendChild(slot);
        startTime = endTime.getTime();
    }
}
