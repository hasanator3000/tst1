// ------------ Глобальные переменные ------------
let db; // База данных
let currentDayOffset = 0; // Смещение для выбора даты

// ------------ Общие функции интерфейса ------------

// Функция для кнопки "Читать полностью"
function toggleReadMore() {
    const hiddenText = document.getElementById('hidden-text');
    const readFullButton = document.getElementById('text1');
    const hideButton = document.getElementById('hide-button');
    const gradientOverlay = document.getElementById('gradient-overlay');

    if (hiddenText.style.display === 'none') {
        hiddenText.style.display = 'block';
        readFullButton.style.display = 'none';
        hideButton.style.display = 'block';
        gradientOverlay.style.display = 'none';
    } else {
        hiddenText.style.display = 'none';
        readFullButton.style.display = 'block';
        hideButton.style.display = 'none';
        gradientOverlay.style.display = 'block';
    }
}

// ------------ Функции для модального окна ------------

// Открытие модального окна
document.getElementById('fixed-button').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'flex';
    showStep(1);
});

// Показ текущего шага и скрытие остальных
function showStep(step) {
    document.querySelectorAll('.step').forEach(function (stepElement) {
        stepElement.style.display = 'none';
    });
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

    if (step === 4) {
        validateStep4();
        setupStep4Listeners();
    }
}

// Переход к следующему шагу
function nextStep(step) {
    if (step === 5) {
        saveAppointment();
    } else {
        showStep(step);
    }
}

// Переход на предыдущий шаг
function prevStep() {
    const currentStep = document.querySelector('.step[style="display: flex;"]');
    if (currentStep) {
        const currentStepNumber = parseInt(currentStep.id.replace('step', ''));
        if (currentStepNumber > 1) {
            showStep(currentStepNumber - 1);
        }
    }
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// ------------ Работа с данными ------------

// Заполнение выбора марок
function populateBrands(brands) {
    const brandSelect = document.getElementById('brand');
    brandSelect.innerHTML = '<option value="">Выберите марку</option>';

    if (!brands || !Array.isArray(brands)) {
        console.error("Ошибка: brands не определен или не является массивом");
        return;
    }

    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name;
        brandSelect.appendChild(option);
    });
}

// Заполнение выбора моделей
function populateModels(models) {
    const modelSelect = document.getElementById('model');
    modelSelect.innerHTML = '<option value="">Выберите модель</option>';
    modelSelect.disabled = true;

    if (!Array.isArray(models)) {
        console.error("Models не является массивом");
        return;
    }

    if (models.length === 0) {
        console.warn("Нет доступных моделей для выбранной марки");
        return;
    }

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.name;
        modelSelect.appendChild(option);
    });
    
    modelSelect.disabled = false;
}

// Заполнение выбора услуг
function populateServices(services) {
    const servicesContainer = document.getElementById('services-container');
    servicesContainer.innerHTML = '';

    if (!services || !Array.isArray(services)) {
        console.error("Ошибка: services не определен или не является массивом");
        return;
    }

    services.forEach(service => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" name="service" value="${service.id}" data-duration="${service.duration}" onchange="updateTotal()">
            ${service.name} (${service.price}₽, ${service.duration} мин)
        `;
        servicesContainer.appendChild(label);
    });
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
        slotDiv.addEventListener('click', function () {
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
            document.getElementById('next3').disabled = false;
        });
        timeSlotsContainer.appendChild(slotDiv);
    });
}

// Обновление подытога
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

// ------------ Валидация и форматирование ------------

// Автоматическая капитализация первой буквы каждого слова
function capitalizeInput(input) {
    input.value = input.value
        .toLowerCase() // Приводим весь текст к нижнему регистру
        .split(' ') // Разделяем строку по пробелам
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Капитализируем первую букву каждого слова
        .join(' '); // Соединяем слова обратно в строку
}

// Валидация поля "ФИО" (только буквы и пробелы)
function validateName(input) {
    input.value = input.value.replace(/[^а-яА-ЯёЁ\s]/g, ''); // Удаляем всё, кроме букв и пробелов
    capitalizeInput(input); // Применяем капитализацию
    validateStep4(); // Проверяем валидацию шага 4
}

// Форматирование номера телефона
function formatPhone(input) {
    // Удаляем всё, кроме цифр
    let phone = input.value.replace(/\D/g, '');

    // Если номер начинается с 7 или 8, заменяем на +7
    if (phone.startsWith('7') || phone.startsWith('8')) {
        phone = phone.substring(1); // Убираем первую цифру (7 или 8)
    }

    // Ограничиваем длину номера (10 цифр, без +7)
    if (phone.length > 10) {
        phone = phone.substring(0, 10);
    }

    // Форматируем номер по шаблону +7 (777) 777-77-77
    let formattedPhone = '+7';
    if (phone.length > 0) {
        formattedPhone += ` (${phone.substring(0, 3)}`;
    }
    if (phone.length > 3) {
        formattedPhone += `) ${phone.substring(3, 6)}`;
    }
    if (phone.length > 6) {
        formattedPhone += `-${phone.substring(6, 8)}`;
    }
    if (phone.length > 8) {
        formattedPhone += `-${phone.substring(8, 10)}`;
    }

    input.value = formattedPhone;
    validateStep4(); // Проверяем валидацию шага 4
}

// Валидация данных на шаге 4
function validateStep4() {
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const carNumberInput = document.getElementById('clientCarNumber');
    const nextButton = document.getElementById('next4');

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const carNumber = carNumberInput.value.trim();

    // Проверяем, что номер телефона заполнен полностью
    const isPhoneValid = phone.length === 18; // +7 (777) 777-77-77

    nextButton.disabled = !(name && isPhoneValid && carNumber);
}

// Добавляем обработчики событий для полей ввода на шаге 4
function setupStep4Listeners() {
    const nameInput = document.getElementById('clientName');
    const phoneInput = document.getElementById('clientPhone');
    const carNumberInput = document.getElementById('clientCarNumber');

    nameInput.addEventListener('input', validateStep4);
    phoneInput.addEventListener('input', validateStep4);
    carNumberInput.addEventListener('input', validateStep4);
}

// ------------ Инициализация и обработчики ------------

// Инициализация базы данных при открытии модального окна
document.getElementById('fixed-button').addEventListener('click', async function () {
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

// Обновление моделей при выборе марки
document.getElementById('brand').addEventListener('change', async function () {
    try {
        const brandId = this.value;
        if (!brandId) {
            document.getElementById('model').disabled = true;
            return;
        }
        
        const models = await dbFunctions.getModels(db, brandId);
        console.log("Полученные модели:", models); // Добавляем лог
        
        populateModels(models);
        document.getElementById('model').disabled = false;
    } catch (error) {
        console.error("Ошибка при загрузке моделей:", error);
        document.getElementById('model').disabled = true;
    }
});

// Получение услуг при выборе модели
document.getElementById('model').addEventListener('change', async function () {
    try {
        const modelId = this.value;
        const services = await dbFunctions.getServices(db, modelId);
        populateServices(services);
    } catch (error) {
        console.error("Ошибка при загрузке услуг:", error);
    }
});

// Добавляем +7 при фокусе на поле ввода телефона
document.getElementById('clientPhone').addEventListener('focus', function () {
    const phoneInput = this;
    if (!phoneInput.value.startsWith('+7')) {
        phoneInput.value = '+7';
    }
});

// Обработка вставки текста в поле "ФИО"
document.getElementById('clientName').addEventListener('paste', function (event) {
    event.preventDefault(); // Отменяем стандартное поведение вставки
    const pastedText = (event.clipboardData || window.clipboardData).getData('text'); // Получаем вставленный текст
    this.value = pastedText; // Вставляем текст в поле
    capitalizeInput(this); // Применяем функцию капитализации
});

// Скрытие кнопки "Записаться сейчас" при прокрутке до черного поля
document.addEventListener('scroll', function () {
    const fixedButton = document.getElementById('fixed-button');
    const aboutSection = document.querySelector('.about-section');
    const footer = document.querySelector('.footer');

    const aboutSectionRect = aboutSection.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();

    if (aboutSectionRect.top <= window.innerHeight || footerRect.top <= window.innerHeight) {
        fixedButton.classList.add('hidden');
    } else {
        fixedButton.classList.remove('hidden');
    }
});

// ------------ Вспомогательные функции ------------

// Функция для изменения дня
function changeDay(offset) {
    currentDayOffset += offset;
    updateDayDisplay();
}

// Функция для обновления отображения текущей даты
function updateDayDisplay() {
    const currentDayElement = document.getElementById('current-day');
    const today = new Date(); // Текущая дата
    today.setDate(today.getDate() + currentDayOffset); // Добавляем смещение

    // Форматируем дату в формате "ДД.ММ.ГГГГ"
    const formattedDate = today.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    currentDayElement.textContent = formattedDate; // Отображаем дату
}

// Инициализация выбора времени
document.querySelectorAll('.time-slot').forEach(function (slot) {
    slot.addEventListener('click', function () {
        if (!slot.classList.contains('unavailable')) {
            document.querySelectorAll('.time-slot').forEach(function (s) {
                s.classList.remove('selected');
            });
            slot.classList.add('selected');
            document.getElementById('next3').disabled = false;
        }
    });
});
