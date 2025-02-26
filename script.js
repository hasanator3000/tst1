let db;

// Функция для отображения шага
function showStep(step) {
    // Скрываем все шаги
    document.querySelectorAll('.step').forEach(stepElement => {
        stepElement.style.display = 'none';
    });

    // Показываем текущий шаг
    document.getElementById(`step${step}`).style.display = 'flex';

    // Управление видимостью кнопки "Назад" и крестика
    const backButton = document.querySelector('.back-button');
    const closeButton = document.querySelector('.close-modal');

    if (step === 1) {
        backButton.style.display = 'none'; // На первом шаге скрываем кнопку "Назад"
        closeButton.style.display = 'block'; // Крестик отображается
    } else if (step === 5) {
        backButton.style.display = 'none'; // На последнем шаге скрываем кнопку "Назад"
        closeButton.style.display = 'none'; // Крестик скрываем
    } else {
        backButton.style.display = 'block'; // На остальных шагах показываем кнопку "Назад"
        closeButton.style.display = 'block'; // Крестик отображается
    }
}

// Инициализация базы данных при открытии модального окна
document.getElementById('fixed-button').addEventListener('click', async function() {
    console.log("Кнопка нажата"); // Проверка, что обработчик срабатывает
    try {
        db = await dbFunctions.initDatabase();
        console.log("База данных инициализирована"); // Проверка инициализации базы
        const brands = await dbFunctions.getBrands(db);
        console.log("Марки загружены:", brands); // Проверка загрузки марок
        populateBrands(brands);
        showStep(1);
    } catch (error) {
        console.error("Ошибка:", error); // Ловим ошибки
    }
});

// Заполнение выбора марок
function populateBrands(brands) {
    const brandSelect = document.getElementById('brand');
    brandSelect.innerHTML = '<option value="">Выберите марку</option>';
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name;
        brandSelect.appendChild(option);
    });
}

// Обновление моделей при выборе марки
document.getElementById('brand').addEventListener('change', async function() {
    const brandId = this.value;
    const models = await dbFunctions.getModels(db, brandId);
    populateModels(models);
});

// Заполнение выбора моделей
function populateModels(models) {
    const modelSelect = document.getElementById('model');
    modelSelect.innerHTML = '<option value="">Выберите модель</option>';
    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelect.appendChild(option);
    });
}

// Получение услуг при выборе модели
document.getElementById('model').addEventListener('change', async function() {
    const modelId = this.value;
    const services = await dbFunctions.getServices(db, modelId);
    populateServices(services);
});

// Заполнение выбора услуг
function populateServices(services) {
    const servicesContainer = document.getElementById('services-container');
    servicesContainer.innerHTML = '';
    services.forEach(service => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" name="service" value="${service.id}" data-duration="${service.duration}" onchange="updateTotal()">
            ${service.name} (${service.price}₽, ${service.duration} мин)
        `;
        servicesContainer.appendChild(label);
    });
}

// Обновление подытога и временных слотов
function updateTotal() {
    const selectedServices = document.querySelectorAll('input[name="service"]:checked');
    let total = 0;
    let totalDuration = 0;
    selectedServices.forEach(service => {
        total += parseInt(service.dataset.price);
        totalDuration += parseInt(service.dataset.duration);
    });
    document.getElementById('total').textContent = `${total}₽`;
    populateTimeSlots(totalDuration);
}

// Расчет временных слотов
function calculateTimeSlots(duration) {
    const slots = [];
    let startTime = new Date();
    startTime.setHours(9, 0, 0); // Начало работы с 9:00

    while (startTime.getHours() < 20) { // Работа до 20:00
        const endTime = new Date(startTime.getTime() + duration * 60000);
        slots.push({
            start: startTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
            end: endTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        });
        startTime = endTime;
    }

    return slots;
}

// Отображение временных слотов
function populateTimeSlots(duration) {
    const slots = calculateTimeSlots(duration);
    const timeSlotsContainer = document.querySelector('.time-slots');
    timeSlotsContainer.innerHTML = '';
    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'time-slot available';
        slotDiv.textContent = `${slot.start} - ${slot.end}`;
        slotDiv.addEventListener('click', function() {
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('next3').disabled = false;
        });
        timeSlotsContainer.appendChild(slotDiv);
    });
}

// Сохранение записи
async function saveAppointment() {
    const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked')).map(s => s.value);
    const selectedTime = document.querySelector('.time-slot.selected').textContent.split(' - ');
    await dbFunctions.saveAppointment(
        db,
        document.getElementById('clientName').value,
        document.getElementById('clientPhone').value,
        document.getElementById('clientCarNumber').value,
        document.getElementById('model').value,
        selectedServices,
        selectedTime[0],
        selectedTime[1]
    );
    showStep(5);
}

// Переход к следующему шагу
function nextStep(step) {
    if (step === 5) {
        saveAppointment();
    } else {
        showStep(step);
    }
}
